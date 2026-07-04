using FluentValidation;
using WorkHub.API.DTOs.Invite;

namespace WorkHub.API.Validators;

public class CreateInviteValidator : AbstractValidator<CreateInviteDto>
{
    private static readonly string[] ValidRoles = { "Owner", "Admin", "Member" };

    public CreateInviteValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email address")
            .MaximumLength(100).WithMessage("Email cannot exceed 100 characters");

        RuleFor(x => x.Role)
            .NotEmpty().WithMessage("Role is required")
            .Must(r => ValidRoles.Contains(r))
            .WithMessage("Invalid role. Valid roles: Owner, Admin, Member");
    }
}

public class AcceptInviteValidator : AbstractValidator<AcceptInviteDto>
{
    public AcceptInviteValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(50).WithMessage("First name cannot exceed 50 characters");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(50).WithMessage("Last name cannot exceed 50 characters");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters")
            .MaximumLength(128).WithMessage("Password cannot exceed 128 characters");
    }
}