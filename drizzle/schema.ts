import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";

// Define enums
export const roleEnum = ["owner", "admin", "member"] as const;

// Organizations table
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users table (extends auth.users)
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // Will be same as auth.users.id
  email: text("email").notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Note: In Supabase, this table will be populated via auth hooks or manually
// RLS will ensure users can only see their own row

// Org members table
export const orgMembers = pgTable("org_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .references(() => organizations.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  role: text("role", { enum: roleEnum }).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Notes table
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .references(() => organizations.id)
    .notNull(),
  title: text("title").notNull(),
  content: text("content"),
  visibility: text("visibility", { enum: ["public", "private", "shared"] })
    .default("private")
    .notNull(),
  summary: text("summary"),
  summaryStatus: text("summary_status", {
    enum: ["pending", "accepted", "rejected"],
  })
    .default("pending")
    .notNull(),
  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Note versions table
export const noteVersions = pgTable("note_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("note_id")
    .references(() => notes.id)
    .notNull(),
  version: integer("version").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tags table
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .references(() => organizations.id)
    .notNull(),
  name: text("name").notNull(),
});

// Note tags junction table
export const noteTags = pgTable(
  "note_tags",
  {
    noteId: uuid("note_id")
      .references(() => notes.id)
      .notNull(),
    tagId: uuid("tag_id")
      .references(() => tags.id)
      .notNull(),
  },
  (table) => ({
    pk: primaryKey(table.noteId, table.tagId),
  }),
);

// Shared notes table
export const noteShares = pgTable(
  "note_shares",
  {
    noteId: uuid("note_id")
      .references(() => notes.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
  },
  (table) => ({
    pk: primaryKey(table.noteId, table.userId),
  }),
);

// Files table
export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .references(() => organizations.id)
    .notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  uploadedBy: uuid("uploaded_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
