using System.Text.Json;
using FluentValidation;
using Serilog;
using WorkHub.Application.DTOs.Common;
using WorkHub.Domain.Exceptions;

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

        var (statusCode, message) = GetStatusCode(ex);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        if (statusCode >= 500 && !_env.IsDevelopment())
            message = "An unexpected error occurred. Please try again later.";

        var response = ApiResponse<object>.Fail(message);

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }

    private static (int statusCode, string message) GetStatusCode(Exception exception)
    {
        return exception switch
        {
            // ── Domain exceptions — clean, intentional errors ──────
            NotFoundException        ex => (StatusCodes.Status404NotFound, ex.Message),
            ForbiddenException       ex => (StatusCodes.Status403Forbidden, ex.Message),
            BusinessRuleException    ex => (StatusCodes.Status400BadRequest, ex.Message),
            ConflictException        ex => (StatusCodes.Status409Conflict, ex.Message),
            AuthenticationException  ex => (StatusCodes.Status401Unauthorized, ex.Message),

            // ── Legacy exceptions — kept for backward compatibility ──
            KeyNotFoundException     ex => (StatusCodes.Status404NotFound, ex.Message),
            UnauthorizedAccessException ex => (StatusCodes.Status401Unauthorized, ex.Message),
            InvalidOperationException   ex => (StatusCodes.Status400BadRequest, ex.Message),
            ArgumentException           ex => (StatusCodes.Status400BadRequest, ex.Message),

            // ── FluentValidation ─────────────────────────────────────
            ValidationException ex => (StatusCodes.Status400BadRequest,
                string.Join(", ", ex.Errors.Select(e => e.ErrorMessage))),

            // ── Everything else → 500 ───────────────────────────────
            _ => (StatusCodes.Status500InternalServerError,
                "An unexpected error occurred.")
        };
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