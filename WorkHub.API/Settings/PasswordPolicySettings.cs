namespace WorkHub.API.Settings;

public class PasswordPolicySettings
{
    public const string SectionName = "PasswordPolicy";

    public int WorkFactor { get; set; } = 12;
    public int MinLength { get; set; } = 8;
    public int MaxLength { get; set; } = 128;
    public bool RequireUppercase { get; set; } = true;
    public bool RequireLowercase { get; set; } = true;
    public bool RequireDigit { get; set; } = true;
    public bool RequireSpecialChar { get; set; } = true;
}