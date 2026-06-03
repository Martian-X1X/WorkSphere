using WorkHub.API.DTOs.Auth;
using WorkHub.API.DTOs.Common;

namespace WorkHub.API.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterRequestDto request);
    Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request);
    Task<ApiResponse<AuthResponseDto>> RefreshTokenAsync(string refreshToken);  
    Task<ApiResponse<object>> RevokeTokenAsync(string refreshToken); 
}