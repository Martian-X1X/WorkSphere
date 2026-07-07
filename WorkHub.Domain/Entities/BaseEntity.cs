namespace WorkHub.Domain.Entities;
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Soft delete — we never hard-delete records in a SaaS
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
}