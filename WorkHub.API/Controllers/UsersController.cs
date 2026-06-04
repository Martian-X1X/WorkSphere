using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkHub.API.DTOs.Common;
using WorkHub.API.Interfaces;

namespace WorkHub.API.Controllers;

[ApiController]
[Route("api/users")]
[Produces("application/json")]
[Authorize] // ✅ ALL endpoints in this controller require a valid JWT
public class UsersController : ControllerBase
{
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        ICurrentUserService currentUser,
        ILogger<UsersController> logger)
    {
        _currentUser = currentUser;
        _logger = logger;
    }

    /// <summary>
    /// Get the currently authenticated user's profile.
    /// Reads directly from JWT claims — zero DB queries.
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
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

        return Ok(ApiResponse<CurrentUserDto>.Ok(
            profile, "Profile retrieved successfully."));
    }

    /// <summary>
    /// Owner-only endpoint example.
    /// Returns 403 for Admin and Member roles.
    /// </summary>
    [HttpGet("owner-only")]
    [Authorize(Roles = "Owner")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public IActionResult OwnerOnlyEndpoint()
    {
        return Ok(ApiResponse<object>.Ok(
            new { message = "Welcome, Owner! You have full platform access." },
            "Owner access granted."));
    }

    /// <summary>
    /// Admin or Owner endpoint example.
    /// Returns 403 for Member role.
    /// </summary>
    [HttpGet("admin-area")]
    [Authorize(Roles = "Owner,Admin")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public IActionResult AdminAreaEndpoint()
    {
        return Ok(ApiResponse<object>.Ok(
            new
            {
                message = $"Welcome to the admin area, {_currentUser.FullName}!",
                yourRole = _currentUser.Role,
                organizationId = _currentUser.OrganizationId
            },
            "Admin access granted."));
    }
}