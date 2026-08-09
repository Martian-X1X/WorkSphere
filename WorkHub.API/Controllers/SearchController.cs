using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkHub.Application.DTOs.Common;
using WorkHub.Application.DTOs.Search;
using WorkHub.Application.Interfaces;

namespace WorkHub.API.Controllers;

[ApiController]
[Route("api/search")]
[Produces("application/json")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;

    public SearchController(ISearchService searchService)
    {
        _searchService = searchService;
    }

    /// <summary>
    /// Global search across projects and tasks in the current organization.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<SearchResultDto>), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Search(
        [FromQuery] string q          = "",
        [FromQuery] int    maxResults = 8)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
        {
            return Ok(ApiResponse<SearchResultDto>.Ok(
                new SearchResultDto(),
                "No query provided"
            ));
        }

        // Clamp maxResults to reasonable range
        maxResults = Math.Clamp(maxResults, 1, 20);

        var result = await _searchService.SearchAsync(q.Trim(), maxResults);

        return Ok(ApiResponse<SearchResultDto>.Ok(
            result,
            $"{result.TotalCount} result(s) found"
        ));
    }
}
