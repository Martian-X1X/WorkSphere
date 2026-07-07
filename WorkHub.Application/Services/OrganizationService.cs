using Microsoft.EntityFrameworkCore;
using WorkHub.Application.Authorization;
using WorkHub.Infrastructure.Data;
using WorkHub.Application.DTOs.Common;
using WorkHub.Application.DTOs.Organization;
using WorkHub.Application.Interfaces;
using WorkHub.Domain.Entities;

namespace WorkHub.Application.Services;

public class OrganizationService : IOrganizationService
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly OrgScopeGuard _orgScopeGuard;
    private readonly ISlugService _slugService;
    private readonly ILogger<OrganizationService> _logger;

    public OrganizationService(
        AppDbContext context,
        ICurrentUserService currentUser,
        OrgScopeGuard orgScopeGuard,
        ISlugService slugService,
        ILogger<OrganizationService> logger)
    {
        _context = context;
        _currentUser = currentUser;
        _orgScopeGuard = orgScopeGuard;
        _slugService = slugService;
        _logger = logger;
    }

    // ════════════════════════════════════════════════════════════
    // GET MY ORGANIZATION
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<OrganizationDto>> GetMyOrganizationAsync()
    {
        try
        {
            var org = await _context.Organizations
                .FirstOrDefaultAsync(o => o.Id == _currentUser.OrganizationId);

            if (org == null)
                return ApiResponse<OrganizationDto>.Fail(
                    "Organization not found.");

            // Count active members in this org
            var memberCount = await _context.Users
                .CountAsync(u => u.OrganizationId == _currentUser.OrganizationId
                              && u.IsActive);

            var dto = MapToDto(org, memberCount);

            _logger.LogInformation(
                "Org profile retrieved by {UserId} for org {OrgId}",
                _currentUser.UserId, org.Id);

            return ApiResponse<OrganizationDto>.Ok(dto,
                "Organization retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving organization for {UserId}",
                _currentUser.UserId);
            return ApiResponse<OrganizationDto>.Fail(
                "An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // UPDATE ORGANIZATION
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<OrganizationDto>> UpdateOrganizationAsync(
        UpdateOrganizationDto dto)
    {
        try
        {
            var org = await _context.Organizations
                .FirstOrDefaultAsync(o => o.Id == _currentUser.OrganizationId);

            if (org == null)
                return ApiResponse<OrganizationDto>.Fail(
                    "Organization not found.");

            // ✅ Org scope guard — confirm user belongs to this org
            var guard = _orgScopeGuard.Check(org.Id);
            if (!guard.Allowed)
                return ApiResponse<OrganizationDto>.Fail(guard.Reason!);

            // Update fields
            org.Name = dto.Name.Trim();
            org.Description = dto.Description?.Trim();
            org.LogoUrl = dto.LogoUrl?.Trim();
            // UpdatedAt handled automatically by AppDbContext.SaveChangesAsync

            await _context.SaveChangesAsync();

            var memberCount = await _context.Users
                .CountAsync(u => u.OrganizationId == org.Id && u.IsActive);

            _logger.LogInformation(
                "Org {OrgId} updated by {UserId}",
                org.Id, _currentUser.UserId);

            return ApiResponse<OrganizationDto>.Ok(
                MapToDto(org, memberCount),
                "Organization updated successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating organization for {UserId}",
                _currentUser.UserId);
            return ApiResponse<OrganizationDto>.Fail(
                "An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // GET MEMBERS (PAGINATED)
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<PagedResult<MemberDto>>> GetMembersAsync(
        int page = 1, int pageSize = 20)
    {
        try
        {
            // Clamp pagination values
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            // ✅ EF Core global query filter already excludes soft-deleted users
            // The OrganizationId filter is the tenant isolation layer
            var query = _context.Users
                .Where(u => u.OrganizationId == _currentUser.OrganizationId)
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName);

            var totalCount = await query.CountAsync();

            var members = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var result = new PagedResult<MemberDto>
            {
                Items = members.Select(MapToMemberDto).ToList(),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };

            _logger.LogInformation(
                "Members listed for org {OrgId} — page {Page}, {Count} results",
                _currentUser.OrganizationId, page, members.Count);

            return ApiResponse<PagedResult<MemberDto>>.Ok(result,
                "Members retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing members for org {OrgId}",
                _currentUser.OrganizationId);
            return ApiResponse<PagedResult<MemberDto>>.Fail(
                "An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // GET MEMBER BY ID
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<MemberDto>> GetMemberByIdAsync(Guid memberId)
    {
        try
        {
            var member = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == memberId);

            if (member == null)
                return ApiResponse<MemberDto>.Fail("Member not found.");

            // ✅ Org scope guard — is this member in the current user's org?
            var guard = _orgScopeGuard.Check(member.OrganizationId);
            if (!guard.Allowed)
                return ApiResponse<MemberDto>.Fail(guard.Reason!);

            return ApiResponse<MemberDto>.Ok(
                MapToMemberDto(member),
                "Member retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving member {MemberId}", memberId);
            return ApiResponse<MemberDto>.Fail("An unexpected error occurred.");
        }
    }

    // ════════════════════════════════════════════════════════════
    // PRIVATE MAPPERS
    // ════════════════════════════════════════════════════════════
    private static OrganizationDto MapToDto(
        Organization org, int memberCount) => new()
    {
        Id = org.Id,
        Name = org.Name,
        Slug = org.Slug,
        Description = org.Description,
        LogoUrl = org.LogoUrl,
        Plan = org.Plan,
        IsActive = org.IsActive,
        MemberCount = memberCount,
        CreatedAt = org.CreatedAt,
        UpdatedAt = org.UpdatedAt
    };

    private static MemberDto MapToMemberDto(
        User user) => new()
    {
        Id = user.Id,
        FirstName = user.FirstName,
        LastName = user.LastName,
        FullName = user.FullName,
        Email = user.Email,
        Role = user.Role,
        IsActive = user.IsActive,
        IsEmailVerified = user.IsEmailVerified,
        ProfilePictureUrl = user.ProfilePictureUrl,
        LastLoginAt = user.LastLoginAt,
        JoinedAt = user.CreatedAt
    };

    // ════════════════════════════════════════════════════════════
// CHANGE MEMBER ROLE
// ════════════════════════════════════════════════════════════
public async Task<ApiResponse<MemberDto>> ChangeMemberRoleAsync(
    Guid memberId, string newRole)
{
    try
    {
        // ─── Validate role ─────────────────────────────────
        if (!UserRole.IsValid(newRole))
            return ApiResponse<MemberDto>.Fail(
                $"Invalid role '{newRole}'. Valid roles: Owner, Admin, Member.");

        var member = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == memberId);

        if (member == null)
            return ApiResponse<MemberDto>.Fail("Member not found.");

        // ─── Org scope guard ───────────────────────────────
        var guard = _orgScopeGuard.Check(member.OrganizationId);
        if (!guard.Allowed)
            return ApiResponse<MemberDto>.Fail(guard.Reason!);

        // ─── Cannot change your own role ───────────────────
        if (member.Id == _currentUser.UserId)
            return ApiResponse<MemberDto>.Fail(
                "You cannot change your own role.");

        // ─── Cannot demote another Owner ───────────────────
        // Only another Owner can change an Owner's role
        // and you'd be creating a second Owner which breaks the model
        if (member.Role == UserRole.Owner)
            return ApiResponse<MemberDto>.Fail(
                "Cannot change the role of the organization Owner.");

        var oldRole = member.Role;
        member.Role = newRole;
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Member {MemberId} role changed from {OldRole} to {NewRole} by {UserId}",
            memberId, oldRole, newRole, _currentUser.UserId);

        return ApiResponse<MemberDto>.Ok(
            MapToMemberDto(member),
            $"Member role updated to {newRole} successfully.");
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error changing role for member {MemberId}", memberId);
        return ApiResponse<MemberDto>.Fail("An unexpected error occurred.");
    }
}

    // ════════════════════════════════════════════════════════════
    // DEACTIVATE MEMBER
    // ════════════════════════════════════════════════════════════
    public async Task<ApiResponse<object>> DeactivateMemberAsync(Guid memberId)
    {
        try
        {
            var member = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == memberId);

            if (member == null)
                return ApiResponse<object>.Fail("Member not found.");

            // ─── Org scope guard ───────────────────────────────
            var guard = _orgScopeGuard.Check(member.OrganizationId);
            if (!guard.Allowed)
                return ApiResponse<object>.Fail(guard.Reason!);

            // ─── Cannot deactivate yourself ────────────────────
            if (member.Id == _currentUser.UserId)
                return ApiResponse<object>.Fail(
                    "You cannot deactivate your own account.");

            // ─── Cannot deactivate the Owner ───────────────────
            if (member.Role == UserRole.Owner)
                return ApiResponse<object>.Fail(
                    "Cannot deactivate the organization Owner.");

            if (!member.IsActive)
                return ApiResponse<object>.Fail(
                    "This member is already deactivated.");

            member.IsActive = false;

            // ─── Invalidate their refresh token immediately ────
            // They cannot silently re-auth — they get blocked at
            // TenantMiddleware on their next request anyway,
            // but this also prevents refresh token reuse
            member.RefreshToken = null;
            member.RefreshTokenExpiry = null;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Member {MemberId} deactivated by {UserId} in org {OrgId}",
                memberId, _currentUser.UserId, _currentUser.OrganizationId);

            return ApiResponse<object>.Ok(null!,
                "Member deactivated successfully. They can no longer access WorkSphere.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating member {MemberId}", memberId);
            return ApiResponse<object>.Fail("An unexpected error occurred.");
        }
    }
}