using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkHub.API.Authorization;
using WorkHub.Application.Authorization;
using WorkHub.Application.DTOs.Common;
using WorkHub.Application.Interfaces;

namespace WorkHub.API.Controllers;

[ApiController]
[Route("api/users")]
[Produces("application/json")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ICurrentUserService _currentUser;
    private readonly IPermissionService _permissionService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        ICurrentUserService currentUser,
        IPermissionService permissionService,
        ILogger<UsersController> logger)
    {
        _currentUser = currentUser;
        _permissionService = permissionService;
        _logger = logger;
    }

    /// <summary>Get current user profile from JWT claims</summary>
    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        var profile = new CurrentUserDto
        {
            UserId = _currentUser.UserId,
            Email = _currentUser.Email,
            FullName = _currentUser.FullName,
            Role = _currentUser.Role,
            OrganizationId = _currentUser.OrganizationId,
            IsEmailVerified = _currentUser.IsEmailVerified,
            IsOwner = _currentUser.IsOwner,
            IsAdminOrOwner = _currentUser.IsAdminOrOwner
        };

        _logger.LogInformation(
            "Profile accessed by user {UserId} ({Role})",
            _currentUser.UserId, _currentUser.Role);

        return Ok(ApiResponse<CurrentUserDto>.Ok(profile,
            "Profile retrieved successfully."));
    }

    /// <summary>
    /// Get current user's full permission list.
    /// Useful for the frontend to conditionally show/hide UI elements.
    /// </summary>
    [HttpGet("me/permissions")]
    public IActionResult GetMyPermissions()
    {
        var permissions = _permissionService.GetCurrentUserPermissions();

        return Ok(ApiResponse<object>.Ok(new
        {
            role = _currentUser.Role,
            permissionCount = permissions.Count,
            permissions = permissions.OrderBy(p => p)
        }, "Permissions retrieved successfully."));
    }

    /// <summary>Owner-only — full platform control</summary>
    [HttpGet("owner-only")]
    [Authorize(Roles = "Owner")]
    public IActionResult OwnerOnlyEndpoint()
    {
        return Ok(ApiResponse<object>.Ok(
            new { message = "Welcome, Owner! You have full platform access." },
            "Owner access granted."));
    }

    /// <summary>Admin + Owner — team management area</summary>
    [HttpGet("admin-area")]
    [Authorize(Roles = "Owner,Admin")]
    public IActionResult AdminAreaEndpoint()
    {
        return Ok(ApiResponse<object>.Ok(new
        {
            message = $"Welcome to the admin area, {_currentUser.FullName}!",
            yourRole = _currentUser.Role,
            organizationId = _currentUser.OrganizationId
        }, "Admin access granted."));
    }

    /// <summary>
    /// Policy-based: only users who can invite members.
    /// Owner + Admin have this permission. Member does not.
    /// </summary>
    [HttpGet("can-invite")]
    [Authorize(Policy = PolicyNames.CanInviteMembers)]
    public IActionResult CanInviteTest()
    {
        return Ok(ApiResponse<object>.Ok(new
        {
            message = $"{_currentUser.FullName} ({_currentUser.Role}) can invite members.",
            permission = Permissions.Members.Invite
        }, "Permission verified."));
    }

    /// <summary>
    /// Policy-based: only users who can export reports.
    /// Only Owner has this permission.
    /// </summary>
    [HttpGet("can-export")]
    [Authorize(Policy = PolicyNames.CanExportReports)]
    public IActionResult CanExportTest()
    {
        return Ok(ApiResponse<object>.Ok(new
        {
            message = $"{_currentUser.FullName} ({_currentUser.Role}) can export reports.",
            permission = Permissions.Reports.Export
        }, "Permission verified."));
    }

    /// <summary>
    /// Service-level permission check example.
    /// Shows how to check permissions inside a controller without [Authorize].
    /// Used when permission depends on runtime data (not just role).
    /// </summary>
    [HttpGet("permission-check")]
    public IActionResult CheckPermissions()
    {
        return Ok(ApiResponse<object>.Ok(new
        {
            canInviteMembers  = _permissionService.CurrentUserHasPermission(Permissions.Members.Invite),
            canRemoveMembers  = _permissionService.CurrentUserHasPermission(Permissions.Members.Remove),
            canChangeRoles    = _permissionService.CurrentUserHasPermission(Permissions.Members.ChangeRole),
            canCreateProjects = _permissionService.CurrentUserHasPermission(Permissions.Projects.Create),
            canDeleteProjects = _permissionService.CurrentUserHasPermission(Permissions.Projects.Delete),
            canArchiveProjects= _permissionService.CurrentUserHasPermission(Permissions.Projects.Archive),
            canAssignTasks    = _permissionService.CurrentUserHasPermission(Permissions.Tasks.Assign),
            canDeleteTasks    = _permissionService.CurrentUserHasPermission(Permissions.Tasks.Delete),
            canExportReports  = _permissionService.CurrentUserHasPermission(Permissions.Reports.Export),
            canViewBilling    = _permissionService.CurrentUserHasPermission(Permissions.Organizations.ViewBilling),
        }, "Permission matrix for current user."));
    }
}