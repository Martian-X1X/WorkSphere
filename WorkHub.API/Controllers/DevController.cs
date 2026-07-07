using Microsoft.AspNetCore.Mvc;
using WorkHub.Infrastructure.Data.Seeding;
using WorkHub.Application.DTOs.Common;

namespace WorkHub.API.Controllers;

/// <summary>
/// Development-only controller.
/// Returns seed data reference — NOT available in production.
/// </summary>
[ApiController]
[Route("api/dev")]
[Produces("application/json")]
public class DevController : ControllerBase
{
    private readonly IHostEnvironment _env;

    public DevController(IHostEnvironment env)
    {
        _env = env;
    }

    /// <summary>
    /// Get all seeded test credentials.
    /// DEV ONLY — returns 404 in production.
    /// </summary>
    [HttpGet("seed-reference")]
    public IActionResult GetSeedReference()
    {
        // ✅ Block in production — this endpoint must never exist in prod
        if (!_env.IsDevelopment())
            return NotFound();

        var reference = new
        {
            note = "DEV ONLY — These credentials exist after seeding. Never expose in production.",
            organizations = new[]
            {
                new
                {
                    id = SeedReference.OrgIds.Demo,
                    name = "WorkSphere Demo",
                    slug = "worksphere-demo",
                    users = new[]
                    {
                        new { role = "Owner",  email = SeedReference.Credentials.DemoOwnerEmail,   password = SeedReference.Credentials.DemoOwnerPassword,   userId = SeedReference.UserIds.DemoOwner },
                        new { role = "Admin",  email = SeedReference.Credentials.DemoAdminEmail,   password = SeedReference.Credentials.DemoAdminPassword,   userId = SeedReference.UserIds.DemoAdmin },
                        new { role = "Member", email = SeedReference.Credentials.DemoMember1Email, password = SeedReference.Credentials.DemoMember1Password, userId = SeedReference.UserIds.DemoMember1 },
                        new { role = "Member", email = SeedReference.Credentials.DemoMember2Email, password = SeedReference.Credentials.DemoMember2Password, userId = SeedReference.UserIds.DemoMember2 }
                    }
                },
                new
                {
                    id = SeedReference.OrgIds.Acme,
                    name = "Acme Corporation",
                    slug = "acme-corporation",
                    users = new[]
                    {
                        new { role = "Owner",  email = SeedReference.Credentials.AcmeOwnerEmail,  password = SeedReference.Credentials.AcmeOwnerPassword,  userId = SeedReference.UserIds.AcmeOwner },
                        new { role = "Admin",  email = SeedReference.Credentials.AcmeAdminEmail,  password = SeedReference.Credentials.AcmeAdminPassword,  userId = SeedReference.UserIds.AcmeAdmin },
                        new { role = "Member", email = SeedReference.Credentials.AcmeMemberEmail, password = SeedReference.Credentials.AcmeMemberPassword, userId = SeedReference.UserIds.AcmeMember }
                    }
                },
                new
                {
                    id = SeedReference.OrgIds.Tech,
                    name = "TechStart Ltd",
                    slug = "techstart-ltd",
                    users = new[]
                    {
                        new { role = "Owner", email = SeedReference.Credentials.TechOwnerEmail, password = SeedReference.Credentials.TechOwnerPassword, userId = SeedReference.UserIds.TechOwner }
                    }
                }
            }
        };

        return Ok(ApiResponse<object>.Ok(reference,
            "Seed reference — DEV only."));
    }
}