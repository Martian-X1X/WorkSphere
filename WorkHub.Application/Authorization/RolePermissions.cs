using WorkHub.Domain.Entities;
using WorkHub.Domain.Constants;

namespace WorkHub.Application.Authorization;

public static class RolePermissions
{
    private static readonly Dictionary<string, HashSet<string>> _matrix = new()
    {
        [UserRole.Owner] = new HashSet<string>
        {
            Permissions.Organizations.View,
            Permissions.Organizations.Update,
            Permissions.Organizations.Delete,
            Permissions.Organizations.ViewBilling,

            Permissions.Members.View,
            Permissions.Members.Invite,
            Permissions.Members.Remove,
            Permissions.Members.ChangeRole,

            Permissions.Projects.View,
            Permissions.Projects.Create,
            Permissions.Projects.Update,
            Permissions.Projects.Delete,
            Permissions.Projects.Archive,

            Permissions.Tasks.View,
            Permissions.Tasks.Create,
            Permissions.Tasks.Update,
            Permissions.Tasks.Delete,
            Permissions.Tasks.Assign,
            Permissions.Tasks.UpdateOwn,

            Permissions.Comments.View,
            Permissions.Comments.Create,
            Permissions.Comments.Delete,
            Permissions.Comments.DeleteOwn,

            Permissions.Reports.View,
            Permissions.Reports.Export,
        },

        [UserRole.Admin] = new HashSet<string>
        {
            Permissions.Organizations.View,

            Permissions.Members.View,
            Permissions.Members.Invite,
            Permissions.Members.Remove,

            Permissions.Projects.View,
            Permissions.Projects.Create,
            Permissions.Projects.Update,
            Permissions.Projects.Delete,

            Permissions.Tasks.View,
            Permissions.Tasks.Create,
            Permissions.Tasks.Update,
            Permissions.Tasks.Delete,
            Permissions.Tasks.Assign,
            Permissions.Tasks.UpdateOwn,

            Permissions.Comments.View,
            Permissions.Comments.Create,
            Permissions.Comments.Delete,
            Permissions.Comments.DeleteOwn,

            Permissions.Reports.View,
        },

        [UserRole.Member] = new HashSet<string>
        {
            Permissions.Organizations.View,

            Permissions.Members.View,

            Permissions.Projects.View,

            Permissions.Tasks.View,
            Permissions.Tasks.UpdateOwn,

            Permissions.Comments.View,
            Permissions.Comments.Create,
            Permissions.Comments.DeleteOwn,
        }
    };

    public static bool HasPermission(string role, string permission)
    {
        if (string.IsNullOrWhiteSpace(role) || string.IsNullOrWhiteSpace(permission))
            return false;

        return _matrix.TryGetValue(role, out var permissions)
            && permissions.Contains(permission);
    }

    public static IReadOnlySet<string> GetPermissions(string role)
    {
        return _matrix.TryGetValue(role, out var permissions)
            ? permissions
            : new HashSet<string>();
    }

    public static IReadOnlyDictionary<string, HashSet<string>> GetMatrix()
        => _matrix;
}
