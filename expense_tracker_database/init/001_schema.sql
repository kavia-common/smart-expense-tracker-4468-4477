-- Expense Tracker Database Schema
-- This script is executed automatically by Postgres on first container start.
-- It creates tables: users, accounts, categories, transactions, budgets, goals, alerts
-- Includes essential indexes and foreign keys.
-- Also seeds some common categories.

-- Safety: ensure we are in the intended database (Docker entrypoint does this via POSTGRES_DB)
-- but we can explicitly create schema namespace if needed
CREATE SCHEMA IF NOT EXISTS public;

-- Users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    -- Store bcrypt hash for authentication
    password_hash TEXT,
    -- Align with "name" expectation while keeping backward-compatible alias
    name TEXT,
    full_name VARCHAR(255),
    -- JSONB preferences for notifications and app settings
    notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Keep name in sync if only full_name provided on inserts
    CONSTRAINT users_name_coalesce CHECK (true)  -- placeholder to allow future constraints
);

-- Accounts (e.g., bank accounts, credit cards)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., checking, savings, credit
    institution VARCHAR(120),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories (both income and expense)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name VARCHAR(120) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    icon VARCHAR(60),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (user_id, name, type)
);

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL, -- expenses negative, income positive (or use type)
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inflow', 'outflow')),
    description TEXT,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Budgets (per category and month)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    month DATE NOT NULL, -- Use first day of month to represent period
    limit_amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, category_id, month)
);

-- Savings Goals
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL,
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    target_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alerts (e.g., budget exceeded)
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(60) NOT NULL, -- e.g., 'BUDGET_EXCEEDED', 'GOAL_REACHED'
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name_type ON public.categories(name, type);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_direction ON public.transactions(direction);
-- Helpful indexes for common filters
CREATE INDEX IF NOT EXISTS idx_transactions_date_only ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);

CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_budgets_user_category ON public.budgets(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON public.budgets(category_id);

CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);

CREATE INDEX IF NOT EXISTS idx_alerts_user_created ON public.alerts(user_id, created_at);

-- Triggers to auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    -- already created above; this guard is for idempotency in some environments
    NULL;
  END IF;
END $$;

-- Attach triggers
DROP TRIGGER IF EXISTS trg_users_set_updated_at ON public.users;
CREATE TRIGGER trg_users_set_updated_at BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_accounts_set_updated_at ON public.accounts;
CREATE TRIGGER trg_accounts_set_updated_at BEFORE UPDATE ON public.accounts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_transactions_set_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_set_updated_at BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_budgets_set_updated_at ON public.budgets;
CREATE TRIGGER trg_budgets_set_updated_at BEFORE UPDATE ON public.budgets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_goals_set_updated_at ON public.goals;
CREATE TRIGGER trg_goals_set_updated_at BEFORE UPDATE ON public.goals
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable pgcrypto for gen_random_uuid if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Seed default categories (optional). These are global defaults with user_id NULL and is_default = TRUE.
-- Expense categories
INSERT INTO public.categories (user_id, name, type, icon, is_default)
VALUES
  (NULL, 'Food & Dining', 'expense', '🍽️', TRUE),
  (NULL, 'Groceries', 'expense', '🛒', TRUE),
  (NULL, 'Transport', 'expense', '🚌', TRUE),
  (NULL, 'Utilities', 'expense', '💡', TRUE),
  (NULL, 'Rent', 'expense', '🏠', TRUE),
  (NULL, 'Healthcare', 'expense', '🩺', TRUE),
  (NULL, 'Entertainment', 'expense', '🎬', TRUE),
  (NULL, 'Shopping', 'expense', '🛍️', TRUE),
  (NULL, 'Travel', 'expense', '✈️', TRUE),
  (NULL, 'Misc', 'expense', '📦', TRUE)
ON CONFLICT DO NOTHING;

-- Income categories
INSERT INTO public.categories (user_id, name, type, icon, is_default)
VALUES
  (NULL, 'Salary', 'income', '💼', TRUE),
  (NULL, 'Bonus', 'income', '🎉', TRUE),
  (NULL, 'Investments', 'income', '📈', TRUE),
  (NULL, 'Other', 'income', '💸', TRUE)
ON CONFLICT DO NOTHING;

-- Usage note:
-- On first run, Docker's Postgres entrypoint will create the database and execute this file,
-- creating the schema and seeding default categories.

-- ============================================================
-- Seed demo data (idempotent)
-- - 1 demo user
-- - 3 accounts
-- - Link user-specific categories mirroring defaults
-- - 90 realistic transactions over the last 3 months (inflow + outflow)
-- - Budgets for Food & Dining, Groceries, Transport, Entertainment, Utilities
-- - A savings goal
-- ============================================================

-- Create demo user if not exists
-- Plaintext for local testing: DemoPass!123
-- Bcrypt rounds: 10
-- Hash generated via bcrypt: $2b$10$kCAkSvOJbHXUq1zYuQkF5uJxXhY3T6FQ0R2yZV0z9c6H6l0o8e8Wm
INSERT INTO public.users (id, email, name, full_name, password_hash, notification_preferences)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'demo.user@example.com',
  'Demo User',
  'Demo User',
  '$2b$10$kCAkSvOJbHXUq1zYuQkF5uJxXhY3T6FQ0R2yZV0z9c6H6l0o8e8Wm',
  '{}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Create accounts for the demo user (checking, savings, credit)
INSERT INTO public.accounts (id, user_id, name, type, institution, currency)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'Everyday Checking', 'checking', 'OceanBank', 'USD'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111111', 'High-Yield Savings', 'savings', 'OceanBank', 'USD'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '11111111-1111-1111-1111-111111111111', 'Rewards Credit', 'credit', 'OceanBank', 'USD')
ON CONFLICT (id) DO NOTHING;

-- Create user-specific categories by copying from defaults if not already present
-- Ensures user-level uniqueness and stable foreign keys for budgets
INSERT INTO public.categories (id, user_id, name, type, icon, is_default)
SELECT
  gen_random_uuid(), -- new id for user-specific category
  '11111111-1111-1111-1111-111111111111'::uuid,
  c.name,
  c.type,
  c.icon,
  FALSE
FROM public.categories c
LEFT JOIN public.categories u
  ON u.user_id = '11111111-1111-1111-1111-111111111111'::uuid
  AND u.name = c.name
  AND u.type = c.type
WHERE c.user_id IS NULL
  AND u.id IS NULL;

-- Helper: fetch category ids for budgets and transactions
-- We will lookup IDs dynamically in a DO block to remain idempotent and portable.

-- Transactions seed:
-- Generate 90 transactions over last ~3 months distributed across accounts and categories.
DO $$
DECLARE
  uid UUID := '11111111-1111-1111-1111-111111111111'::uuid;
  acc_checking UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid;
  acc_savings  UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid;
  acc_credit   UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid;

  cat_food UUID;
  cat_groceries UUID;
  cat_transport UUID;
  cat_entertainment UUID;
  cat_utilities UUID;
  cat_rent UUID;
  cat_healthcare UUID;
  cat_shopping UUID;
  cat_travel UUID;
  cat_misc UUID;
  cat_salary UUID;
  cat_bonus UUID;
  cat_investments UUID;
  cat_other_income UUID;

  -- dynamic helpers
  base_date DATE := date_trunc('day', CURRENT_DATE)::date;
  d  INTEGER;
  i  INTEGER := 0;
  tx_date DATE;
  pick INT;
  acct UUID;
  out_cat UUID;
  out_amt NUMERIC(12,2);
  desc_text TEXT;
BEGIN
  -- resolve user-specific categories by name/type, fallback to global default if needed
  SELECT id INTO cat_food FROM public.categories WHERE user_id = uid AND name = 'Food & Dining' AND type = 'expense' LIMIT 1;
  IF cat_food IS NULL THEN SELECT id INTO cat_food FROM public.categories WHERE user_id IS NULL AND name = 'Food & Dining' AND type = 'expense' LIMIT 1; END IF;

  SELECT id INTO cat_groceries FROM public.categories WHERE user_id = uid AND name = 'Groceries' AND type = 'expense' LIMIT 1;
  IF cat_groceries IS NULL THEN SELECT id INTO cat_groceries FROM public.categories WHERE user_id IS NULL AND name = 'Groceries' AND type = 'expense' LIMIT 1; END IF;

  SELECT id INTO cat_transport FROM public.categories WHERE user_id = uid AND name = 'Transport' AND type = 'expense' LIMIT 1;
  IF cat_transport IS NULL THEN SELECT id INTO cat_transport FROM public.categories WHERE user_id IS NULL AND name = 'Transport' AND type = 'expense' LIMIT 1; END IF;

  SELECT id INTO cat_entertainment FROM public.categories WHERE user_id = uid AND name = 'Entertainment' AND type = 'expense' LIMIT 1;
  IF cat_entertainment IS NULL THEN SELECT id INTO cat_entertainment FROM public.categories WHERE user_id IS NULL AND name = 'Entertainment' AND type = 'expense' LIMIT 1; END IF;

  SELECT id INTO cat_utilities FROM public.categories WHERE user_id = uid AND name = 'Utilities' AND type = 'expense' LIMIT 1;
  IF cat_utilities IS NULL THEN SELECT id INTO cat_utilities FROM public.categories WHERE user_id IS NULL AND name = 'Utilities' AND type = 'expense' LIMIT 1; END IF;

  SELECT id INTO cat_rent FROM public.categories WHERE user_id = uid AND name = 'Rent' AND type = 'expense' LIMIT 1;
  IF cat_rent IS NULL THEN SELECT id INTO cat_rent FROM public.categories WHERE user_id IS NULL AND name = 'Rent' AND type = 'expense' LIMIT 1; END IF;

  SELECT id INTO cat_healthcare FROM public.categories WHERE user_id = uid AND name = 'Healthcare' AND type = 'expense' LIMIT 1;
  IF cat_healthcare IS NULL THEN SELECT id INTO cat_healthcare FROM public.categories WHERE user_id IS NULL AND name = 'Healthcare' AND type = 'expense' LIMIT 1; END IF;

  SELECT id INTO cat_shopping FROM public.categories WHERE user_id = uid AND name = 'Shopping' AND type = 'expense' LIMIT 1;
  IF cat_shopping IS NULL THEN SELECT id INTO cat_shopping FROM public.categories WHERE user_id IS NULL AND name = 'Shopping' AND type = 'expense' LIMIT 1; END IF;

  SELECT id INTO cat_travel FROM public.categories WHERE user_id = uid AND name = 'Travel' AND type = 'expense' LIMIT 1;
  IF cat_travel IS NULL THEN SELECT id INTO cat_travel FROM public.categories WHERE user_id IS NULL AND name = 'Travel' AND type = 'expense' LIMIT 1; END IF;

  SELECT id INTO cat_misc FROM public.categories WHERE user_id = uid AND name = 'Misc' AND type = 'expense' LIMIT 1;
  IF cat_misc IS NULL THEN SELECT id INTO cat_misc FROM public.categories WHERE user_id IS NULL AND name = 'Misc' AND type = 'expense' LIMIT 1; END IF;

  SELECT id INTO cat_salary FROM public.categories WHERE user_id = uid AND name = 'Salary' AND type = 'income' LIMIT 1;
  IF cat_salary IS NULL THEN SELECT id INTO cat_salary FROM public.categories WHERE user_id IS NULL AND name = 'Salary' AND type = 'income' LIMIT 1; END IF;

  SELECT id INTO cat_bonus FROM public.categories WHERE user_id = uid AND name = 'Bonus' AND type = 'income' LIMIT 1;
  IF cat_bonus IS NULL THEN SELECT id INTO cat_bonus FROM public.categories WHERE user_id IS NULL AND name = 'Bonus' AND type = 'income' LIMIT 1; END IF;

  SELECT id INTO cat_investments FROM public.categories WHERE user_id = uid AND name = 'Investments' AND type = 'income' LIMIT 1;
  IF cat_investments IS NULL THEN SELECT id INTO cat_investments FROM public.categories WHERE user_id IS NULL AND name = 'Investments' AND type = 'income' LIMIT 1; END IF;

  SELECT id INTO cat_other_income FROM public.categories WHERE user_id = uid AND name = 'Other' AND type = 'income' LIMIT 1;
  IF cat_other_income IS NULL THEN SELECT id INTO cat_other_income FROM public.categories WHERE user_id IS NULL AND name = 'Other' AND type = 'income' LIMIT 1; END IF;

  -- Ensure we don't duplicate seed if transactions already present for the demo user
  IF (SELECT COUNT(1) FROM public.transactions WHERE user_id = uid) = 0 THEN
    -- Income seeds: 3 monthly salaries (1st of each month), occasional bonus/investment
    INSERT INTO public.transactions (user_id, account_id, category_id, amount, direction, description, transaction_date)
    VALUES
      (uid, acc_checking, cat_salary, 5500.00, 'inflow', 'Monthly Salary', date_trunc('month', base_date)::date - INTERVAL '2 months'),
      (uid, acc_checking, cat_salary, 5500.00, 'inflow', 'Monthly Salary', date_trunc('month', base_date)::date - INTERVAL '1 months'),
      (uid, acc_checking, cat_salary, 5500.00, 'inflow', 'Monthly Salary', date_trunc('month', base_date)::date),
      (uid, acc_checking, cat_bonus, 700.00, 'inflow', 'Quarterly Bonus', date_trunc('month', base_date)::date - INTERVAL '1 months' + INTERVAL '15 days'),
      (uid, acc_savings,  cat_investments, 120.00, 'inflow', 'Dividend', date_trunc('month', base_date)::date - INTERVAL '2 months' + INTERVAL '20 days');

    -- Rent and utilities monthly (outflow)
    INSERT INTO public.transactions (user_id, account_id, category_id, amount, direction, description, transaction_date)
    VALUES
      (uid, acc_checking, cat_rent, 1800.00, 'outflow', 'Monthly Rent', date_trunc('month', base_date)::date - INTERVAL '2 months' + INTERVAL '2 days'),
      (uid, acc_checking, cat_utilities, 220.00, 'outflow', 'Utilities', date_trunc('month', base_date)::date - INTERVAL '2 months' + INTERVAL '10 days'),
      (uid, acc_checking, cat_rent, 1800.00, 'outflow', 'Monthly Rent', date_trunc('month', base_date)::date - INTERVAL '1 months' + INTERVAL '2 days'),
      (uid, acc_checking, cat_utilities, 205.00, 'outflow', 'Utilities', date_trunc('month', base_date)::date - INTERVAL '1 months' + INTERVAL '10 days'),
      (uid, acc_checking, cat_rent, 1800.00, 'outflow', 'Monthly Rent', date_trunc('month', base_date)::date + INTERVAL '2 days'),
      (uid, acc_checking, cat_utilities, 198.00, 'outflow', 'Utilities', date_trunc('month', base_date)::date + INTERVAL '10 days');

    -- Savings transfer
    INSERT INTO public.transactions (user_id, account_id, category_id, amount, direction, description, transaction_date)
    VALUES
      (uid, acc_savings, NULL, 1000.00, 'inflow', 'Transfer to savings', date_trunc('month', base_date)::date - INTERVAL '1 months' + INTERVAL '5 days');

    -- Daily purchases over ~3 months (about 72 entries -> plus above > 90 total)
    FOR d IN REVERSE 89..0 LOOP
      tx_date := base_date - (d || ' days')::interval;
      pick := ((extract(doy FROM tx_date)::int + d) % 10) + 1; -- deterministic variety

      -- pick an account
      IF pick % 3 = 0 THEN
        acct := acc_credit;
      ELSIF pick % 2 = 0 THEN
        acct := acc_checking;
      ELSE
        acct := acc_checking;
      END IF;

      -- pick category and amount
      IF pick IN (1,2) THEN
        out_cat := cat_groceries;
        out_amt := round((20 + (pick * 3) + (random()*10))::numeric, 2);
        desc_text := 'Groceries';
      ELSIF pick IN (3,4) THEN
        out_cat := cat_food;
        out_amt := round((10 + (pick * 2) + (random()*15))::numeric, 2);
        desc_text := 'Dining';
      ELSIF pick IN (5) THEN
        out_cat := cat_transport;
        out_amt := round((5 + (random()*10))::numeric, 2);
        desc_text := 'Transit';
      ELSIF pick IN (6) THEN
        out_cat := cat_entertainment;
        out_amt := round((8 + (random()*20))::numeric, 2);
        desc_text := 'Entertainment';
      ELSIF pick IN (7) THEN
        out_cat := cat_shopping;
        out_amt := round((15 + (random()*40))::numeric, 2);
        desc_text := 'Shopping';
      ELSIF pick IN (8) THEN
        out_cat := cat_travel;
        out_amt := round((30 + (random()*60))::numeric, 2);
        desc_text := 'Travel';
      ELSE
        out_cat := cat_misc;
        out_amt := round((5 + (random()*20))::numeric, 2);
        desc_text := 'Misc';
      END IF;

      -- insert outflow transaction
      INSERT INTO public.transactions (user_id, account_id, category_id, amount, direction, description, transaction_date)
      VALUES (uid, acct, out_cat, out_amt, 'outflow', desc_text, tx_date);
      i := i + 1;
    END LOOP;
  END IF;
END
$$;

-- Budgets for the last 3 months for key categories (idempotent upsert via ON CONFLICT unique)
WITH u AS (SELECT '11111111-1111-1111-1111-111111111111'::uuid AS uid),
     months AS (
       SELECT date_trunc('month', CURRENT_DATE)::date AS m UNION ALL
       SELECT (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::date UNION ALL
       SELECT (date_trunc('month', CURRENT_DATE) - INTERVAL '2 months')::date
     ),
     cat AS (
       SELECT c.name, c.id
       FROM public.categories c, u
       WHERE c.user_id = u.uid AND c.name IN ('Food & Dining','Groceries','Transport','Entertainment','Utilities')
     )
INSERT INTO public.budgets (user_id, category_id, month, limit_amount)
SELECT
  (SELECT uid FROM u),
  c.id,
  m.m,
  CASE c.name
    WHEN 'Food & Dining' THEN 350.00
    WHEN 'Groceries' THEN 450.00
    WHEN 'Transport' THEN 120.00
    WHEN 'Entertainment' THEN 160.00
    WHEN 'Utilities' THEN 220.00
    ELSE 200.00
  END
FROM cat c CROSS JOIN months m
ON CONFLICT (user_id, category_id, month) DO UPDATE
SET limit_amount = EXCLUDED.limit_amount,
    updated_at = NOW();

-- Savings Goal (upsert-like behavior)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.goals WHERE user_id = '11111111-1111-1111-1111-111111111111' AND name = 'Emergency Fund'
  ) THEN
    INSERT INTO public.goals (user_id, name, target_amount, current_amount, target_date)
    VALUES ('11111111-1111-1111-1111-111111111111', 'Emergency Fund', 5000.00, 1500.00, (CURRENT_DATE + INTERVAL '6 months')::date);
  END IF;
END$$;

-- Additional indexes for common report filters
-- spending-by-category uses join on category_id and date_trunc(transaction_date), direction, and type
CREATE INDEX IF NOT EXISTS idx_transactions_date_direction
  ON public.transactions (transaction_date, direction);
-- Ensure quick access to category type
CREATE INDEX IF NOT EXISTS idx_categories_type
  ON public.categories (type);
