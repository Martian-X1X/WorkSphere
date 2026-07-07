namespace WorkSphere.Domain.Constants;

public static class WorkTaskPriority
{
    public const string Low    = "Low";
    public const string Medium = "Medium";
    public const string High   = "High";
    public const string Urgent = "Urgent";

    public static bool IsValid(string priority) =>
        priority is Low or Medium or High or Urgent;

    public static readonly string[] All = { Low, Medium, High, Urgent };
}