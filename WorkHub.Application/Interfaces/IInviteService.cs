using WorkHub.Application.DTOs.Auth;
using WorkHub.Application.DTOs.Common;
using WorkHub.Application.DTOs.Invite;

namespace WorkHub.Application.Interfaces;

public interface IInviteService
{
    /// <summary>Send an invite to an email address — Owner/Admin only</summary>
    Task<ApiResponse<InviteResponseDto>> CreateInviteAsync(CreateInviteDto dto);

    /// <summary>Get all pending invites for the current org</summary>
    Task<ApiResponse<List<InviteResponseDto>>> GetOrgInvitesAsync();

    /// <summary>Preview invite details before accepting — public endpoint</summary>
    Task<ApiResponse<InvitePreviewDto>> GetInvitePreviewAsync(string token);

    /// <summary>Accept invite — creates user account and joins org</summary>
    Task<ApiResponse<AuthResponseDto>> AcceptInviteAsync(string token, AcceptInviteDto dto);

    /// <summary>Cancel a pending invite — Owner/Admin only</summary>
    Task<ApiResponse<object>> CancelInviteAsync(Guid inviteId);
}