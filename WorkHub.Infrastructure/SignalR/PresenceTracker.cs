using System.Collections.Concurrent;

namespace WorkHub.Infrastructure.SignalR;

/// <summary>
/// Thread-safe in-memory presence store.
/// A user is online while at least one SignalR connection is registered.
/// Each browser tab is one connection; closing every tab makes the user offline.
/// </summary>
public sealed class PresenceTracker
{
    // userId → set of connectionIds
    private readonly ConcurrentDictionary<string, HashSet<string>> _connections = new();

    // connectionId → the user/org it belongs to (kept so disconnect always
    // reports the right org even if the last remaining tab came from another org)
    private readonly ConcurrentDictionary<string, ConnectionInfo> _connectionInfo = new();

    private readonly object _lock = new();

    /// <summary>
    /// Registers a new connection for a user.
    /// Returns true when this is their first connection (they just came online).
    /// </summary>
    public bool Connect(string userId, string orgId, string connectionId)
    {
        lock (_lock)
        {
            _connectionInfo[connectionId] = new ConnectionInfo(userId, orgId);

            if (!_connections.TryGetValue(userId, out var connections))
            {
                connections = new HashSet<string>();
                _connections[userId] = connections;
            }

            bool wasOffline = connections.Count == 0;
            connections.Add(connectionId);
            return wasOffline;
        }
    }

    /// <summary>
    /// Removes a connection for a user.
    /// Returns true when this was their last connection (they just went offline).
    /// </summary>
    public bool Disconnect(string userId, string connectionId, out string? orgId)
    {
        lock (_lock)
        {
            orgId = null;
            ConnectionInfo? info = null;

            if (_connectionInfo.TryRemove(connectionId, out info))
                orgId = info.OrgId;

            var targetUserId = info?.UserId ?? userId;
            if (!_connections.TryGetValue(targetUserId, out var connections))
                return false;

            connections.Remove(connectionId);

            if (connections.Count == 0)
            {
                _connections.TryRemove(targetUserId, out _);
                return true;
            }

            return false;
        }
    }

    /// <summary>Returns true when the user has at least one active connection.</summary>
    public bool IsOnline(string userId)
    {
        lock (_lock)
        {
            return _connections.TryGetValue(userId, out var connections)
                && connections.Count > 0;
        }
    }

    /// <summary>
    /// Returns all online user IDs, optionally filtered to one organization.
    /// </summary>
    public IReadOnlyList<string> GetOnlineUsers(string? orgId = null)
    {
        lock (_lock)
        {
            return _connections
                .Where(entry => entry.Value.Count > 0 && IsInOrg(entry.Value, orgId))
                .Select(entry => entry.Key)
                .ToList();
        }
    }

    /// <summary>
    /// Returns the online subset of a supplied list, optionally filtered to one
    /// organization. Useful for room member lists.
    /// </summary>
    public IReadOnlyList<string> GetOnlineUsersFromList(
        IEnumerable<string> userIds,
        string? orgId = null)
    {
        lock (_lock)
        {
            return userIds
                .Where(id => _connections.TryGetValue(id, out var connections)
                    && connections.Count > 0
                    && IsInOrg(connections, orgId))
                .ToList();
        }
    }

    private bool IsInOrg(HashSet<string> connections, string? orgId)
    {
        if (string.IsNullOrWhiteSpace(orgId)) return true;

        return connections.Any(id =>
            _connectionInfo.TryGetValue(id, out var info) && info.OrgId == orgId);
    }

    private sealed record ConnectionInfo(string UserId, string OrgId);
}
