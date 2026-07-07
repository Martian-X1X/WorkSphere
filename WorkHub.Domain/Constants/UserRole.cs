namespace WorkHub.Domain.Constants;

public static class UserRole
{
    public const string Owner = "Owner";
    public const string Admin = "Admin";
    public const string Member = "Member";

    // Helper to validate a role string
    public static bool IsValid(string role) =>
        role == Owner || role == Admin || role == Member;

    // All roles as a list — useful for validation
    public static readonly string[] All = { Owner, Admin, Member };
}