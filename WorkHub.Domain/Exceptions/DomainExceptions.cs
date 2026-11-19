namespace WorkHub.Domain.Exceptions;

/// <summary>
/// Base class for all WorkSphere domain exceptions.
/// Represents intentional, domain-level errors with predictable HTTP mappings.
/// </summary>
public abstract class DomainException : Exception
{
    protected DomainException(string message) : base(message) { }
    protected DomainException(string message, Exception inner) : base(message, inner) { }
}

/// <summary>
/// Thrown when a requested resource does not exist.
/// Maps to HTTP 404.
/// </summary>
public class NotFoundException : DomainException
{
    public NotFoundException(string entityName, object key)
        : base($"{entityName} with key '{key}' was not found.") { }

    public NotFoundException(string message)
        : base(message) { }
}

/// <summary>
/// Thrown when the current user does not have permission.
/// Maps to HTTP 403.
/// </summary>
public class ForbiddenException : DomainException
{
    public ForbiddenException(string message = "You do not have permission to perform this action.")
        : base(message) { }
}

/// <summary>
/// Thrown when a request is malformed or invalid.
/// Maps to HTTP 400.
/// </summary>
public class BadRequestException : DomainException
{
    public BadRequestException(string message) : base(message) { }
}

/// <summary>
/// Thrown when business rules are violated.
/// Maps to HTTP 400.
/// </summary>
public class BusinessRuleException : DomainException
{
    public BusinessRuleException(string message) : base(message) { }
}

/// <summary>
/// Thrown when a resource already exists (duplicate).
/// Maps to HTTP 409.
/// </summary>
public class ConflictException : DomainException
{
    public ConflictException(string message) : base(message) { }
}

/// <summary>
/// Thrown when authentication fails.
/// Maps to HTTP 401.
/// </summary>
public class AuthenticationException : DomainException
{
    public AuthenticationException(string message = "Authentication failed.")
        : base(message) { }
}