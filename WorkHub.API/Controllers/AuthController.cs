using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkHub.Application.DTOs.Auth;
using WorkHub.Application.DTOs.Common;
using WorkHub.Application.Interfaces;


namespace WorkHub.API.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>Register a new organization and owner account</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<AuthResponseDto>.Fail(errors));
        }

        var result = await _authService.RegisterAsync(request);

        if (!result.Success)
        {
            if (result.Message.Contains("already exists"))
                return Conflict(result);
            return BadRequest(result);
        }

        return StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>Login — returns JWT access token + refresh token</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<AuthResponseDto>.Fail(errors));
        }

        var result = await _authService.LoginAsync(request);

        if (!result.Success)
        {
            if (result.Message.Contains("Invalid email or password"))
                return Unauthorized(result);
            if (result.Message.Contains("deactivated"))
                return StatusCode(StatusCodes.Status403Forbidden, result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Exchange a valid refresh token for a new access token + rotated refresh token.
    /// Call this when the access token expires (every 15 minutes).
    /// </summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<AuthResponseDto>.Fail(errors));
        }

        var result = await _authService.RefreshTokenAsync(request.RefreshToken);

        if (!result.Success)
            return Unauthorized(result);

        return Ok(result);
    }

    /// <summary>
    /// Revoke a refresh token — use this on logout.
    /// Clears the stored token so it can never be used again.
    /// </summary>
    [HttpPost("revoke")]
    [Authorize] // ← Only authenticated users can revoke
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Revoke([FromBody] RevokeTokenRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<object>.Fail(errors));
        }

        var result = await _authService.RevokeTokenAsync(request.RefreshToken);
        return Ok(result);
    }

    /// <summary>
    /// Get the full authorization context for the current request.
    /// Shows user identity, org info, and all permissions.
    /// Useful for frontend to build role-aware UIs.
    /// </summary>
    [HttpGet("context")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<AuthContextDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuthContext(
        [FromServices] IOrgContextService orgContext,
        [FromServices] IPermissionService permissionService,
        [FromServices] ICurrentUserService currentUser)
    {
        var org = await orgContext.GetCurrentOrgAsync();

        var context = new AuthContextDto
        {
            UserId = currentUser.UserId,
            Email = currentUser.Email,
            FullName = currentUser.FullName,
            Role = currentUser.Role,
            OrganizationId = currentUser.OrganizationId,
            OrganizationName = org?.Name ?? "Unknown",
            IsEmailVerified = currentUser.IsEmailVerified,
            IsOwner = currentUser.IsOwner,
            IsAdminOrOwner = currentUser.IsAdminOrOwner,
            OrgIsActive = org?.IsActive ?? false,
            OrgPlan = org?.Plan ?? "Unknown",
            Permissions = permissionService
                .GetCurrentUserPermissions()
                .OrderBy(p => p)
                .ToList()
        };

        return Ok(ApiResponse<AuthContextDto>.Ok(context,
            "Authorization context retrieved successfully."));
    }
}