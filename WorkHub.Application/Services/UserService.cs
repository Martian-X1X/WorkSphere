using Microsoft.EntityFrameworkCore;
using WorkHub.Application.DTOs.Common;
using WorkHub.Application.DTOs.Users;
using WorkHub.Application.Interfaces;
using WorkHub.Infrastructure.Data;

namespace WorkHub.Application.Services;

public class UserService : IUserService
{
    private readonly AppDbContext        _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IPasswordService    _passwordService;

    public UserService(
        AppDbContext        context,
        ICurrentUserService currentUser,
        IPasswordService    passwordService)
    {
        _context         = context;
        _currentUser     = currentUser;
        _passwordService = passwordService;
    }

    // ── Get full profile with stats ──────────────────────────────────
    public async Task<ApiResponse<ProfileDto>> GetProfileAsync()
    {
        var userId = _currentUser.UserId;
        var orgId  = _currentUser.OrganizationId;

        var user = await _context.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return ApiResponse<ProfileDto>.Fail("User not found.");

        // Stats — count from related tables
        var tasksAssigned = await _context.Tasks
            .CountAsync(t => t.AssignedToUserId == userId);

        var commentsCount = await _context.Comments
            .CountAsync(c => c.CreatedByUserId == userId);

        var projectsCount = await _context.Projects
            .CountAsync(p => p.OrganizationId == orgId);

        var activityCount = await _context.ActivityLogs
            .CountAsync(a => a.UserId == userId && a.OrganizationId == orgId);

        var profile = new ProfileDto
        {
            Id                = user.Id,
            FirstName         = user.FirstName,
            LastName          = user.LastName,
            FullName          = user.FullName,
            Email             = user.Email,
            Role              = user.Role,
            OrganizationId    = user.OrganizationId,
            OrganizationName  = user.Organization?.Name ?? string.Empty,
            ProfilePictureUrl = user.ProfilePictureUrl,
            IsEmailVerified   = user.IsEmailVerified,
            LastLoginAt       = user.LastLoginAt,
            CreatedAt         = user.CreatedAt,
            TasksAssigned     = tasksAssigned,
            CommentsCount     = commentsCount,
            ProjectsCount     = projectsCount,
            ActivityCount     = activityCount,
        };

        return ApiResponse<ProfileDto>.Ok(profile, "Profile retrieved successfully.");
    }

    // ── Update first + last name ─────────────────────────────────────
    public async Task<ApiResponse<ProfileDto>> UpdateProfileAsync(UpdateProfileDto dto)
    {
        var userId = _currentUser.UserId;

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return ApiResponse<ProfileDto>.Fail("User not found.");

        user.FirstName = dto.FirstName.Trim();
        user.LastName  = dto.LastName.Trim();

        await _context.SaveChangesAsync();

        return await GetProfileAsync();
    }

    // ── Change password ──────────────────────────────────────────────
    public async Task<ApiResponse<object>> ChangePasswordAsync(ChangePasswordDto dto)
    {
        var userId = _currentUser.UserId;

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return ApiResponse<object>.Fail("User not found.");

        // Verify current password
        if (!_passwordService.VerifyPassword(dto.CurrentPassword, user.PasswordHash))
            return ApiResponse<object>.Fail("Current password is incorrect.");

        // Validate new password against policy
        var validation = _passwordService.ValidatePassword(dto.NewPassword);
        if (!validation.IsValid)
            return ApiResponse<object>.Fail(validation.Errors);

        // Hash and save
        user.PasswordHash       = _passwordService.HashPassword(dto.NewPassword);
        user.RefreshToken       = null;   // invalidate all sessions
        user.RefreshTokenExpiry = null;

        await _context.SaveChangesAsync();

        return ApiResponse<object>.Ok(null!, "Password changed successfully. Please sign in again.");
    }
}
