using WorkHub.Application.DTOs.Search;

namespace WorkHub.Application.Interfaces;

public interface ISearchService
{
    Task<SearchResultDto> SearchAsync(string query, int maxResults = 10);
}
