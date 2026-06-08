using WorkHub.API.DTOs.Common;
using WorkHub.API.DTOs.Organization;

namespace WorkHub.API.Interfaces;

public interface IOrganizationService
{
    /// <summary>Get the current user's organization profile</summary>
    Task<ApiResponse<OrganizationDto>> GetMyOrganizationAsync();

    /// <summary>Update organization details — Owner only</summary>
    Task<ApiResponse<OrganizationDto>> UpdateOrganizationAsync(UpdateOrganizationDto dto);

    /// <summary>Get paginated list of members in the current org</summary>
    Task<ApiResponse<PagedResult<MemberDto>>> GetMembersAsync(int page = 1, int pageSize = 20);

    /// <summary>Get a specific member by ID — must be in same org</summary>
    Task<ApiResponse<MemberDto>> GetMemberByIdAsync(Guid memberId);
}