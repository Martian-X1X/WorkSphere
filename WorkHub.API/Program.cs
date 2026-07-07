using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WorkHub.API.Authorization;
using WorkHub.Application.Authorization;
using WorkHub.Infrastructure.Data;
using WorkHub.Application.Interfaces;
using WorkHub.API.Middleware;
using WorkHub.Application.Services;
using WorkHub.Application.Settings;
using WorkHub.Infrastructure.Data.Seeding;
using FluentValidation;
using FluentValidation.AspNetCore;
using WorkHub.Application.Validators;
using Serilog;
using Serilog.Events;

// ── Bootstrap logger — catches startup errors before full config loads ──
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting WorkSphere API...");

    var builder = WebApplication.CreateBuilder(args);

    // ── Serilog — read full config from appsettings.json ──────────────
    builder.Host.UseSerilog((context, services, configuration) =>
        configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Application", "WorkSphere.API"));

    // ─── Controllers ──────────────────────────────────────────────────
    builder.Services.AddControllers()
        .ConfigureApiBehaviorOptions(options =>
        {
            // ✅ We suppress the default ASP.NET validation response
            // and use our own ApiResponse<T> format via the pipeline
            options.SuppressModelStateInvalidFilter = true;
        });

    // ── FluentValidation ──────────────────────────────────────────
    builder.Services.AddFluentValidationAutoValidation();
    builder.Services.AddFluentValidationClientsideAdapters();

    // Register all validators from the Validators assembly
    builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

    builder.Services.AddEndpointsApiExplorer();

    // ─── HttpContextAccessor — needed by CurrentUserService ──────────
    builder.Services.AddHttpContextAccessor();

    // ─── Swagger with JWT support ─────────────────────────────────────
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new()
        {
            Title = "WorkSphere API",
            Version = "v1",
            Description = "Multi-tenant project management platform API"
        });

        // Add JWT Bearer button to Swagger UI
        c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Description = "Enter your JWT token. Example: eyJhbGci..."
        });

        c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
        });
    });

    // ─── Settings binding ─────────────────────────────────────────────
    builder.Services.Configure<JwtSettings>(
        builder.Configuration.GetSection(JwtSettings.SectionName));

    builder.Services.Configure<PasswordPolicySettings>(
        builder.Configuration.GetSection(PasswordPolicySettings.SectionName));

    // ─── Read JWT settings safely ─────────────────────────────────────
    // ✅ FIXED: Single declaration — removed duplicate jwtSettings variable
    var jwtSettings = builder.Configuration
        .GetSection(JwtSettings.SectionName)
        .Get<JwtSettings>()
        ?? throw new InvalidOperationException(
            "JwtSettings section is missing from configuration.");

    var jwtSecret = jwtSettings.Secret;
    if (string.IsNullOrWhiteSpace(jwtSecret))
        throw new InvalidOperationException(
            "JwtSettings:Secret is missing. Run: dotnet user-secrets set \"JwtSettings:Secret\" \"YourSecretKey\"");

    // ─── JWT Authentication ───────────────────────────────────────────
    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            // Validate the server that issued the token
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,

            // Validate the recipient the token is intended for
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,

            // Validate expiry — reject expired tokens
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,

            // Validate signature — verify token wasn't tampered with
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecret))
        };

        // Return 401/403 in ApiResponse format
        options.Events = new JwtBearerEvents
        {
            OnChallenge = context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                var result = System.Text.Json.JsonSerializer.Serialize(new
                {
                    success = false,
                    message = "Authentication required. Please provide a valid JWT token.",
                    errors = new[] { "Unauthorized" }
                });
                return context.Response.WriteAsync(result);
            },

            OnForbidden = context =>
            {
                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json";
                var result = System.Text.Json.JsonSerializer.Serialize(new
                {
                    success = false,
                    message = "You do not have permission to access this resource.",
                    errors = new[] { "Forbidden" }
                });
                return context.Response.WriteAsync(result);
            }
        };
    });

    // ─── Authorization with Permission Policies ───────────────────────
    builder.Services.AddAuthorization(options =>
    {
        // ── Organization policies ─────────────────────────────────────
        options.AddPolicy(PolicyNames.CanViewOrganization,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Organizations.View)));

        options.AddPolicy(PolicyNames.CanManageOrganization,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Organizations.Update)));

        options.AddPolicy(PolicyNames.CanViewBilling,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Organizations.ViewBilling)));

        // ── Member policies ───────────────────────────────────────────
        options.AddPolicy(PolicyNames.CanViewMembers,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Members.View)));

        options.AddPolicy(PolicyNames.CanInviteMembers,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Members.Invite)));

        options.AddPolicy(PolicyNames.CanRemoveMembers,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Members.Remove)));

        options.AddPolicy(PolicyNames.CanChangeRoles,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Members.ChangeRole)));

        // ── Project policies ──────────────────────────────────────────
        options.AddPolicy(PolicyNames.CanViewProjects,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Projects.View)));

        options.AddPolicy(PolicyNames.CanCreateProjects,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Projects.Create)));

        options.AddPolicy(PolicyNames.CanManageProjects,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Projects.Update)));

        options.AddPolicy(PolicyNames.CanDeleteProjects,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Projects.Delete)));

        // ── Task policies ─────────────────────────────────────────────
        options.AddPolicy(PolicyNames.CanViewTasks,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Tasks.View)));

        options.AddPolicy(PolicyNames.CanCreateTasks,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Tasks.Create)));

        options.AddPolicy(PolicyNames.CanManageTasks,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Tasks.Update)));

        options.AddPolicy(PolicyNames.CanAssignTasks,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Tasks.Assign)));

        options.AddPolicy(PolicyNames.CanUpdateOwnTasks,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Tasks.UpdateOwn)));

        // ── Comment policies ──────────────────────────────────────────
        options.AddPolicy(PolicyNames.CanViewComments,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Comments.View)));

        options.AddPolicy(PolicyNames.CanCreateComments,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Comments.Create)));

        options.AddPolicy(PolicyNames.CanDeleteComments,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Comments.Delete)));

        // ── Report policies ───────────────────────────────────────────
        options.AddPolicy(PolicyNames.CanViewReports,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Reports.View)));

        options.AddPolicy(PolicyNames.CanExportReports,
            p => p.AddRequirements(new PermissionRequirement(Permissions.Reports.Export)));
    });

    // Register the permission handler + service
    builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();

    // ─── Database ─────────────────────────────────────────────────────
    builder.Services.AddDbContext<AppDbContext>(options =>
    {
        options.UseNpgsql(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            npgsqlOptions => npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(5),
                errorCodesToAdd: null
            )
        );

        if (builder.Environment.IsDevelopment())
        {
            options.EnableSensitiveDataLogging();
            options.EnableDetailedErrors();
        }
    });

    // ─── Application Services ─────────────────────────────────────────
    builder.Services.AddScoped<ISlugService, SlugService>();
    builder.Services.AddScoped<IPasswordService, PasswordService>();
    builder.Services.AddScoped<IJwtService, JwtService>();
    builder.Services.AddScoped<IRefreshTokenService, RefreshTokenService>();
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
    builder.Services.AddScoped<IPermissionService, PermissionService>();
    builder.Services.AddScoped<IOrgContextService, OrgContextService>();
    builder.Services.AddScoped<OrgScopeGuard>();
    builder.Services.AddScoped<IOrganizationService, OrganizationService>();
    builder.Services.AddScoped<IInviteService, InviteService>();
    builder.Services.AddScoped<IProjectService, ProjectService>();
    builder.Services.AddScoped<ITaskService, TaskService>();
    builder.Services.AddScoped<ICommentService, CommentService>();
    builder.Services.AddScoped<IActivityService, ActivityService>();
    // ─── Seeder ───────────────────────────────────────────────────────
    builder.Services.AddScoped<DataSeeder>();

    // ─── Health Checks ────────────────────────────────────────────────
    builder.Services.AddHealthChecks()
        .AddDbContextCheck<AppDbContext>("database");

    // ─── Build app ────────────────────────────────────────────────────
    var app = builder.Build();

    // ── Serilog request logging — replaces RequestLoggingMiddleware ───
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate =
            "[{RequestId}] {RequestMethod} {RequestPath} → {StatusCode} ({Elapsed:0.0}ms)";

        // Add extra properties to each request log
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
            diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
            diagnosticContext.Set("UserAgent",
                httpContext.Request.Headers["User-Agent"].ToString());

            if (httpContext.User.Identity?.IsAuthenticated == true)
            {
                var userId = httpContext.User.FindFirst(
                    System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (userId != null)
                    diagnosticContext.Set("UserId", userId);
            }
        };

        // Only log warnings for health checks (reduce noise)
        options.GetLevel = (httpContext, elapsed, ex) =>
        {
            if (ex != null) return LogEventLevel.Error;
            if (httpContext.Request.Path.StartsWithSegments("/health"))
                return LogEventLevel.Debug;
            if (httpContext.Response.StatusCode >= 500)
                return LogEventLevel.Error;
            if (httpContext.Response.StatusCode >= 400)
                return LogEventLevel.Warning;
            return LogEventLevel.Information;
        };
    });

    // ─── Apply migrations + run seeder on startup (Development only) ──
    if (app.Environment.IsDevelopment())
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await context.Database.MigrateAsync();

        var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
        await seeder.SeedAsync();
    }

    // ─── Middleware pipeline — ORDER IS CRITICAL ──────────────────────
    app.UseGlobalExceptionHandler(); // ← FIRST — catches everything
    app.UseRequestLogging();         // ← SECOND — logs all requests

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "WorkSphere API v1");
            c.RoutePrefix = "swagger";
        });
    }

    app.UseHttpsRedirection();
    app.UseAuthentication(); // ← BEFORE Authorization
    app.UseAuthorization();  // ← AFTER Authentication
    app.UseTenantValidation();

    app.MapHealthChecks("/health");
    app.MapControllers();
    app.Run();

}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "WorkSphere API failed to start");
}
finally
{
    Log.CloseAndFlush();
}