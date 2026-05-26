import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';

export interface BankAccount {
  id: string;
  name: string;
  number: string;
  balance: number;
  currency: string;
  type: 'checking' | 'savings' | 'credit';
}

export interface ConnectedBank {
  id: string;
  bankName: string;
  logo: string;
  color: string;
  status: 'synced' | 'syncing' | 'error';
  lastSyncedAt: string;
  accounts: BankAccount[];
}

export interface BankTemplate {
  id: string;
  bankName: string;
  logo: string;
  color: string;
  market: 'TR' | 'GLOBAL';
  accounts: Omit<BankAccount, 'id'>[];
}

export interface BankingToast {
  id: string;
  bankName: string;
  amount: number;
  currency: string;
  description: string;
  categoryName: string;
  type: 'income' | 'expense';
}

interface OpenBankingContextType {
  connectedBanks: ConnectedBank[];
  bankTemplates: BankTemplate[];
  isSyncingAll: boolean;
  autoSyncEnabled: boolean;
  bankingToast: BankingToast | null;
  connectBank: (bankId: string) => Promise<{ success: boolean; error?: string }>;
  disconnectBank: (bankId: string) => Promise<{ success: boolean }>;
  syncBankNow: (bankId: string) => Promise<{ success: boolean }>;
  syncAllBanks: () => Promise<void>;
  toggleAutoSync: () => void;
  clearToast: () => void;
}

const OpenBankingContext = createContext<OpenBankingContextType | undefined>(undefined);

// Bank templates based on TR and GLOBAL markets
const BANK_TEMPLATES: BankTemplate[] = [
  {
    id: 'garanti',
    bankName: 'Garanti BBVA',
    logo: '🍀',
    color: '#00853F',
    market: 'TR',
    accounts: [
      { name: 'Vadesiz TL Hesabı', number: 'TR** **** 4529', balance: 45250, currency: 'TRY', type: 'checking' },
      { name: 'Bonus Kredi Kartı', number: 'MC **** 8820', balance: -12400, currency: 'TRY', type: 'credit' }
    ]
  },
  {
    id: 'akbank',
    bankName: 'Akbank',
    logo: '🔴',
    color: '#E30613',
    market: 'TR',
    accounts: [
      { name: 'Akbank Direkt Vadesiz', number: 'TR** **** 1907', balance: 18700, currency: 'TRY', type: 'checking' },
      { name: 'Nar Vadeli Mevduat', number: 'TR** **** 9912', balance: 150000, currency: 'TRY', type: 'savings' }
    ]
  },
  {
    id: 'isbank',
    bankName: 'İş Bankası',
    logo: '🔵',
    color: '#004F9F',
    market: 'TR',
    accounts: [
      { name: 'Vadesiz TL - Maaş', number: 'TR** **** 1923', balance: 62300, currency: 'TRY', type: 'checking' }
    ]
  },
  {
    id: 'yapi_kredi',
    bankName: 'Yapı Kredi',
    logo: '🟡',
    color: '#002C6C',
    market: 'TR',
    accounts: [
      { name: 'Vadesiz TL Hesabı', number: 'TR** **** 9988', balance: 34150, currency: 'TRY', type: 'checking' },
      { name: 'World Kredi Kartı', number: 'VI **** 1144', balance: -8900, currency: 'TRY', type: 'credit' }
    ]
  },
  {
    id: 'chase',
    bankName: 'Chase Bank',
    logo: '🔷',
    color: '#117ACA',
    market: 'GLOBAL',
    accounts: [
      { name: 'Total Checking', number: 'CH **** 4492', balance: 5400, currency: 'USD', type: 'checking' },
      { name: 'Sapphire Preferred', number: 'VI **** 8829', balance: -1850, currency: 'USD', type: 'credit' }
    ]
  },
  {
    id: 'boa',
    bankName: 'Bank of America',
    logo: '🇺🇸',
    color: '#E01E26',
    market: 'GLOBAL',
    accounts: [
      { name: 'Advantage Checking', number: 'BA **** 2108', balance: 3200, currency: 'USD', type: 'checking' },
      { name: 'Premium Savings', number: 'BA **** 7731', balance: 25000, currency: 'USD', type: 'savings' }
    ]
  },
  {
    id: 'hsbc',
    bankName: 'HSBC Bank',
    logo: '🔴',
    color: '#DB0011',
    market: 'GLOBAL',
    accounts: [
      { name: 'HSBC Advance Checking', number: 'HS **** 9820', balance: 4100, currency: 'GBP', type: 'checking' }
    ]
  },
  {
    id: 'barclays',
    bankName: 'Barclays',
    logo: '🦅',
    color: '#00AEEF',
    market: 'GLOBAL',
    accounts: [
      { name: 'Everyday Checking', number: 'BC **** 6620', balance: 2900, currency: 'GBP', type: 'checking' }
    ]
  }
];

// Predefined mock transaction pools for simulations
interface MockTxTemplate {
  description: string;
  amountRange: [number, number];
  category_id: string;
  categoryName: string;
  type: 'income' | 'expense';
  keywords: string[];
}

const TR_MOCK_TXS: MockTxTemplate[] = [
  { description: 'MİGROS TİC. A.Ş.', amountRange: [120, 680], category_id: 'cat-expense-market', categoryName: 'Market', type: 'expense', keywords: ['market', 'gıda', 'süpermarket'] },
  { description: 'NETFLIX MEMBERSHIP', amountRange: [229.99, 229.99], category_id: 'cat-expense-abonelik', categoryName: 'Abonelik', type: 'expense', keywords: ['netflix', 'film', 'dizi'] },
  { description: 'SHELL PETROL A.Ş.', amountRange: [500, 1500], category_id: 'cat-expense-ulasim', categoryName: 'Ulaşım', type: 'expense', keywords: ['shell', 'petrol', 'benzin', 'yakıt'] },
  { description: 'STARBUCKS COFFEE', amountRange: [75, 220], category_id: 'cat-expense-yemek', categoryName: 'Yemek', type: 'expense', keywords: ['starbucks', 'kahve', 'cafe'] },
  { description: 'TRENDYOL.COM TİCARET', amountRange: [250, 1800], category_id: 'cat-expense-diger', categoryName: 'Diğer Gider', type: 'expense', keywords: ['trendyol', 'giyim', 'alışveriş'] },
  { description: 'GETİR YEMEK SİPARİŞ', amountRange: [150, 480], category_id: 'cat-expense-yemek', categoryName: 'Yemek', type: 'expense', keywords: ['getir', 'yemek', 'sipariş'] },
  { description: 'SPOTIFY SWEDEN', amountRange: [59.99, 59.99], category_id: 'cat-expense-abonelik', categoryName: 'Abonelik', type: 'expense', keywords: ['spotify', 'müzik'] },
  { description: 'YATIRIM FONU KÂR PAYI', amountRange: [1500, 4500], category_id: 'cat-income-yatirim', categoryName: 'Yatırım', type: 'income', keywords: ['yatırım', 'kâr', 'fon'] },
  { description: 'ŞİRKET YOL HARCIRAHI', amountRange: [2500, 6000], category_id: 'cat-income-diger', categoryName: 'Diğer Gelir', type: 'income', keywords: ['harcırah', 'yol', 'şirket'] }
];

const GLOBAL_MOCK_TXS: MockTxTemplate[] = [
  { description: 'WHOLE FOODS MARKET', amountRange: [35, 185], category_id: 'cat-expense-market', categoryName: 'Market', type: 'expense', keywords: ['grocery', 'food', 'supermarket'] },
  { description: 'NETFLIX.COM PREMIUM', amountRange: [15.49, 15.49], category_id: 'cat-expense-abonelik', categoryName: 'Abonelik', type: 'expense', keywords: ['netflix', 'streaming'] },
  { description: 'EXXONMOBIL FUEL', amountRange: [30, 80], category_id: 'cat-expense-ulasim', categoryName: 'Ulaşım', type: 'expense', keywords: ['gas', 'fuel', 'exxon'] },
  { description: 'STARBUCKS STORE', amountRange: [6, 22], category_id: 'cat-expense-yemek', categoryName: 'Yemek', type: 'expense', keywords: ['coffee', 'starbucks', 'cafe'] },
  { description: 'AMAZON.COM ORDER', amountRange: [20, 320], category_id: 'cat-expense-diger', categoryName: 'Diğer Gider', type: 'expense', keywords: ['amazon', 'shopping'] },
  { description: 'UBER TRIP RIDE', amountRange: [12, 48], category_id: 'cat-expense-ulasim', categoryName: 'Ulaşım', type: 'expense', keywords: ['uber', 'ride', 'taxi'] },
  { description: 'SPOTIFY PREMIUM', amountRange: [10.99, 10.99], category_id: 'cat-expense-abonelik', categoryName: 'Abonelik', type: 'expense', keywords: ['spotify', 'music'] },
  { description: 'PAYROLL DIRECT DEPOSIT', amountRange: [2500, 2500], category_id: 'cat-income-maas', categoryName: 'Maaş', type: 'income', keywords: ['payroll', 'salary', 'salary deposit'] },
  { description: 'DIVIDEND CREDIT PAYMENT', amountRange: [150, 450], category_id: 'cat-income-yatirim', categoryName: 'Yatırım', type: 'income', keywords: ['dividend', 'investment'] }
];

export const OpenBankingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addTransaction, addAsset, updateAsset, deleteAsset, assets, activeWorkspace } = useData();

  const [connectedBanks, setConnectedBanks] = useState<ConnectedBank[]>([]);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return localStorage.getItem('moneymate_banking_autosync') === 'true';
  });
  const [bankingToast, setBankingToast] = useState<BankingToast | null>(null);

  const autoSyncTimerRef = useRef<any>(null);

  // Load connected banks from localStorage on mount/user change
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`moneymate_connected_banks_${user.id}`);
      if (stored) {
        setConnectedBanks(JSON.parse(stored));
      } else {
        setConnectedBanks([]);
      }
    }
  }, [user?.id]);

  // Save connected banks to localStorage on change
  const saveBanksState = (newBanks: ConnectedBank[]) => {
    if (user?.id) {
      localStorage.setItem(`moneymate_connected_banks_${user.id}`, JSON.stringify(newBanks));
      setConnectedBanks(newBanks);
    }
  };

  // Connects a bank (OAuth simulation)
  const connectBank = async (bankId: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const template = BANK_TEMPLATES.find(b => b.id === bankId);
        if (!template) {
          resolve({ success: false, error: 'Banka şablonu bulunamadı.' });
          return;
        }

        const isAlreadyConnected = connectedBanks.some(b => b.id === bankId);
        if (isAlreadyConnected) {
          resolve({ success: false, error: 'Bu banka hesabı zaten bağlı.' });
          return;
        }

        // Initialize bank connection with accounts
        const newBankConnection: ConnectedBank = {
          id: bankId,
          bankName: template.bankName,
          logo: template.logo,
          color: template.color,
          status: 'synced',
          lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          accounts: template.accounts.map((acc, index) => ({
            ...acc,
            id: `bank-acc-${bankId}-${index}-${Math.random().toString(36).substr(2, 5)}`
          }))
        };

        const updatedBanks = [...connectedBanks, newBankConnection];
        saveBanksState(updatedBanks);

        // --- DEEP INTEGRATION: Add bank accounts to Net Worth Assets ---
        for (const account of newBankConnection.accounts) {
          const workspaceId = activeWorkspace ? activeWorkspace.id : null;
          await addAsset({
            name: `${template.bankName} - ${account.name}`,
            type: 'cash',
            value: account.balance,
            quantity: 1,
            purchase_price: account.balance,
            workspace_id: workspaceId
          });
        }

        resolve({ success: true });
      }, 2000); // 2 second delay to simulate bank secure redirection
    });
  };

  // Disconnects a bank and deletes associated Net Worth assets
  const disconnectBank = async (bankId: string): Promise<{ success: boolean }> => {
    const bank = connectedBanks.find(b => b.id === bankId);
    if (!bank) return { success: false };

    // --- DEEP INTEGRATION: Remove accounts from Net Worth Assets ---
    for (const account of bank.accounts) {
      const assetName = `${bank.bankName} - ${account.name}`;
      const matchingAsset = assets.find(a => a.name === assetName);
      if (matchingAsset) {
        await deleteAsset(matchingAsset.id);
      }
    }

    const updatedBanks = connectedBanks.filter(b => b.id !== bankId);
    saveBanksState(updatedBanks);
    return { success: true };
  };

  // Triggers mock transaction synchronization for a bank
  const syncBankNow = async (bankId: string): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
      // Set bank status to 'syncing'
      const banksSyncing = connectedBanks.map(b => b.id === bankId ? { ...b, status: 'syncing' as const } : b);
      setConnectedBanks(banksSyncing);

      setTimeout(async () => {
        const currentBank = connectedBanks.find(b => b.id === bankId);
        if (!currentBank) {
          resolve({ success: false });
          return;
        }

        // Pick mock transaction templates depending on market (GLOBAL vs TR)
        const template = BANK_TEMPLATES.find(b => b.id === bankId);
        const market = template?.market || 'TR';
        const txfPool = market === 'TR' ? TR_MOCK_TXS : GLOBAL_MOCK_TXS;
        
        // Pick a random mock transaction
        const randomTxTemplate = txfPool[Math.floor(Math.random() * txfPool.length)];
        
        // Generate random amount
        const [min, max] = randomTxTemplate.amountRange;
        const generatedAmount = Math.round((min + Math.random() * (max - min)) * 100) / 100;

        // Choose a valid sub-account of the bank (prefer Checking for expense, Savings/Credit accordingly)
        let selectedAccount = currentBank.accounts[0];
        if (randomTxTemplate.type === 'expense' && currentBank.accounts.length > 1) {
          // If we have a credit card account, direct some transactions to credit card
          const creditAcc = currentBank.accounts.find(a => a.type === 'credit');
          if (creditAcc && Math.random() > 0.4) {
            selectedAccount = creditAcc;
          }
        }

        // Calculate new balance
        let newBalance = selectedAccount.balance;
        if (randomTxTemplate.type === 'expense') {
          // Expense reduces cash balance or increases credit debt
          newBalance = selectedAccount.balance - generatedAmount;
        } else {
          newBalance = selectedAccount.balance + generatedAmount;
        }

        // Update database/localStorage transactions
        const workspaceId = activeWorkspace ? activeWorkspace.id : null;
        
        const txPayload = {
          amount: generatedAmount,
          type: randomTxTemplate.type,
          category_id: randomTxTemplate.category_id,
          description: `${randomTxTemplate.description} #banka #${bankId}`,
          payment_method: selectedAccount.type === 'credit' ? 'Kredi Kartı' : 'Banka Kartı',
          transaction_date: new Date().toISOString().split('T')[0],
          workspace_id: workspaceId
        };

        const txResult = await addTransaction(txPayload);

        if (txResult.success) {
          // --- DEEP INTEGRATION: Update Net Worth Assets and balances ---
          const assetName = `${currentBank.bankName} - ${selectedAccount.name}`;
          const matchingAsset = assets.find(a => a.name === assetName);
          
          if (matchingAsset) {
            await updateAsset(matchingAsset.id, {
              value: newBalance,
              purchase_price: newBalance
            });
          }

          // Update Connected Bank details and balances
          const updatedBanks = connectedBanks.map(b => {
            if (b.id === bankId) {
              const updatedAccounts = b.accounts.map(acc => 
                acc.id === selectedAccount.id ? { ...acc, balance: Math.round(newBalance * 100) / 100 } : acc
              );
              return {
                ...b,
                status: 'synced' as const,
                lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                accounts: updatedAccounts
              };
            }
            return b;
          });
          
          saveBanksState(updatedBanks);

          // Trigger screen toast
          const newToast: BankingToast = {
            id: `toast-${Date.now()}`,
            bankName: currentBank.bankName,
            amount: generatedAmount,
            currency: selectedAccount.currency,
            description: randomTxTemplate.description,
            categoryName: randomTxTemplate.categoryName,
            type: randomTxTemplate.type
          };
          setBankingToast(newToast);

          // Append toast notification to local notifications key
          const notificationId = `bank-sync-notif-${Date.now()}`;
          const storedNotifs = localStorage.getItem(`moneymate_bank_notifications_${user?.id || 'demo'}`);
          const notifsList = storedNotifs ? JSON.parse(storedNotifs) : [];
          
          const isEn = user?.lang === 'en';
          const symbol = selectedAccount.currency === 'TRY' ? '₺' : selectedAccount.currency === 'USD' ? '$' : '€';
          
          const messageText = isEn
            ? `New banking transaction synced from ${currentBank.bankName} (${selectedAccount.name}): ${generatedAmount} ${symbol} spent at "${randomTxTemplate.description}". Automated Category: "${randomTxTemplate.categoryName}".`
            : `${currentBank.bankName} (${selectedAccount.name}) hesabınızdan yeni işlem çekildi: "${randomTxTemplate.description}" noktasında ${generatedAmount} ${symbol} harcandı. Otomatik Kategori: "${randomTxTemplate.categoryName}".`;

          const newNotifItem = {
            id: notificationId,
            bankName: currentBank.bankName,
            title: isEn ? 'Automated Banking Sync' : '🏦 Otomatik Banka Senkronizasyonu',
            message: messageText,
            date: new Date().toISOString().split('T')[0],
            isImportant: false
          };

          localStorage.setItem(
            `moneymate_bank_notifications_${user?.id || 'demo'}`,
            JSON.stringify([newNotifItem, ...notifsList].slice(0, 30))
          );
        } else {
          // On failure, return bank to synced with no modifications
          const updatedBanks = connectedBanks.map(b => b.id === bankId ? { ...b, status: 'synced' as const } : b);
          setConnectedBanks(updatedBanks);
        }

        resolve({ success: true });
      }, 1500); // 1.5 seconds mock syncing delay
    });
  };

  // Syncs all banks at once
  const syncAllBanks = async () => {
    if (connectedBanks.length === 0) return;
    setIsSyncingAll(true);
    for (const bank of connectedBanks) {
      await syncBankNow(bank.id);
    }
    setIsSyncingAll(false);
  };

  // Toggles the auto sync simulation engine
  const toggleAutoSync = () => {
    const newValue = !autoSyncEnabled;
    setAutoSyncEnabled(newValue);
    localStorage.setItem('moneymate_banking_autosync', String(newValue));
  };

  const clearToast = () => setBankingToast(null);

  // Setup the auto sync simulation interval
  useEffect(() => {
    if (autoSyncEnabled && connectedBanks.length > 0) {
      autoSyncTimerRef.current = setInterval(() => {
        // Sync a random connected bank
        const randomBank = connectedBanks[Math.floor(Math.random() * connectedBanks.length)];
        if (randomBank && randomBank.status !== 'syncing') {
          syncBankNow(randomBank.id);
        }
      }, 40000); // Runs simulation every 40 seconds
    } else {
      if (autoSyncTimerRef.current) {
        clearInterval(autoSyncTimerRef.current);
        autoSyncTimerRef.current = null;
      }
    }

    return () => {
      if (autoSyncTimerRef.current) {
        clearInterval(autoSyncTimerRef.current);
      }
    };
  }, [autoSyncEnabled, connectedBanks]);

  const bankTemplates = BANK_TEMPLATES;

  return (
    <OpenBankingContext.Provider
      value={{
        connectedBanks,
        bankTemplates,
        isSyncingAll,
        autoSyncEnabled,
        bankingToast,
        connectBank,
        disconnectBank,
        syncBankNow,
        syncAllBanks,
        toggleAutoSync,
        clearToast
      }}
    >
      {children}
      
      {/* Visual Toast Notification Overlay */}
      {bankingToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm w-full">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-brand-500/30 dark:border-brand-500/20 shadow-2xl rounded-2xl p-4.5 flex items-start space-x-3.5 ring-1 ring-brand-500/10">
            <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl font-bold flex items-center justify-center shrink-0">
              🏦
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
                <span>{bankingToast.bankName} İşlemi Çekildi</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1.5 leading-none">
                {bankingToast.categoryName} • Otomatik
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate mt-1">
                {bankingToast.description}
              </p>
              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 leading-none">
                <span className="text-[9px] font-bold text-slate-400">Yeni İşlem</span>
                <span className={`text-sm font-black ${bankingToast.type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>
                  {bankingToast.type === 'expense' ? '-' : '+'}
                  {bankingToast.amount} {bankingToast.currency === 'TRY' ? '₺' : bankingToast.currency === 'USD' ? '$' : '€'}
                </span>
              </div>
            </div>
            <button 
              onClick={clearToast}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </OpenBankingContext.Provider>
  );
};

export const useOpenBanking = () => {
  const context = useContext(OpenBankingContext);
  if (context === undefined) {
    throw new Error('useOpenBanking must be used within an OpenBankingProvider');
  }
  return context;
};
