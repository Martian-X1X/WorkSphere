namespace WorkHub.Application.DTOs.Search;

public class SearchResultDto
{
    public SearchProjectResult[] Projects { get; set; } = [];
    public SearchTaskResult[]    Tasks    { get; set; } = [];
    public int TotalCount => Projects.Length + Tasks.Length;
}

public class SearchProjectResult
{
    public Guid    Id          { get; set; }
    public string  Name        { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string  Status      { get; set; } = string.Empty;
    public int     TaskCount   { get; set; }
}

public class SearchTaskResult
{
    public Guid     Id              { get; set; }
    public string   Title           { get; set; } = string.Empty;
    public string?  Description     { get; set; }
    public string   Status          { get; set; } = string.Empty;
    public string   Priority        { get; set; } = string.Empty;
    public Guid     ProjectId       { get; set; }
    public string   ProjectName     { get; set; } = string.Empty;
    public string?  AssignedToName  { get; set; }
}
