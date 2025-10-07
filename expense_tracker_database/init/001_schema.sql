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
    full_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets(user_id, month);
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
