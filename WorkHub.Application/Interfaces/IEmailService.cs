namespace WorkHub.Application.Interfaces;

// ── Email message model ────────────────────────────────────────────
public class EmailMessage
{
    public string  ToEmail       { get; set; } = string.Empty;
    public string  ToName        { get; set; } = string.Empty;
    public string  Subject       { get; set; } = string.Empty;
    public string  HtmlBody      { get; set; } = string.Empty;
    public string? PlainTextBody { get; set; }
}

// ── Service contract ───────────────────────────────────────────────
public interface IEmailService
{
    Task<bool> SendAsync(EmailMessage message);

    Task SendInviteEmailAsync(
        string toEmail,
        string toName,
        string invitedByName,
        string organizationName,
        string role,
        string inviteLink,
        DateTime expiresAt
    );

    Task SendWelcomeEmailAsync(
        string toEmail,
        string fullName,
        string organizationName
    );

    Task SendPasswordChangedEmailAsync(
        string toEmail,
        string fullName
    );
}
