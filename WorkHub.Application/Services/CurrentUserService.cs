using System.Security.Claims;
using WorkHub.Application.Interfaces;
using WorkHub.Domain.Entities;

namespace WorkHub.Application.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<CurrentUserService> _logger;

    public CurrentUserService(
        IHttpContextAccessor httpContextAccessor,
        ILogger<CurrentUserService> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    // ── Core identity claims ──────────────────────────────────────

    public Guid UserId
    {
        get
        {
            var claim = GetClaim(ClaimTypes.NameIdentifier);
            return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
        }
    }

    public string Email =>
        GetClaim(ClaimTypes.Email) ?? string.Empty;

    public string Role =>
        GetClaim(ClaimTypes.Role) ?? string.Empty;

    public Guid OrganizationId
    {
        get
        {
            var claim = GetClaim("org_id");
            return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
        }
    }

    public string FullName =>
        GetClaim("full_name") ?? string.Empty;

    public bool IsEmailVerified =>
        GetClaim("is_email_verified") == "true";

    // ── Authentication state ──────────────────────────────────────

    public bool IsAuthenticated =>
        _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

    // ── Role helpers ──────────────────────────────────────────────

    public bool IsOwner =>
        Role == UserRole.Owner;

    public bool IsAdminOrOwner =>
        Role == UserRole.Owner || Role == UserRole.Admin;

    // ── Private helper ────────────────────────────────────────────

    private string? GetClaim(string claimType)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        if (user == null) return null;

        var claim = user.FindFirst(claimType);
        return claim?.Value;
    }
}