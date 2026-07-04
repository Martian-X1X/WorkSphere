using FluentValidation;
using WorkHub.API.DTOs.Organization;

namespace WorkHub.API.Validators;

public class UpdateOrganizationValidator : AbstractValidator<UpdateOrganizationDto>
{
    public UpdateOrganizationValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Organization name is required")
            .MaximumLength(100).WithMessage("Name cannot exceed 100 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500)
            .WithMessage("Description cannot exceed 500 characters")
            .When(x => x.Description != null);

        RuleFor(x => x.LogoUrl)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("Logo URL must be a valid URL")
            .When(x => !string.IsNullOrEmpty(x.LogoUrl));
    }
}

public class ChangeMemberRoleValidator : AbstractValidator<ChangeMemberRoleDto>
{
    private static readonly string[] ValidRoles = { "Owner", "Admin", "Member" };

    public ChangeMemberRoleValidator()
    {
        RuleFor(x => x.Role)
            .NotEmpty().WithMessage("Role is required")
            .Must(r => ValidRoles.Contains(r))
            .WithMessage("Invalid role. Valid roles: Owner, Admin, Member");
    }
}