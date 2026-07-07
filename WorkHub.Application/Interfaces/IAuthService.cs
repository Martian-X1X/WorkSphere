using WorkHub.Application.DTOs.Auth;
using WorkHub.Application.DTOs.Common;

namespace WorkHub.Application.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterRequestDto request);
    Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request);
    Task<ApiResponse<AuthResponseDto>> RefreshTokenAsync(string refreshToken);  
    Task<ApiResponse<object>> RevokeTokenAsync(string refreshToken); 
}