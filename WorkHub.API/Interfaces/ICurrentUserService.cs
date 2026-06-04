namespace WorkHub.API.Interfaces;

public interface ICurrentUserService
{
    /// <summary>Current user's ID from JWT claim</summary>
    Guid UserId { get; }

    /// <summary>Current user's email from JWT claim</summary>
    string Email { get; }

    /// <summary>Current user's role from JWT claim — Owner/Admin/Member</summary>
    string Role { get; }

    /// <summary>Current user's organization ID from JWT claim</summary>
    Guid OrganizationId { get; }

    /// <summary>Current user's full name from JWT claim</summary>
    string FullName { get; }

    /// <summary>Whether the current user's email is verified</summary>
    bool IsEmailVerified { get; }

    /// <summary>True if a valid authenticated user is present in context</summary>
    bool IsAuthenticated { get; }

    /// <summary>True if current user has Owner role</summary>
    bool IsOwner { get; }

    /// <summary>True if current user has Admin or Owner role</summary>
    bool IsAdminOrOwner { get; }
}