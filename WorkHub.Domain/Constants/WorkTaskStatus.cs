namespace WorkSphere.Domain.Constants;

public static class WorkTaskStatus
{
    public const string Todo       = "Todo";
    public const string InProgress = "InProgress";
    public const string InReview   = "InReview";
    public const string Done       = "Done";
    public const string Cancelled  = "Cancelled";

    public static bool IsValid(string status) =>
        status is Todo or InProgress or InReview or Done or Cancelled;

    public static readonly string[] All =
        { Todo, InProgress, InReview, Done, Cancelled };
}