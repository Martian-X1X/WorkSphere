namespace WorkSphere.Domain.Constants;

public static class InviteStatus
{
    public const string Pending   = "Pending";
    public const string Accepted  = "Accepted";
    public const string Expired   = "Expired";
    public const string Cancelled = "Cancelled";

    public static bool IsValid(string status) =>
        status is Pending or Accepted or Expired or Cancelled;
}