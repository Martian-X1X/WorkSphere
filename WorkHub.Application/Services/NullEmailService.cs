using Microsoft.Extensions.Logging;
using WorkHub.Application.Interfaces;

namespace WorkHub.Application.Services;

// No-op email service — used when SMTP is not configured.
// Logs instead of sending.
public class NullEmailService : IEmailService
{
    private readonly ILogger<NullEmailService> _logger;

    public NullEmailService(ILogger<NullEmailService> logger)
    {
        _logger = logger;
    }

    public Task<bool> SendAsync(EmailMessage message)
    {
        _logger.LogInformation(
            "[NullEmailService] Would send email to {To} | Subject: {Subject}",
            message.ToEmail, message.Subject);
        return Task.FromResult(true);
    }

    public Task SendInviteEmailAsync(
        string toEmail, string toName, string invitedByName,
        string organizationName, string role,
        string inviteLink, DateTime expiresAt)
    {
        _logger.LogInformation(
            "[NullEmailService] Invite email to {Email} | Link: {Link}",
            toEmail, inviteLink);
        return Task.CompletedTask;
    }

    public Task SendWelcomeEmailAsync(
        string toEmail, string fullName, string organizationName)
    {
        _logger.LogInformation(
            "[NullEmailService] Welcome email to {Email}", toEmail);
        return Task.CompletedTask;
    }

    public Task SendPasswordChangedEmailAsync(
        string toEmail, string fullName)
    {
        _logger.LogInformation(
            "[NullEmailService] Password changed email to {Email}", toEmail);
        return Task.CompletedTask;
    }
}
