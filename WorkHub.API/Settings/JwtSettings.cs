namespace WorkHub.API.Settings;

public class JwtSettings
{
    public const string SectionName = "JwtSettings";

    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "WorkSphere.API";
    public string Audience { get; set; } = "WorkSphere.Client";
    public int AccessTokenExpiryMinutes { get; set; } = 15;
    public int RefreshTokenExpiryDays { get; set; } = 7;
}