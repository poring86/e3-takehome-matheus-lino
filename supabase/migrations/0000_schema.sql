-- Base schema for Supabase cloud project
-- Run before policy migrations

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY NOT NULL,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  joined_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT org_members_org_user_unique UNIQUE (org_id, user_id),
  CONSTRAINT org_members_org_id_organizations_id_fk FOREIGN KEY (org_id)
    REFERENCES organizations(id) ON DELETE no action ON UPDATE no action,
  CONSTRAINT org_members_user_id_users_id_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE no action ON UPDATE no action,
  CONSTRAINT org_members_role_check CHECK (role IN ('owner', 'admin', 'member'))
);

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  org_id uuid NOT NULL,
  title text NOT NULL,
  content text,
  visibility text DEFAULT 'private' NOT NULL,
  summary text,
  summary_status text DEFAULT 'pending' NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT notes_org_id_organizations_id_fk FOREIGN KEY (org_id)
    REFERENCES organizations(id) ON DELETE no action ON UPDATE no action,
  CONSTRAINT notes_created_by_users_id_fk FOREIGN KEY (created_by)
    REFERENCES users(id) ON DELETE no action ON UPDATE no action,
  CONSTRAINT notes_visibility_check CHECK (visibility IN ('public', 'private', 'shared')),
  CONSTRAINT notes_summary_status_check CHECK (summary_status IN ('pending', 'accepted', 'rejected'))
);

CREATE TABLE IF NOT EXISTS note_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  note_id uuid NOT NULL,
  version integer NOT NULL,
  content text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT note_versions_note_id_notes_id_fk FOREIGN KEY (note_id)
    REFERENCES notes(id) ON DELETE no action ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  org_id uuid NOT NULL,
  name text NOT NULL,
  CONSTRAINT tags_org_id_organizations_id_fk FOREIGN KEY (org_id)
    REFERENCES organizations(id) ON DELETE no action ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS note_tags (
  note_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  CONSTRAINT note_tags_note_id_tag_id_pk PRIMARY KEY (note_id, tag_id),
  CONSTRAINT note_tags_note_id_notes_id_fk FOREIGN KEY (note_id)
    REFERENCES notes(id) ON DELETE no action ON UPDATE no action,
  CONSTRAINT note_tags_tag_id_tags_id_fk FOREIGN KEY (tag_id)
    REFERENCES tags(id) ON DELETE no action ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS note_shares (
  note_id uuid NOT NULL,
  user_id uuid NOT NULL,
  CONSTRAINT note_shares_note_id_user_id_pk PRIMARY KEY (note_id, user_id),
  CONSTRAINT note_shares_note_id_notes_id_fk FOREIGN KEY (note_id)
    REFERENCES notes(id) ON DELETE no action ON UPDATE no action,
  CONSTRAINT note_shares_user_id_users_id_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE no action ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  org_id uuid NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  uploaded_by uuid NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT files_org_id_organizations_id_fk FOREIGN KEY (org_id)
    REFERENCES organizations(id) ON DELETE no action ON UPDATE no action,
  CONSTRAINT files_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by)
    REFERENCES users(id) ON DELETE no action ON UPDATE no action
);
