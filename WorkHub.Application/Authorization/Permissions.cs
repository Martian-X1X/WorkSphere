namespace WorkHub.Application.Authorization;

public static class Permissions
{
    public static class Organizations
    {
        public const string View     = "organizations.view";
        public const string Update   = "organizations.update";
        public const string Delete   = "organizations.delete";
        public const string ViewBilling = "organizations.billing.view";
    }

    public static class Members
    {
        public const string View     = "members.view";
        public const string Invite   = "members.invite";
        public const string Remove   = "members.remove";
        public const string ChangeRole = "members.changerole";
    }

    public static class Projects
    {
        public const string View     = "projects.view";
        public const string Create   = "projects.create";
        public const string Update   = "projects.update";
        public const string Delete   = "projects.delete";
        public const string Archive  = "projects.archive";
    }

    public static class Tasks
    {
        public const string View     = "tasks.view";
        public const string Create   = "tasks.create";
        public const string Update   = "tasks.update";
        public const string Delete   = "tasks.delete";
        public const string Assign   = "tasks.assign";
        public const string UpdateOwn = "tasks.update.own";
    }

    public static class Comments
    {
        public const string View     = "comments.view";
        public const string Create   = "comments.create";
        public const string Delete   = "comments.delete";
        public const string DeleteOwn = "comments.delete.own";
    }

    public static class Reports
    {
        public const string View     = "reports.view";
        public const string Export   = "reports.export";
    }
}
