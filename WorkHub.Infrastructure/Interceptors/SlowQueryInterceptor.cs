using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
using WorkHub.Domain.Constants;

namespace WorkHub.Infrastructure.Interceptors;

/// <summary>
/// Logs a warning for any database query exceeding the threshold.
/// Helps identify performance regressions before they hit production.
/// </summary>
public class SlowQueryInterceptor : DbCommandInterceptor
{
    private readonly ILogger<SlowQueryInterceptor> _logger;
    private const int ThresholdMs = AppConstants.SlowQueryThresholdMs;

    public SlowQueryInterceptor(ILogger<SlowQueryInterceptor> logger)
    {
        _logger = logger;
    }

    public override DbDataReader ReaderExecuted(
        DbCommand                  command,
        CommandExecutedEventData   eventData,
        DbDataReader               result)
    {
        LogIfSlow(command, eventData.Duration);
        return result;
    }

    public override ValueTask<DbDataReader> ReaderExecutedAsync(
        DbCommand                  command,
        CommandExecutedEventData   eventData,
        DbDataReader               result,
        CancellationToken          cancellationToken = default)
    {
        LogIfSlow(command, eventData.Duration);
        return ValueTask.FromResult(result);
    }

    public override int NonQueryExecuted(
        DbCommand         command,
        CommandExecutedEventData eventData,
        int              result)
    {
        LogIfSlow(command, eventData.Duration);
        return result;
    }

    public override ValueTask<int> NonQueryExecutedAsync(
        DbCommand                command,
        CommandExecutedEventData eventData,
        int                      result,
        CancellationToken        cancellationToken = default)
    {
        LogIfSlow(command, eventData.Duration);
        return ValueTask.FromResult(result);
    }

    public override object? ScalarExecuted(
        DbCommand                command,
        CommandExecutedEventData eventData,
        object?                  result)
    {
        LogIfSlow(command, eventData.Duration);
        return result;
    }

    public override ValueTask<object?> ScalarExecutedAsync(
        DbCommand                command,
        CommandExecutedEventData eventData,
        object?                  result,
        CancellationToken        cancellationToken = default)
    {
        LogIfSlow(command, eventData.Duration);
        return ValueTask.FromResult(result);
    }

    private void LogIfSlow(DbCommand command, TimeSpan duration)
    {
        if (duration.TotalMilliseconds < ThresholdMs) return;

        _logger.LogWarning(
            "SLOW QUERY detected ({ElapsedMs}ms > {ThresholdMs}ms):\n{Sql}",
            (int)duration.TotalMilliseconds,
            ThresholdMs,
            command.CommandText
        );
    }
}