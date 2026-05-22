/**
 * MoneyMate TypeScript Tip Tanımlamaları
 */

export interface Profile {
  id: string;
  email: string;
  currency: 'TRY' | 'USD' | 'EUR';
  theme: 'light' | 'dark' | 'system';
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
