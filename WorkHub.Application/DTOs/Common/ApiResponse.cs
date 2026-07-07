namespace WorkHub.Application.DTOs.Common;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string> Errors { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // ✅ Static factory methods — clean, readable call sites
    public static ApiResponse<T> Ok(T data, string message = "Success") => new()
    {
        Success = true,
        Message = message,
        Data = data
    };

    public static ApiResponse<T> Fail(string error) => new()
    {
        Success = false,
        Message = error,
        Errors = new List<string> { error }
    };

    public static ApiResponse<T> Fail(List<string> errors) => new()
    {
        Success = false,
        Message = "Validation failed",
        Errors = errors
    };
}

// Non-generic version for responses with no data body
public class ApiResponse : ApiResponse<object>
{
    public static ApiResponse Ok(string message = "Success") => new()
    {
        Success = true,
        Message = message
    };

    public new static ApiResponse Fail(string error) => new()
    {
        Success = false,
        Message = error,
        Errors = new List<string> { error }
    };
}