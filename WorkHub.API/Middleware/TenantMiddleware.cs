using System.Text.Json;
using WorkHub.API.DTOs.Common;
using WorkHub.API.Interfaces;

namespace WorkHub.API.Middleware;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantMiddleware> _logger;

    // ✅ These paths are exempt from tenant validation
    // Public endpoints that don't require an org context
    private static readonly HashSet<string> _exemptPaths = new(
        StringComparer.OrdinalIgnoreCase)
    {
        "/api/auth/register",
        "/api/auth/login",
        "/api/auth/refresh",
        "/health",
        "/swagger",
        "/swagger/index.html",
        "/swagger/v1/swagger.json"
    };

    public TenantMiddleware(RequestDelegate next, ILogger<TenantMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip validation for exempt paths
        var path = context.Request.Path.Value ?? string.Empty;
        if (IsExemptPath(path))
        {
            await _next(context);
            return;
        }

        // Only validate authenticated requests
        var currentUser = context.RequestServices
            .GetRequiredService<ICurrentUserService>();

        if (!currentUser.IsAuthenticated)
        {
            await _next(context);
            return;
        }

        // ✅ Validate user + org status on every authenticated request
        var orgContext = context.RequestServices
            .GetRequiredService<IOrgContextService>();

        var (isValid, reason) = await orgContext.ValidateCurrentUserContextAsync();

        if (!isValid)
        {
            _logger.LogWarning(
                "Tenant validation failed for user {UserId}: {Reason}",
                currentUser.UserId, reason);

            context.Response.StatusCode = 403;
            context.Response.ContentType = "application/json";

            var response = ApiResponse<object>.Fail(reason ?? "Access denied.");
            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
            return;
        }

        await _next(context);
    }

    private static bool IsExemptPath(string path)
    {
        // Check exact match first
        if (_exemptPaths.Contains(path)) return true;

        // Check prefix match for swagger
        return path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase);
    }
}

public static class TenantMiddlewareExtensions
{
    public static IApplicationBuilder UseTenantValidation(
        this IApplicationBuilder app)
    {
        return app.UseMiddleware<TenantMiddleware>();
    }
}