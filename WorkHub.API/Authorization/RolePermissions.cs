using WorkHub.API.Models;

namespace WorkHub.API.Authorization;

/// <summary>
/// Maps each role to its set of allowed permissions.
/// This is the permission matrix — the definitive answer to
/// "what can a [Role] do in WorkSphere?"
/// </summary>
public static class RolePermissions
{
    private static readonly Dictionary<string, HashSet<string>> _matrix = new()
    {
        // ── OWNER — Full platform control ─────────────────────────
        [UserRole.Owner] = new HashSet<string>
        {
            // Organization
            Permissions.Organizations.View,
            Permissions.Organizations.Update,
            Permissions.Organizations.Delete,
            Permissions.Organizations.ViewBilling,

            // Members
            Permissions.Members.View,
            Permissions.Members.Invite,
            Permissions.Members.Remove,
            Permissions.Members.ChangeRole,

            // Projects
            Permissions.Projects.View,
            Permissions.Projects.Create,
            Permissions.Projects.Update,
            Permissions.Projects.Delete,
            Permissions.Projects.Archive,

            // Tasks
            Permissions.Tasks.View,
            Permissions.Tasks.Create,
            Permissions.Tasks.Update,
            Permissions.Tasks.Delete,
            Permissions.Tasks.Assign,
            Permissions.Tasks.UpdateOwn,

            // Comments
            Permissions.Comments.View,
            Permissions.Comments.Create,
            Permissions.Comments.Delete,
            Permissions.Comments.DeleteOwn,

            // Reports
            Permissions.Reports.View,
            Permissions.Reports.Export,
        },

        // ── ADMIN — Manage team and content ───────────────────────
        [UserRole.Admin] = new HashSet<string>
        {
            // Organization (view only — cannot delete)
            Permissions.Organizations.View,

            // Members (invite + remove, but NOT change roles)
            Permissions.Members.View,
            Permissions.Members.Invite,
            Permissions.Members.Remove,

            // Projects (full CRUD, cannot archive)
            Permissions.Projects.View,
            Permissions.Projects.Create,
            Permissions.Projects.Update,
            Permissions.Projects.Delete,

            // Tasks (full CRUD + assign)
            Permissions.Tasks.View,
            Permissions.Tasks.Create,
            Permissions.Tasks.Update,
            Permissions.Tasks.Delete,
            Permissions.Tasks.Assign,
            Permissions.Tasks.UpdateOwn,

            // Comments (full + own delete)
            Permissions.Comments.View,
            Permissions.Comments.Create,
            Permissions.Comments.Delete,
            Permissions.Comments.DeleteOwn,

            // Reports (view only — cannot export)
            Permissions.Reports.View,
        },

        // ── MEMBER — Work on assigned tasks ───────────────────────
        [UserRole.Member] = new HashSet<string>
        {
            // Organization (view only)
            Permissions.Organizations.View,

            // Members (view only — cannot invite or remove)
            Permissions.Members.View,

            // Projects (view only — cannot create/edit/delete)
            Permissions.Projects.View,

            // Tasks (view all, update only own)
            Permissions.Tasks.View,
            Permissions.Tasks.UpdateOwn,

            // Comments (view + create + delete own)
            Permissions.Comments.View,
            Permissions.Comments.Create,
            Permissions.Comments.DeleteOwn,
        }
    };

    /// <summary>
    /// Check if a role has a specific permission.
    /// </summary>
    public static bool HasPermission(string role, string permission)
    {
        if (string.IsNullOrWhiteSpace(role) || string.IsNullOrWhiteSpace(permission))
            return false;

        return _matrix.TryGetValue(role, out var permissions)
            && permissions.Contains(permission);
    }

    /// <summary>
    /// Get all permissions for a given role.
    /// </summary>
    public static IReadOnlySet<string> GetPermissions(string role)
    {
        return _matrix.TryGetValue(role, out var permissions)
            ? permissions
            : new HashSet<string>();
    }

    /// <summary>
    /// Get the full permission matrix — useful for debugging
    /// or building a permissions UI.
    /// </summary>
    public static IReadOnlyDictionary<string, HashSet<string>> GetMatrix()
        => _matrix;
}