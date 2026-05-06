using WorkHub.API.DTOs.Common;

namespace WorkHub.API.Interfaces;

public interface IPasswordService
{
    /// <summary>
    /// Validate password against policy rules.
    /// Call this BEFORE hashing — on registration and password change.
    /// </summary>
    PasswordValidationResult ValidatePassword(string password);

    /// <summary>
    /// Hash a plain text password using BCrypt.
    /// Always validate first with ValidatePassword().
    /// </summary>
    string HashPassword(string plainTextPassword);

    /// <summary>
    /// Verify a plain text password against a stored BCrypt hash.
    /// Returns true if they match.
    /// </summary>
    bool VerifyPassword(string plainTextPassword, string hashedPassword);

    /// <summary>
    /// Check if a hash needs to be rehashed (e.g. work factor increased).
    /// Use this on login to silently upgrade old hashes.
    /// </summary>
    bool NeedsRehash(string hashedPassword);
}