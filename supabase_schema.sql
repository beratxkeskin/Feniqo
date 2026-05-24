-- MoneyMate Database Schema & Row Level Security (RLS) Setup
-- This script can be run directly in the Supabase SQL Editor.

-- 1. Create Profiles Table (Linked to Auth.Users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TRY', -- 'TRY', 'USD', 'EUR'
    theme TEXT NOT NULL DEFAULT 'system',  -- 'light', 'dark', 'system'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create Categories Table
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT NOT NULL, -- Hex code e.g. '#EF4444'
    icon TEXT, -- Lucide icon name
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3. Create Transactions Table
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT NOT NULL,
    description TEXT,
    payment_method TEXT NOT NULL, -- 'Nakit', 'Kredi Kartı', 'Banka Kartı', 'Havale/EFT', 'Diğer'
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. Create Budgets Table
CREATE TABLE public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL, -- Format: 'YYYY-MM'
    limit_amount NUMERIC NOT NULL CHECK (limit_amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (user_id, category_id, month)
);

-- Enable RLS for budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- 5. Create Recurring Transactions Table
CREATE TABLE public.recurring_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT NOT NULL,
    description TEXT,
    payment_method TEXT NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    last_processed_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for recurring_transactions
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

-- 6. Create Goals Table
CREATE TABLE public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    target_date DATE NOT NULL,
    color TEXT NOT NULL, -- Hex code or preset name
    icon TEXT, -- Lucide icon name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;


-----------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-----------------------------------------------------------

-- Profiles Policies
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Categories Policies
CREATE POLICY "Users can view default categories and their own custom categories" 
    ON public.categories FOR SELECT 
    USING (is_default = TRUE OR user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert their own categories" 
    ON public.categories FOR INSERT 
    WITH CHECK (auth.uid() = user_id AND is_default = FALSE);

CREATE POLICY "Users can update their own custom categories" 
    ON public.categories FOR UPDATE 
    USING (auth.uid() = user_id AND is_default = FALSE);

CREATE POLICY "Users can delete their own custom categories" 
    ON public.categories FOR DELETE 
    USING (auth.uid() = user_id AND is_default = FALSE);

-- Transactions Policies
CREATE POLICY "Users can view their own transactions" 
    ON public.transactions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
    ON public.transactions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
    ON public.transactions FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
    ON public.transactions FOR DELETE 
    USING (auth.uid() = user_id);

-- Budgets Policies
CREATE POLICY "Users can view their own budgets" 
    ON public.budgets FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets" 
    ON public.budgets FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" 
    ON public.budgets FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" 
    ON public.budgets FOR DELETE 
    USING (auth.uid() = user_id);

-- Recurring Transactions Policies
CREATE POLICY "Users can view their own recurring transactions" 
    ON public.recurring_transactions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring transactions" 
    ON public.recurring_transactions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring transactions" 
    ON public.recurring_transactions FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring transactions" 
    ON public.recurring_transactions FOR DELETE 
    USING (auth.uid() = user_id);

-- Goals Policies
CREATE POLICY "Users can view their own goals" 
    ON public.goals FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" 
    ON public.goals FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
    ON public.goals FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
    ON public.goals FOR DELETE 
    USING (auth.uid() = user_id);


-----------------------------------------------------------
-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-----------------------------------------------------------

-- Create a function that inserts a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, currency, theme)
    VALUES (new.id, new.email, 'TRY', 'system');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-----------------------------------------------------------
-- SYSTEM DEFAULT CATEGORIES SEED DATA
-----------------------------------------------------------

-- Income Categories
INSERT INTO public.categories (name, type, color, icon, is_default) VALUES
('Maaş', 'income', '#10B981', 'Briefcase', TRUE),
('Freelance', 'income', '#34D399', 'Laptop', TRUE),
('Burs', 'income', '#6EE7B7', 'GraduationCap', TRUE),
('Yatırım', 'income', '#059669', 'TrendingUp', TRUE),
('Diğer Gelir', 'income', '#A7F3D0', 'DollarSign', TRUE);

-- Expense Categories
INSERT INTO public.categories (name, type, color, icon, is_default) VALUES
('Yemek', 'expense', '#FBBF24', 'Utensils', TRUE),
('Market', 'expense', '#EF4444', 'ShoppingCart', TRUE),
('Ulaşım', 'expense', '#F59E0B', 'Car', TRUE),
('Kira', 'expense', '#3B82F6', 'Home', TRUE),
('Fatura', 'expense', '#10B981', 'FileText', TRUE),
('Eğlence', 'expense', '#EC4899', 'Music', TRUE),
('Eğitim', 'expense', '#8B5CF6', 'BookOpen', TRUE),
('Sağlık', 'expense', '#EF4444', 'HeartPulse', TRUE),
('Abonelik', 'expense', '#6366F1', 'CreditCard', TRUE),
('Diğer Gider', 'expense', '#6B7280', 'HelpCircle', TRUE);


-----------------------------------------------------------
-- 7. CREATE DEBTS TABLE & POLICIES
-----------------------------------------------------------

CREATE TABLE public.debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    type TEXT NOT NULL CHECK (type IN ('debt', 'receivable')),
    due_date DATE NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for debts
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Debts Policies
CREATE POLICY "Users can view their own debts" 
    ON public.debts FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debts" 
    ON public.debts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debts" 
    ON public.debts FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debts" 
    ON public.debts FOR DELETE 
    USING (auth.uid() = user_id);


-----------------------------------------------------------
-- 8. CREATE SUBSCRIPTIONS TABLE & POLICIES
-----------------------------------------------------------

CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    renewal_date DATE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions Policies
CREATE POLICY "Users can view their own subscriptions" 
    ON public.subscriptions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" 
    ON public.subscriptions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
    ON public.subscriptions FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions" 
    ON public.subscriptions FOR DELETE 
    USING (auth.uid() = user_id);


-----------------------------------------------------------
-- 9. SETUP STORAGE FOR RECEIPTS
-----------------------------------------------------------

-- Bu komutlar manuel olarak Storage kısmından çalıştırılmalı veya SQL ekranında çalıştırılmalıdır
-- Insert into storage buckets if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for receipts
CREATE POLICY "Makbuzlar herkese açık okunabilir" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'receipts' );

CREATE POLICY "Sadece oturum açmış kullanıcılar makbuz yükleyebilir" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'receipts' AND auth.role() = 'authenticated' );

CREATE POLICY "Kullanıcılar kendi makbuzlarını silebilir/güncelleyebilir" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'receipts' AND auth.uid() = owner );

CREATE POLICY "Kullanıcılar kendi makbuzlarını silebilir" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'receipts' AND auth.uid() = owner );


-----------------------------------------------------------
-- 10. MULTI-USER SHARED WORKSPACES & COLLABORATION SCHEMA
-----------------------------------------------------------

-- Create Workspaces Table
CREATE TABLE public.workspaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text) from 1 for 8),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Workspaces Policies
CREATE POLICY "Users can view workspaces they are members of" 
    ON public.workspaces FOR SELECT 
    USING (id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create workspaces" 
    ON public.workspaces FOR INSERT 
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Workspace owners can update their workspace" 
    ON public.workspaces FOR UPDATE 
    USING (created_by = auth.uid());

CREATE POLICY "Workspace owners can delete their workspace" 
    ON public.workspaces FOR DELETE 
    USING (created_by = auth.uid());


-- Create Workspace Members Table
CREATE TABLE public.workspace_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member')) DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (workspace_id, user_id)
);

-- Enable RLS for workspace_members
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspace Members Policies
CREATE POLICY "Members can view workspace member listings" 
    ON public.workspace_members FOR SELECT 
    USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Workspace owners can add members" 
    ON public.workspace_members FOR INSERT 
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE created_by = auth.uid()
        ) OR 
        -- Allow joining if invite code is checked client-side and verified
        auth.uid() = user_id
    );

CREATE POLICY "Workspace owners can update member roles" 
    ON public.workspace_members FOR UPDATE 
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Members can remove themselves or owners can remove anyone" 
    ON public.workspace_members FOR DELETE 
    USING (
        auth.uid() = user_id OR 
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE created_by = auth.uid()
        )
    );


-- Modify Profiles Table to support Active Workspace
ALTER TABLE public.profiles ADD COLUMN active_workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- Update Profiles SELECT policy to allow viewing profiles of workspace members
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile and workspace partners" 
    ON public.profiles FOR SELECT 
    USING (
        auth.uid() = id OR 
        id IN (
            SELECT user_id FROM public.workspace_members WHERE workspace_id IN (
                SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
            )
        )
    );


-- Add workspace_id column to core financial entities
ALTER TABLE public.categories ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.budgets ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.recurring_transactions ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.goals ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.debts ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.subscriptions ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;


-----------------------------------------------------------
-- 11. RE-EVALUATE RLS POLICIES FOR SHARED ACCESS
-----------------------------------------------------------

-- Categories RLS
DROP POLICY IF EXISTS "Users can view default categories and their own custom categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own custom categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own custom categories" ON public.categories;

CREATE POLICY "Users can view categories (personal or workspace)" 
    ON public.categories FOR SELECT 
    USING (
        is_default = TRUE OR 
        user_id = auth.uid() OR 
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can insert categories (personal or workspace)" 
    ON public.categories FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id AND (
            workspace_id IS NULL OR 
            workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update categories (personal or workspace)" 
    ON public.categories FOR UPDATE 
    USING (
        auth.uid() = user_id AND (
            workspace_id IS NULL OR 
            workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete categories (personal or workspace)" 
    ON public.categories FOR DELETE 
    USING (
        auth.uid() = user_id AND (
            workspace_id IS NULL OR 
            workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
    );


-- Transactions RLS
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

CREATE POLICY "Users can view transactions (personal or workspace)" 
    ON public.transactions FOR SELECT 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can insert transactions (personal or workspace)" 
    ON public.transactions FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id AND (
            workspace_id IS NULL OR 
            workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update transactions (personal or workspace)" 
    ON public.transactions FOR UPDATE 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can delete transactions (personal or workspace)" 
    ON public.transactions FOR DELETE 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );


-- Budgets RLS
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

CREATE POLICY "Users can view budgets (personal or workspace)" 
    ON public.budgets FOR SELECT 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can insert budgets (personal or workspace)" 
    ON public.budgets FOR INSERT 
    WITH CHECK (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can update budgets (personal or workspace)" 
    ON public.budgets FOR UPDATE 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can delete budgets (personal or workspace)" 
    ON public.budgets FOR DELETE 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );


-- Recurring Transactions RLS
DROP POLICY IF EXISTS "Users can view their own recurring transactions" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Users can insert their own recurring transactions" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Users can update their own recurring transactions" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Users can delete their own recurring transactions" ON public.recurring_transactions;

CREATE POLICY "Users can view recurring transactions (personal or workspace)" 
    ON public.recurring_transactions FOR SELECT 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can insert recurring transactions (personal or workspace)" 
    ON public.recurring_transactions FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id AND (
            workspace_id IS NULL OR 
            workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update recurring transactions (personal or workspace)" 
    ON public.recurring_transactions FOR UPDATE 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can delete recurring transactions (personal or workspace)" 
    ON public.recurring_transactions FOR DELETE 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );


-- Goals RLS
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.goals;

CREATE POLICY "Users can view goals (personal or workspace)" 
    ON public.goals FOR SELECT 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can insert goals (personal or workspace)" 
    ON public.goals FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id AND (
            workspace_id IS NULL OR 
            workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update goals (personal or workspace)" 
    ON public.goals FOR UPDATE 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can delete goals (personal or workspace)" 
    ON public.goals FOR DELETE 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );


-- Debts RLS
DROP POLICY IF EXISTS "Users can view their own debts" ON public.debts;
DROP POLICY IF EXISTS "Users can insert their own debts" ON public.debts;
DROP POLICY IF EXISTS "Users can update their own debts" ON public.debts;
DROP POLICY IF EXISTS "Users can delete their own debts" ON public.debts;

CREATE POLICY "Users can view debts (personal or workspace)" 
    ON public.debts FOR SELECT 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can insert debts (personal or workspace)" 
    ON public.debts FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id AND (
            workspace_id IS NULL OR 
            workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update debts (personal or workspace)" 
    ON public.debts FOR UPDATE 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can delete debts (personal or workspace)" 
    ON public.debts FOR DELETE 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );


-- Subscriptions RLS
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view subscriptions (personal or workspace)" 
    ON public.subscriptions FOR SELECT 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can insert subscriptions (personal or workspace)" 
    ON public.subscriptions FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id AND (
            workspace_id IS NULL OR 
            workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update subscriptions (personal or workspace)" 
    ON public.subscriptions FOR UPDATE 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can delete subscriptions (personal or workspace)" 
    ON public.subscriptions FOR DELETE 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );


-----------------------------------------------------------
-- 12. CREATE TAGS & TRANSACTION TAGS TABLES
-----------------------------------------------------------

-- Create Tags Table
CREATE TABLE public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (name, user_id, workspace_id)
);

-- Enable RLS for tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Tags Policies
CREATE POLICY "Users can view tags (personal or workspace)" 
    ON public.tags FOR SELECT 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can insert tags (personal or workspace)" 
    ON public.tags FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id AND (
            workspace_id IS NULL OR 
            workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update tags (personal or workspace)" 
    ON public.tags FOR UPDATE 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can delete tags (personal or workspace)" 
    ON public.tags FOR DELETE 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );


-- Create Transaction Tags Join Table
CREATE TABLE public.transaction_tags (
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (transaction_id, tag_id)
);

-- Enable RLS for transaction_tags
ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;

-- Transaction Tags Policies
CREATE POLICY "Users can view transaction tags (personal or workspace)" 
    ON public.transaction_tags FOR SELECT 
    USING (
        transaction_id IN (
            SELECT id FROM public.transactions 
            WHERE workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
                  (workspace_id IS NULL AND user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert transaction tags" 
    ON public.transaction_tags FOR INSERT 
    WITH CHECK (
        transaction_id IN (
            SELECT id FROM public.transactions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete transaction tags" 
    ON public.transaction_tags FOR DELETE 
    USING (
        transaction_id IN (
            SELECT id FROM public.transactions WHERE user_id = auth.uid()
        )
    );


-----------------------------------------------------------
-- 13. CREATE ASSETS TABLE & POLICIES
-----------------------------------------------------------

CREATE TABLE public.assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'crypto', 'stocks', 'real_estate', 'precious_metals', 'other')),
    value NUMERIC NOT NULL CHECK (value >= 0),
    quantity NUMERIC CHECK (quantity >= 0),
    purchase_price NUMERIC CHECK (purchase_price >= 0),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Assets Policies
CREATE POLICY "Users can view assets (personal or workspace)" 
    ON public.assets FOR SELECT 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can insert assets (personal or workspace)" 
    ON public.assets FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id AND (
            workspace_id IS NULL OR 
            workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update assets (personal or workspace)" 
    ON public.assets FOR UPDATE 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );

CREATE POLICY "Users can delete assets (personal or workspace)" 
    ON public.assets FOR DELETE 
    USING (
        workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
        (workspace_id IS NULL AND user_id = auth.uid())
    );


