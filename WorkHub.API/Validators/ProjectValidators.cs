using FluentValidation;
using WorkHub.API.DTOs.Project;
using WorkHub.API.Models;

namespace WorkHub.API.Validators;

public class CreateProjectValidator : AbstractValidator<CreateProjectDto>
{
    public CreateProjectValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Project name is required")
            .MaximumLength(200).WithMessage("Name cannot exceed 200 characters");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters")
            .When(x => x.Description != null);

        // ✅ Cross-field validation — moved from service to here
        RuleFor(x => x.DueDate)
            .GreaterThan(x => x.StartDate)
            .WithMessage("Due date cannot be before start date")
            .When(x => x.StartDate.HasValue && x.DueDate.HasValue);

        RuleFor(x => x.DueDate)
            .GreaterThan(DateTime.UtcNow.Date)
            .WithMessage("Due date must be in the future")
            .When(x => x.DueDate.HasValue);
    }
}

public class UpdateProjectValidator : AbstractValidator<UpdateProjectDto>
{
    public UpdateProjectValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Project name is required")
            .MaximumLength(200).WithMessage("Name cannot exceed 200 characters");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters")
            .When(x => x.Description != null);

        // ✅ Cross-field validation
        RuleFor(x => x.DueDate)
            .GreaterThan(x => x.StartDate)
            .WithMessage("Due date cannot be before start date")
            .When(x => x.StartDate.HasValue && x.DueDate.HasValue);
    }
}

public class ChangeProjectStatusValidator : AbstractValidator<ChangeProjectStatusDto>
{
    public ChangeProjectStatusValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required")
            .Must(s => ProjectStatus.IsValid(s))
            .WithMessage($"Invalid status. Valid values: {string.Join(", ", ProjectStatus.All)}");
    }
}