import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../db/supabaseClient';
import type { Transaction, Category, Budget } from '../db/types';
import { DEFAULT_CATEGORIES, generateDemoTransactions, generateDemoBudgets } from '../db/demoData';

interface DataContextType {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  loadingData: boolean;
  
  // Transaction CRUD
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<{ success: boolean; error?: string }>;
  deleteTransaction: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Category CRUD
  addCategory: (cat: Omit<Category, 'id' | 'user_id' | 'is_default' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (id: string) => Promise<{ success: boolean; error?: string; isUsed?: boolean }>;
  
  // Budget CRUD
  addOrUpdateBudget: (budget: { category_id: string; month: string; limit_amount: number }) => Promise<{ success: boolean; error?: string }>;
  deleteBudget: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Helpers
  resetAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemo } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setTransactions([]);
        setBudgets([]);
        setCategories([]);
        setLoadingData(false);
        return;
      }

      setLoadingData(true);

      if (isDemo) {
        // --- 1. LOCAL STORAGE DEMO MODE ---
        // Categories
        let storedCats = localStorage.getItem('moneymate_demo_categories');
        let currentCats: Category[] = [];
        if (!storedCats) {
          localStorage.setItem('moneymate_demo_categories', JSON.stringify(DEFAULT_CATEGORIES));
          currentCats = DEFAULT_CATEGORIES;
        } else {
          currentCats = JSON.parse(storedCats);
        }
        setCategories(currentCats);

        // Transactions
        let storedTxs = localStorage.getItem('moneymate_demo_transactions');
        let currentTxs: Transaction[] = [];
        if (!storedTxs) {
          const demoTxs = generateDemoTransactions(user.id);
          localStorage.setItem('moneymate_demo_transactions', JSON.stringify(demoTxs));
          currentTxs = demoTxs;
        } else {
          currentTxs = JSON.parse(storedTxs);
        }
        setTransactions(currentTxs);

        // Budgets
        let storedBudgets = localStorage.getItem('moneymate_demo_budgets');
        let currentBudgets: Budget[] = [];
        if (!storedBudgets) {
          const demoBudgets = generateDemoBudgets(user.id);
          localStorage.setItem('moneymate_demo_budgets', JSON.stringify(demoBudgets));
          currentBudgets = demoBudgets;
        } else {
          currentBudgets = JSON.parse(storedBudgets);
        }
        setBudgets(currentBudgets);
      } else if (isSupabaseConfigured && supabase) {
        // --- 2. SUPABASE PRODUCTION MODE ---
        try {
          // Fetch categories (defaults + user custom)
          const { data: catData, error: catErr } = await supabase
            .from('categories')
            .select('*')
            .or(`user_id.eq.${user.id},user_id.is.null`);
            
          if (catErr) throw catErr;
          setCategories(catData || []);

          // Fetch transactions
          const { data: txData, error: txErr } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('transaction_date', { ascending: false });
            
          if (txErr) throw txErr;
          setTransactions(txData || []);

          // Fetch budgets
          const { data: budgetData, error: budgetErr } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', user.id);
            
          if (budgetErr) throw budgetErr;
          setBudgets(budgetData || []);
        } catch (e) {
          console.error("Error loading Supabase data", e);
        }
      }

      setLoadingData(false);
    };

    fetchData();
  }, [user, isDemo]);

  // ==========================================
  // TRANSACTION CRUD
  // ==========================================

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { success: false, error: 'Oturum açılmadı.' };

    const newTx: Transaction = {
      ...tx,
      id: isDemo ? `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : '',
      user_id: user.id,
    };

    if (isDemo) {
      const updated = [newTx, ...transactions];
      localStorage.setItem('moneymate_demo_transactions', JSON.stringify(updated));
      setTransactions(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            amount: newTx.amount,
            type: newTx.type,
            category_id: newTx.category_id,
            description: newTx.description,
            payment_method: newTx.payment_method,
            transaction_date: newTx.transaction_date,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        setTransactions([data, ...transactions]);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'İşlem eklenemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const updateTransaction = async (id: string, updatedFields: Partial<Transaction>) => {
    if (isDemo) {
      const updated = transactions.map(t => (t.id === id ? { ...t, ...updatedFields } : t));
      localStorage.setItem('moneymate_demo_transactions', JSON.stringify(updated));
      setTransactions(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .update({
            amount: updatedFields.amount,
            type: updatedFields.type,
            category_id: updatedFields.category_id,
            description: updatedFields.description,
            payment_method: updatedFields.payment_method,
            transaction_date: updatedFields.transaction_date,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        setTransactions(transactions.map(t => (t.id === id ? data : t)));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'İşlem güncellenemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const deleteTransaction = async (id: string) => {
    if (isDemo) {
      const updated = transactions.filter(t => t.id !== id);
      localStorage.setItem('moneymate_demo_transactions', JSON.stringify(updated));
      setTransactions(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
        setTransactions(transactions.filter(t => t.id !== id));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'İşlem silinemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  // ==========================================
  // CATEGORY CRUD
  // ==========================================

  const addCategory = async (cat: Omit<Category, 'id' | 'user_id' | 'is_default' | 'created_at'>) => {
    if (!user) return { success: false, error: 'Oturum açılmadı.' };

    const newCat: Category = {
      ...cat,
      id: isDemo ? `cat-${Date.now()}` : '',
      user_id: user.id,
      is_default: false,
    };

    if (isDemo) {
      const updated = [...categories, newCat];
      localStorage.setItem('moneymate_demo_categories', JSON.stringify(updated));
      setCategories(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            name: newCat.name,
            type: newCat.type,
            color: newCat.color,
            icon: newCat.icon,
            user_id: user.id,
            is_default: false,
          })
          .select()
          .single();

        if (error) throw error;
        setCategories([...categories, data]);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Kategori eklenemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const updateCategory = async (id: string, updatedFields: Partial<Category>) => {
    if (isDemo) {
      const updated = categories.map(c => (c.id === id ? { ...c, ...updatedFields } : c));
      localStorage.setItem('moneymate_demo_categories', JSON.stringify(updated));
      setCategories(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .update({
            name: updatedFields.name,
            color: updatedFields.color,
            icon: updatedFields.icon,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        setCategories(categories.map(c => (c.id === id ? data : c)));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Kategori güncellenemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const deleteCategory = async (id: string) => {
    // Check if category is used in transactions
    const isUsed = transactions.some(t => t.category_id === id);
    if (isUsed) {
      return { success: false, isUsed: true, error: 'Bu kategori bazı işlemler tarafından kullanılmaktadır. Silmek için önce bu işlemleri düzenlemeli veya silmelisiniz.' };
    }

    if (isDemo) {
      const updated = categories.filter(c => c.id !== id);
      localStorage.setItem('moneymate_demo_categories', JSON.stringify(updated));
      setCategories(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        setCategories(categories.filter(c => c.id !== id));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Kategori silinemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  // ==========================================
  // BUDGET CRUD
  // ==========================================

  const addOrUpdateBudget = async (budget: { category_id: string; month: string; limit_amount: number }) => {
    if (!user) return { success: false, error: 'Oturum açılmadı.' };

    const existingBudget = budgets.find(
      b => b.category_id === budget.category_id && b.month === budget.month
    );

    if (isDemo) {
      let updated: Budget[];
      if (existingBudget) {
        updated = budgets.map(b =>
          b.id === existingBudget.id ? { ...b, limit_amount: budget.limit_amount } : b
        );
      } else {
        const newBudget: Budget = {
          id: `b-${Date.now()}`,
          user_id: user.id,
          category_id: budget.category_id,
          month: budget.month,
          limit_amount: budget.limit_amount,
        };
        updated = [...budgets, newBudget];
      }
      localStorage.setItem('moneymate_demo_budgets', JSON.stringify(updated));
      setBudgets(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        if (existingBudget) {
          const { data, error } = await supabase
            .from('budgets')
            .update({ limit_amount: budget.limit_amount })
            .eq('id', existingBudget.id)
            .select()
            .single();

          if (error) throw error;
          setBudgets(budgets.map(b => (b.id === existingBudget.id ? data : b)));
        } else {
          const { data, error } = await supabase
            .from('budgets')
            .insert({
              category_id: budget.category_id,
              month: budget.month,
              limit_amount: budget.limit_amount,
              user_id: user.id,
            })
            .select()
            .single();

          if (error) throw error;
          setBudgets([...budgets, data]);
        }
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Bütçe kaydedilemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const deleteBudget = async (id: string) => {
    if (isDemo) {
      const updated = budgets.filter(b => b.id !== id);
      localStorage.setItem('moneymate_demo_budgets', JSON.stringify(updated));
      setBudgets(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('budgets').delete().eq('id', id);
        if (error) throw error;
        setBudgets(budgets.filter(b => b.id !== id));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Bütçe silinemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  // ==========================================
  // RESET ALL DATA
  // ==========================================

  const resetAllData = async () => {
    if (!user) return;

    if (isDemo) {
      localStorage.removeItem('moneymate_demo_transactions');
      localStorage.removeItem('moneymate_demo_budgets');
      localStorage.removeItem('moneymate_demo_categories');
      
      // Reload demo data defaults
      const demoTxs = generateDemoTransactions(user.id);
      const demoBudgets = generateDemoBudgets(user.id);
      localStorage.setItem('moneymate_demo_transactions', JSON.stringify(demoTxs));
      localStorage.setItem('moneymate_demo_budgets', JSON.stringify(demoBudgets));
      localStorage.setItem('moneymate_demo_categories', JSON.stringify(DEFAULT_CATEGORIES));
      
      setTransactions(demoTxs);
      setBudgets(demoBudgets);
      setCategories(DEFAULT_CATEGORIES);
    } else if (isSupabaseConfigured && supabase) {
      try {
        // Delete all transactions
        await supabase.from('transactions').delete().eq('user_id', user.id);
        // Delete all budgets
        await supabase.from('budgets').delete().eq('user_id', user.id);
        // Delete custom categories
        await supabase.from('categories').delete().eq('user_id', user.id);
        
        // Refetch empty states
        setTransactions([]);
        setBudgets([]);
        
        // Fetch default categories
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .or(`user_id.eq.${user.id},user_id.is.null`);
        setCategories(catData || []);
      } catch (e) {
        console.error("Error resetting Supabase data", e);
      }
    }
  };

  return (
    <DataContext.Provider
      value={{
        transactions,
        categories,
        budgets,
        loadingData,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        addOrUpdateBudget,
        deleteBudget,
        resetAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
