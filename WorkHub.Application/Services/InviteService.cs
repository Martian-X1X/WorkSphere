using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using WorkHub.Application.Authorization;
using WorkHub.Infrastructure.Data;
using WorkHub.Application.DTOs.Auth;
using WorkHub.Application.DTOs.Common;
using WorkHub.Application.DTOs.Invite;
using WorkHub.Application.Interfaces;
using WorkHub.Domain.Constants;
using WorkHub.Domain.Entities;
using WorkHub.Domain.Enums;

namespace WorkHub.Application.Services;

public class InviteService : IInviteService
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IPasswordService _passwordService;
    private readonly IJwtService _jwtService;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly OrgScopeGuard _orgScopeGuard;
    private readonly IEmailService _emailService;
    private readonly INotificationService _notificationService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<InviteService> _logger;

    public InviteService(
        AppDbContext context,
        ICurrentUserService currentUser,
        IPasswordService passwordService,
        IJwtService jwtService,
        IRefreshTokenService refreshTokenService,
        OrgScopeGuard orgScopeGuard,
        IEmailService emailService,
        INotificationService notificationService,
        IConfiguration configuration,
        ILogger<InviteService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _passwordService = passwordService;
        _jwtService = jwtService;
        _refreshTokenService = refreshTokenService;
        _orgScopeGuard = orgScopeGuard;
        _emailService = emailService;
        _notificationService = notificationService;
        _configuration = configuration;
        _logger = logger;
    }

    // ════════════════════════════════════════════════════════════
    // CREATE INVITE
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<InviteResponseDto>> CreateInviteAsync(
        CreateInviteDto dto)
    {
        try
        {
            var email = dto.Email.Trim().ToLowerInvariant();

            // ─── Validate role ─────────────────────────────────
            if (!UserRole.IsValid(dto.Role))
                return ApiResponse<InviteResponseDto>.Fail(
                    $"Invalid role '{dto.Role}'. Valid roles: Owner, Admin, Member.");

            // ─── Check email not already a member ─────────────
            var existingMember = await _context.Users
                .AnyAsync(u => u.Email == email
                            && u.OrganizationId == _currentUser.OrganizationId);

            if (existingMember)
                return ApiResponse<InviteResponseDto>.Fail(
                    "This email address is already a member of your organization.");

            // ─── Check no active pending invite exists ─────────
            var existingInvite = await _context.OrganizationInvites
                .FirstOrDefaultAsync(i =>
                    i.InviteeEmail == email &&
                    i.OrganizationId == _currentUser.OrganizationId &&
                    i.Status == InviteStatus.Pending &&
                    i.ExpiresAt > DateTime.UtcNow);

            if (existingInvite != null)
                return ApiResponse<InviteResponseDto>.Fail(
                    "An active invite already exists for this email address. " +
                    "Cancel the existing invite first.");

            // ─── Generate secure token ─────────────────────────
            // 32 bytes = 256 bits of randomness — URL-safe base64
            var tokenBytes = new byte[AppConstants.InviteTokenByteLength];
            RandomNumberGenerator.Fill(tokenBytes);
            var token = Convert.ToBase64String(tokenBytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");

            // ─── Create invite ─────────────────────────────────
            var invite = new OrganizationInvite
            {
                OrganizationId = _currentUser.OrganizationId,
                InvitedByUserId = _currentUser.UserId,
                InviteeEmail = email,
                Role = dto.Role,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddDays(AppConstants.InviteExpiryDays),
                Status = InviteStatus.Pending
            };

            _context.OrganizationInvites.Add(invite);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Invite created for {Email} to join org {OrgId} as {Role} by {UserId}",
                email, _currentUser.OrganizationId, dto.Role, _currentUser.UserId);

            // Load org name for response
            var org = await _context.Organizations
                .FirstOrDefaultAsync(o => o.Id == _currentUser.OrganizationId);

            var baseUrl    = GetBaseUrl();
            var inviteLink = $"{baseUrl}/invite/{token}";

            // Fire-and-forget — don't await, don't block response
            _ = Task.Run(async () =>
            {
                await _emailService.SendInviteEmailAsync(
                    toEmail:          invite.InviteeEmail,
                    toName:           dto.Email.Split('@')[0],
                    invitedByName:    _currentUser.FullName ?? "A teammate",
                    organizationName: org?.Name ?? "the organization",
                    role:             invite.Role,
                    inviteLink:       inviteLink,
                    expiresAt:        invite.ExpiresAt
                );
            });

            return ApiResponse<InviteResponseDto>.Ok(new InviteResponseDto
            {
                Id = invite.Id,
                InviteeEmail = invite.InviteeEmail,
                Role = invite.Role,
                Status = invite.Status,
                InviteLink = inviteLink,
                ExpiresAt = invite.ExpiresAt,
                CreatedAt = invite.CreatedAt,
                InvitedByName = _currentUser.FullName
            }, "Invite created successfully. Share the invite link with your team member.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating invite for {Email}", dto.Email);
            return ApiResponse<InviteResponseDto>.Fail(
                "An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // GET ORG INVITES
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<List<InviteResponseDto>>> GetOrgInvitesAsync()
    {
        try
        {
            var invites = await _context.OrganizationInvites
                .Include(i => i.InvitedBy)
                .Where(i => i.OrganizationId == _currentUser.OrganizationId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            // Auto-expire invites that are past their expiry date
            var now = DateTime.UtcNow;
            var expired = invites
                .Where(i => i.Status == InviteStatus.Pending && i.ExpiresAt < now)
                .ToList();

            if (expired.Any())
            {
                expired.ForEach(i => i.Status = InviteStatus.Expired);
                await _context.SaveChangesAsync();
            }

            var dtos = invites.Select(i => new InviteResponseDto
            {
                Id = i.Id,
                InviteeEmail = i.InviteeEmail,
                Role = i.Role,
                Status = i.Status == InviteStatus.Pending && i.ExpiresAt < now
                    ? InviteStatus.Expired : i.Status,
                InviteLink = $"{GetBaseUrl()}/invite/{i.Token}",
                ExpiresAt = i.ExpiresAt,
                CreatedAt = i.CreatedAt,
                InvitedByName = i.InvitedBy.FullName
            }).ToList();

            return ApiResponse<List<InviteResponseDto>>.Ok(dtos,
                $"{dtos.Count} invite(s) found.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing invites for org {OrgId}",
                _currentUser.OrganizationId);
            return ApiResponse<List<InviteResponseDto>>.Fail(
                "An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // GET INVITE PREVIEW (PUBLIC)
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<InvitePreviewDto>> GetInvitePreviewAsync(string token)
    {
        try
        {
            // IgnoreQueryFilters so we can find expired/cancelled invites
            // and return proper error messages
            var invite = await _context.OrganizationInvites
                .IgnoreQueryFilters()
                .Include(i => i.Organization)
                .Include(i => i.InvitedBy)
                .FirstOrDefaultAsync(i => i.Token == token);

            if (invite == null)
                return ApiResponse<InvitePreviewDto>.Fail(
                    "Invite not found. The link may be invalid.");

            var preview = new InvitePreviewDto
            {
                OrganizationName = invite.Organization.Name,
                OrganizationSlug = invite.Organization.Slug,
                InvitedByName = invite.InvitedBy.FullName,
                Role = invite.Role,
                ExpiresAt = invite.ExpiresAt,
                IsExpired = invite.ExpiresAt < DateTime.UtcNow
                    || invite.Status == InviteStatus.Expired
                    || invite.Status == InviteStatus.Cancelled,
                IsAlreadyAccepted = invite.Status == InviteStatus.Accepted
            };

            return ApiResponse<InvitePreviewDto>.Ok(preview,
                "Invite details retrieved.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error previewing invite token");
            return ApiResponse<InvitePreviewDto>.Fail(
                "An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // ACCEPT INVITE
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<AuthResponseDto>> AcceptInviteAsync(
        string token, AcceptInviteDto dto)
    {
        try
        {
            // ─── Find and validate invite ──────────────────────
            var invite = await _context.OrganizationInvites
                .IgnoreQueryFilters()
                .Include(i => i.Organization)
                .FirstOrDefaultAsync(i => i.Token == token);

            if (invite == null)
                return ApiResponse<AuthResponseDto>.Fail(
                    "Invite not found. The link may be invalid.");

            if (invite.Status == InviteStatus.Accepted)
                return ApiResponse<AuthResponseDto>.Fail(
                    "This invite has already been accepted.");

            if (invite.Status == InviteStatus.Cancelled)
                return ApiResponse<AuthResponseDto>.Fail(
                    "This invite has been cancelled.");

            if (invite.Status == InviteStatus.Expired ||
                invite.ExpiresAt < DateTime.UtcNow)
                return ApiResponse<AuthResponseDto>.Fail(
                    "This invite has expired. Please request a new invite.");

            // ─── Check email not already registered ───────────
            var emailExists = await _context.Users
                .AnyAsync(u => u.Email == invite.InviteeEmail);

            if (emailExists)
                return ApiResponse<AuthResponseDto>.Fail(
                    "An account with this email address already exists. " +
                    "Please log in with your existing account.");

            // ─── Validate password ─────────────────────────────
            var passwordValidation = _passwordService.ValidatePassword(dto.Password);
            if (!passwordValidation.IsValid)
                return ApiResponse<AuthResponseDto>.Fail(passwordValidation.Errors);

            // ─── Create user and join org ──────────────────────
            var passwordHash = _passwordService.HashPassword(dto.Password);
            var refreshToken = _refreshTokenService.GenerateRefreshToken();

            var user = new User
            {
                FirstName = dto.FirstName.Trim(),
                LastName = dto.LastName.Trim(),
                Email = invite.InviteeEmail,
                PasswordHash = passwordHash,
                OrganizationId = invite.OrganizationId,
                Role = invite.Role,
                IsActive = true,
                IsEmailVerified = false,
                RefreshToken = refreshToken,
                RefreshTokenExpiry = _refreshTokenService.GetRefreshTokenExpiry(),
                LastLoginAt = DateTime.UtcNow
            };

            _context.Users.Add(user);

            // ─── Mark invite as accepted ───────────────────────
            invite.Status = InviteStatus.Accepted;
            invite.AcceptedAt = DateTime.UtcNow;
            invite.AcceptedByUserId = user.Id;

            var generalRoom = await _context.ChatRooms
                .FirstOrDefaultAsync(r =>
                    r.OrganizationId == user.OrganizationId &&
                    r.Type == ChatRoomType.General &&
                    r.IsActive);

            if (generalRoom != null)
            {
                var alreadyMember = await _context.ChatRoomMembers.AnyAsync(m =>
                    m.ChatRoomId == generalRoom.Id &&
                    m.UserId == user.Id);

                if (!alreadyMember)
                {
                    _context.ChatRoomMembers.Add(new ChatRoomMember
                    {
                        ChatRoomId = generalRoom.Id,
                        UserId = user.Id,
                        JoinedAt = DateTime.UtcNow,
                        IsActive = true,
                    });

                    _context.Messages.Add(new Message
                    {
                        ChatRoomId = generalRoom.Id,
                        OrganizationId = user.OrganizationId,
                        SenderUserId = user.Id,
                        Content = $"{user.FirstName} {user.LastName} joined the workspace.",
                        Type = MessageType.System,
                        CreatedAt = DateTime.UtcNow,
                    });
                }
            }

            await _context.SaveChangesAsync();

            // ─── Generate JWT ──────────────────────────────────
            var accessToken = _jwtService.GenerateAccessToken(user);
            var expiry = _jwtService.GetAccessTokenExpiry();

            // Fire-and-forget welcome email
            _ = Task.Run(async () =>
            {
                await _emailService.SendWelcomeEmailAsync(
                    toEmail:          user.Email,
                    fullName:         user.FullName,
                    organizationName: invite.Organization.Name
                );
            });

            // ✅ Notify inviter that their invite was accepted
            await _notificationService.NotifyInviteAcceptedAsync(
                inviterUserId:   invite.InvitedByUserId,
                organizationId:  invite.OrganizationId,
                newMemberName:   $"{dto.FirstName} {dto.LastName}",
                newMemberEmail:  invite.InviteeEmail
            );

            // ✅ Notify org admins that a member joined
            await _notificationService.NotifyMemberJoinedAsync(
                organizationId:  invite.OrganizationId,
                newMemberName:   $"{dto.FirstName} {dto.LastName}",
                newMemberId:     user.Id,
                role:            invite.Role
            );

            _logger.LogInformation(
                "Invite accepted: {Email} joined org {OrgId} as {Role}",
                user.Email, invite.OrganizationId, invite.Role);

            return ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = expiry,
                User = new UserDto
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    FullName = user.FullName,
                    Email = user.Email,
                    Role = user.Role,
                    OrganizationId = invite.OrganizationId.ToString(),
                    OrganizationName = invite.Organization.Name,
                    IsEmailVerified = user.IsEmailVerified,
                    ProfilePictureUrl = user.ProfilePictureUrl
                }
            }, $"Welcome to {invite.Organization.Name}! Your account has been created successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error accepting invite token");
            return ApiResponse<AuthResponseDto>.Fail(
                "An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // CANCEL INVITE
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<object>> CancelInviteAsync(Guid inviteId)
    {
        try
        {
            var invite = await _context.OrganizationInvites
                .FirstOrDefaultAsync(i => i.Id == inviteId);

            if (invite == null)
                return ApiResponse<object>.Fail("Invite not found.");

            // ✅ Org scope guard — is this invite in the current user's org?
            var guard = _orgScopeGuard.Check(invite.OrganizationId);
            if (!guard.Allowed)
                return ApiResponse<object>.Fail(guard.Reason!);

            if (invite.Status != InviteStatus.Pending)
                return ApiResponse<object>.Fail(
                    $"Cannot cancel invite with status '{invite.Status}'. " +
                    "Only pending invites can be cancelled.");

            invite.Status = InviteStatus.Cancelled;
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Invite {InviteId} cancelled by {UserId}",
                inviteId, _currentUser.UserId);

            return ApiResponse<object>.Ok(null!,
                "Invite cancelled successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling invite {InviteId}", inviteId);
            return ApiResponse<object>.Fail("An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // RESEND INVITE
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<InviteResponseDto>> ResendInviteAsync(Guid inviteId)
    {
        try
        {
            var orgId = _currentUser.OrganizationId;

            var invite = await _context.OrganizationInvites
                .FirstOrDefaultAsync(i =>
                    i.Id             == inviteId &&
                    i.OrganizationId == orgId    &&
                    !i.IsDeleted);

            if (invite == null)
                return ApiResponse<InviteResponseDto>.Fail("Invite not found.");

            var guard = _orgScopeGuard.Check(invite.OrganizationId);
            if (!guard.Allowed)
                return ApiResponse<InviteResponseDto>.Fail(guard.Reason!);

            if (invite.Status != InviteStatus.Pending)
                return ApiResponse<InviteResponseDto>.Fail(
                    "Only pending invites can be resent.");

            // Generate a fresh token + reset expiry
            var tokenBytes = new byte[AppConstants.InviteTokenByteLength];
            RandomNumberGenerator.Fill(tokenBytes);
            invite.Token     = Convert.ToBase64String(tokenBytes)
                .Replace("+", "-").Replace("/", "_").Replace("=", "");
            invite.ExpiresAt = DateTime.UtcNow.AddDays(AppConstants.InviteExpiryDays);

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Invite {InviteId} resent by {UserId}",
                inviteId, _currentUser.UserId);

            return ApiResponse<InviteResponseDto>.Ok(new InviteResponseDto
            {
                Id            = invite.Id,
                InviteeEmail  = invite.InviteeEmail,
                Role          = invite.Role,
                Status        = invite.Status,
                InviteLink    = $"{GetBaseUrl()}/invite/{invite.Token}",
                ExpiresAt     = invite.ExpiresAt,
                CreatedAt     = invite.CreatedAt,
                InvitedByName = _currentUser.FullName ?? "Someone"
            }, "Invite resent successfully. A new link has been generated.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resending invite {InviteId}", inviteId);
            return ApiResponse<InviteResponseDto>.Fail("An unexpected error occurred.");
        }
    }

    // ── Base URL helper ─────────────────────────────────────────────
    // Single source of truth for invite links. Prefer the configured
    // AppSettings:BaseUrl; fall back to the local dev URL.
    private string GetBaseUrl()
        => _configuration["AppSettings:BaseUrl"] ?? "http://localhost:5173";
}