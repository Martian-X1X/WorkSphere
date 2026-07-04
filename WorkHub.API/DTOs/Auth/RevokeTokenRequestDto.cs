using System.ComponentModel.DataAnnotations;

namespace WorkHub.API.DTOs.Auth;

public class RevokeTokenRequestDto
{
    public string RefreshToken { get; set; } = string.Empty;
}