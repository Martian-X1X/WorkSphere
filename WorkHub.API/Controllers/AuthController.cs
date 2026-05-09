using Microsoft.AspNetCore.Mvc;
using WorkHub.API.DTOs.Auth;
using WorkHub.API.DTOs.Common;
using WorkHub.API.Interfaces;

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

    /// <summary>Login with email and password — returns JWT access token</summary>
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
            // Invalid credentials = 401 Unauthorized
            if (result.Message.Contains("Invalid email or password"))
                return Unauthorized(result);

            // Deactivated account = 403 Forbidden
            if (result.Message.Contains("deactivated"))
                return StatusCode(StatusCodes.Status403Forbidden, result);

            return BadRequest(result);
        }

        return Ok(result);
    }
}