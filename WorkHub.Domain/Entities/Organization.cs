using System.ComponentModel.DataAnnotations;

namespace WorkHub.Domain.Entities;
public class Organization : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(255)]
    public string? LogoUrl { get; set; }

    // Subscription tier — for future billing
    [MaxLength(20)]
    public string Plan { get; set; } = "Free";

    public bool IsActive { get; set; } = true;

    // Navigation property — one org has many users
    public ICollection<User> Users { get; set; } = new List<User>();
}