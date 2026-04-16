CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_tags" (
	"note_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "note_tags_note_id_tag_id_pk" PRIMARY KEY("note_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "note_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_versions" ADD CONSTRAINT "note_versions_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Enable RLS on all tables
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "org_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "files" ENABLE ROW LEVEL SECURITY;

-- Policies for users table: users can only see their own profile
CREATE POLICY "users_select_own" ON "users" FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON "users" FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON "users" FOR UPDATE USING (auth.uid() = id);

-- Policies for organizations: users can see orgs they are members of
CREATE POLICY "organizations_select_member" ON "organizations" FOR SELECT USING (
  id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);
CREATE POLICY "organizations_insert_owner" ON "organizations" FOR INSERT WITH CHECK (true); -- Allow insert, but control via org_members
CREATE POLICY "organizations_update_admin" ON "organizations" FOR UPDATE USING (
  id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Policies for org_members: users can see members of their orgs, and manage based on role
CREATE POLICY "org_members_select_member" ON "org_members" FOR SELECT USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);
CREATE POLICY "org_members_insert_admin" ON "org_members" FOR INSERT WITH CHECK (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);
CREATE POLICY "org_members_update_admin" ON "org_members" FOR UPDATE USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);
CREATE POLICY "org_members_delete_admin" ON "org_members" FOR DELETE USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Policies for notes: users can see notes in their orgs
CREATE POLICY "notes_select_member" ON "notes" FOR SELECT USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);
CREATE POLICY "notes_insert_member" ON "notes" FOR INSERT WITH CHECK (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()) AND created_by = auth.uid()
);
CREATE POLICY "notes_update_author" ON "notes" FOR UPDATE USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()) AND created_by = auth.uid()
);
CREATE POLICY "notes_delete_author" ON "notes" FOR DELETE USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()) AND created_by = auth.uid()
);

-- Policies for note_versions: similar to notes
CREATE POLICY "note_versions_select_member" ON "note_versions" FOR SELECT USING (
  note_id IN (SELECT id FROM notes WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
);
CREATE POLICY "note_versions_insert_member" ON "note_versions" FOR INSERT WITH CHECK (
  note_id IN (SELECT id FROM notes WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
);

-- Policies for tags: users can see tags in their orgs
CREATE POLICY "tags_select_member" ON "tags" FOR SELECT USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);
CREATE POLICY "tags_insert_member" ON "tags" FOR INSERT WITH CHECK (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);
CREATE POLICY "tags_update_member" ON "tags" FOR UPDATE USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);
CREATE POLICY "tags_delete_member" ON "tags" FOR DELETE USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);

-- Policies for note_tags: based on note and tag orgs
CREATE POLICY "note_tags_select_member" ON "note_tags" FOR SELECT USING (
  note_id IN (SELECT id FROM notes WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())) AND
  tag_id IN (SELECT id FROM tags WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
);
CREATE POLICY "note_tags_insert_member" ON "note_tags" FOR INSERT WITH CHECK (
  note_id IN (SELECT id FROM notes WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())) AND
  tag_id IN (SELECT id FROM tags WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
);
CREATE POLICY "note_tags_delete_member" ON "note_tags" FOR DELETE USING (
  note_id IN (SELECT id FROM notes WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())) AND
  tag_id IN (SELECT id FROM tags WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
);

-- Policies for files: users can see files in their orgs
CREATE POLICY "files_select_member" ON "files" FOR SELECT USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);
CREATE POLICY "files_insert_member" ON "files" FOR INSERT WITH CHECK (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()) AND uploaded_by = auth.uid()
);
CREATE POLICY "files_update_author" ON "files" FOR UPDATE USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()) AND uploaded_by = auth.uid()
);
CREATE POLICY "files_delete_author" ON "files" FOR DELETE USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()) AND uploaded_by = auth.uid()
);