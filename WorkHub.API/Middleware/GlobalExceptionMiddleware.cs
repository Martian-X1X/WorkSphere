using System.Net;
using System.Text.Json;
using Serilog;
using WorkHub.Application.DTOs.Common;

namespace WorkHub.API.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        // ✅ Structured exception logging — Serilog captures full exception details
        Log.Error(ex,
            "Unhandled exception on {Method} {Path} — {ExceptionType}: {Message}",
            context.Request.Method,
            context.Request.Path,
            ex.GetType().Name,
            ex.Message);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var message = _env.IsDevelopment()
            ? $"Internal server error: {ex.Message}"
            : "An unexpected error occurred. Please try again later.";

        var response = ApiResponse<object>.Fail(message);

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}

// ✅ Extension method for clean registration in Program.cs
public static class GlobalExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(
        this IApplicationBuilder app)
    {
        return app.UseMiddleware<GlobalExceptionMiddleware>();
    }
}