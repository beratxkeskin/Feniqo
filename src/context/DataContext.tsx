import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../db/supabaseClient';
import type { Transaction, Category, Budget, RecurringTransaction, Goal, Debt, Subscription } from '../db/types';
import { DEFAULT_CATEGORIES, generateDemoTransactions, generateDemoBudgets, generateDemoRecurringTransactions, generateDemoGoals, generateDemoDebts, generateDemoSubscriptions } from '../db/demoData';


interface DataContextType {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
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

  // Recurring Transaction CRUD
  addRecurringTransaction: (rt: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at' | 'last_processed_date'>) => Promise<{ success: boolean; error?: string }>;
  updateRecurringTransaction: (id: string, rt: Partial<RecurringTransaction>) => Promise<{ success: boolean; error?: string }>;
  deleteRecurringTransaction: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Goal CRUD
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<{ success: boolean; error?: string }>;
  deleteGoal: (id: string) => Promise<{ success: boolean; error?: string }>;
  addFundsToGoal: (id: string, amount: number) => Promise<{ success: boolean; error?: string }>;
  
  // Debt CRUD
  debts: Debt[];
  addDebt: (debt: Omit<Debt, 'id' | 'user_id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateDebt: (id: string, debt: Partial<Debt>) => Promise<{ success: boolean; error?: string }>;
  deleteDebt: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleDebtPaidStatus: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Subscription CRUD
  subscriptions: Subscription[];
  addSubscription: (sub: Omit<Subscription, 'id' | 'user_id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateSubscription: (id: string, sub: Partial<Subscription>) => Promise<{ success: boolean; error?: string }>;
  deleteSubscription: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleSubscriptionActiveStatus: (id: string) => Promise<{ success: boolean; error?: string }>;
  renewSubscription: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Helpers
  resetAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemo } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setTransactions([]);
        setBudgets([]);
        setCategories([]);
        setRecurringTransactions([]);
        setGoals([]);
        setDebts([]);
        setSubscriptions([]);
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

        // Recurring Transactions
        let storedRts = localStorage.getItem('moneymate_demo_recurring');
        let currentRts: RecurringTransaction[] = [];
        if (!storedRts) {
          const demoRts = generateDemoRecurringTransactions(user.id);
          localStorage.setItem('moneymate_demo_recurring', JSON.stringify(demoRts));
          currentRts = demoRts;
        } else {
          currentRts = JSON.parse(storedRts);
        }
        setRecurringTransactions(currentRts);

        // Goals
        let storedGoals = localStorage.getItem('moneymate_demo_goals');
        let currentGoals: Goal[] = [];
        if (!storedGoals) {
          const demoGoals = generateDemoGoals(user.id);
          localStorage.setItem('moneymate_demo_goals', JSON.stringify(demoGoals));
          currentGoals = demoGoals;
        } else {
          currentGoals = JSON.parse(storedGoals);
        }
        setGoals(currentGoals);

        // Debts
        let storedDebts = localStorage.getItem('moneymate_demo_debts');
        let currentDebts: Debt[] = [];
        if (!storedDebts) {
          const demoDebts = generateDemoDebts(user.id);
          localStorage.setItem('moneymate_demo_debts', JSON.stringify(demoDebts));
          currentDebts = demoDebts;
        } else {
          currentDebts = JSON.parse(storedDebts);
        }
        setDebts(currentDebts);

        // Subscriptions
        let storedSubs = localStorage.getItem('moneymate_demo_subscriptions');
        let currentSubs: Subscription[] = [];
        if (!storedSubs) {
          const demoSubs = generateDemoSubscriptions(user.id);
          localStorage.setItem('moneymate_demo_subscriptions', JSON.stringify(demoSubs));
          currentSubs = demoSubs;
        } else {
          currentSubs = JSON.parse(storedSubs);
        }
        setSubscriptions(currentSubs);

        // --- CATCH UP LOGIC (Demo) ---
        await processCatchUp(currentRts, currentTxs, true);

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

          // Fetch recurring transactions
          const { data: rtData, error: rtErr } = await supabase
            .from('recurring_transactions')
            .select('*')
            .eq('user_id', user.id);

          if (rtErr) throw rtErr;
          setRecurringTransactions(rtData || []);

          // Fetch goals
          const { data: goalData, error: goalErr } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
          if (goalErr) throw goalErr;
          setGoals(goalData || []);

          // Fetch debts
          const { data: debtData, error: debtErr } = await supabase
            .from('debts')
            .select('*')
            .eq('user_id', user.id)
            .order('due_date', { ascending: true });
            
          if (debtErr) throw debtErr;
          setDebts(debtData || []);

          // Fetch subscriptions
          const { data: subData, error: subErr } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .order('renewal_date', { ascending: true });
            
          if (subErr) throw subErr;
          setSubscriptions(subData || []);

          // --- CATCH UP LOGIC (Supabase) ---
          await processCatchUp(rtData || [], txData || [], false);

        } catch (e) {
          console.error("Error loading Supabase data", e);
        }
      }

      setLoadingData(false);
    };

    fetchData();
  }, [user, isDemo]);

  // ==========================================
  // CATCH-UP LOGIC FOR RECURRING TRANSACTIONS
  // ==========================================
  const processCatchUp = async (rts: RecurringTransaction[], currentTxs: Transaction[], isDemoMode: boolean) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    let newTxs: Transaction[] = [];
    let updatedRts: RecurringTransaction[] = [];

    for (const rt of rts) {
      if (!rt.is_active) continue;
      if (rt.end_date && rt.end_date < today) continue;

      let processDateStr = rt.last_processed_date || rt.start_date;
      let processDate = new Date(processDateStr);
      let iterationCount = 0;
      let rtUpdated = false;

      while (iterationCount < 100) {
        let nextDate = new Date(processDate);
        if (rt.last_processed_date || iterationCount > 0) {
          if (rt.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
          else if (rt.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
          else if (rt.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
          else if (rt.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
        
        const nextDateStr = nextDate.toISOString().split('T')[0];

        if (nextDateStr > today) break;
        if (rt.end_date && nextDateStr > rt.end_date) break;

        const newTx: Transaction = {
          id: isDemoMode ? `tx-auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : '',
          user_id: user.id,
          amount: rt.amount,
          type: rt.type,
          category_id: rt.category_id,
          description: rt.description,
          payment_method: rt.payment_method,
          transaction_date: nextDateStr,
        };
        
        newTxs.push(newTx);
        processDate = nextDate;
        rtUpdated = true;
        iterationCount++;
      }

      if (rtUpdated) {
        updatedRts.push({ ...rt, last_processed_date: processDate.toISOString().split('T')[0] });
      }
    }

    if (newTxs.length > 0) {
      if (isDemoMode) {
        const finalTxs = [...newTxs, ...currentTxs].sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
        localStorage.setItem('moneymate_demo_transactions', JSON.stringify(finalTxs));
        setTransactions(finalTxs);

        const finalRts = rts.map(rt => updatedRts.find(u => u.id === rt.id) || rt);
        localStorage.setItem('moneymate_demo_recurring', JSON.stringify(finalRts));
        setRecurringTransactions(finalRts);
      } else if (isSupabaseConfigured && supabase) {
        try {
          // Insert new transactions
          const txInserts = newTxs.map(({ id, ...rest }) => rest);
          const { data: insertedTxs } = await supabase.from('transactions').insert(txInserts).select();
          
          if (insertedTxs) {
            setTransactions(prev => [...insertedTxs, ...prev].sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()));
          }

          // Update recurring transactions
          for (const urt of updatedRts) {
            await supabase.from('recurring_transactions').update({ last_processed_date: urt.last_processed_date }).eq('id', urt.id);
          }
          
          setRecurringTransactions(prev => prev.map(rt => updatedRts.find(u => u.id === rt.id) || rt));
        } catch (e) {
          console.error("Error processing catch-up", e);
        }
      }
    }
  };

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
  // RECURRING TRANSACTIONS CRUD
  // ==========================================

  const addRecurringTransaction = async (rt: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at' | 'last_processed_date'>) => {
    if (!user) return { success: false, error: 'Oturum açılmadı.' };

    const newRt: RecurringTransaction = {
      ...rt,
      id: isDemo ? `rt-${Date.now()}` : '',
      user_id: user.id,
      last_processed_date: null,
      is_active: true
    };

    if (isDemo) {
      const updated = [newRt, ...recurringTransactions];
      localStorage.setItem('moneymate_demo_recurring', JSON.stringify(updated));
      setRecurringTransactions(updated);
      
      // Instantly process if start_date is past
      await processCatchUp(updated, transactions, true);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('recurring_transactions')
          .insert({
            amount: newRt.amount,
            type: newRt.type,
            category_id: newRt.category_id,
            description: newRt.description,
            payment_method: newRt.payment_method,
            frequency: newRt.frequency,
            start_date: newRt.start_date,
            end_date: newRt.end_date,
            is_active: newRt.is_active,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        const updated = [data, ...recurringTransactions];
        setRecurringTransactions(updated);
        await processCatchUp(updated, transactions, false);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Tekrarlayan işlem eklenemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const updateRecurringTransaction = async (id: string, updatedFields: Partial<RecurringTransaction>) => {
    if (isDemo) {
      const updated = recurringTransactions.map(rt => (rt.id === id ? { ...rt, ...updatedFields } : rt));
      localStorage.setItem('moneymate_demo_recurring', JSON.stringify(updated));
      setRecurringTransactions(updated);
      // Process catch-up just in case they activated or changed dates
      await processCatchUp(updated, transactions, true);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('recurring_transactions')
          .update({
            amount: updatedFields.amount,
            category_id: updatedFields.category_id,
            description: updatedFields.description,
            payment_method: updatedFields.payment_method,
            frequency: updatedFields.frequency,
            end_date: updatedFields.end_date,
            is_active: updatedFields.is_active,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        const updated = recurringTransactions.map(rt => (rt.id === id ? data : rt));
        setRecurringTransactions(updated);
        await processCatchUp(updated, transactions, false);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Tekrarlayan işlem güncellenemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const deleteRecurringTransaction = async (id: string) => {
    if (isDemo) {
      const updated = recurringTransactions.filter(rt => rt.id !== id);
      localStorage.setItem('moneymate_demo_recurring', JSON.stringify(updated));
      setRecurringTransactions(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
        if (error) throw error;
        setRecurringTransactions(recurringTransactions.filter(rt => rt.id !== id));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'İşlem silinemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  // ==========================================
  // SAVINGS GOALS CRUD
  // ==========================================

  const addGoal = async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { success: false, error: 'Oturum açılmadı.' };

    const newGoal: Goal = {
      ...goal,
      id: isDemo ? `g-${Date.now()}` : '',
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    if (isDemo) {
      const updated = [newGoal, ...goals];
      localStorage.setItem('moneymate_demo_goals', JSON.stringify(updated));
      setGoals(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('goals')
          .insert({
            name: newGoal.name,
            target_amount: newGoal.target_amount,
            current_amount: newGoal.current_amount,
            target_date: newGoal.target_date,
            color: newGoal.color,
            icon: newGoal.icon,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        setGoals([data, ...goals]);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Hedef eklenemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const updateGoal = async (id: string, updatedFields: Partial<Goal>) => {
    if (isDemo) {
      const updated = goals.map(g => (g.id === id ? { ...g, ...updatedFields } : g));
      localStorage.setItem('moneymate_demo_goals', JSON.stringify(updated));
      setGoals(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('goals')
          .update({
            name: updatedFields.name,
            target_amount: updatedFields.target_amount,
            current_amount: updatedFields.current_amount,
            target_date: updatedFields.target_date,
            color: updatedFields.color,
            icon: updatedFields.icon,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        setGoals(goals.map(g => (g.id === id ? data : g)));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Hedef güncellenemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const deleteGoal = async (id: string) => {
    if (isDemo) {
      const updated = goals.filter(g => g.id !== id);
      localStorage.setItem('moneymate_demo_goals', JSON.stringify(updated));
      setGoals(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (error) throw error;
        setGoals(goals.filter(g => g.id !== id));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Hedef silinemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const addFundsToGoal = async (id: string, amount: number) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return { success: false, error: 'Hedef bulunamadı.' };

    const newAmount = Math.max(0, goal.current_amount + amount);
    return updateGoal(id, { current_amount: newAmount });
  };

  // ==========================================
  // DEBTS AND RECEIVABLES CRUD
  // ==========================================

  const addDebt = async (debt: Omit<Debt, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { success: false, error: 'Oturum açılmadı.' };

    const newDebt: Debt = {
      ...debt,
      id: isDemo ? `d-${Date.now()}` : '',
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    if (isDemo) {
      const updated = [newDebt, ...debts];
      localStorage.setItem('moneymate_demo_debts', JSON.stringify(updated));
      setDebts(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('debts')
          .insert({
            title: newDebt.title,
            amount: newDebt.amount,
            type: newDebt.type,
            due_date: newDebt.due_date,
            is_paid: newDebt.is_paid,
            description: newDebt.description,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        setDebts([data, ...debts]);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Kayıt eklenemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const updateDebt = async (id: string, updatedFields: Partial<Debt>) => {
    if (isDemo) {
      const updated = debts.map(d => (d.id === id ? { ...d, ...updatedFields } : d));
      localStorage.setItem('moneymate_demo_debts', JSON.stringify(updated));
      setDebts(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('debts')
          .update({
            title: updatedFields.title,
            amount: updatedFields.amount,
            type: updatedFields.type,
            due_date: updatedFields.due_date,
            is_paid: updatedFields.is_paid,
            description: updatedFields.description,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        setDebts(debts.map(d => (d.id === id ? data : d)));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Kayıt güncellenemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const deleteDebt = async (id: string) => {
    if (isDemo) {
      const updated = debts.filter(d => d.id !== id);
      localStorage.setItem('moneymate_demo_debts', JSON.stringify(updated));
      setDebts(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('debts').delete().eq('id', id);
         if (error) throw error;
        setDebts(debts.filter(d => d.id !== id));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Kayıt silinemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const toggleDebtPaidStatus = async (id: string) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return { success: false, error: 'Kayıt bulunamadı.' };
    return updateDebt(id, { is_paid: !debt.is_paid });
  };

  // ==========================================
  // SUBSCRIPTIONS CRUD
  // ==========================================
  const addSubscription = async (sub: Omit<Subscription, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { success: false, error: 'Kullanıcı oturumu bulunamadı.' };

    const newSub: Subscription = {
      ...sub,
      id: isDemo ? `sub-demo-${Date.now()}` : '',
      user_id: user.id
    };

    if (isDemo) {
      const updated = [newSub, ...subscriptions];
      localStorage.setItem('moneymate_demo_subscriptions', JSON.stringify(updated));
      setSubscriptions(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .insert({
            name: newSub.name,
            amount: newSub.amount,
            renewal_date: newSub.renewal_date,
            category_id: newSub.category_id,
            is_active: newSub.is_active,
            user_id: user.id
          })
          .select()
          .single();

        if (error) throw error;
        setSubscriptions([data, ...subscriptions]);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Abonelik eklenemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const updateSubscription = async (id: string, sub: Partial<Subscription>) => {
    if (isDemo) {
      const updated = subscriptions.map(s => (s.id === id ? { ...s, ...sub } : s));
      localStorage.setItem('moneymate_demo_subscriptions', JSON.stringify(updated));
      setSubscriptions(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .update(sub)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        setSubscriptions(subscriptions.map(s => (s.id === id ? data : s)));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Abonelik güncellenemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const deleteSubscription = async (id: string) => {
    if (isDemo) {
      const updated = subscriptions.filter(s => s.id !== id);
      localStorage.setItem('moneymate_demo_subscriptions', JSON.stringify(updated));
      setSubscriptions(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('subscriptions').delete().eq('id', id);
        if (error) throw error;
        setSubscriptions(subscriptions.filter(s => s.id !== id));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Abonelik silinemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const toggleSubscriptionActiveStatus = async (id: string) => {
    const sub = subscriptions.find(s => s.id === id);
    if (!sub) return { success: false, error: 'Abonelik bulunamadı.' };
    return updateSubscription(id, { is_active: !sub.is_active });
  };

  const renewSubscription = async (id: string) => {
    const sub = subscriptions.find(s => s.id === id);
    if (!sub) return { success: false, error: 'Abonelik bulunamadı.' };

    // 1. Calculate next renewal date (advance by exactly 1 month)
    const currentDate = new Date(sub.renewal_date);
    currentDate.setMonth(currentDate.getMonth() + 1);
    const nextRenewalDateStr = currentDate.toISOString().split('T')[0];

    // 2. Add transaction logic (as an expense)
    const txDescription = sub.name + ' Ödemesi';
    const txResult = await addTransaction({
      amount: sub.amount,
      type: 'expense',
      category_id: sub.category_id,
      description: txDescription,
      payment_method: 'Kredi Kartı', // Default payment method for subscriptions
      transaction_date: new Date().toISOString().split('T')[0] // today's date
    });

    if (!txResult.success) {
      return { success: false, error: txResult.error || 'Ödeme kaydı oluşturulamadı.' };
    }

    // 3. Update subscription's renewal date
    return updateSubscription(id, { renewal_date: nextRenewalDateStr });
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
      localStorage.removeItem('moneymate_demo_recurring');
      localStorage.removeItem('moneymate_demo_goals');
      localStorage.removeItem('moneymate_demo_debts');
      localStorage.removeItem('moneymate_demo_subscriptions');
      
      // Reload demo data defaults
      const demoTxs = generateDemoTransactions(user.id);
      const demoBudgets = generateDemoBudgets(user.id);
      const demoRts = generateDemoRecurringTransactions(user.id);
      const demoGoals = generateDemoGoals(user.id);
      const demoDebts = generateDemoDebts(user.id);
      const demoSubs = generateDemoSubscriptions(user.id);
      localStorage.setItem('moneymate_demo_transactions', JSON.stringify(demoTxs));
      localStorage.setItem('moneymate_demo_budgets', JSON.stringify(demoBudgets));
      localStorage.setItem('moneymate_demo_categories', JSON.stringify(DEFAULT_CATEGORIES));
      localStorage.setItem('moneymate_demo_recurring', JSON.stringify(demoRts));
      localStorage.setItem('moneymate_demo_goals', JSON.stringify(demoGoals));
      localStorage.setItem('moneymate_demo_debts', JSON.stringify(demoDebts));
      localStorage.setItem('moneymate_demo_subscriptions', JSON.stringify(demoSubs));
      
      setTransactions(demoTxs);
      setBudgets(demoBudgets);
      setCategories(DEFAULT_CATEGORIES);
      setRecurringTransactions(demoRts);
      setGoals(demoGoals);
      setDebts(demoDebts);
      setSubscriptions(demoSubs);
    } else if (isSupabaseConfigured && supabase) {
      try {
        // Delete all transactions
        await supabase.from('transactions').delete().eq('user_id', user.id);
        // Delete all budgets
        await supabase.from('budgets').delete().eq('user_id', user.id);
        // Delete all recurring transactions
        await supabase.from('recurring_transactions').delete().eq('user_id', user.id);
        // Delete all goals
        await supabase.from('goals').delete().eq('user_id', user.id);
        // Delete all debts
        await supabase.from('debts').delete().eq('user_id', user.id);
        // Delete all subscriptions
        await supabase.from('subscriptions').delete().eq('user_id', user.id);
        // Delete custom categories
        await supabase.from('categories').delete().eq('user_id', user.id);
        
        // Refetch empty states
        setTransactions([]);
        setBudgets([]);
        setRecurringTransactions([]);
        setGoals([]);
        setDebts([]);
        setSubscriptions([]);
        
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
        recurringTransactions,
        goals,
        loadingData,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        addOrUpdateBudget,
        deleteBudget,
        addRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,
        addGoal,
        updateGoal,
        deleteGoal,
        addFundsToGoal,
        debts,
        addDebt,
        updateDebt,
        deleteDebt,
        toggleDebtPaidStatus,
        subscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        toggleSubscriptionActiveStatus,
        renewSubscription,
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
