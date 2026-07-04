using FluentValidation;
using WorkHub.API.DTOs.Comment;

namespace WorkHub.API.Validators;

public class CreateCommentValidator : AbstractValidator<CreateCommentDto>
{
    public CreateCommentValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Comment content is required")
            .MinimumLength(1).WithMessage("Comment cannot be empty")
            .MaximumLength(4000).WithMessage("Comment cannot exceed 4000 characters")
            .Must(c => !string.IsNullOrWhiteSpace(c))
            .WithMessage("Comment cannot be only whitespace");
    }
}

public class UpdateCommentValidator : AbstractValidator<UpdateCommentDto>
{
    public UpdateCommentValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Comment content is required")
            .MinimumLength(1).WithMessage("Comment cannot be empty")
            .MaximumLength(4000).WithMessage("Comment cannot exceed 4000 characters")
            .Must(c => !string.IsNullOrWhiteSpace(c))
            .WithMessage("Comment cannot be only whitespace");
    }
}