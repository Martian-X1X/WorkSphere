CREATE TABLE "Organizations" (
  "Id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "Name" varchar(100) NOT NULL,
  "Slug" varchar(100) UNIQUE NOT NULL,
  "CreatedAt" timestamp NOT NULL DEFAULT (now()),
  "UpdatedAt" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "Users" (
  "Id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "FirstName" varchar(50) NOT NULL,
  "LastName" varchar(50) NOT NULL,
  "Email" varchar(100) UNIQUE NOT NULL,
  "PasswordHash" text NOT NULL,
  "OrganizationId" uuid NOT NULL,
  "Role" varchar(20) NOT NULL DEFAULT 'Member',
  "IsActive" boolean NOT NULL DEFAULT true,
  "CreatedAt" timestamp NOT NULL DEFAULT (now()),
  "UpdatedAt" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "Projects" (
  "Id" uuid PRIMARY KEY,
  "Name" varchar(100) NOT NULL,
  "Description" text,
  "OrganizationId" uuid NOT NULL,
  "CreatedByUserId" uuid NOT NULL,
  "CreatedAt" timestamp,
  "UpdatedAt" timestamp
);

CREATE TABLE "Tasks" (
  "Id" uuid PRIMARY KEY,
  "Title" varchar(200) NOT NULL,
  "Description" text,
  "Status" varchar(20),
  "Priority" varchar(20),
  "DueDate" timestamp,
  "ProjectId" uuid NOT NULL,
  "AssignedToUserId" uuid,
  "CreatedByUserId" uuid NOT NULL,
  "CreatedAt" timestamp,
  "UpdatedAt" timestamp
);

CREATE TABLE "Comments" (
  "Id" uuid PRIMARY KEY,
  "Content" text NOT NULL,
  "TaskId" uuid NOT NULL,
  "UserId" uuid NOT NULL,
  "CreatedAt" timestamp,
  "UpdatedAt" timestamp
);

CREATE TABLE "ActivityLogs" (
  "Id" uuid PRIMARY KEY,
  "Action" varchar(100) NOT NULL,
  "EntityType" varchar(50),
  "EntityId" uuid,
  "UserId" uuid NOT NULL,
  "OrganizationId" uuid NOT NULL,
  "CreatedAt" timestamp
);

CREATE TABLE "Notifications" (
  "Id" uuid PRIMARY KEY,
  "Title" varchar(200) NOT NULL,
  "Message" text,
  "IsRead" boolean DEFAULT false,
  "UserId" uuid NOT NULL,
  "CreatedAt" timestamp
);

CREATE TABLE "ChatRooms" (
  "Id" uuid PRIMARY KEY,
  "Name" varchar(100),
  "OrganizationId" uuid NOT NULL,
  "CreatedAt" timestamp
);

CREATE TABLE "Messages" (
  "Id" uuid PRIMARY KEY,
  "Content" text NOT NULL,
  "ChatRoomId" uuid NOT NULL,
  "UserId" uuid NOT NULL,
  "CreatedAt" timestamp
);

CREATE TABLE "FileAttachments" (
  "Id" uuid PRIMARY KEY,
  "FileName" varchar(255) NOT NULL,
  "FileUrl" text NOT NULL,
  "FileSize" bigint,
  "TaskId" uuid NOT NULL,
  "UploadedByUserId" uuid NOT NULL,
  "CreatedAt" timestamp
);

COMMENT ON COLUMN "Organizations"."Id" IS 'Primary Key';

COMMENT ON COLUMN "Organizations"."Name" IS 'Organization display name';

COMMENT ON COLUMN "Organizations"."Slug" IS 'URL-friendly identifier';

COMMENT ON COLUMN "Users"."Id" IS 'Primary Key';

COMMENT ON COLUMN "Users"."PasswordHash" IS 'BCrypt hashed';

COMMENT ON COLUMN "Users"."Role" IS 'Owner | Admin | Member';

COMMENT ON COLUMN "Tasks"."Status" IS 'todo | in-progress | done';

COMMENT ON COLUMN "Tasks"."Priority" IS 'low | medium | high';

COMMENT ON COLUMN "ActivityLogs"."Action" IS 'e.g. task.created, task.updated';

COMMENT ON COLUMN "ActivityLogs"."EntityType" IS 'Task | Project | Comment';

ALTER TABLE "Users" ADD FOREIGN KEY ("OrganizationId") REFERENCES "Organizations" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Projects" ADD FOREIGN KEY ("OrganizationId") REFERENCES "Organizations" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Projects" ADD FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Tasks" ADD FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Tasks" ADD FOREIGN KEY ("AssignedToUserId") REFERENCES "Users" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Tasks" ADD FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Comments" ADD FOREIGN KEY ("TaskId") REFERENCES "Tasks" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Comments" ADD FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ActivityLogs" ADD FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ActivityLogs" ADD FOREIGN KEY ("OrganizationId") REFERENCES "Organizations" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Notifications" ADD FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ChatRooms" ADD FOREIGN KEY ("OrganizationId") REFERENCES "Organizations" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Messages" ADD FOREIGN KEY ("ChatRoomId") REFERENCES "ChatRooms" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Messages" ADD FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "FileAttachments" ADD FOREIGN KEY ("TaskId") REFERENCES "Tasks" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "FileAttachments" ADD FOREIGN KEY ("UploadedByUserId") REFERENCES "Users" ("Id") DEFERRABLE INITIALLY IMMEDIATE;
