using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PerformanceOptimization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── Projects ──────────────────────────────────────────────────

            // Hot path: org project list (most common query) + soft-delete
            migrationBuilder.CreateIndex(
                name:    "IX_Projects_OrgId_IsDeleted_CreatedAt",
                table:   "Projects",
                columns: new[] { "OrganizationId", "IsDeleted", "CreatedAt" });

            // Status filter scoped to org + soft-delete
            migrationBuilder.CreateIndex(
                name:    "IX_Projects_OrgId_Status_IsDeleted",
                table:   "Projects",
                columns: new[] { "OrganizationId", "Status", "IsDeleted" });

            // ── Tasks ─────────────────────────────────────────────────────

            // Task list by project (most common task query) + soft-delete
            migrationBuilder.CreateIndex(
                name:    "IX_Tasks_ProjectId_IsDeleted_OrderIndex",
                table:   "Tasks",
                columns: new[] { "ProjectId", "IsDeleted", "OrderIndex" });

            // Status filter on tasks + soft-delete
            migrationBuilder.CreateIndex(
                name:    "IX_Tasks_ProjectId_Status_IsDeleted",
                table:   "Tasks",
                columns: new[] { "ProjectId", "Status", "IsDeleted" });

            // My Tasks query — assigned to user + soft-delete
            migrationBuilder.CreateIndex(
                name:    "IX_Tasks_AssignedToUserId_IsDeleted",
                table:   "Tasks",
                columns: new[] { "AssignedToUserId", "IsDeleted" });

            // Org-wide task scope + soft-delete
            migrationBuilder.CreateIndex(
                name:    "IX_Tasks_OrgId_IsDeleted",
                table:   "Tasks",
                columns: new[] { "OrganizationId", "IsDeleted" });

            // ── Comments ──────────────────────────────────────────────────

            // Comments by task (most common comment query) + soft-delete
            migrationBuilder.CreateIndex(
                name:    "IX_Comments_TaskId_IsDeleted_CreatedAt",
                table:   "Comments",
                columns: new[] { "TaskId", "IsDeleted", "CreatedAt" });

            // Comments by author + soft-delete
            migrationBuilder.CreateIndex(
                name:    "IX_Comments_CreatedByUserId_IsDeleted",
                table:   "Comments",
                columns: new[] { "CreatedByUserId", "IsDeleted" });

            // ── Activity Logs ─────────────────────────────────────────────

            // User activity (profile page) — newest first
            migrationBuilder.CreateIndex(
                name:    "IX_ActivityLogs_UserId_CreatedAt",
                table:   "ActivityLogs",
                columns: new[] { "UserId", "CreatedAt" });

            // ── Users ─────────────────────────────────────────────────────

            // Members list by org — role/status filter
            migrationBuilder.CreateIndex(
                name:    "IX_Users_OrgId_IsActive_Role",
                table:   "Users",
                columns: new[] { "OrganizationId", "IsActive", "Role" });

            // ── Organization Invites ──────────────────────────────────────

            // Pending invites by org
            migrationBuilder.CreateIndex(
                name:    "IX_OrganizationInvites_OrgId_Status",
                table:   "OrganizationInvites",
                columns: new[] { "OrganizationId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex("IX_Projects_OrgId_IsDeleted_CreatedAt", "Projects");
            migrationBuilder.DropIndex("IX_Projects_OrgId_Status_IsDeleted", "Projects");
            migrationBuilder.DropIndex("IX_Tasks_ProjectId_IsDeleted_OrderIndex", "Tasks");
            migrationBuilder.DropIndex("IX_Tasks_ProjectId_Status_IsDeleted", "Tasks");
            migrationBuilder.DropIndex("IX_Tasks_AssignedToUserId_IsDeleted", "Tasks");
            migrationBuilder.DropIndex("IX_Tasks_OrgId_IsDeleted", "Tasks");
            migrationBuilder.DropIndex("IX_Comments_TaskId_IsDeleted_CreatedAt", "Comments");
            migrationBuilder.DropIndex("IX_Comments_CreatedByUserId_IsDeleted", "Comments");
            migrationBuilder.DropIndex("IX_ActivityLogs_UserId_CreatedAt", "ActivityLogs");
            migrationBuilder.DropIndex("IX_Users_OrgId_IsActive_Role", "Users");
            migrationBuilder.DropIndex("IX_OrganizationInvites_OrgId_Status", "OrganizationInvites");
        }
    }
}
