namespace WorkHub.Domain.Entities;
/// <summary>
/// Junction table — many-to-many between WorkTask and User.
/// A task can have multiple assignees.
/// A user can be assigned to multiple tasks.
///
/// Does NOT inherit BaseEntity — it's a pure join record
/// with its own minimal audit fields.
/// </summary>
public class TaskAssignee
{
    public Guid TaskId { get; set; }
    public Guid UserId { get; set; }

    // When this assignment was created
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    // Who made the assignment (for audit trail)
    public Guid AssignedByUserId { get; set; }

    // ── Navigation properties ──────────────────────────────────
    public WorkTask Task { get; set; } = null!;
    public User User { get; set; } = null!;
    public User AssignedBy { get; set; } = null!;
}