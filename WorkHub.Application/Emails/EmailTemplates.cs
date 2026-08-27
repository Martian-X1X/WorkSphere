namespace WorkHub.Application.Emails;

public static class EmailTemplates
{
    // ── Shared styles ──────────────────────────────────────────────
    private const string BaseStyles = @"
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont,
               'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
               background-color: #0f172a; color: #f1f5f9; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background-color: #1e293b; border: 1px solid #334155;
                border-radius: 16px; padding: 40px; }
        .logo { display: flex; align-items: center; gap: 12px;
                margin-bottom: 32px; }
        .logo-icon { width: 40px; height: 40px; background-color: #6366f1;
                     border-radius: 10px; display: inline-flex;
                     align-items: center; justify-content: center;
                     font-size: 18px; font-weight: 900; color: white;
                     text-decoration: none; }
        .logo-text { font-size: 20px; font-weight: 700; color: #f1f5f9; }
        h1 { font-size: 24px; font-weight: 700; color: #f1f5f9;
             margin: 0 0 8px 0; }
        p  { font-size: 15px; color: #94a3b8; line-height: 1.6;
             margin: 0 0 16px 0; }
        .btn { display: inline-block; background-color: #6366f1;
               color: white !important; text-decoration: none;
               padding: 14px 32px; border-radius: 12px;
               font-size: 15px; font-weight: 600; margin: 8px 0 24px 0; }
        .btn:hover { background-color: #4f46e5; }
        .highlight { background-color: #0f172a; border: 1px solid #334155;
                     border-radius: 10px; padding: 16px; margin: 16px 0; }
        .highlight p { margin: 0; font-size: 14px; }
        .highlight strong { color: #f1f5f9; }
        .badge { display: inline-block; background-color: #1e3a5f;
                 color: #60a5fa; border: 1px solid #1d4ed8;
                 border-radius: 20px; padding: 4px 12px;
                 font-size: 13px; font-weight: 600; }
        .divider { border: none; border-top: 1px solid #334155;
                   margin: 24px 0; }
        .footer { text-align: center; margin-top: 32px; }
        .footer p { font-size: 12px; color: #475569; margin: 4px 0; }
        .footer a { color: #6366f1; text-decoration: none; }
    ";

    // ── Invite email ───────────────────────────────────────────────
    public static string BuildInviteEmail(
        string invitedByName,
        string organizationName,
        string role,
        string inviteLink,
        DateTime expiresAt)
    {
        var expiryStr = expiresAt.ToString("MMMM d, yyyy");

        return $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>You've been invited to WorkSphere</title>
  <style>{BaseStyles}</style>
</head>
<body>
  <div class=""container"">
    <div class=""card"">

      <!-- Logo -->
      <div class=""logo"">
        <span class=""logo-icon"">W</span>
        <span class=""logo-text"">WorkSphere</span>
      </div>

      <!-- Headline -->
      <h1>You've been invited! 🎉</h1>
      <p>
        <strong style=""color:#f1f5f9"">{HtmlEncode(invitedByName)}</strong>
        has invited you to join
        <strong style=""color:#f1f5f9"">{HtmlEncode(organizationName)}</strong>
        on WorkSphere.
      </p>

      <!-- Role highlight -->
      <div class=""highlight"">
        <p>You'll join as <strong>{HtmlEncode(role)}</strong>
        <span class=""badge"" style=""margin-left:8px"">{HtmlEncode(role)}</span></p>
      </div>

      <!-- CTA -->
      <a href=""{inviteLink}"" class=""btn"">
        Accept Invitation →
      </a>

      <hr class=""divider"" />

      <!-- Details -->
      <p style=""font-size:13px;color:#64748b"">
        This invitation expires on <strong style=""color:#94a3b8"">
        {expiryStr}</strong>.
        If you didn't expect this invitation, you can safely ignore this email.
      </p>

      <p style=""font-size:13px;color:#64748b"">
        Or copy this link into your browser:<br/>
        <a href=""{inviteLink}"" style=""color:#6366f1;word-break:break-all"">
          {inviteLink}
        </a>
      </p>

    </div>

    <!-- Footer -->
    <div class=""footer"">
      <p>© {DateTime.UtcNow.Year} WorkSphere. All rights reserved.</p>
      <p>
        You received this email because someone invited you to join their
        WorkSphere organization.
      </p>
    </div>
  </div>
</body>
</html>";
    }

    // ── Welcome email (after accepting invite) ─────────────────────
    public static string BuildWelcomeEmail(
        string fullName,
        string organizationName,
        string dashboardUrl)
    {
        return $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>Welcome to WorkSphere!</title>
  <style>{BaseStyles}</style>
</head>
<body>
  <div class=""container"">
    <div class=""card"">

      <div class=""logo"">
        <span class=""logo-icon"">W</span>
        <span class=""logo-text"">WorkSphere</span>
      </div>

      <h1>Welcome, {HtmlEncode(fullName)}! 👋</h1>
      <p>
        You've successfully joined
        <strong style=""color:#f1f5f9"">{HtmlEncode(organizationName)}</strong>
        on WorkSphere. You're all set to start collaborating.
      </p>

      <div class=""highlight"">
        <p>Here's what you can do right away:</p>
        <ul style=""margin:8px 0 0 0;padding-left:20px;color:#94a3b8"">
          <li style=""margin-bottom:6px"">View your assigned tasks</li>
          <li style=""margin-bottom:6px"">Browse the project board</li>
          <li style=""margin-bottom:6px"">Collaborate with your team</li>
        </ul>
      </div>

      <a href=""{dashboardUrl}"" class=""btn"">
        Go to Dashboard →
      </a>

    </div>

    <div class=""footer"">
      <p>© {DateTime.UtcNow.Year} WorkSphere. All rights reserved.</p>
    </div>
  </div>
</body>
</html>";
    }

    // ── Password changed email ─────────────────────────────────────
    public static string BuildPasswordChangedEmail(string fullName)
    {
        return $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"" />
  <title>Password Changed</title>
  <style>{BaseStyles}</style>
</head>
<body>
  <div class=""container"">
    <div class=""card"">

      <div class=""logo"">
        <span class=""logo-icon"">W</span>
        <span class=""logo-text"">WorkSphere</span>
      </div>

      <h1>Password changed 🔒</h1>
      <p>Hi {HtmlEncode(fullName)},</p>
      <p>
        Your WorkSphere account password was successfully changed.
        If you made this change, no further action is needed.
      </p>

      <div class=""highlight"" style=""border-color:#7f1d1d;
           background-color:#1c0a0a"">
        <p style=""color:#fca5a5"">
          ⚠ If you did <strong>not</strong> make this change,
          please contact your organization admin immediately.
        </p>
      </div>

    </div>

    <div class=""footer"">
      <p>© {DateTime.UtcNow.Year} WorkSphere. All rights reserved.</p>
    </div>
  </div>
</body>
</html>";
    }

    // ── HTML encoding helper ───────────────────────────────────────
    private static string HtmlEncode(string text)
        => System.Net.WebUtility.HtmlEncode(text);
}
