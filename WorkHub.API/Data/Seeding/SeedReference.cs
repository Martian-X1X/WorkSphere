namespace WorkHub.API.Data.Seeding;

/// <summary>
/// Static reference for all seeded test data.
/// Use these constants in tests — never hardcode IDs elsewhere.
/// </summary>
public static class SeedReference
{
    // ── Organization IDs ──────────────────────────────────────
    public static class OrgIds
    {
        public static readonly Guid Demo  = Guid.Parse("00000000-0000-0000-0001-000000000001");
        public static readonly Guid Acme  = Guid.Parse("00000000-0000-0000-0001-000000000002");
        public static readonly Guid Tech  = Guid.Parse("00000000-0000-0000-0001-000000000003");
    }

    // ── User IDs ──────────────────────────────────────────────
    public static class UserIds
    {
        public static readonly Guid DemoOwner   = Guid.Parse("00000000-0000-0000-0002-000000000001");
        public static readonly Guid DemoAdmin   = Guid.Parse("00000000-0000-0000-0002-000000000002");
        public static readonly Guid DemoMember1 = Guid.Parse("00000000-0000-0000-0002-000000000003");
        public static readonly Guid DemoMember2 = Guid.Parse("00000000-0000-0000-0002-000000000004");
        public static readonly Guid AcmeOwner   = Guid.Parse("00000000-0000-0000-0002-000000000005");
        public static readonly Guid AcmeAdmin   = Guid.Parse("00000000-0000-0000-0002-000000000006");
        public static readonly Guid AcmeMember  = Guid.Parse("00000000-0000-0000-0002-000000000007");
        public static readonly Guid TechOwner   = Guid.Parse("00000000-0000-0000-0002-000000000008");
    }

    // ── Credentials ───────────────────────────────────────────
    public static class Credentials
    {
        // WorkSphere Demo org
        public const string DemoOwnerEmail    = "demo.owner@worksphere.io";
        public const string DemoOwnerPassword = "Demo@Owner#2026";

        public const string DemoAdminEmail    = "demo.admin@worksphere.io";
        public const string DemoAdminPassword = "Demo@Admin#2026";

        public const string DemoMember1Email    = "demo.member1@worksphere.io";
        public const string DemoMember1Password = "Demo@Member#2026";

        public const string DemoMember2Email    = "demo.member2@worksphere.io";
        public const string DemoMember2Password = "Demo@Member#2026";

        // Acme Corporation
        public const string AcmeOwnerEmail    = "acme.owner@worksphere.io";
        public const string AcmeOwnerPassword = "Acme@Owner#2026";

        public const string AcmeAdminEmail    = "acme.admin@worksphere.io";
        public const string AcmeAdminPassword = "Acme@Admin#2026";

        public const string AcmeMemberEmail    = "acme.member@worksphere.io";
        public const string AcmeMemberPassword = "Acme@Member#2026";

        // TechStart Ltd
        public const string TechOwnerEmail    = "techstart.owner@worksphere.io";
        public const string TechOwnerPassword = "Tech@Owner#2026";
    }
}