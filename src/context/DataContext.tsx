import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../db/supabaseClient';
import type { Transaction, Category, Budget, RecurringTransaction, Goal, Debt, Subscription, Workspace, Profile, Asset } from '../db/types';
import { DEFAULT_CATEGORIES, generateDemoTransactions, generateDemoBudgets, generateDemoRecurringTransactions, generateDemoGoals, generateDemoDebts, generateDemoSubscriptions, generateDemoAssets } from '../db/demoData';

export const extractHashtags = (text?: string): string[] => {
  if (!text) return [];
  const matches = text.match(/#[a-zA-Z0-9çıüğöşİĞÜÖŞÇ_]+/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map(tag => tag.substring(1).toLowerCase())));
};

interface DataContextType {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  loadingData: boolean;
  
  // Workspaces
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  workspaceMembers: Profile[];
  createWorkspace: (name: string) => Promise<{ success: boolean; error?: string; workspace?: Workspace }>;
  joinWorkspace: (inviteCode: string) => Promise<{ success: boolean; error?: string }>;
  leaveWorkspace: (workspaceId: string) => Promise<{ success: boolean; error?: string }>;
  setActiveWorkspace: (workspaceId: string | null) => Promise<void>;
  
  // Transaction CRUD
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'> & { user_id?: string }) => Promise<{ success: boolean; error?: string }>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<{ success: boolean; error?: string }>;
  deleteTransaction: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Category CRUD
  addCategory: (cat: Omit<Category, 'id' | 'user_id' | 'is_default' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (id: string) => Promise<{ success: boolean; error?: string; isUsed?: boolean }>;
  
  // Budget CRUD
  addOrUpdateBudget: (budget: { category_id: string; month: string; limit_amount: number }) => Promise<{ success: boolean; error?: string }>;
  deleteBudget: (id: string) => Promise<{ success: boolean; error?: string }>;
  copyBudgets: (fromMonth: string, toMonth: string) => Promise<{ success: boolean; error?: string }>;

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
  
  // Asset CRUD
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id' | 'user_id' | 'created_at'> & { workspace_id?: string | null }) => Promise<{ success: boolean; error?: string }>;
  updateAsset: (id: string, asset: Partial<Asset>) => Promise<{ success: boolean; error?: string }>;
  deleteAsset: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Permissions & Roles
  currentUserRole: 'admin' | 'contributor' | 'viewer';
  updateMemberRole: (memberId: string, role: 'admin' | 'contributor' | 'viewer') => Promise<{ success: boolean; error?: string }>;

  // Helpers
  resetAllData: () => Promise<void>;
  importBackupData: (backupJson: any) => Promise<{ success: boolean; error?: string }>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemo, updateProfile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Workspace States
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<Profile[]>([]);

  // Fetch all data
  const fetchData = async (isSilent = false) => {
    if (!user) {
      setTransactions([]);
      setBudgets([]);
      setCategories([]);
      setRecurringTransactions([]);
      setGoals([]);
      setDebts([]);
      setSubscriptions([]);
      setAssets([]);
      setWorkspaces([]);
      setActiveWorkspaceState(null);
      setWorkspaceMembers([]);
      setLoadingData(false);
      return;
    }

    if (!isSilent) setLoadingData(true);

    if (isDemo) {
      // --- 1. LOCAL STORAGE DEMO MODE ---
      // Workspaces
      let storedWorkspaces = localStorage.getItem('moneymate_demo_workspaces');
      let currentWorkspaces: Workspace[] = [];
      if (!storedWorkspaces) {
        // Pre-seed a default shared family workspace
        const defaultWorkspace: Workspace = {
          id: 'demo-workspace-family',
          name: 'Aile Bütçesi 🏡',
          invite_code: 'LOVE8888',
          created_by: user.id,
          created_at: new Date().toISOString()
        };
        currentWorkspaces = [defaultWorkspace];
        localStorage.setItem('moneymate_demo_workspaces', JSON.stringify(currentWorkspaces));
      } else {
        currentWorkspaces = JSON.parse(storedWorkspaces);
      }
      setWorkspaces(currentWorkspaces);

      // Active Workspace
      let currentActive: Workspace | null = null;
      if (user.active_workspace_id) {
        currentActive = currentWorkspaces.find(w => w.id === user.active_workspace_id) || null;
      }
      setActiveWorkspaceState(currentActive);

      // Members
      let members: Profile[] = [];
      if (currentActive) {
        const storedRoles = localStorage.getItem('moneymate_demo_member_roles');
        const rolesMap = storedRoles ? JSON.parse(storedRoles) : {};
        if (!rolesMap[user.id]) rolesMap[user.id] = 'admin';
        if (!rolesMap['demo-partner-456']) rolesMap['demo-partner-456'] = 'contributor';
        
        const perspectiveRole = localStorage.getItem('moneymate_demo_perspective_role') || 'admin';
        
        members = [
          { 
            id: user.id, 
            email: user.email, 
            currency: user.currency, 
            theme: user.theme, 
            lang: user.lang, 
            active_workspace_id: currentActive.id,
            role: perspectiveRole as 'admin' | 'contributor' | 'viewer'
          }
        ];
        // Buse (demo partner) should ONLY be in the family budget workspace!
        if (currentActive.id === 'demo-workspace-family') {
          members.push({ 
            id: 'demo-partner-456', 
            email: 'buse@moneymate.com', 
            currency: 'TRY', 
            theme: 'system', 
            lang: 'tr', 
            active_workspace_id: currentActive.id,
            role: rolesMap['demo-partner-456'] || 'contributor'
          });
        }
      }
      setWorkspaceMembers(members);

      // Categories
      let storedCats = localStorage.getItem('moneymate_demo_categories');
      let currentCats: Category[] = [];
      if (!storedCats) {
        localStorage.setItem('moneymate_demo_categories', JSON.stringify(DEFAULT_CATEGORIES));
        currentCats = DEFAULT_CATEGORIES;
      } else {
        currentCats = JSON.parse(storedCats);
      }

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

      // Auto seed partner transactions in Family workspace
      if (currentActive && currentActive.id === 'demo-workspace-family') {
        const hasPartnerTxs = currentTxs.some(t => t.user_id === 'demo-partner-456');
        if (!hasPartnerTxs) {
          const marketCat = currentCats.find(c => c.name === 'Market') || currentCats[1];
          const faturaCat = currentCats.find(c => c.name === 'Fatura') || currentCats[4];
          const eglenceCat = currentCats.find(c => c.name === 'Eğlence') || currentCats[5];

          const partnerTxs: Transaction[] = [
            {
              id: 'tx-partner-1',
              user_id: 'demo-partner-456',
              amount: 1250,
              type: 'expense',
              category_id: marketCat.id,
              description: 'Haftalık Mutfak Alışverişi',
              payment_method: 'Kredi Kartı',
              transaction_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              workspace_id: 'demo-workspace-family'
            },
            {
              id: 'tx-partner-2',
              user_id: 'demo-partner-456',
              amount: 850,
              type: 'expense',
              category_id: faturaCat.id,
              description: 'Elektrik Faturası',
              payment_method: 'Havale/EFT',
              transaction_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              workspace_id: 'demo-workspace-family'
            },
            {
              id: 'tx-partner-3',
              user_id: 'demo-partner-456',
              amount: 400,
              type: 'expense',
              category_id: eglenceCat.id,
              description: 'Haftasonu Sinema Keyfi',
              payment_method: 'Nakit',
              transaction_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              workspace_id: 'demo-workspace-family'
            }
          ];
          currentTxs = [...partnerTxs, ...currentTxs];
          localStorage.setItem('moneymate_demo_transactions', JSON.stringify(currentTxs));
        }
      }

      // Filter by Workspace and automatically populate parsed hashtags if they don't have tags array yet
      let filteredTxs = currentTxs.filter(t => currentActive ? t.workspace_id === currentActive.id : !t.workspace_id);
      const mappedTxs = filteredTxs.map(t => ({
        ...t,
        tags: t.tags || extractHashtags(t.description)
      }));
      setTransactions(mappedTxs);

      let filteredCats = currentCats.filter(c => currentActive ? c.workspace_id === currentActive.id || c.is_default : !c.workspace_id || c.is_default);
      setCategories(filteredCats);

      let storedBudgets = localStorage.getItem('moneymate_demo_budgets');
      let currentBudgets = storedBudgets ? JSON.parse(storedBudgets) : generateDemoBudgets(user.id);
      let filteredBudgets = currentBudgets.filter((b: any) => currentActive ? b.workspace_id === currentActive.id : !b.workspace_id);
      setBudgets(filteredBudgets);

      let storedRts = localStorage.getItem('moneymate_demo_recurring');
      let currentRts = storedRts ? JSON.parse(storedRts) : generateDemoRecurringTransactions(user.id);
      let filteredRts = currentRts.filter((rt: any) => currentActive ? rt.workspace_id === currentActive.id : !rt.workspace_id);
      setRecurringTransactions(filteredRts);

      let storedGoals = localStorage.getItem('moneymate_demo_goals');
      let currentGoals = storedGoals ? JSON.parse(storedGoals) : generateDemoGoals(user.id);
      let filteredGoals = currentGoals.filter((g: any) => currentActive ? g.workspace_id === currentActive.id : !g.workspace_id);
      setGoals(filteredGoals);

      let storedDebts = localStorage.getItem('moneymate_demo_debts');
      let currentDebts = storedDebts ? JSON.parse(storedDebts) : generateDemoDebts(user.id);
      let filteredDebts = currentDebts.filter((d: any) => currentActive ? d.workspace_id === currentActive.id : !d.workspace_id);
      setDebts(filteredDebts);

      let storedSubs = localStorage.getItem('moneymate_demo_subscriptions');
      let currentSubs = storedSubs ? JSON.parse(storedSubs) : generateDemoSubscriptions(user.id);
      let filteredSubs = currentSubs.filter((s: any) => currentActive ? s.workspace_id === currentActive.id : !s.workspace_id);
      setSubscriptions(filteredSubs);

      let storedAssets = localStorage.getItem('moneymate_demo_assets');
      let currentAssets = storedAssets ? JSON.parse(storedAssets) : generateDemoAssets(user.id);
      let filteredAssets = currentAssets.filter((a: any) => 
        currentActive 
          ? (a.workspace_id === currentActive.id || (!a.workspace_id && a.user_id === user.id))
          : (!a.workspace_id && a.user_id === user.id)
      );
      setAssets(filteredAssets);

      await processCatchUp(filteredRts, filteredTxs, true);

    } else if (isSupabaseConfigured && supabase) {
      // --- 2. SUPABASE PRODUCTION MODE ---
      try {
        // Fetch workspaces
        const { data: wsMemberships, error: wsMembershipsErr } = await supabase
          .from('workspace_members')
          .select('workspace_id, workspaces(*)');

        if (wsMembershipsErr) throw wsMembershipsErr;

        const userWorkspaces = (wsMemberships || []).map((m: any) => m.workspaces).filter(Boolean) as Workspace[];
        setWorkspaces(userWorkspaces);

        // Get active workspace
        const activeWorkspaceId = user.active_workspace_id;
        const currentActive = userWorkspaces.find(w => w.id === activeWorkspaceId) || null;
        setActiveWorkspaceState(currentActive);

        // Fetch active workspace members
        if (currentActive) {
          const { data: memberProfiles, error: membersErr } = await supabase
            .from('workspace_members')
            .select('user_id, role')
            .eq('workspace_id', currentActive.id);
          
          if (membersErr) throw membersErr;
          const memberIds = (memberProfiles || []).map((m: any) => m.user_id);

          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', memberIds);

          const membersWithRoles = (profilesData || []).map((p: any) => {
            const membership = memberProfiles?.find(m => m.user_id === p.id);
            let codeRole: 'admin' | 'contributor' | 'viewer' = 'contributor';
            if (membership?.role === 'owner') {
              codeRole = 'admin';
            } else {
              const storedViewerOverrides = localStorage.getItem(`moneymate_viewer_overrides_${currentActive.id}`);
              const overrides = storedViewerOverrides ? JSON.parse(storedViewerOverrides) : {};
              if (overrides[p.id] === 'viewer') {
                codeRole = 'viewer';
              } else {
                codeRole = 'contributor';
              }
            }
            return {
              ...p,
              role: codeRole
            };
          });

          setWorkspaceMembers(membersWithRoles);
        } else {
          setWorkspaceMembers([]);
        }

        // Fetch Categories (default + workspace/personal custom)
        let catData;
        if (currentActive) {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .or(`workspace_id.eq.${currentActive.id},is_default.eq.true`);
          if (error) throw error;
          catData = data;
        } else {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .or(`and(user_id.eq.${user.id},workspace_id.is.null),is_default.eq.true`);
          if (error) throw error;
          catData = data;
        }
        setCategories(catData || []);

        // Fetch Transactions
        let txQuery = supabase.from('transactions').select('*, transaction_tags(tags(name))');
        if (currentActive) {
          txQuery = txQuery.eq('workspace_id', currentActive.id);
        } else {
          txQuery = txQuery.eq('user_id', user.id).is('workspace_id', null);
        }
        const { data: txData, error: txErr } = await txQuery.order('transaction_date', { ascending: false });
        if (txErr) throw txErr;
        
        const mappedSupabaseTxs = (txData || []).map((t: any) => ({
          ...t,
          tags: t.transaction_tags 
            ? t.transaction_tags.map((tt: any) => tt.tags?.name).filter(Boolean) 
            : []
        }));
        setTransactions(mappedSupabaseTxs);

        // Fetch Budgets
        let budgetQuery = supabase.from('budgets').select('*');
        if (currentActive) {
          budgetQuery = budgetQuery.eq('workspace_id', currentActive.id);
        } else {
          budgetQuery = budgetQuery.eq('user_id', user.id).is('workspace_id', null);
        }
        const { data: budgetData, error: budgetErr } = await budgetQuery;
        if (budgetErr) throw budgetErr;
        setBudgets(budgetData || []);

        // Fetch Recurring Transactions
        let rtQuery = supabase.from('recurring_transactions').select('*');
        if (currentActive) {
          rtQuery = rtQuery.eq('workspace_id', currentActive.id);
        } else {
          rtQuery = rtQuery.eq('user_id', user.id).is('workspace_id', null);
        }
        const { data: rtData, error: rtErr } = await rtQuery;
        if (rtErr) throw rtErr;
        setRecurringTransactions(rtData || []);

        // Fetch Goals
        let goalQuery = supabase.from('goals').select('*');
        if (currentActive) {
          goalQuery = goalQuery.eq('workspace_id', currentActive.id);
        } else {
          goalQuery = goalQuery.eq('user_id', user.id).is('workspace_id', null);
        }
        const { data: goalData, error: goalErr } = await goalQuery.order('created_at', { ascending: false });
        if (goalErr) throw goalErr;
        setGoals(goalData || []);

        // Fetch Debts
        let debtQuery = supabase.from('debts').select('*');
        if (currentActive) {
          debtQuery = debtQuery.eq('workspace_id', currentActive.id);
        } else {
          debtQuery = debtQuery.eq('user_id', user.id).is('workspace_id', null);
        }
        const { data: debtData, error: debtErr } = await debtQuery.order('due_date', { ascending: true });
        if (debtErr) throw debtErr;
        setDebts(debtData || []);

        // Fetch Subscriptions
        let subQuery = supabase.from('subscriptions').select('*');
        if (currentActive) {
          subQuery = subQuery.eq('workspace_id', currentActive.id);
        } else {
          subQuery = subQuery.eq('user_id', user.id).is('workspace_id', null);
        }
        const { data: subData, error: subErr } = await subQuery.order('renewal_date', { ascending: true });
        if (subErr) throw subErr;
        setSubscriptions(subData || []);

        // Fetch Assets
        let assetQuery = supabase.from('assets').select('*');
        if (currentActive) {
          assetQuery = assetQuery.or(`workspace_id.eq.${currentActive.id},and(workspace_id.is.null,user_id.eq.${user.id})`);
        } else {
          assetQuery = assetQuery.eq('user_id', user.id).is('workspace_id', null);
        }
        const { data: assetData, error: assetErr } = await assetQuery.order('created_at', { ascending: false });
        if (assetErr) throw assetErr;
        setAssets(assetData || []);

        await processCatchUp(rtData || [], txData || [], false);

      } catch (e) {
        console.error("Error loading Supabase collaborative data", e);
      }
    }

    setLoadingData(false);
  };

  // Helper for silent background refresh
  const silentRefresh = () => fetchData(true);

  // Trigger reactive fetch
  useEffect(() => {
    fetchData(false);
  }, [user, isDemo, user?.active_workspace_id]);

  // Supabase Real-Time Subscriptions
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user || isDemo || !activeWorkspace) return;

    const channelName = `workspace-sync-${activeWorkspace.id}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `workspace_id=eq.${activeWorkspace.id}` },
        () => silentRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `workspace_id=eq.${activeWorkspace.id}` },
        () => silentRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets', filter: `workspace_id=eq.${activeWorkspace.id}` },
        () => silentRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recurring_transactions', filter: `workspace_id=eq.${activeWorkspace.id}` },
        () => silentRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goals', filter: `workspace_id=eq.${activeWorkspace.id}` },
        () => silentRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'debts', filter: `workspace_id=eq.${activeWorkspace.id}` },
        () => silentRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions', filter: `workspace_id=eq.${activeWorkspace.id}` },
        () => silentRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assets', filter: `workspace_id=eq.${activeWorkspace.id}` },
        () => silentRefresh()
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.active_workspace_id, activeWorkspace?.id, isDemo]);

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

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'> & { user_id?: string }) => {
    if (!user) return { success: false, error: 'Oturum açılmadı.' };

    const parsedTags = extractHashtags(tx.description);
    const newTx: Transaction = {
      ...tx,
      id: isDemo ? `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : '',
      user_id: tx.user_id || user.id,
      workspace_id: activeWorkspace?.id || null,
      tags: parsedTags,
    };

    if (isDemo) {
      const storedTxs = localStorage.getItem('moneymate_demo_transactions');
      const allTxs: Transaction[] = storedTxs ? JSON.parse(storedTxs) : [];
      const updatedAll = [newTx, ...allTxs];
      localStorage.setItem('moneymate_demo_transactions', JSON.stringify(updatedAll));
      
      setTransactions([newTx, ...transactions]);
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
            receipt_url: newTx.receipt_url,
            user_id: newTx.user_id,
            workspace_id: newTx.workspace_id,
          })
          .select()
          .single();

        if (error) throw error;

        // Save transaction tags
        if (parsedTags.length > 0) {
          for (const tagName of parsedTags) {
            let tagId = '';
            // Check if tag exists
            const { data: existingTag } = await supabase
              .from('tags')
              .select('id')
              .eq('name', tagName)
              .eq('user_id', newTx.user_id)
              .maybeSingle();

            if (existingTag) {
              tagId = existingTag.id;
            } else {
              // Insert tag
              const { data: newTag } = await supabase
                .from('tags')
                .insert({
                  name: tagName,
                  user_id: newTx.user_id,
                  workspace_id: newTx.workspace_id
                })
                .select('id')
                .single();
              if (newTag) tagId = newTag.id;
            }

            if (tagId) {
              await supabase
                .from('transaction_tags')
                .insert({
                  transaction_id: data.id,
                  tag_id: tagId
                });
            }
          }
        }

        const finalTx = { ...data, tags: parsedTags };
        setTransactions([finalTx, ...transactions]);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'İşlem eklenemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const updateTransaction = async (id: string, updatedFields: Partial<Transaction>) => {
    if (!user) return { success: false, error: 'Oturum açılmadı.' };
    const parsedTags = updatedFields.description !== undefined ? extractHashtags(updatedFields.description) : undefined;
    
    if (isDemo) {
      const storedTxs = localStorage.getItem('moneymate_demo_transactions');
      const allTxs: Transaction[] = storedTxs ? JSON.parse(storedTxs) : [];
      const updatedAll = allTxs.map(t => {
        if (t.id === id) {
          const merged = { ...t, ...updatedFields };
          if (parsedTags !== undefined) merged.tags = parsedTags;
          return merged;
        }
        return t;
      });
      localStorage.setItem('moneymate_demo_transactions', JSON.stringify(updatedAll));
      
      setTransactions(transactions.map(t => {
        if (t.id === id) {
          const merged = { ...t, ...updatedFields };
          if (parsedTags !== undefined) merged.tags = parsedTags;
          return merged;
        }
        return t;
      }));
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
            receipt_url: updatedFields.receipt_url,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        // If description is updated, update the tags too
        if (parsedTags !== undefined) {
          // Clear old transaction tags
          await supabase.from('transaction_tags').delete().eq('transaction_id', id);

          // Write new tags
          for (const tagName of parsedTags) {
            let tagId = '';
            const { data: existingTag } = await supabase
              .from('tags')
              .select('id')
              .eq('name', tagName)
              .eq('user_id', user.id)
              .maybeSingle();

            if (existingTag) {
              tagId = existingTag.id;
            } else {
              const { data: newTag } = await supabase
                .from('tags')
                .insert({
                  name: tagName,
                  user_id: user.id,
                  workspace_id: data.workspace_id
                })
                .select('id')
                .single();
              if (newTag) tagId = newTag.id;
            }

            if (tagId) {
              await supabase
                .from('transaction_tags')
                .insert({
                  transaction_id: id,
                  tag_id: tagId
                });
            }
          }
        }

        const finalTx = { 
          ...data, 
          tags: parsedTags !== undefined ? parsedTags : (transactions.find(t => t.id === id)?.tags || [])
        };
        
        setTransactions(transactions.map(t => (t.id === id ? finalTx : t)));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'İşlem güncellenemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const deleteTransaction = async (id: string) => {
    if (isDemo) {
      const storedTxs = localStorage.getItem('moneymate_demo_transactions');
      const allTxs: Transaction[] = storedTxs ? JSON.parse(storedTxs) : [];
      const updatedAll = allTxs.filter(t => t.id !== id);
      localStorage.setItem('moneymate_demo_transactions', JSON.stringify(updatedAll));
      
      setTransactions(transactions.filter(t => t.id !== id));
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
      workspace_id: activeWorkspace?.id || null,
    };

    if (isDemo) {
      const storedCats = localStorage.getItem('moneymate_demo_categories');
      const allCats: Category[] = storedCats ? JSON.parse(storedCats) : DEFAULT_CATEGORIES;
      const updatedAll = [...allCats, newCat];
      localStorage.setItem('moneymate_demo_categories', JSON.stringify(updatedAll));
      
      setCategories([...categories, newCat]);
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
            workspace_id: newCat.workspace_id,
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
      const storedCats = localStorage.getItem('moneymate_demo_categories');
      const allCats: Category[] = storedCats ? JSON.parse(storedCats) : DEFAULT_CATEGORIES;
      const updatedAll = allCats.map(c => (c.id === id ? { ...c, ...updatedFields } : c));
      localStorage.setItem('moneymate_demo_categories', JSON.stringify(updatedAll));
      
      setCategories(categories.map(c => (c.id === id ? { ...c, ...updatedFields } : c)));
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
      const storedCats = localStorage.getItem('moneymate_demo_categories');
      const allCats: Category[] = storedCats ? JSON.parse(storedCats) : DEFAULT_CATEGORIES;
      const updatedAll = allCats.filter(c => c.id !== id);
      localStorage.setItem('moneymate_demo_categories', JSON.stringify(updatedAll));
      
      setCategories(categories.filter(c => c.id !== id));
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

  const copyBudgets = async (fromMonth: string, toMonth: string) => {
    if (!user) return { success: false, error: 'Oturum açılmadı.' };

    const sourceBudgets = budgets.filter(b => b.month === fromMonth);
    if (sourceBudgets.length === 0) {
      return { success: false, error: 'Kopyalanacak bütçe bulunamadı.' };
    }

    if (isDemo) {
      const cleanBudgets = budgets.filter(b => b.month !== toMonth);
      
      const newBudgets: Budget[] = sourceBudgets.map((b, idx) => ({
        id: `b-copy-${Date.now()}-${idx}`,
        user_id: user.id,
        category_id: b.category_id,
        month: toMonth,
        limit_amount: b.limit_amount,
        workspace_id: activeWorkspace?.id || null,
      }));

      const updated = [...cleanBudgets, ...newBudgets];
      localStorage.setItem('moneymate_demo_budgets', JSON.stringify(updated));
      setBudgets(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: deleteError } = await supabase
          .from('budgets')
          .delete()
          .eq('month', toMonth)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        const insertPayload = sourceBudgets.map(b => ({
          user_id: user.id,
          category_id: b.category_id,
          month: toMonth,
          limit_amount: b.limit_amount,
          workspace_id: activeWorkspace?.id || null,
        }));

        const { data, error: insertError } = await supabase
          .from('budgets')
          .insert(insertPayload)
          .select();

        if (insertError) throw insertError;

        const otherBudgets = budgets.filter(b => b.month !== toMonth);
        setBudgets([...otherBudgets, ...data]);

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Bütçeler kopyalanamadı.' };
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
  // ASSET CRUD
  // ==========================================

  const addAsset = async (asset: Omit<Asset, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { success: false, error: 'Oturum açılmadı.' };

    const newAsset: Asset = {
      ...asset,
      id: isDemo ? `ast-${Date.now()}` : '',
      user_id: user.id,
      workspace_id: asset.workspace_id !== undefined ? asset.workspace_id : (activeWorkspace?.id || null),
      created_at: new Date().toISOString(),
    };

    if (isDemo) {
      const updated = [newAsset, ...assets];
      localStorage.setItem('moneymate_demo_assets', JSON.stringify(updated));
      setAssets(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('assets')
          .insert({
            name: newAsset.name,
            type: newAsset.type,
            value: newAsset.value,
            quantity: newAsset.quantity,
            purchase_price: newAsset.purchase_price,
            user_id: user.id,
            workspace_id: newAsset.workspace_id,
          })
          .select()
          .single();

        if (error) throw error;
        setAssets([data, ...assets]);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Varlık eklenemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const updateAsset = async (id: string, updatedFields: Partial<Asset>) => {
    if (isDemo) {
      const updated = assets.map(a => (a.id === id ? { ...a, ...updatedFields } : a));
      localStorage.setItem('moneymate_demo_assets', JSON.stringify(updated));
      setAssets(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const updateData: any = {
          name: updatedFields.name,
          type: updatedFields.type,
          value: updatedFields.value,
          quantity: updatedFields.quantity,
          purchase_price: updatedFields.purchase_price,
        };
        if (updatedFields.workspace_id !== undefined) {
          updateData.workspace_id = updatedFields.workspace_id;
        }

        const { data, error } = await supabase
          .from('assets')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        setAssets(assets.map(a => (a.id === id ? data : a)));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Varlık güncellenemedi.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const deleteAsset = async (id: string) => {
    if (isDemo) {
      const updated = assets.filter(a => a.id !== id);
      localStorage.setItem('moneymate_demo_assets', JSON.stringify(updated));
      setAssets(updated);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('assets').delete().eq('id', id);
        if (error) throw error;
        setAssets(assets.filter(a => a.id !== id));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Varlık silinemedi.' };
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
      localStorage.removeItem('moneymate_demo_recurring');
      localStorage.removeItem('moneymate_demo_goals');
      localStorage.removeItem('moneymate_demo_debts');
      localStorage.removeItem('moneymate_demo_subscriptions');
      localStorage.removeItem('moneymate_demo_assets');
      localStorage.removeItem('moneymate_demo_perspective_role');
      localStorage.removeItem('moneymate_demo_member_roles');
      
      // Reload demo data defaults
      const demoTxs = generateDemoTransactions(user.id);
      const demoBudgets = generateDemoBudgets(user.id);
      const demoRts = generateDemoRecurringTransactions(user.id);
      const demoGoals = generateDemoGoals(user.id);
      const demoDebts = generateDemoDebts(user.id);
      const demoSubs = generateDemoSubscriptions(user.id);
      const demoAssets = generateDemoAssets(user.id);
      localStorage.setItem('moneymate_demo_transactions', JSON.stringify(demoTxs));
      localStorage.setItem('moneymate_demo_budgets', JSON.stringify(demoBudgets));
      localStorage.setItem('moneymate_demo_categories', JSON.stringify(DEFAULT_CATEGORIES));
      localStorage.setItem('moneymate_demo_recurring', JSON.stringify(demoRts));
      localStorage.setItem('moneymate_demo_goals', JSON.stringify(demoGoals));
      localStorage.setItem('moneymate_demo_debts', JSON.stringify(demoDebts));
      localStorage.setItem('moneymate_demo_subscriptions', JSON.stringify(demoSubs));
      localStorage.setItem('moneymate_demo_assets', JSON.stringify(demoAssets));
      
      setTransactions(demoTxs);
      setBudgets(demoBudgets);
      setCategories(DEFAULT_CATEGORIES);
      setRecurringTransactions(demoRts);
      setGoals(demoGoals);
      setDebts(demoDebts);
      setSubscriptions(demoSubs);
      setAssets(demoAssets);
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
        // Delete all assets
        await supabase.from('assets').delete().eq('user_id', user.id);
        // Delete custom categories
        await supabase.from('categories').delete().eq('user_id', user.id);
        
        // Refetch empty states
        setTransactions([]);
        setBudgets([]);
        setRecurringTransactions([]);
        setGoals([]);
        setDebts([]);
        setSubscriptions([]);
        setAssets([]);
        
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

  const importBackupData = async (backupJson: any): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Oturum açılmadı.' };
    
    // Basic structural validation
    if (!backupJson || typeof backupJson !== 'object') {
      return { success: false, error: 'Geçersiz yedek dosyası formatı.' };
    }
    
    const data = backupJson.data;
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Yedek dosyası veri (data) bloğu içermiyor.' };
    }

    // Default arrays if missing
    const importedTxs = Array.isArray(data.transactions) ? data.transactions : [];
    const importedCats = Array.isArray(data.categories) ? data.categories : [];
    const importedBudgets = Array.isArray(data.budgets) ? data.budgets : [];
    const importedRts = Array.isArray(data.recurringTransactions) ? data.recurringTransactions : [];
    const importedGoals = Array.isArray(data.goals) ? data.goals : [];
    const importedDebts = Array.isArray(data.debts) ? data.debts : [];
    const importedSubs = Array.isArray(data.subscriptions) ? data.subscriptions : [];
    const importedAssets = Array.isArray(data.assets) ? data.assets : [];

    // Map user_id for all imported items
    const cleanTxs = importedTxs.map((t: any) => ({ ...t, user_id: user.id }));
    const cleanCats = importedCats.map((c: any) => ({
      ...c,
      user_id: c.is_default ? null : user.id
    }));
    const cleanBudgets = importedBudgets.map((b: any) => ({ ...b, user_id: user.id }));
    const cleanRts = importedRts.map((r: any) => ({ ...r, user_id: user.id }));
    const cleanGoals = importedGoals.map((g: any) => ({ ...g, user_id: user.id }));
    const cleanDebts = importedDebts.map((d: any) => ({ ...d, user_id: user.id }));
    const cleanSubs = importedSubs.map((s: any) => ({ ...s, user_id: user.id }));
    const cleanAssets = importedAssets.map((a: any) => ({ ...a, user_id: user.id }));

    if (isDemo) {
      // 1. Save to LocalStorage
      localStorage.setItem('moneymate_demo_transactions', JSON.stringify(cleanTxs));
      localStorage.setItem('moneymate_demo_categories', JSON.stringify(cleanCats.length > 0 ? cleanCats : DEFAULT_CATEGORIES));
      localStorage.setItem('moneymate_demo_budgets', JSON.stringify(cleanBudgets));
      localStorage.setItem('moneymate_demo_recurring', JSON.stringify(cleanRts));
      localStorage.setItem('moneymate_demo_goals', JSON.stringify(cleanGoals));
      localStorage.setItem('moneymate_demo_debts', JSON.stringify(cleanDebts));
      localStorage.setItem('moneymate_demo_subscriptions', JSON.stringify(cleanSubs));
      localStorage.setItem('moneymate_demo_assets', JSON.stringify(cleanAssets));

      // 2. Set Context States
      setTransactions(cleanTxs);
      setCategories(cleanCats.length > 0 ? cleanCats : DEFAULT_CATEGORIES);
      setBudgets(cleanBudgets);
      setRecurringTransactions(cleanRts);
      setGoals(cleanGoals);
      setDebts(cleanDebts);
      setSubscriptions(cleanSubs);
      setAssets(cleanAssets);

      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // Step 1: Wipe existing records
        await supabase.from('transactions').delete().eq('user_id', user.id);
        await supabase.from('budgets').delete().eq('user_id', user.id);
        await supabase.from('recurring_transactions').delete().eq('user_id', user.id);
        await supabase.from('goals').delete().eq('user_id', user.id);
        await supabase.from('debts').delete().eq('user_id', user.id);
        await supabase.from('subscriptions').delete().eq('user_id', user.id);
        await supabase.from('assets').delete().eq('user_id', user.id);
        // Wipe custom categories only
        await supabase.from('categories').delete().eq('user_id', user.id);

        // Step 2: Bulk Insert Custom Categories first
        const customCatsToInsert = cleanCats.filter((c: any) => !c.is_default);
        if (customCatsToInsert.length > 0) {
          const { error: catErr } = await supabase.from('categories').insert(customCatsToInsert);
          if (catErr) throw catErr;
        }

        // Step 3: Insert other tables in parallel
        const insertPromises = [];
        
        if (cleanTxs.length > 0) {
          insertPromises.push(supabase.from('transactions').insert(cleanTxs));
        }
        if (cleanBudgets.length > 0) {
          insertPromises.push(supabase.from('budgets').insert(cleanBudgets));
        }
        if (cleanRts.length > 0) {
          insertPromises.push(supabase.from('recurring_transactions').insert(cleanRts));
        }
        if (cleanGoals.length > 0) {
          insertPromises.push(supabase.from('goals').insert(cleanGoals));
        }
        if (cleanDebts.length > 0) {
          insertPromises.push(supabase.from('debts').insert(cleanDebts));
        }
        if (cleanSubs.length > 0) {
          insertPromises.push(supabase.from('subscriptions').insert(cleanSubs));
        }
        if (cleanAssets.length > 0) {
          insertPromises.push(supabase.from('assets').insert(cleanAssets));
        }

        const results = await Promise.all(insertPromises);
        const firstError = results.find(r => r.error);
        if (firstError) {
          throw firstError.error;
        }

        // Refetch to sync context state
        await fetchData(true);
        return { success: true };
      } catch (e: any) {
        console.error("Error restoring Supabase backup", e);
        return { success: false, error: e.message || 'Bulut verisi geri yüklenirken bir hata oluştu.' };
      }
    }

    return { success: false, error: 'Geri yükleme işlemi başarısız oldu.' };
  };

  // Perspective role for demo mode testing
  const [demoPerspectiveRole, setDemoPerspectiveRole] = useState<'admin' | 'contributor' | 'viewer'>(() => {
    const stored = localStorage.getItem('moneymate_demo_perspective_role');
    return (stored as 'admin' | 'contributor' | 'viewer') || 'admin';
  });

  const currentUserRole = React.useMemo(() => {
    if (!activeWorkspace) return 'admin';
    if (isDemo) {
      return demoPerspectiveRole;
    }
    const currentMe = workspaceMembers.find(m => m.id === user?.id);
    const role = currentMe?.role;
    return (role === 'contributor' || role === 'viewer') ? role : 'admin';
  }, [activeWorkspace, isDemo, demoPerspectiveRole, workspaceMembers, user?.id]);

  const updateMemberRole = async (memberId: string, role: 'admin' | 'contributor' | 'viewer') => {
    if (!activeWorkspace) return { success: false, error: 'Aktif çalışma alanı yok.' };

    if (isDemo) {
      if (memberId === user?.id) {
        setDemoPerspectiveRole(role);
        localStorage.setItem('moneymate_demo_perspective_role', role);
        setWorkspaceMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
        return { success: true };
      } else {
        const storedRoles = localStorage.getItem('moneymate_demo_member_roles');
        const rolesMap = storedRoles ? JSON.parse(storedRoles) : {};
        rolesMap[memberId] = role;
        localStorage.setItem('moneymate_demo_member_roles', JSON.stringify(rolesMap));
        setWorkspaceMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
        return { success: true };
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        if (memberId === user?.id) {
          return { success: false, error: 'Kendi yetkinizi değiştiremezsiniz.' };
        }
        
        const currentMe = workspaceMembers.find(m => m.id === user?.id);
        if (currentMe?.role !== 'admin') {
          return { success: false, error: 'Yalnızca yöneticiler rol değiştirebilir.' };
        }

        let dbRole: 'owner' | 'member' = 'member';
        if (role === 'admin') {
          dbRole = 'owner';
        }

        const { error } = await supabase
          .from('workspace_members')
          .update({ role: dbRole })
          .eq('workspace_id', activeWorkspace.id)
          .eq('user_id', memberId);

        if (error) throw error;

        const storedViewerOverrides = localStorage.getItem(`moneymate_viewer_overrides_${activeWorkspace.id}`);
        const overrides = storedViewerOverrides ? JSON.parse(storedViewerOverrides) : {};
        
        if (role === 'viewer') {
          overrides[memberId] = 'viewer';
        } else {
          delete overrides[memberId];
        }
        localStorage.setItem(`moneymate_viewer_overrides_${activeWorkspace.id}`, JSON.stringify(overrides));

        await fetchData(true);
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message || 'Rol güncellenirken hata oluştu.' };
      }
    }

    return { success: false, error: 'Sunucu hatası.' };
  };

  const setActiveWorkspace = async (workspaceId: string | null) => {
    const { success, error } = await updateProfile({ active_workspace_id: workspaceId });
    if (!success) {
      console.error("Error setting active workspace:", error);
    }
  };

  const createWorkspace = async (name: string) => {
    if (!user) return { success: false, error: 'Oturum açılmadı.' };

    if (isDemo) {
      const newWorkspace: Workspace = {
        id: `demo-workspace-${Date.now()}`,
        name,
        invite_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
        created_by: user.id,
        created_at: new Date().toISOString()
      };
      
      const storedWorkspaces = localStorage.getItem('moneymate_demo_workspaces');
      const list = storedWorkspaces ? JSON.parse(storedWorkspaces) : [];
      list.push(newWorkspace);
      localStorage.setItem('moneymate_demo_workspaces', JSON.stringify(list));
      
      setWorkspaces(list);
      await setActiveWorkspace(newWorkspace.id);
      return { success: true, workspace: newWorkspace };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: ws, error: wsErr } = await supabase
          .from('workspaces')
          .insert({ name, created_by: user.id })
          .select()
          .single();

        if (wsErr) throw wsErr;

        const { error: memberErr } = await supabase
          .from('workspace_members')
          .insert({ workspace_id: ws.id, user_id: user.id, role: 'owner' });

        if (memberErr) throw memberErr;

        await setActiveWorkspace(ws.id);
        return { success: true, workspace: ws };
      } catch (e: any) {
        return { success: false, error: e.message || 'Ortak bütçe oluşturulamadı.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const joinWorkspace = async (inviteCode: string) => {
    if (!user) return { success: false, error: 'Oturum açılmadı.' };

    const formattedCode = inviteCode.trim().toUpperCase();

    if (isDemo) {
      const storedWorkspaces = localStorage.getItem('moneymate_demo_workspaces');
      const list: Workspace[] = storedWorkspaces ? JSON.parse(storedWorkspaces) : [];
      
      let ws = list.find(w => w.invite_code === formattedCode);
      if (!ws) {
        ws = {
          id: `demo-workspace-${Date.now()}`,
          name: 'Katılınan Bütçe 🏡',
          invite_code: formattedCode,
          created_by: 'another-user',
          created_at: new Date().toISOString()
        };
        list.push(ws);
        localStorage.setItem('moneymate_demo_workspaces', JSON.stringify(list));
        setWorkspaces(list);
      }

      await setActiveWorkspace(ws.id);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: ws, error: wsErr } = await supabase
          .from('workspaces')
          .select('*')
          .eq('invite_code', formattedCode)
          .single();

        if (wsErr || !ws) throw new Error('Geçersiz davet kodu.');

        const { error: memberErr } = await supabase
          .from('workspace_members')
          .insert({ workspace_id: ws.id, user_id: user.id, role: 'member' });

        if (memberErr && !memberErr.message.includes('duplicate key')) {
          throw memberErr;
        }

        await setActiveWorkspace(ws.id);
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message || 'Bütçeye katılırken hata oluştu.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
  };

  const leaveWorkspace = async (workspaceId: string) => {
    if (!user) return { success: false, error: 'Oturum açılmadı.' };

    if (isDemo) {
      const storedWorkspaces = localStorage.getItem('moneymate_demo_workspaces');
      let list: Workspace[] = storedWorkspaces ? JSON.parse(storedWorkspaces) : [];
      list = list.filter(w => w.id !== workspaceId);
      localStorage.setItem('moneymate_demo_workspaces', JSON.stringify(list));
      setWorkspaces(list);

      if (user.active_workspace_id === workspaceId) {
        await setActiveWorkspace(null);
      }
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('workspace_members')
          .delete()
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id);

        if (error) throw error;

        if (user.active_workspace_id === workspaceId) {
          await setActiveWorkspace(null);
        }
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message || 'Bütçeden ayrılırken hata oluştu.' };
      }
    }
    return { success: false, error: 'Sunucu hatası.' };
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
        workspaces,
        activeWorkspace,
        workspaceMembers,
        currentUserRole,
        updateMemberRole,
        createWorkspace,
        joinWorkspace,
        leaveWorkspace,
        setActiveWorkspace,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        addOrUpdateBudget,
        deleteBudget,
        copyBudgets,
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
        assets,
        addAsset,
        updateAsset,
        deleteAsset,
        resetAllData,
        importBackupData,
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
