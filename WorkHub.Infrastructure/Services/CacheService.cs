using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace WorkHub.Infrastructure.Services;

/// <summary>
/// Lightweight abstraction over <see cref="IMemoryCache"/> for frequent-read
/// data (org profile, permissions, notification counts, …).
/// </summary>
public interface ICacheService
{
    T? Get<T>(string key);
    void Set<T>(string key, T value, TimeSpan? expiry = null);
    void Remove(string key);

    string OrgKey(string prefix, Guid orgId) => $"{prefix}:{orgId}";
    string UserKey(string prefix, Guid userId) => $"{prefix}:{userId}";
}

/// <inheritdoc cref="ICacheService"/>
public class MemoryCacheService : ICacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<MemoryCacheService> _logger;

    private static readonly TimeSpan DefaultExpiry = TimeSpan.FromMinutes(5);

    public MemoryCacheService(
        IMemoryCache cache,
        ILogger<MemoryCacheService> logger)
    {
        _cache  = cache;
        _logger = logger;
    }

    public T? Get<T>(string key)
    {
        _cache.TryGetValue(key, out T? value);
        return value;
    }

    public void Set<T>(string key, T value, TimeSpan? expiry = null)
    {
        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiry ?? DefaultExpiry,
            Size = 1,
        };
        _cache.Set(key, value, options);

        _logger.LogTrace("Cache set: {Key} (expires in {Seconds}s)",
            key, (expiry ?? DefaultExpiry).TotalSeconds);
    }

    public void Remove(string key)
    {
        _cache.Remove(key);
        _logger.LogTrace("Cache removed: {Key}", key);
    }
}