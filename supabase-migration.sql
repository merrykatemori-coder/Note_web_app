-- ============================
-- Supabase Database Setup
-- Run this SQL in Supabase SQL Editor
-- ============================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Memos table
CREATE TABLE IF NOT EXISTS memos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tab TEXT NOT NULL DEFAULT 'Office',
  topic TEXT NOT NULL,
  details TEXT DEFAULT '',
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memos_user_id ON memos(user_id);
CREATE INDEX idx_memos_tab ON memos(user_id, tab);

-- Finance entries table
CREATE TABLE IF NOT EXISTS finance_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  remark TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_finance_user_id ON finance_entries(user_id);
CREATE INDEX idx_finance_date ON finance_entries(user_id, date);
CREATE INDEX idx_finance_type ON finance_entries(user_id, type);

-- Work orders table
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  topic TEXT DEFAULT '',
  order_detail TEXT NOT NULL,
  remark TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_work_orders_user_id ON work_orders(user_id);
CREATE INDEX idx_work_orders_status ON work_orders(user_id, category, status);

-- Salary entries table
CREATE TABLE IF NOT EXISTS salary_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission DECIMAL(12,2) NOT NULL DEFAULT 0,
  brand TEXT NOT NULL,
  remark TEXT DEFAULT '',
  period_from TEXT DEFAULT '',
  period_to TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_salary_user_id ON salary_entries(user_id);

-- Dropdown settings table
CREATE TABLE IF NOT EXISTS dropdown_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dropdown_user_id ON dropdown_settings(user_id);
CREATE INDEX idx_dropdown_category ON dropdown_settings(user_id, category);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line_id TEXT DEFAULT '',
  email TEXT DEFAULT '',
  contact_type TEXT NOT NULL DEFAULT 'Customer',
  position TEXT DEFAULT '',
  company TEXT DEFAULT '',
  remark TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_name ON contacts(user_id, name);

-- ============================
-- Row Level Security (RLS)
-- ============================

ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropdown_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Memos policies
CREATE POLICY "Users can view own memos" ON memos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memos" ON memos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memos" ON memos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memos" ON memos FOR DELETE USING (auth.uid() = user_id);

-- Finance entries policies
CREATE POLICY "Users can view own finance" ON finance_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance" ON finance_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance" ON finance_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own finance" ON finance_entries FOR DELETE USING (auth.uid() = user_id);

-- Work orders policies
CREATE POLICY "Users can view own work_orders" ON work_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own work_orders" ON work_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own work_orders" ON work_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own work_orders" ON work_orders FOR DELETE USING (auth.uid() = user_id);

-- Salary entries policies
CREATE POLICY "Users can view own salary" ON salary_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own salary" ON salary_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own salary" ON salary_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own salary" ON salary_entries FOR DELETE USING (auth.uid() = user_id);

-- Dropdown settings policies
CREATE POLICY "Users can view own dropdown" ON dropdown_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dropdown" ON dropdown_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dropdown" ON dropdown_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dropdown" ON dropdown_settings FOR DELETE USING (auth.uid() = user_id);

-- Contacts policies
CREATE POLICY "Users can view own contacts" ON contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contacts" ON contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contacts" ON contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contacts" ON contacts FOR DELETE USING (auth.uid() = user_id);
