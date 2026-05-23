/**
 * MoneyMate TypeScript Tip Tanımlamaları
 */

export interface Profile {
  id: string;
  email: string;
  currency: 'TRY' | 'USD' | 'EUR';
  theme: 'light' | 'dark' | 'system';
  lang?: 'tr' | 'en';
  created_at?: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string | null;
  is_default: boolean;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string;
  description?: string;
  payment_method: string; // 'Nakit', 'Kredi Kartı', 'Banka Kartı', 'Havale/EFT', 'Diğer'
  transaction_date: string; // YYYY-MM-DD
  created_at?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: string; // YYYY-MM
  limit_amount: number;
  created_at?: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string;
  description?: string;
  payment_method: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD
  last_processed_date?: string | null; // YYYY-MM-DD
  is_active: boolean;
  created_at?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string; // YYYY-MM-DD
  color: string;
  icon?: string | null;
  created_at?: string;
}

export interface Debt {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: 'debt' | 'receivable'; // debt = borç, receivable = alacak
  due_date: string; // YYYY-MM-DD
  is_paid: boolean;
  description?: string;
  created_at?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  renewal_date: string; // YYYY-MM-DD
  category_id: string;
  is_active: boolean;
  created_at?: string;
}


