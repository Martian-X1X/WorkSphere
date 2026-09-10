using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkHub.Infrastructure.Data;

namespace WorkHub.API.Controllers;

/// <summary>
/// Development-only diagnostics endpoints.
/// Returns query performance metrics.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
#if !DEBUG
[ApiExplorerSettings(IgnoreApi = true)]   // hide from Swagger in production
#endif
public class DiagnosticsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public DiagnosticsController(
        AppDbContext context,
        IWebHostEnvironment env)
    {
        _context = context;
        _env     = env;
    }

    /// <summary>Check database connectivity and response time.</summary>
    [HttpGet("db-ping")]
    [AllowAnonymous]
    public async Task<IActionResult> DbPing()
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var canConnect = await _context.Database.CanConnectAsync();
        sw.Stop();

        return Ok(new
        {
            connected  = canConnect,
            elapsedMs  = sw.ElapsedMilliseconds,
            timestamp  = DateTime.UtcNow,
            database   = _context.Database.GetDbConnection().Database,
        });
    }

    /// <summary>Get row counts for all major tables.</summary>
    [HttpGet("table-stats")]
    public async Task<IActionResult> TableStats()
    {
        if (!_env.IsDevelopment())
            return NotFound();

        var stats = new
        {
            projects      = await _context.Projects.CountAsync(),
            tasks         = await _context.Tasks.CountAsync(),
            comments      = await _context.Comments.CountAsync(),
            activityLogs  = await _context.ActivityLogs.CountAsync(),
            notifications = await _context.Notifications.CountAsync(),
            users         = await _context.Users.CountAsync(),
            invites       = await _context.OrganizationInvites.CountAsync(),
            timestamp     = DateTime.UtcNow,
        };

        return Ok(stats);
    }

    /// <summary>List all indexes on the database.</summary>
    [HttpGet("indexes")]
    public async Task<IActionResult> GetIndexes()
    {
        if (!_env.IsDevelopment())
            return NotFound();

        var indexes = await _context.Database
            .SqlQueryRaw<IndexInfo>(@"
                SELECT
                    i.relname        AS ""IndexName"",
                    t.relname        AS ""TableName"",
                    ix.indisunique   AS ""IsUnique"",
                    ix.indisprimary  AS ""IsPrimary""
                FROM
                    pg_class t
                    JOIN pg_index ix ON t.oid = ix.indrelid
                    JOIN pg_class i  ON i.oid = ix.indexrelid
                WHERE
                    t.relkind = 'r'
                    AND t.relname NOT LIKE 'pg_%'
                ORDER BY
                    t.relname, i.relname
            ")
            .ToListAsync();

        return Ok(indexes);
    }
}

public record IndexInfo(
    string IndexName,
    string TableName,
    bool   IsUnique,
    bool   IsPrimary
);