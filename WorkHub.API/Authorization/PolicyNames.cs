namespace WorkHub.API.Authorization;

/// <summary>
/// Named authorization policies — use these strings with
/// [Authorize(Policy = PolicyNames.CanInviteMembers)]
/// instead of hardcoding permission strings in attributes.
/// </summary>
public static class PolicyNames
{
    // Organization
    public const string CanViewOrganization   = "CanViewOrganization";
    public const string CanManageOrganization = "CanManageOrganization";
    public const string CanViewBilling        = "CanViewBilling";

    // Members
    public const string CanViewMembers        = "CanViewMembers";
    public const string CanInviteMembers      = "CanInviteMembers";
    public const string CanRemoveMembers      = "CanRemoveMembers";
    public const string CanChangeRoles        = "CanChangeRoles";

    // Projects
    public const string CanViewProjects       = "CanViewProjects";
    public const string CanCreateProjects     = "CanCreateProjects";
    public const string CanManageProjects     = "CanManageProjects";
    public const string CanDeleteProjects     = "CanDeleteProjects";

    // Tasks
    public const string CanViewTasks          = "CanViewTasks";
    public const string CanCreateTasks        = "CanCreateTasks";
    public const string CanManageTasks        = "CanManageTasks";
    public const string CanAssignTasks        = "CanAssignTasks";
    public const string CanUpdateOwnTasks     = "CanUpdateOwnTasks";

    // Comments
    public const string CanViewComments       = "CanViewComments";
    public const string CanCreateComments     = "CanCreateComments";
    public const string CanDeleteComments     = "CanDeleteComments";

    // Reports
    public const string CanViewReports        = "CanViewReports";
    public const string CanExportReports      = "CanExportReports";
}