using System.Diagnostics;
using Serilog.Context;

namespace WorkHub.API.Middleware;

/// <summary>
/// Adds a correlation ID to every request for distributed tracing.
/// Serilog handles the actual request logging via UseSerilogRequestLogging().
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;

    public RequestLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // ✅ Generate or read correlation ID from request header
        var correlationId = context.Request.Headers["X-Correlation-ID"]
            .FirstOrDefault() ?? Guid.NewGuid().ToString()[..8];

        context.Response.Headers["X-Correlation-ID"] = correlationId;

        // ✅ Push correlation ID into Serilog's log context
        // All log entries within this request will include CorrelationId
        using (LogContext.PushProperty("CorrelationId", correlationId))
        using (LogContext.PushProperty("RequestId", correlationId))
        {
            await _next(context);
        }
    }
}

public static class RequestLoggingMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestLogging(
        this IApplicationBuilder app)
    {
        return app.UseMiddleware<RequestLoggingMiddleware>();
    }
}