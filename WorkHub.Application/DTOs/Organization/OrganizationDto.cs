using System.ComponentModel.DataAnnotations;

namespace WorkHub.Application.DTOs.Organization;

/// <summary>Safe organization response — never expose internal fields</summary>
public class OrganizationDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public string Plan { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int MemberCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>Update organization details — Owner only</summary>
public class UpdateOrganizationDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
}

/// <summary>Member summary — used in member listing</summary>
public class MemberDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsEmailVerified { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime JoinedAt { get; set; }
}

/// <summary>Paginated list wrapper</summary>
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}

/// <summary>Change a member's role — Owner only</summary>
public class ChangeMemberRoleDto
{
    public string Role { get; set; } = string.Empty;
}