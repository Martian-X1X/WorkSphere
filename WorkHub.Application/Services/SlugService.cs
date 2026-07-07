using System.Text;
using System.Text.RegularExpressions;
using WorkHub.Application.Interfaces;
using WorkHub.Infrastructure.Data;

namespace WorkHub.Application.Services;

public class SlugService : ISlugService
{
    private readonly AppDbContext _context;

    public SlugService(AppDbContext context)
    {
        _context = context;
    }

    public string GenerateSlug(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        // Convert to lowercase
        var slug = input.ToLowerInvariant();

        // Replace spaces with hyphens
        slug = slug.Replace(" ", "-");

        // Remove all characters that are not letters, digits, or hyphens
        slug = Regex.Replace(slug, @"[^a-z0-9\-]", "");

        // Replace multiple consecutive hyphens with single hyphen
        slug = Regex.Replace(slug, @"-+", "-");

        // Trim hyphens from start and end
        slug = slug.Trim('-');

        // Limit length to 100 characters
        if (slug.Length > 100)
            slug = slug[..100];

        return slug;
    }

    public async Task<string> GenerateUniqueSlugAsync(string input)
    {
        var baseSlug = GenerateSlug(input);
        var slug = baseSlug;
        var counter = 1;

        // Keep trying until we find a slug not already in the DB
        while (_context.Organizations.Any(o => o.Slug == slug))
        {
            slug = $"{baseSlug}-{counter}";
            counter++;
        }

        return await Task.FromResult(slug);
    }
}