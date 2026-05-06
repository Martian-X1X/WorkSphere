using WorkHub.API.Data;
using WorkHub.API.Interfaces;
using WorkHub.API.Services;
using WorkHub.API.Settings;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.SuppressModelStateInvalidFilter = true;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "WorkSphere API",
        Version = "v1",
        Description = "Multi-tenant project management platform API"
    });
});

// ✅ Bind PasswordPolicy settings from appsettings.json
builder.Services.Configure<PasswordPolicySettings>(
    builder.Configuration.GetSection(PasswordPolicySettings.SectionName));

// ✅ PostgreSQL with retry resilience
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

// ✅ Register all services
builder.Services.AddScoped<ISlugService, SlugService>();
builder.Services.AddScoped<IPasswordService, PasswordService>(); // ← ADD THIS
builder.Services.AddScoped<IAuthService, AuthService>();

// ✅ Health check
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database");

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
app.UseAuthorization();
app.MapHealthChecks("/health");
app.MapControllers();
app.Run();