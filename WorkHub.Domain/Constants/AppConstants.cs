namespace WorkHub.Domain.Constants;

/// <summary>
/// Application-wide constants. Single source of truth for all magic numbers.
/// </summary>
public static class AppConstants
{
    // ── JWT ─────────────────────────────────────────────────────────
    public const int JwtAccessTokenExpiryMinutes = 15;
    public const int JwtRefreshTokenExpiryDays   = 7;
    public const int RefreshTokenByteLength      = 64;   // 512 bits

    // ── Password ────────────────────────────────────────────────────
    public const int BcryptWorkFactor     = 12;
    public const int MinPasswordLength    = 8;
    public const int MaxPasswordLength    = 128;

    // ── Invites ─────────────────────────────────────────────────────
    public const int InviteTokenByteLength = 32;   // 256 bits
    public const int InviteExpiryDays      = 7;

    // ── Pagination ──────────────────────────────────────────────────
    public const int DefaultPageSize     = 20;
    public const int MaxPageSize         = 100;
    public const int SearchMaxResults    = 10;
    public const int SearchMinQueryLength = 2;

    // ── Notifications ───────────────────────────────────────────────
    public const int NotificationCountCacheSeconds = 10;
    public const int NotificationMaxPerPage        = 50;

    // ── Email ───────────────────────────────────────────────────────
    public const int SmtpTimeoutSeconds = 30;

    // ── Rate limiting (future) ──────────────────────────────────────
    public const int MaxLoginAttemptsPerMinute = 5;
    public const int MaxInvitesPerHour         = 20;

    // ── Field lengths (match DB MaxLength attributes) ───────────────
    public const int MaxProjectNameLength        = 200;
    public const int MaxTaskTitleLength          = 500;
    public const int MaxCommentLength            = 4000;
    public const int MaxDescriptionLength        = 2000;
    public const int MaxUserNameLength           = 50;
    public const int MaxEmailLength              = 256;
    public const int MaxOrganizationNameLength   = 100;

    // ── Performance ─────────────────────────────────────────────────
    public const int SlowQueryThresholdMs = 500;
    public const int DbConnectionMinPool  = 2;
    public const int DbConnectionMaxPool  = 20;
}