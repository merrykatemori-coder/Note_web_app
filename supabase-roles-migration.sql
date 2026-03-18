-- ============================
-- Run this SQL in Supabase SQL Editor
-- after creating the 2 users in Authentication
-- ============================

-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read roles" ON user_roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only own role insert" ON user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Insert roles for users
-- Replace the UUIDs below with actual user IDs from Supabase Auth > Users
-- nutchotikan@workspace.local = admin
-- nattaporn@workspace.local = staff
--
-- To find user IDs: go to Supabase > Authentication > Users > click user > copy UUID
--
-- INSERT INTO user_roles (user_id, role) VALUES
-- ('paste-nutchotikan-uuid-here', 'admin'),
-- ('paste-nattaporn-uuid-here', 'staff');

-- 3. Drop old RLS policies (user-specific) and create new ones (all authenticated users can see all data)

-- Memos
DROP POLICY IF EXISTS "Users can view own memos" ON memos;
DROP POLICY IF EXISTS "Users can insert own memos" ON memos;
DROP POLICY IF EXISTS "Users can update own memos" ON memos;
DROP POLICY IF EXISTS "Users can delete own memos" ON memos;
CREATE POLICY "Auth users can view all memos" ON memos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert memos" ON memos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can update memos" ON memos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can delete memos" ON memos FOR DELETE USING (auth.role() = 'authenticated');

-- Finance entries
DROP POLICY IF EXISTS "Users can view own finance" ON finance_entries;
DROP POLICY IF EXISTS "Users can insert own finance" ON finance_entries;
DROP POLICY IF EXISTS "Users can update own finance" ON finance_entries;
DROP POLICY IF EXISTS "Users can delete own finance" ON finance_entries;
CREATE POLICY "Auth users can view all finance" ON finance_entries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert finance" ON finance_entries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can update finance" ON finance_entries FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can delete finance" ON finance_entries FOR DELETE USING (auth.role() = 'authenticated');

-- Work orders
DROP POLICY IF EXISTS "Users can view own work_orders" ON work_orders;
DROP POLICY IF EXISTS "Users can insert own work_orders" ON work_orders;
DROP POLICY IF EXISTS "Users can update own work_orders" ON work_orders;
DROP POLICY IF EXISTS "Users can delete own work_orders" ON work_orders;
CREATE POLICY "Auth users can view all work_orders" ON work_orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert work_orders" ON work_orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can update work_orders" ON work_orders FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can delete work_orders" ON work_orders FOR DELETE USING (auth.role() = 'authenticated');

-- Salary entries
DROP POLICY IF EXISTS "Users can view own salary" ON salary_entries;
DROP POLICY IF EXISTS "Users can insert own salary" ON salary_entries;
DROP POLICY IF EXISTS "Users can update own salary" ON salary_entries;
DROP POLICY IF EXISTS "Users can delete own salary" ON salary_entries;
CREATE POLICY "Auth users can view all salary" ON salary_entries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert salary" ON salary_entries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can update salary" ON salary_entries FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can delete salary" ON salary_entries FOR DELETE USING (auth.role() = 'authenticated');

-- Dropdown settings
DROP POLICY IF EXISTS "Users can view own dropdown" ON dropdown_settings;
DROP POLICY IF EXISTS "Users can insert own dropdown" ON dropdown_settings;
DROP POLICY IF EXISTS "Users can update own dropdown" ON dropdown_settings;
DROP POLICY IF EXISTS "Users can delete own dropdown" ON dropdown_settings;
CREATE POLICY "Auth users can view all dropdown" ON dropdown_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert dropdown" ON dropdown_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can update dropdown" ON dropdown_settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can delete dropdown" ON dropdown_settings FOR DELETE USING (auth.role() = 'authenticated');

-- Contacts
DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;
CREATE POLICY "Auth users can view all contacts" ON contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert contacts" ON contacts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can update contacts" ON contacts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can delete contacts" ON contacts FOR DELETE USING (auth.role() = 'authenticated');
