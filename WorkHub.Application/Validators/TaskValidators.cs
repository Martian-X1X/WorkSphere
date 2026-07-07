using FluentValidation;
using WorkHub.Application.DTOs.Task;
using WorkHub.Domain.Entities;

namespace WorkHub.Application.Validators;

public class CreateTaskValidator : AbstractValidator<CreateTaskDto>
{
    public CreateTaskValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Task title is required")
            .MaximumLength(500).WithMessage("Title cannot exceed 500 characters");

        RuleFor(x => x.Description)
            .MaximumLength(4000).WithMessage("Description cannot exceed 4000 characters")
            .When(x => x.Description != null);

        RuleFor(x => x.Priority)
            .NotEmpty().WithMessage("Priority is required")
            .Must(p => WorkTaskPriority.IsValid(p))
            .WithMessage($"Invalid priority. Valid: {string.Join(", ", WorkTaskPriority.All)}");

        // ✅ Cross-field validation — moved from service
        RuleFor(x => x.DueDate)
            .GreaterThan(x => x.StartDate)
            .WithMessage("Due date cannot be before start date")
            .When(x => x.StartDate.HasValue && x.DueDate.HasValue);

        // ✅ Conditional validation
        RuleFor(x => x.EstimatedMinutes)
            .GreaterThan(0).WithMessage("Estimated minutes must be greater than 0")
            .LessThanOrEqualTo(100000).WithMessage("Estimated minutes seems unreasonably large")
            .When(x => x.EstimatedMinutes.HasValue);
    }
}

public class UpdateTaskValidator : AbstractValidator<UpdateTaskDto>
{
    public UpdateTaskValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Task title is required")
            .MaximumLength(500).WithMessage("Title cannot exceed 500 characters");

        RuleFor(x => x.Description)
            .MaximumLength(4000).WithMessage("Description cannot exceed 4000 characters")
            .When(x => x.Description != null);

        RuleFor(x => x.Priority)
            .NotEmpty().WithMessage("Priority is required")
            .Must(p => WorkTaskPriority.IsValid(p))
            .WithMessage($"Invalid priority. Valid: {string.Join(", ", WorkTaskPriority.All)}");

        RuleFor(x => x.DueDate)
            .GreaterThan(x => x.StartDate)
            .WithMessage("Due date cannot be before start date")
            .When(x => x.StartDate.HasValue && x.DueDate.HasValue);

        RuleFor(x => x.EstimatedMinutes)
            .GreaterThan(0).WithMessage("Estimated minutes must be greater than 0")
            .When(x => x.EstimatedMinutes.HasValue);

        RuleFor(x => x.ActualMinutes)
            .GreaterThan(0).WithMessage("Actual minutes must be greater than 0")
            .When(x => x.ActualMinutes.HasValue);
    }
}

public class ChangeTaskStatusValidator : AbstractValidator<ChangeTaskStatusDto>
{
    public ChangeTaskStatusValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required")
            .Must(s => WorkTaskStatus.IsValid(s))
            .WithMessage($"Invalid status. Valid: {string.Join(", ", WorkTaskStatus.All)}");

        RuleFor(x => x.ActualMinutes)
            .GreaterThan(0).WithMessage("Actual minutes must be greater than 0")
            .When(x => x.ActualMinutes.HasValue);
    }
}

public class AddAssigneeValidator : AbstractValidator<AddAssigneeDto>
{
    public AddAssigneeValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
    }
}