namespace WorkSphere.Domain.Constants;

public static class ProjectStatus
{
    public const string Active    = "Active";
    public const string OnHold    = "OnHold";
    public const string Completed = "Completed";
    public const string Archived  = "Archived";

    public static bool IsValid(string status) =>
        status is Active or OnHold or Completed or Archived;

    public static readonly string[] All =
        { Active, OnHold, Completed, Archived };
}