    -- Supabase Database Schema for Ledger Expense Tracker
    -- Run this SQL in your Supabase SQL Editor to create/update the transactions table

    -- Enable UUID extension (usually already enabled in Supabase)
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Drop existing table if it exists (this will delete all data!)
    -- Only run this if you're setting up fresh or want to reset
    -- DROP TABLE IF EXISTS transactions;

    -- Transactions table with enhanced fields
    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        date DATE NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        month TEXT NOT NULL,
        
        -- NEW: Payment method for better tracking
        payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'upi', 'credit', 'bank_transfer', 'other')),
        
        -- NEW: Additional notes (separate from description)
        notes TEXT,
        
        -- NEW: Tags for custom categorization (stored as comma-separated values)
        tags TEXT,
        
        -- NEW: For future receipt upload feature
        receipt_image_url TEXT,
        
        -- NEW: Recurring transaction flag
        is_recurring BOOLEAN DEFAULT FALSE,
        
        -- NEW: For future multi-user support
        user_id UUID,
        
        -- Auto-generated timestamps
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- If table already exists and you need to add new columns, run these:
    -- (Uncomment only if the table exists but columns are missing)

    -- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'upi', 'credit', 'bank_transfer', 'other'));
    -- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT;
    -- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tags TEXT;
    -- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt_image_url TEXT;
    -- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
    -- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id UUID;

    -- Create indexes for faster queries
    CREATE INDEX IF NOT EXISTS idx_transactions_month ON transactions(month);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

    -- Composite index for common queries
    CREATE INDEX IF NOT EXISTS idx_transactions_month_type ON transactions(month, type);
    CREATE INDEX IF NOT EXISTS idx_transactions_date_type ON transactions(date, type);

    -- Function to update the updated_at timestamp
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Trigger to auto-update updated_at on UPDATE
    CREATE TRIGGER update_transactions_updated_at
        BEFORE UPDATE ON transactions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- Row Level Security (RLS) - Currently disabled for public access
    ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

    -- Grant public access
    GRANT ALL ON transactions TO postgres;
    GRANT ALL ON transactions TO anon;
    GRANT ALL ON transactions TO authenticated;
