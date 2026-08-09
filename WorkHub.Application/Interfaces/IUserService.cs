using WorkHub.Application.DTOs.Common;
using WorkHub.Application.DTOs.Users;

namespace WorkHub.Application.Interfaces;

public interface IUserService
{
    /// <summary>
    /// Get the current user's full profile including activity stats.
    /// </summary>
    Task<ApiResponse<ProfileDto>> GetProfileAsync();

    /// <summary>
    /// Update the current user's first + last name.
    /// </summary>
    Task<ApiResponse<ProfileDto>> UpdateProfileAsync(UpdateProfileDto dto);

    /// <summary>
    /// Change the current user's password.
    /// Verifies the current password, applies the password policy,
    /// and invalidates all existing refresh tokens.
    /// </summary>
    Task<ApiResponse<object>> ChangePasswordAsync(ChangePasswordDto dto);
}
