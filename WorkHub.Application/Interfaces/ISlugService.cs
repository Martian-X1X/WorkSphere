namespace WorkHub.Application.Interfaces;

public interface ISlugService
{
    string GenerateSlug(string input);
    Task<string> GenerateUniqueSlugAsync(string input);
}