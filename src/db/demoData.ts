import type { Category, Transaction, Budget } from './types';

// System Default Categories (Matches SQL exactly)
export const DEFAULT_CATEGORIES: Category[] = [
  // Income
  { id: 'cat-income-maas', user_id: null, name: 'Maaş', type: 'income', color: '#10B981', icon: 'Briefcase', is_default: true },
  { id: 'cat-income-freelance', user_id: null, name: 'Freelance', type: 'income', color: '#34D399', icon: 'Laptop', is_default: true },
  { id: 'cat-income-burs', user_id: null, name: 'Burs', type: 'income', color: '#6EE7B7', icon: 'GraduationCap', is_default: true },
  { id: 'cat-income-yatirim', user_id: null, name: 'Yatırım', type: 'income', color: '#059669', icon: 'TrendingUp', is_default: true },
  { id: 'cat-income-diger', user_id: null, name: 'Diğer Gelir', type: 'income', color: '#A7F3D0', icon: 'DollarSign', is_default: true },
  
  // Expense
  { id: 'cat-expense-yemek', user_id: null, name: 'Yemek', type: 'expense', color: '#FBBF24', icon: 'Utensils', is_default: true },
  { id: 'cat-expense-market', user_id: null, name: 'Market', type: 'expense', color: '#EF4444', icon: 'ShoppingCart', is_default: true },
  { id: 'cat-expense-ulasim', user_id: null, name: 'Ulaşım', type: 'expense', color: '#F59E0B', icon: 'Car', is_default: true },
  { id: 'cat-expense-kira', user_id: null, name: 'Kira', type: 'expense', color: '#3B82F6', icon: 'Home', is_default: true },
  { id: 'cat-expense-fatura', user_id: null, name: 'Fatura', type: 'expense', color: '#10B981', icon: 'FileText', is_default: true },
  { id: 'cat-expense-eglence', user_id: null, name: 'Eğlence', type: 'expense', color: '#EC4899', icon: 'Music', is_default: true },
  { id: 'cat-expense-egitim', user_id: null, name: 'Eğitim', type: 'expense', color: '#8B5CF6', icon: 'BookOpen', is_default: true },
  { id: 'cat-expense-saglik', user_id: null, name: 'Sağlık', type: 'expense', color: '#EF4444', icon: 'HeartPulse', is_default: true },
  { id: 'cat-expense-abonelik', user_id: null, name: 'Abonelik', type: 'expense', color: '#6366F1', icon: 'CreditCard', is_default: true },
  { id: 'cat-expense-diger', user_id: null, name: 'Diğer Gider', type: 'expense', color: '#6B7280', icon: 'HelpCircle', is_default: true }
];

// Helper to generate dynamic dates relative to current date (YYYY-MM-DD)
const getRelativeDateStr = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

const getRelativeMonthStr = (monthsAgo: number): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return date.toISOString().substring(0, 7); // YYYY-MM
};

// Seed Transactions (Dynamic dates so portfolio charts look alive!)
export const generateDemoTransactions = (userId: string): Transaction[] => [
  // This Month
  {
    id: 't-1',
    user_id: userId,
    amount: 32000,
    type: 'income',
    category_id: 'cat-income-maas',
    description: 'Şirket Aylık Maaş Ödemesi',
    payment_method: 'Havale/EFT',
    transaction_date: getRelativeDateStr(21)
  },
  {
    id: 't-2',
    user_id: userId,
    amount: 6500,
    type: 'income',
    category_id: 'cat-income-freelance',
    description: 'E-ticaret Tasarım Arayüz İşi',
    payment_method: 'Havale/EFT',
    transaction_date: getRelativeDateStr(5)
  },
  {
    id: 't-3',
    user_id: userId,
    amount: 8500,
    type: 'expense',
    category_id: 'cat-expense-kira',
    description: 'Ev Kirası',
    payment_method: 'Havale/EFT',
    transaction_date: getRelativeDateStr(21)
  },
  {
    id: 't-4',
    user_id: userId,
    amount: 1450.50,
    type: 'expense',
    category_id: 'cat-expense-market',
    description: 'Haftalık Süpermarket Alışverişi',
    payment_method: 'Kredi Kartı',
    transaction_date: getRelativeDateStr(2)
  },
  {
    id: 't-5',
    user_id: userId,
    amount: 1250.75,
    type: 'expense',
    category_id: 'cat-expense-market',
    description: 'Genel Gıda ve Hijyen Alışverişi',
    payment_method: 'Banka Kartı',
    transaction_date: getRelativeDateStr(14)
  },
  {
    id: 't-6',
    user_id: userId,
    amount: 450,
    type: 'expense',
    category_id: 'cat-expense-ulasim',
    description: 'İstanbulkart Aylık Yükleme',
    payment_method: 'Nakit',
    transaction_date: getRelativeDateStr(20)
  },
  {
    id: 't-7',
    user_id: userId,
    amount: 1200,
    type: 'expense',
    category_id: 'cat-expense-fatura',
    description: 'Elektrik & Su Faturası',
    payment_method: 'Havale/EFT',
    transaction_date: getRelativeDateStr(12)
  },
  {
    id: 't-8',
    user_id: userId,
    amount: 650,
    type: 'expense',
    category_id: 'cat-expense-fatura',
    description: 'Fiber İnternet Faturası',
    payment_method: 'Kredi Kartı',
    transaction_date: getRelativeDateStr(15)
  },
  {
    id: 't-9',
    user_id: userId,
    amount: 850,
    type: 'expense',
    category_id: 'cat-expense-eglence',
    description: 'Konser Bileti ve Atıştırmalıklar',
    payment_method: 'Kredi Kartı',
    transaction_date: getRelativeDateStr(4)
  },
  {
    id: 't-10',
    user_id: userId,
    amount: 1250,
    type: 'expense',
    category_id: 'cat-expense-egitim',
    description: 'Udemy Next.js & AI Bootcamp Kursu',
    payment_method: 'Kredi Kartı',
    transaction_date: getRelativeDateStr(10)
  },
  {
    id: 't-11',
    user_id: userId,
    amount: 320,
    type: 'expense',
    category_id: 'cat-expense-abonelik',
    description: 'Netflix & Spotify Premium',
    payment_method: 'Kredi Kartı',
    transaction_date: getRelativeDateStr(1)
  },
  {
    id: 't-12',
    user_id: userId,
    amount: 550,
    type: 'expense',
    category_id: 'cat-expense-saglik',
    description: 'Eczane - Vitaminler',
    payment_method: 'Banka Kartı',
    transaction_date: getRelativeDateStr(9)
  },

  // Last Month
  {
    id: 't-last-1',
    user_id: userId,
    amount: 32000,
    type: 'income',
    category_id: 'cat-income-maas',
    description: 'Şirket Aylık Maaş Ödemesi',
    payment_method: 'Havale/EFT',
    transaction_date: getRelativeDateStr(51)
  },
  {
    id: 't-last-2',
    user_id: userId,
    amount: 4200,
    type: 'income',
    category_id: 'cat-income-freelance',
    description: 'Mobil Aplikasyon Logo Tasarımı',
    payment_method: 'Havale/EFT',
    transaction_date: getRelativeDateStr(45)
  },
  {
    id: 't-last-3',
    user_id: userId,
    amount: 8500,
    type: 'expense',
    category_id: 'cat-expense-kira',
    description: 'Ev Kirası',
    payment_method: 'Havale/EFT',
    transaction_date: getRelativeDateStr(51)
  },
  {
    id: 't-last-4',
    user_id: userId,
    amount: 3200,
    type: 'expense',
    category_id: 'cat-expense-market',
    description: 'Aylık Toplu Market Alışverişi',
    payment_method: 'Kredi Kartı',
    transaction_date: getRelativeDateStr(44)
  },
  {
    id: 't-last-5',
    user_id: userId,
    amount: 1950,
    type: 'expense',
    category_id: 'cat-expense-eglence',
    description: 'Hafta Sonu Arkadaşlarla Akşam Yemeği',
    payment_method: 'Banka Kartı',
    transaction_date: getRelativeDateStr(38)
  },
  {
    id: 't-last-6',
    user_id: userId,
    amount: 1500,
    type: 'expense',
    category_id: 'cat-expense-fatura',
    description: 'Doğalgaz & Elektrik Faturaları',
    payment_method: 'Kredi Kartı',
    transaction_date: getRelativeDateStr(42)
  },

  // 2 Months Ago
  {
    id: 't-prev-1',
    user_id: userId,
    amount: 30000,
    type: 'income',
    category_id: 'cat-income-maas',
    description: 'Şirket Aylık Maaş Ödemesi',
    payment_method: 'Havale/EFT',
    transaction_date: getRelativeDateStr(81)
  },
  {
    id: 't-prev-2',
    user_id: userId,
    amount: 8500,
    type: 'expense',
    category_id: 'cat-expense-kira',
    description: 'Ev Kirası',
    payment_method: 'Havale/EFT',
    transaction_date: getRelativeDateStr(81)
  },
  {
    id: 't-prev-3',
    user_id: userId,
    amount: 2800,
    type: 'expense',
    category_id: 'cat-expense-market',
    description: 'Aylık Market Gideri',
    payment_method: 'Banka Kartı',
    transaction_date: getRelativeDateStr(72)
  },
  {
    id: 't-prev-4',
    user_id: userId,
    amount: 2400,
    type: 'expense',
    category_id: 'cat-expense-fatura',
    description: 'Elektrik, İnternet, Su & Doğalgaz',
    payment_method: 'Havale/EFT',
    transaction_date: getRelativeDateStr(75)
  }
];

// Seed Budgets for the current and last months
export const generateDemoBudgets = (userId: string): Budget[] => [
  // Current Month Budgets
  {
    id: 'b-1',
    user_id: userId,
    category_id: 'cat-expense-market',
    month: getRelativeMonthStr(0),
    limit_amount: 3000
  },
  {
    id: 'b-2',
    user_id: userId,
    category_id: 'cat-expense-ulasim',
    month: getRelativeMonthStr(0),
    limit_amount: 500
  },
  {
    id: 'b-3',
    user_id: userId,
    category_id: 'cat-expense-fatura',
    month: getRelativeMonthStr(0),
    limit_amount: 2500
  },
  {
    id: 'b-4',
    user_id: userId,
    category_id: 'cat-expense-eglence',
    month: getRelativeMonthStr(0),
    limit_amount: 1000 // Currently 850 spent (85% - yellow alert!)
  },
  {
    id: 'b-5',
    user_id: userId,
    category_id: 'cat-expense-egitim',
    month: getRelativeMonthStr(0),
    limit_amount: 1000 // Currently 1250 spent (125% - red alert!)
  },
  {
    id: 'b-6',
    user_id: userId,
    category_id: 'cat-expense-abonelik',
    month: getRelativeMonthStr(0),
    limit_amount: 400
  }
];
