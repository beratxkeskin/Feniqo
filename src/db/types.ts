/**
 * MoneyMate TypeScript Tip Tanımlamaları
 */

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role?: 'admin' | 'contributor' | 'viewer' | string;
  currency: 'TRY' | 'USD' | 'EUR';
  theme: 'light' | 'dark' | 'system';
  lang?: 'tr' | 'en';
  active_workspace_id?: string | null;
  created_at?: string;
}

export interface Workspace {
  id: string;
  name: string;
  invite_code: string;
  created_by: string | null;
  created_at?: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'member';
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
  workspace_id?: string | null;
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
  receipt_url?: string | null;
  workspace_id?: string | null;
  created_at?: string;
  tags?: string[]; // Ayrıştırılmış hashtag'ler (Örn: ['iş', 'kişisel'])
  installment_number?: number;
  total_installments?: number;
  installment_group_id?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: string; // YYYY-MM
  limit_amount: number;
  workspace_id?: string | null;
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
  workspace_id?: string | null;
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
  workspace_id?: string | null;
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
  workspace_id?: string | null;
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
  workspace_id?: string | null;
  created_at?: string;
}

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'crypto' | 'stocks' | 'real_estate' | 'precious_metals' | 'other';
  value: number; // Value in base currency
  quantity?: number; // Optional quantity
  purchase_price?: number; // Optional purchase price per unit
  workspace_id?: string | null;
  created_at?: string;
  auto_track?: boolean;
  tracking_symbol?: string | null;
}



