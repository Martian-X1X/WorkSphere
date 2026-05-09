using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WorkHub.API.Data;
using WorkHub.API.Interfaces;
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

// ─── Swagger with JWT support ─────────────────────────────────────
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "WorkSphere API",
        Version = "v1",
        Description = "Multi-tenant project management platform API"
    });

    // ✅ Add JWT Bearer button to Swagger UI
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

// ─── JWT Authentication ───────────────────────────────────────────
var jwtSettings = builder.Configuration
    .GetSection(JwtSettings.SectionName)
    .Get<JwtSettings>()!;

var jwtSecret = builder.Configuration["JwtSettings:Secret"]
    ?? throw new InvalidOperationException(
        "JwtSettings:Secret is not configured. Run: dotnet user-secrets set \"JwtSettings:Secret\" \"your-secret\"");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        // ✅ Validate the server that issued the token
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,

        // ✅ Validate the recipient the token is intended for
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,

        // ✅ Validate expiry — reject expired tokens
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero, // No tolerance — token expired = rejected immediately

        // ✅ Validate signature — verify token wasn't tampered with
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSecret))
    };

    // ✅ Return 401 properly formatted
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

builder.Services.AddAuthorization();

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
builder.Services.AddScoped<IJwtService, JwtService>();       // ← NEW
builder.Services.AddScoped<IAuthService, AuthService>();

// ─── Health Checks ────────────────────────────────────────────────
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database");

// ─── Build app ────────────────────────────────────────────────────
var app = builder.Build();

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

// ✅ ORDER MATTERS: Authentication before Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapControllers();
app.Run();