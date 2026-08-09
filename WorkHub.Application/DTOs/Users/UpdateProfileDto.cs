namespace WorkHub.Application.DTOs.Users;

public class UpdateProfileDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName  { get; set; } = string.Empty;
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword     { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class ProfileDto
{
    public Guid      Id                { get; set; }
    public string    FirstName         { get; set; } = string.Empty;
    public string    LastName          { get; set; } = string.Empty;
    public string    FullName          { get; set; } = string.Empty;
    public string    Email             { get; set; } = string.Empty;
    public string    Role              { get; set; } = string.Empty;
    public Guid      OrganizationId    { get; set; }
    public string    OrganizationName  { get; set; } = string.Empty;
    public string?   ProfilePictureUrl { get; set; }
    public bool      IsEmailVerified   { get; set; }
    public DateTime? LastLoginAt       { get; set; }
    public DateTime  CreatedAt         { get; set; }
    public int       TasksAssigned     { get; set; }
    public int       CommentsCount     { get; set; }
    public int       ProjectsCount     { get; set; }
    public int       ActivityCount     { get; set; }
}
