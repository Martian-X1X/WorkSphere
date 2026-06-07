using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WorkHub.API.Authorization;
using WorkHub.API.Data;
using WorkHub.API.Interfaces;
using WorkHub.API.Middleware;
using WorkHub.API.Services;
using WorkHub.API.Settings;

var builder = WebApplication.CreateBuilder(args);

// ─── Controllers ──────────────────────────────────────────────────
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.SuppressModelStateInvalidFilter = true;
    });

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

// ─── Health Checks ────────────────────────────────────────────────
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database");

// ─── Build app ────────────────────────────────────────────────────
var app = builder.Build();

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