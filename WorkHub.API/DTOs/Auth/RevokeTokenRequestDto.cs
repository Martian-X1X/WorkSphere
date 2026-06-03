using System.ComponentModel.DataAnnotations;

namespace WorkHub.API.DTOs.Auth;

public class RevokeTokenRequestDto
{
    [Required(ErrorMessage = "Refresh token is required")]
    public string RefreshToken { get; set; } = string.Empty;
}