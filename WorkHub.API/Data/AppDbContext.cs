using Microsoft.EntityFrameworkCore;

namespace WorkHub.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
    // DbSets added on Day 5
}