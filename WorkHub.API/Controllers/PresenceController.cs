using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkHub.Application.DTOs.Common;
using WorkHub.Application.Interfaces;
using WorkHub.Infrastructure.SignalR;

namespace WorkHub.API.Controllers;

/// <summary>
/// Presence snapshot for the current user's organization. SignalR events keep
/// the client in sync after the initial load.
/// </summary>
[ApiController]
[Route("api/presence")]
[Authorize]
[Produces("application/json")]
public class PresenceController : ControllerBase
{
    private readonly PresenceTracker _presence;
    private readonly ICurrentUserService _currentUser;

    public PresenceController(PresenceTracker presence, ICurrentUserService currentUser)
    {
        _presence    = presence;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Returns the online user IDs in the authenticated user's organization.
    /// </summary>
    [HttpGet("online")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<string>>), StatusCodes.Status200OK)]
    public IActionResult GetOnlineUsers()
    {
        var online = _presence.GetOnlineUsers(_currentUser.OrganizationId.ToString());
        return Ok(ApiResponse<IReadOnlyList<string>>.Ok(online));
    }
}
