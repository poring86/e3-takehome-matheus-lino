-- Supabase RLS Policies for Multi-tenant Note-taking App
-- Execute these policies in Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see orgs they belong to
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = organizations.id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Org owners can update their organizations" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = organizations.id
      AND org_members.user_id = auth.uid()
      AND org_members.role = 'owner'
    )
  );

-- Users: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Org Members: Complex policies for membership management
CREATE POLICY "Users can view org memberships they belong to" ON org_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can manage memberships" ON org_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Notes: Complex visibility rules
CREATE POLICY "Users can view notes in their orgs with proper permissions" ON notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = notes.org_id
      AND om.user_id = auth.uid()
    ) AND (
      -- Public notes: visible to all org members
      visibility = 'public' OR
      -- Private notes: only creator
      (visibility = 'private' AND created_by = auth.uid()) OR
      -- Shared notes: creator or explicitly shared with user
      (visibility = 'shared' AND (
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM note_shares WHERE note_id = notes.id AND user_id = auth.uid())
      ))
    )
  );

CREATE POLICY "Users can create notes in their orgs" ON notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = notes.org_id
      AND om.user_id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Users can update notes they have permission to edit" ON notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = notes.org_id
      AND om.user_id = auth.uid()
    ) AND (
      -- Creator can always edit
      created_by = auth.uid() OR
      -- Org admins/owners can edit any note in their org
      EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.org_id = notes.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "Users can delete notes they have permission to delete" ON notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = notes.org_id
      AND om.user_id = auth.uid()
    ) AND (
      -- Creator can always delete
      created_by = auth.uid() OR
      -- Org admins/owners can delete any note in their org
      EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.org_id = notes.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
      )
    )
  );

-- Note Versions: Same visibility as parent note
CREATE POLICY "Users can view note versions they can access" ON note_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notes n
      JOIN org_members om ON om.org_id = n.org_id
      WHERE n.id = note_versions.note_id
      AND om.user_id = auth.uid()
      AND (
        n.visibility = 'public' OR
        (n.visibility = 'private' AND n.created_by = auth.uid()) OR
        (n.visibility = 'shared' AND (
          n.created_by = auth.uid() OR
          EXISTS (SELECT 1 FROM note_shares WHERE note_id = n.id AND user_id = auth.uid())
        ))
      )
    )
  );

-- Tags: Org-scoped
CREATE POLICY "Users can view tags in their orgs" ON tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = tags.org_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tags in their orgs" ON tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = tags.org_id
      AND om.user_id = auth.uid()
    )
  );

-- Note Tags: Junction table with proper permissions
CREATE POLICY "Users can view note tags for accessible notes" ON note_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notes n
      JOIN org_members om ON om.org_id = n.org_id
      WHERE n.id = note_tags.note_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage note tags for notes they can edit" ON note_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM notes n
      JOIN org_members om ON om.org_id = n.org_id
      WHERE n.id = note_tags.note_id
      AND om.user_id = auth.uid()
      AND (
        n.created_by = auth.uid() OR
        om.role IN ('owner', 'admin')
      )
    )
  );

-- Note Shares: Complex sharing permissions
CREATE POLICY "Users can view shares for notes they can access" ON note_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notes n
      JOIN org_members om ON om.org_id = n.org_id
      WHERE n.id = note_shares.note_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage shares for notes they own" ON note_shares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM notes n
      WHERE n.id = note_shares.note_id
      AND n.created_by = auth.uid()
    )
  );

-- Files: Org-scoped with proper access
CREATE POLICY "Users can view files in their orgs" ON files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = files.org_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload files to their orgs" ON files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = files.org_id
      AND om.user_id = auth.uid()
    ) AND uploaded_by = auth.uid()
  );

CREATE POLICY "Users can delete files they uploaded or org admins can delete any" ON files
  FOR DELETE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = files.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );