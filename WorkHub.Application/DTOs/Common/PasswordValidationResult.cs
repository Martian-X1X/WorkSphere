namespace WorkHub.Application.DTOs.Common;

public class PasswordValidationResult
{
    public bool IsValid => Errors.Count == 0;
    public List<string> Errors { get; set; } = new();

    public static PasswordValidationResult Success() =>
        new PasswordValidationResult();

    public static PasswordValidationResult Failure(List<string> errors) =>
        new PasswordValidationResult { Errors = errors };
}