using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkHub.API.Authorization;
using WorkHub.Application.DTOs.Common;
using WorkHub.Application.DTOs.Organization;
using WorkHub.Application.Interfaces;

namespace WorkHub.API.Controllers;

[ApiController]
[Route("api/organizations")]
[Produces("application/json")]
[Authorize] // All endpoints require authentication
public class OrganizationsController : ControllerBase
{
    private readonly IOrganizationService _orgService;
    private readonly ILogger<OrganizationsController> _logger;

    public OrganizationsController(
        IOrganizationService orgService,
        ILogger<OrganizationsController> logger)
    {
        _orgService = orgService;
        _logger = logger;
    }

    /// <summary>
    /// Get the current user's organization profile.
    /// All roles can access this.
    /// </summary>
    [HttpGet("me")]
    [Authorize(Policy = PolicyNames.CanViewOrganization)]
    [ProducesResponseType(typeof(ApiResponse<OrganizationDto>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetMyOrganization()
    {
        var result = await _orgService.GetMyOrganizationAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update organization details.
    /// Owner only — admins and members cannot change org settings.
    /// </summary>
    [HttpPut("me")]
    [Authorize(Policy = PolicyNames.CanManageOrganization)]
    [ProducesResponseType(typeof(ApiResponse<OrganizationDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<OrganizationDto>), 400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> UpdateOrganization(
        [FromBody] UpdateOrganizationDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<OrganizationDto>.Fail(errors));
        }

        var result = await _orgService.UpdateOrganizationAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get paginated list of all members in the current organization.
    /// All roles can view members.
    /// </summary>
    [HttpGet("me/members")]
    [Authorize(Policy = PolicyNames.CanViewMembers)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<MemberDto>>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetMembers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _orgService.GetMembersAsync(page, pageSize);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get a specific member by their ID.
    /// Must belong to the same organization — cross-org access blocked by OrgScopeGuard.
    /// </summary>
    [HttpGet("me/members/{memberId:guid}")]
    [Authorize(Policy = PolicyNames.CanViewMembers)]
    [ProducesResponseType(typeof(ApiResponse<MemberDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<MemberDto>), 404)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetMemberById(Guid memberId)
    {
        var result = await _orgService.GetMemberByIdAsync(memberId);

        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Change a member's role.
    /// Owner only — only Owners can assign/change roles.
    /// </summary>
    [HttpPatch("me/members/{memberId:guid}/role")]
    [Authorize(Policy = PolicyNames.CanChangeRoles)]
    [ProducesResponseType(typeof(ApiResponse<MemberDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<MemberDto>), 400)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> ChangeMemberRole(
        Guid memberId,
        [FromBody] ChangeMemberRoleDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<MemberDto>.Fail(errors));
        }

        var result = await _orgService.ChangeMemberRoleAsync(memberId, dto.Role);

        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Deactivate a member — removes their access immediately.
    /// Owner and Admin can deactivate Members.
    /// Owner can deactivate Admins.
    /// </summary>
    [HttpPatch("me/members/{memberId:guid}/deactivate")]
    [Authorize(Policy = PolicyNames.CanRemoveMembers)]
    [ProducesResponseType(typeof(ApiResponse<object>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    [ProducesResponseType(401), ProducesResponseType(403)]
    public async Task<IActionResult> DeactivateMember(Guid memberId)
    {
        var result = await _orgService.DeactivateMemberAsync(memberId);

        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }
}