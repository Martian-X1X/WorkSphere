using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using WorkHub.Application.Emails;
using WorkHub.Application.Interfaces;
using WorkHub.Application.Settings;

namespace WorkHub.Application.Services;

public class MailKitEmailService : IEmailService
{
    private readonly SmtpSettings  _smtp;
    private readonly AppSettings   _app;
    private readonly ILogger<MailKitEmailService> _logger;

    public MailKitEmailService(
        IOptions<SmtpSettings>  smtp,
        IOptions<AppSettings>   app,
        ILogger<MailKitEmailService> logger)
    {
        _smtp   = smtp.Value;
        _app    = app.Value;
        _logger = logger;
    }

    // ── Core send method ───────────────────────────────────────────
    public async Task<bool> SendAsync(EmailMessage message)
    {
        try
        {
            var email = new MimeMessage();

            // From
            email.From.Add(new MailboxAddress(_smtp.FromName, _smtp.FromEmail));

            // To
            email.To.Add(new MailboxAddress(message.ToName, message.ToEmail));

            // Subject
            email.Subject = message.Subject;

            // Body — multipart (HTML + plain text)
            var builder = new BodyBuilder
            {
                HtmlBody      = message.HtmlBody,
                TextBody      = message.PlainTextBody
                    ?? StripHtml(message.HtmlBody),
            };
            email.Body = builder.ToMessageBody();

            // Connect and send
            using var client = new SmtpClient();

            await client.ConnectAsync(
                _smtp.Host,
                _smtp.Port,
                _smtp.EnableSsl
                    ? SecureSocketOptions.StartTls
                    : SecureSocketOptions.None
            );

            await client.AuthenticateAsync(_smtp.Username, _smtp.Password);
            await client.SendAsync(email);
            await client.DisconnectAsync(true);

            _logger.LogInformation(
                "Email sent successfully to {Email} | Subject: {Subject}",
                message.ToEmail, message.Subject);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to send email to {Email} | Subject: {Subject}",
                message.ToEmail, message.Subject);
            return false;
        }
    }

    // ── Invite email ───────────────────────────────────────────────
    public async Task SendInviteEmailAsync(
        string   toEmail,
        string   toName,
        string   invitedByName,
        string   organizationName,
        string   role,
        string   inviteLink,
        DateTime expiresAt)
    {
        var html = EmailTemplates.BuildInviteEmail(
            invitedByName,
            organizationName,
            role,
            inviteLink,
            expiresAt
        );

        await SendAsync(new EmailMessage
        {
            ToEmail  = toEmail,
            ToName   = toName,
            Subject  = $"{invitedByName} invited you to join {organizationName} on WorkSphere",
            HtmlBody = html,
        });
    }

    // ── Welcome email ──────────────────────────────────────────────
    public async Task SendWelcomeEmailAsync(
        string toEmail,
        string fullName,
        string organizationName)
    {
        var dashboardUrl = $"{_app.BaseUrl}/dashboard";

        var html = EmailTemplates.BuildWelcomeEmail(
            fullName,
            organizationName,
            dashboardUrl
        );

        await SendAsync(new EmailMessage
        {
            ToEmail  = toEmail,
            ToName   = fullName,
            Subject  = $"Welcome to {organizationName} on WorkSphere! 🎉",
            HtmlBody = html,
        });
    }

    // ── Password changed email ─────────────────────────────────────
    public async Task SendPasswordChangedEmailAsync(
        string toEmail,
        string fullName)
    {
        var html = EmailTemplates.BuildPasswordChangedEmail(fullName);

        await SendAsync(new EmailMessage
        {
            ToEmail  = toEmail,
            ToName   = fullName,
            Subject  = "Your WorkSphere password was changed",
            HtmlBody = html,
        });
    }

    // ── Strip HTML for plain text fallback ────────────────────────
    private static string StripHtml(string html)
    {
        return System.Text.RegularExpressions.Regex
            .Replace(html, "<[^>]*>", " ")
            .Replace("&nbsp;", " ")
            .Replace("&amp;",  "&")
            .Replace("&lt;",   "<")
            .Replace("&gt;",   ">")
            .Trim();
    }
}
