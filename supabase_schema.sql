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
