using Microsoft.Extensions.Options;
using WorkHub.API.DTOs.Common;
using WorkHub.API.Interfaces;
using WorkHub.API.Settings;

namespace WorkHub.API.Services;

public class PasswordService : IPasswordService
{
    private readonly PasswordPolicySettings _policy;
    private readonly ILogger<PasswordService> _logger;

    // ✅ Common weak passwords — rejected regardless of complexity rules
    private static readonly HashSet<string> CommonPasswords = new(StringComparer.OrdinalIgnoreCase)
    {
        "password", "password1", "password123", "Password1", "Password123",
        "Password123!", "12345678", "123456789", "qwerty123", "iloveyou",
        "admin123", "letmein1", "welcome1", "monkey123", "dragon123",
        "master123", "sunshine1", "princess1", "football1", "baseball1",
        "superman1", "batman123", "trustno1!", "abc12345!", "pass1234"
    };

    public PasswordService(
        IOptions<PasswordPolicySettings> policy,
        ILogger<PasswordService> logger)
    {
        _policy = policy.Value;
        _logger = logger;
    }

    // ─────────────────────────────────────────────────────────
    // VALIDATE
    // ─────────────────────────────────────────────────────────
    public PasswordValidationResult ValidatePassword(string password)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(password))
        {
            errors.Add("Password is required.");
            return PasswordValidationResult.Failure(errors);
        }

        // ── Length ──────────────────────────────────────────
        if (password.Length < _policy.MinLength)
            errors.Add($"Password must be at least {_policy.MinLength} characters long.");

        if (password.Length > _policy.MaxLength)
            errors.Add($"Password must not exceed {_policy.MaxLength} characters.");

        // ── Complexity ──────────────────────────────────────
        if (_policy.RequireUppercase && !password.Any(char.IsUpper))
            errors.Add("Password must contain at least one uppercase letter (A-Z).");

        if (_policy.RequireLowercase && !password.Any(char.IsLower))
            errors.Add("Password must contain at least one lowercase letter (a-z).");

        if (_policy.RequireDigit && !password.Any(char.IsDigit))
            errors.Add("Password must contain at least one number (0-9).");

        if (_policy.RequireSpecialChar && !password.Any(c => !char.IsLetterOrDigit(c)))
            errors.Add("Password must contain at least one special character (!@#$%^&*).");

        // ── Common password check ───────────────────────────
        if (CommonPasswords.Contains(password))
            errors.Add("This password is too common. Please choose a more unique password.");

        // ── No whitespace allowed ───────────────────────────
        if (password.Any(char.IsWhiteSpace))
            errors.Add("Password must not contain spaces.");

        if (errors.Count > 0)
        {
            _logger.LogWarning("Password validation failed with {ErrorCount} error(s)", errors.Count);
            return PasswordValidationResult.Failure(errors);
        }

        return PasswordValidationResult.Success();
    }

    // ─────────────────────────────────────────────────────────
    // HASH
    // ─────────────────────────────────────────────────────────
    public string HashPassword(string plainTextPassword)
    {
        if (string.IsNullOrWhiteSpace(plainTextPassword))
            throw new ArgumentException("Password cannot be empty.", nameof(plainTextPassword));

        // BCrypt generates a unique salt and embeds it in the hash automatically
        // Work factor 12 = ~300ms per hash on modern hardware
        // This makes brute-force attacks computationally expensive
        var hash = BCrypt.Net.BCrypt.HashPassword(plainTextPassword, _policy.WorkFactor);

        _logger.LogDebug("Password hashed successfully with work factor {WorkFactor}", _policy.WorkFactor);

        return hash;
    }

    // ─────────────────────────────────────────────────────────
    // VERIFY
    // ─────────────────────────────────────────────────────────
    public bool VerifyPassword(string plainTextPassword, string hashedPassword)
    {
        if (string.IsNullOrWhiteSpace(plainTextPassword) ||
            string.IsNullOrWhiteSpace(hashedPassword))
            return false;

        try
        {
            // BCrypt.Verify extracts the salt from the stored hash and
            // re-hashes the plain text to compare — constant-time comparison
            return BCrypt.Net.BCrypt.Verify(plainTextPassword, hashedPassword);
        }
        catch (Exception ex)
        {
            // Invalid hash format — log and return false (never throw to caller)
            _logger.LogError(ex, "BCrypt verification failed — invalid hash format");
            return false;
        }
    }

    // ─────────────────────────────────────────────────────────
    // NEEDS REHASH
    // ─────────────────────────────────────────────────────────
    public bool NeedsRehash(string hashedPassword)
    {
        if (string.IsNullOrWhiteSpace(hashedPassword))
            return true;

        try
        {
            // Check if the stored hash was created with a lower work factor
            // If yes, silently rehash on next login (transparent to the user)
            return BCrypt.Net.BCrypt.PasswordNeedsRehash(hashedPassword, _policy.WorkFactor);
        }
        catch
        {
            return true;
        }
    }
}