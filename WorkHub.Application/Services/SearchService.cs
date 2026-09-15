using Microsoft.EntityFrameworkCore;
using WorkHub.Application.DTOs.Search;
using WorkHub.Application.Interfaces;
using WorkHub.Domain.Constants;
using WorkHub.Infrastructure.Data;

namespace WorkHub.Application.Services;

public class SearchService : ISearchService
{
    private readonly AppDbContext        _context;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<SearchService> _logger;

    public SearchService(
        AppDbContext        context,
        ICurrentUserService currentUser,
        ILogger<SearchService> logger)
    {
        _context     = context;
        _currentUser = currentUser;
        _logger      = logger;
    }

    public async Task<SearchResultDto> SearchAsync(
        string query,
        int    maxResults = AppConstants.SearchMaxResults)
    {
        // Sanitize — reject too-short queries to avoid huge result sets
        query = query?.Trim() ?? string.Empty;
        if (query.Length < AppConstants.SearchMinQueryLength)
            return new SearchResultDto();

        // Clamp against the safe upper bound
        maxResults = Math.Clamp(maxResults, 1, AppConstants.SearchMaxResults);

        var orgId = _currentUser.OrganizationId;

        try
        {
            // ── Search Projects ──────────────────────────────────────────
            var projects = await _context.Projects
                .AsNoTracking()
                .Where(p =>
                    p.OrganizationId == orgId &&
                    !p.IsDeleted      &&
                    (
                        EF.Functions.ILike(p.Name,        $"%{query}%") ||
                        EF.Functions.ILike(p.Description ?? "", $"%{query}%")
                    )
                )
                .OrderByDescending(p => p.UpdatedAt)
                .Take(maxResults)
                .Select(p => new SearchProjectResult
                {
                    Id          = p.Id,
                    Name        = p.Name,
                    Description = p.Description,
                    Status      = p.Status,
                    TaskCount   = p.Tasks.Count(t => !t.IsDeleted),
                })
                .ToListAsync();

            // ── Search Tasks ─────────────────────────────────────────────
            var tasks = await _context.Tasks
                .AsNoTracking()
                .Where(t =>
                    t.OrganizationId == orgId &&
                    !t.IsDeleted      &&
                    (
                        EF.Functions.ILike(t.Title,        $"%{query}%") ||
                        EF.Functions.ILike(t.Description ?? "", $"%{query}%")
                    )
                )
                .OrderByDescending(t => t.UpdatedAt)
                .Take(maxResults)
                .Select(t => new SearchTaskResult
                {
                    Id             = t.Id,
                    Title          = t.Title,
                    Description    = t.Description,
                    Status         = t.Status,
                    Priority       = t.Priority,
                    ProjectId      = t.ProjectId,
                    ProjectName    = t.Project.Name,
                    AssignedToName = t.AssignedTo != null
                        ? t.AssignedTo.FirstName + " " + t.AssignedTo.LastName
                        : null,
                })
                .ToListAsync();

            _logger.LogInformation(
                "Search '{Query}' in org {OrgId} — {Projects} project(s), {Tasks} task(s)",
                query, orgId, projects.Count, tasks.Count);

            return new SearchResultDto
            {
                Projects = projects.ToArray(),
                Tasks    = tasks.ToArray(),
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Search failed for org {OrgId}", orgId);
            return new SearchResultDto();
        }
    }
}
