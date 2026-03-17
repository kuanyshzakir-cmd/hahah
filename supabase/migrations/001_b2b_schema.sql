-- ============================================
-- B2B Manager (Dariger) — Database Schema
-- Timezone: Asia/Almaty (UTC+5)
-- Tables prefixed with b2b_ to coexist with barbershop tables
-- ============================================

-- Enable UUID extension (may already exist)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- B2B_CONTACTS — parsed from 2GIS
-- ============================================
CREATE TABLE b2b_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  external_id TEXT UNIQUE,
  company_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT NOT NULL,
  category TEXT,
  wa_status TEXT DEFAULT 'unknown' CHECK (wa_status IN ('unknown', 'valid', 'invalid')),
  lead_status TEXT DEFAULT 'new' CHECK (lead_status IN ('new', 'contacted', 'responding', 'qualified', 'not_interested', 'converted')),
  lead_score INT DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  is_blacklisted BOOLEAN DEFAULT false,
  blacklist_reason TEXT CHECK (blacklist_reason IN ('opt-out', 'competitor', 'already_client', 'manual') OR blacklist_reason IS NULL),
  parsing_task_id UUID
);

CREATE INDEX idx_b2b_contacts_city ON b2b_contacts(city);
CREATE INDEX idx_b2b_contacts_status ON b2b_contacts(lead_status);
CREATE INDEX idx_b2b_contacts_phone ON b2b_contacts(phone);
CREATE INDEX idx_b2b_contacts_blacklist ON b2b_contacts(is_blacklisted) WHERE is_blacklisted = true;
CREATE INDEX idx_b2b_contacts_score ON b2b_contacts(lead_score DESC);

-- ============================================
-- B2B_PRODUCTS — product catalog
-- ============================================
CREATE TABLE b2b_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name_ru TEXT NOT NULL,
  name_kz TEXT,
  sku TEXT UNIQUE,
  category TEXT CHECK (category IN ('coats', 'suits', 'caps', 'shoes', 'accessories', 'other')),
  description TEXT,
  sizes TEXT[],
  colors TEXT[],
  price_retail DECIMAL(10,2),
  price_wholesale DECIMAL(10,2),
  min_wholesale_qty INT DEFAULT 10,
  image_url TEXT,
  in_stock BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

CREATE INDEX idx_b2b_products_category ON b2b_products(category);
CREATE INDEX idx_b2b_products_stock ON b2b_products(in_stock) WHERE in_stock = true;

-- ============================================
-- B2B_PARSING_TASKS — 2GIS parsing history
-- ============================================
CREATE TABLE b2b_parsing_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  city TEXT NOT NULL,
  search_query TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  total_found INT DEFAULT 0,
  total_saved INT DEFAULT 0,
  total_duplicates INT DEFAULT 0,
  error_message TEXT
);

CREATE INDEX idx_b2b_parsing_tasks_status ON b2b_parsing_tasks(status);

-- Add FK after parsing_tasks exists
ALTER TABLE b2b_contacts
  ADD CONSTRAINT fk_b2b_contacts_parsing_task
  FOREIGN KEY (parsing_task_id) REFERENCES b2b_parsing_tasks(id) ON DELETE SET NULL;

-- ============================================
-- B2B_CAMPAIGNS — outreach campaigns
-- ============================================
CREATE TABLE b2b_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_params JSONB DEFAULT '{}',
  target_filter JSONB DEFAULT '{}',
  followup_enabled BOOLEAN DEFAULT true,
  followup_template_1 TEXT,
  followup_template_2 TEXT,
  send_window_start TIME DEFAULT '09:00',
  send_window_end TIME DEFAULT '18:00',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'paused', 'completed')),
  total_recipients INT DEFAULT 0,
  total_sent INT DEFAULT 0,
  total_delivered INT DEFAULT 0,
  total_read INT DEFAULT 0,
  total_replied INT DEFAULT 0
);

CREATE INDEX idx_b2b_campaigns_status ON b2b_campaigns(status);

-- ============================================
-- B2B_CAMPAIGN_CONTACTS — campaign ↔ contact link
-- ============================================
CREATE TABLE b2b_campaign_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES b2b_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES b2b_contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'read', 'replied', 'failed')),
  sent_at TIMESTAMPTZ,
  followup_1_sent BOOLEAN DEFAULT false,
  followup_1_at TIMESTAMPTZ,
  followup_2_sent BOOLEAN DEFAULT false,
  followup_2_at TIMESTAMPTZ,
  UNIQUE(campaign_id, contact_id)
);

CREATE INDEX idx_b2b_cc_campaign ON b2b_campaign_contacts(campaign_id);
CREATE INDEX idx_b2b_cc_status ON b2b_campaign_contacts(status);
CREATE INDEX idx_b2b_cc_followup ON b2b_campaign_contacts(followup_1_sent, followup_2_sent, sent_at)
  WHERE status IN ('sent', 'delivered') AND followup_2_sent = false;

-- ============================================
-- B2B_MESSAGES — all WhatsApp messages
-- ============================================
CREATE TABLE b2b_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  contact_id UUID NOT NULL REFERENCES b2b_contacts(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES b2b_campaigns(id) ON DELETE SET NULL,
  wa_message_id TEXT UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'template', 'image', 'document')),
  body TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  is_ai_generated BOOLEAN DEFAULT false
);

CREATE INDEX idx_b2b_messages_contact ON b2b_messages(contact_id, created_at DESC);
CREATE INDEX idx_b2b_messages_wa_id ON b2b_messages(wa_message_id);

-- ============================================
-- B2B_CONVERSATIONS — per-contact conversation state
-- ============================================
CREATE TABLE b2b_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL UNIQUE REFERENCES b2b_contacts(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  unread_count INT DEFAULT 0,
  ai_enabled BOOLEAN DEFAULT true,
  ai_context JSONB DEFAULT '[]',
  needs_attention BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'ru' CHECK (language IN ('ru', 'kz'))
);

CREATE INDEX idx_b2b_conversations_attention ON b2b_conversations(needs_attention) WHERE needs_attention = true;
CREATE INDEX idx_b2b_conversations_last_msg ON b2b_conversations(last_message_at DESC);

-- ============================================
-- B2B_DAILY_STATS — daily aggregates
-- ============================================
CREATE TABLE b2b_daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  messages_sent INT DEFAULT 0,
  messages_received INT DEFAULT 0,
  new_contacts INT DEFAULT 0,
  new_leads INT DEFAULT 0,
  campaigns_active INT DEFAULT 0,
  contacts_parsed INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_b2b_daily_stats_date ON b2b_daily_stats(date DESC);

-- ============================================
-- B2B_SETTINGS — key-value config
-- ============================================
CREATE TABLE b2b_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO b2b_settings (key, value) VALUES
  ('ai_system_prompt', '"Ты — менеджер по продажам компании Dariger. Мы продаём медицинскую одежду для клиник, стоматологий и салонов красоты. Отвечай кратко (1-3 предложения). Определи язык клиента и отвечай на нём."'),
  ('ai_model', '"gpt-4.1"'),
  ('ai_temperature', '0.7'),
  ('business_info', '{"name": "Dariger", "type": "Медицинская одежда", "cities": ["Астана", "Алматы", "Караганда", "Атырау", "Актобе", "Шымкент"]}'),
  ('send_window', '{"start": "09:00", "end": "18:00", "timezone": "Asia/Almaty", "days": ["mon","tue","wed","thu","fri"]}'),
  ('telegram_chat_id', '""'),
  ('followup_intervals', '{"followup_1_days": 3, "followup_2_days": 7}');

-- ============================================
-- TRIGGERS — auto-update updated_at
-- ============================================
-- Reuse existing update_updated_at() function from barbershop if exists
-- Otherwise create it
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER b2b_contacts_updated_at
  BEFORE UPDATE ON b2b_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER b2b_products_updated_at
  BEFORE UPDATE ON b2b_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER b2b_settings_updated_at
  BEFORE UPDATE ON b2b_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FUNCTION — aggregate daily stats
-- ============================================
CREATE OR REPLACE FUNCTION b2b_aggregate_daily_stats(stats_date DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO b2b_daily_stats (date, messages_sent, messages_received, new_contacts, contacts_parsed)
  VALUES (
    stats_date,
    (SELECT COUNT(*) FROM b2b_messages WHERE created_at::date = stats_date AND direction = 'outbound'),
    (SELECT COUNT(*) FROM b2b_messages WHERE created_at::date = stats_date AND direction = 'inbound'),
    (SELECT COUNT(*) FROM b2b_contacts WHERE created_at::date = stats_date),
    (SELECT COALESCE(SUM(total_saved), 0) FROM b2b_parsing_tasks WHERE created_at::date = stats_date AND status = 'completed')
  )
  ON CONFLICT (date) DO UPDATE SET
    messages_sent = EXCLUDED.messages_sent,
    messages_received = EXCLUDED.messages_received,
    new_contacts = EXCLUDED.new_contacts,
    contacts_parsed = EXCLUDED.contacts_parsed;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE b2b_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_parsing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_settings ENABLE ROW LEVEL SECURITY;

-- Service role: full access (for n8n)
CREATE POLICY "Service role full access" ON b2b_contacts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON b2b_products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON b2b_parsing_tasks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON b2b_campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON b2b_campaign_contacts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON b2b_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON b2b_conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON b2b_daily_stats FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON b2b_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users: full access (for dashboard)
CREATE POLICY "Auth full access" ON b2b_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access" ON b2b_products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access" ON b2b_parsing_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access" ON b2b_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access" ON b2b_campaign_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access" ON b2b_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access" ON b2b_conversations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access" ON b2b_daily_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access" ON b2b_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION b2b_aggregate_daily_stats TO service_role, authenticated;
