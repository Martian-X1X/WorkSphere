using System.ComponentModel.DataAnnotations;

namespace WorkHub.Application.DTOs.Auth;
public class RevokeTokenRequestDto
{
    public string RefreshToken { get; set; } = string.Empty;
}