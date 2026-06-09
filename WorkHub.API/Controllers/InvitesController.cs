using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkHub.API.Authorization;
using WorkHub.API.DTOs.Common;
using WorkHub.API.DTOs.Invite;
using WorkHub.API.Interfaces;

namespace WorkHub.API.Controllers;

[ApiController]
[Route("api")]
[Produces("application/json")]
public class InvitesController : ControllerBase
{
    private readonly IInviteService _inviteService;
    private readonly ILogger<InvitesController> _logger;

    public InvitesController(
        IInviteService inviteService,
        ILogger<InvitesController> logger)
    {
        _inviteService = inviteService;
        _logger = logger;
    }

    /// <summary>
    /// Create and send an invite to a team member.
    /// Owner and Admin only.
    /// </summary>
    [HttpPost("organizations/me/invites")]
    [Authorize(Policy = PolicyNames.CanInviteMembers)]
    [ProducesResponseType(typeof(ApiResponse<InviteResponseDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<InviteResponseDto>), 400)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> CreateInvite([FromBody] CreateInviteDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<InviteResponseDto>.Fail(errors));
        }

        var result = await _inviteService.CreateInviteAsync(dto);

        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    /// <summary>
    /// Get all invites for the current organization.
    /// Owner and Admin only.
    /// </summary>
    [HttpGet("organizations/me/invites")]
    [Authorize(Policy = PolicyNames.CanInviteMembers)]
    [ProducesResponseType(typeof(ApiResponse<List<InviteResponseDto>>), 200)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> GetOrgInvites()
    {
        var result = await _inviteService.GetOrgInvitesAsync();
        return Ok(result);
    }

    /// <summary>
    /// Cancel a pending invite.
    /// Owner and Admin only.
    /// </summary>
    [HttpDelete("organizations/me/invites/{inviteId:guid}")]
    [Authorize(Policy = PolicyNames.CanInviteMembers)]
    [ProducesResponseType(typeof(ApiResponse<object>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> CancelInvite(Guid inviteId)
    {
        var result = await _inviteService.CancelInviteAsync(inviteId);

        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Preview an invite — public endpoint, no auth required.
    /// Shows org name, inviter name, role, expiry.
    /// </summary>
    [HttpGet("invites/{token}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<InvitePreviewDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<InvitePreviewDto>), 404)]
    public async Task<IActionResult> GetInvitePreview(string token)
    {
        var result = await _inviteService.GetInvitePreviewAsync(token);

        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Accept an invite — creates user account and joins org.
    /// Public endpoint — the new user is not logged in yet.
    /// Returns JWT + refresh token on success.
    /// </summary>
    [HttpPost("invites/{token}/accept")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>), 201)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> AcceptInvite(
        string token,
        [FromBody] AcceptInviteDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<object>.Fail(errors));
        }

        var result = await _inviteService.AcceptInviteAsync(token, dto);

        if (!result.Success)
        {
            if (result.Message.Contains("not found") ||
                result.Message.Contains("expired") ||
                result.Message.Contains("cancelled"))
                return NotFound(result);

            return BadRequest(result);
        }

        return StatusCode(201, result);
    }
}