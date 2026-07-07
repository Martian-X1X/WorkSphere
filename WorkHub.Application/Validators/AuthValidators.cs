using FluentValidation;
using WorkHub.Application.DTOs.Auth;

namespace WorkHub.Application.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequestDto>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(50).WithMessage("First name cannot exceed 50 characters")
            .Matches(@"^[a-zA-Z\s\-']+$")
            .WithMessage("First name can only contain letters, spaces, hyphens, and apostrophes");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(50).WithMessage("Last name cannot exceed 50 characters")
            .Matches(@"^[a-zA-Z\s\-']+$")
            .WithMessage("Last name can only contain letters, spaces, hyphens, and apostrophes");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email address is required")
            .EmailAddress().WithMessage("Invalid email address")
            .MaximumLength(100).WithMessage("Email cannot exceed 100 characters");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters")
            .MaximumLength(128).WithMessage("Password cannot exceed 128 characters");

        RuleFor(x => x.OrganizationName)
            .NotEmpty().WithMessage("Organization name is required")
            .MaximumLength(100).WithMessage("Organization name cannot exceed 100 characters");
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email address is required")
            .EmailAddress().WithMessage("Invalid email address");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required");
    }
}

public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequestDto>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required");
    }
}

public class RevokeTokenRequestValidator : AbstractValidator<RevokeTokenRequestDto>
{
    public RevokeTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required");
    }
}