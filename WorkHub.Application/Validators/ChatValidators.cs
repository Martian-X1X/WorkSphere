using FluentValidation;
using WorkHub.Application.DTOs.Chat;
using WorkHub.Domain.Enums;

namespace WorkHub.Application.Validators;

public class CreateRoomValidator : AbstractValidator<CreateRoomDto>
{
    public CreateRoomValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(100).WithMessage("Room name cannot exceed 100 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Name));

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.Type)
            .Must(type => string.Equals(type, nameof(ChatRoomType.Custom), StringComparison.OrdinalIgnoreCase))
            .WithMessage("Only custom rooms can be created directly.");

        RuleFor(x => x.MemberIds)
            .NotNull().WithMessage("MemberIds is required");

        RuleForEach(x => x.MemberIds)
            .NotEqual(Guid.Empty).WithMessage("MemberIds cannot contain an empty GUID");
    }
}

public class SendMessageValidator : AbstractValidator<SendMessageDto>
{
    public SendMessageValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Message content is required")
            .MaximumLength(4000).WithMessage("Message cannot exceed 4000 characters")
            .Must(content => !string.IsNullOrWhiteSpace(content))
            .WithMessage("Message cannot be only whitespace");

        RuleFor(x => x.Type)
            .Must(type => Enum.TryParse<MessageType>(type, true, out var parsed)
                       && parsed != MessageType.System)
            .WithMessage("Invalid message type.");
    }
}

public class EditMessageValidator : AbstractValidator<EditMessageDto>
{
    public EditMessageValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Content is required")
            .MaximumLength(4000).WithMessage("Message cannot exceed 4000 characters")
            .Must(content => !string.IsNullOrWhiteSpace(content))
            .WithMessage("Message cannot be only whitespace");
    }
}

public class ToggleReactionValidator : AbstractValidator<ToggleReactionDto>
{
    public ToggleReactionValidator()
    {
        RuleFor(x => x.Emoji)
            .NotEmpty().WithMessage("Emoji is required")
            .MaximumLength(10).WithMessage("Emoji cannot exceed 10 characters")
            .Must(emoji => !string.IsNullOrWhiteSpace(emoji))
            .WithMessage("Emoji cannot be only whitespace");
    }
}

public class AddMemberValidator : AbstractValidator<AddMemberDto>
{
    public AddMemberValidator()
    {
        RuleFor(x => x.UserIds)
            .NotEmpty().WithMessage("At least one user is required");

        RuleForEach(x => x.UserIds)
            .NotEqual(Guid.Empty).WithMessage("UserIds cannot contain an empty GUID");
    }
}
