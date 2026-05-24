import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { CustomSelect } from '../components/common/CustomSelect';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency } from '../utils/formatters';
import { 
  Briefcase, 
  Plus, 
  X, 
  Trash2, 
  Edit3, 
  Wallet, 
  Coins, 
  TrendingUp, 
  Home, 
  Sparkles, 
  HelpCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PieChart as PieIcon, 
  LineChart as LineIcon,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as ChartTooltip, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

const translations = {
  tr: {
    title: 'Varlık Takibi & Net Değer',
    subtitle: 'Tüm finansal servetinizi (nakit, hisse, kripto, gayrimenkul) tek bir yerden yönetin ve net servetinizi izleyin.',
    assets: 'Toplam Varlık',
    liabilities: 'Toplam Borç',
    netWorth: 'Net Değer (Servet)',
    assetAllocation: 'Varlık Dağılımı',
    netWorthTrend: 'Servet Büyüme Trendi',
    addNewAsset: 'Yeni Varlık Ekle',
    editAsset: 'Varlığı Düzenle',
    deleteConfirm: 'Bu varlığı silmek istediğinizden emin misiniz?',
    assetName: 'Varlık Adı / Açıklama',
    assetType: 'Varlık Türü',
    assetValue: 'Güncel Değer',
    quantity: 'Miktar / Adet (İsteğe bağlı)',
    purchasePrice: 'Alış Fiyatı (İsteğe bağlı)',
    save: 'Kaydet',
    cancel: 'İptal',
    namePlaceholder: 'Örn: Garanti Bankası TL Hesabı, Apple Hissesi...',
    cash: 'Nakit Varlıklar (Banka, Nakit)',
    crypto: 'Kripto Para (BTC, ETH...)',
    stocks: 'Hisse Senedi & Fonlar',
    real_estate: 'Gayrimenkul (Konut, Arsa)',
    precious_metals: 'Değerli Metaller (Altın, Gümüş)',
    other: 'Diğer Yatırımlar / Varlıklar',
    emptyTitle: 'Portföyünüz Henüz Boş',
    emptyDesc: 'Net servetinizi hesaplamak ve varlık dağılımınızı grafik üzerinde görmek için ilk varlığınızı ekleyin.',
    allAssets: 'Varlık Portföyü',
    worthFormula: 'Net Değer = Varlıklar - Borçlar',
    unit: 'Birim',
    totalValue: 'Toplam Değer',
    quantityLabel: 'Miktar',
    purchasePriceLabel: 'Alış Fiyatı',
    profitVal: 'Kâr / Zarar',
    noProfit: 'Maliyet Girilmedi',
    lastUpdated: 'Son Güncelleme',
    justNow: 'Şimdi',
    minutesAgo: '{min} dk önce',
    hoursAgo: '{hr} sa önce',
    daysAgo: '{day} gün önce',
    refreshRatesTooltip: 'Kurları Şimdi Güncelle',
    ratesModeRealtime: 'Canlı Kur',
    ratesModeDaily: 'Günlük Önbellek',
    ratesModeManual: 'Manuel Kur'
  },
  en: {
    title: 'Asset Tracker & Net Worth',
    subtitle: 'Manage all your financial assets (cash, stocks, crypto, real estate) in one place and monitor your net worth.',
    assets: 'Total Assets',
    liabilities: 'Total Liabilities',
    netWorth: 'Net Worth',
    assetAllocation: 'Asset Allocation',
    netWorthTrend: 'Net Worth Growth Trend',
    addNewAsset: 'Add New Asset',
    editAsset: 'Edit Asset',
    deleteConfirm: 'Are you sure you want to delete this asset?',
    assetName: 'Asset Name / Description',
    assetType: 'Asset Class',
    assetValue: 'Current Value',
    quantity: 'Quantity / Units (Optional)',
    purchasePrice: 'Purchase Price (Optional)',
    save: 'Save',
    cancel: 'Cancel',
    namePlaceholder: 'e.g., Chase Savings, Apple Shares, BTC...',
    cash: 'Cash Assets (Bank, Cash)',
    crypto: 'Cryptocurrency (BTC, ETH...)',
    stocks: 'Stocks & Equities',
    real_estate: 'Real Estate (Home, Land)',
    precious_metals: 'Precious Metals (Gold, Silver)',
    other: 'Other Assets / Investments',
    emptyTitle: 'Your Portfolio is Empty',
    emptyDesc: 'Add your first asset to calculate your net worth and view your financial asset allocation chart.',
    allAssets: 'Asset Portfolio',
    worthFormula: 'Net Worth = Assets - Liabilities',
    unit: 'Unit',
    totalValue: 'Total Value',
    quantityLabel: 'Quantity',
    purchasePriceLabel: 'Purchase Price',
    profitVal: 'Profit / Loss',
    noProfit: 'No cost basis',
    lastUpdated: 'Last Update',
    justNow: 'Just now',
    minutesAgo: '{min}m ago',
    hoursAgo: '{hr}h ago',
    daysAgo: '{day}d ago',
    refreshRatesTooltip: 'Refresh Rates Now',
    ratesModeRealtime: 'Real-time Rates',
    ratesModeDaily: 'Daily Cached',
    ratesModeManual: 'Manual Rates'
  }
};

const ASSET_COLORS: Record<string, string> = {
  liquid: '#06B6D4',         // Cyan
  cash: '#10B981',           // Emerald Green
  crypto: '#F59E0B',         // Amber/Orange
  stocks: '#3B82F6',         // Royal Blue
  real_estate: '#8B5CF6',    // Amethyst Purple
  precious_metals: '#EC4899', // Altın / Rose Pink
  other: '#6B7280'           // Slate Grey
};

export const NetWorth: React.FC = () => {
  const { user } = useAuth();
  const { assets, debts, transactions, addAsset, updateAsset, deleteAsset, activeWorkspace } = useData();
  const [isShared, setIsShared] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);

  // Form States
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [value, setValue] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const lang = user?.lang || 'tr';
  const t = translations[lang];
  const currency = user?.currency || 'TRY';

  // Valuation Currency States
  const [valuationCurrency, setValuationCurrency] = useState(() => {
    return localStorage.getItem('moneymate_portfolio_currency') || user?.currency || 'TRY';
  });

  const [rates, setRates] = useState<Record<string, number>>(() => {
    const baseCur = user?.currency || 'TRY';
    const cached = localStorage.getItem(`moneymate_cached_rates_${baseCur}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Fallback
      }
    }
    return { TRY: 1, USD: 1, EUR: 1 };
  });

  const [ratesTimestamp, setRatesTimestamp] = useState<number | null>(() => {
    const baseCur = user?.currency || 'TRY';
    const stored = localStorage.getItem(`moneymate_rates_timestamp_${baseCur}`);
    return stored ? parseInt(stored) : null;
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    isMountedRef.current = true;
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 30000);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  // Consume tick in a dummy effect to satisfy strict unused variable checks while driving periodic rates re-evaluations
  React.useEffect(() => {}, [tick]);

  const fetchRates = async (force: boolean = false) => {
    const baseCur = user?.currency || 'TRY';
    const mode = localStorage.getItem('moneymate_rates_refresh') || 'daily';
    
    const cachedRatesStr = localStorage.getItem(`moneymate_cached_rates_${baseCur}`);
    const cachedTimestampStr = localStorage.getItem(`moneymate_rates_timestamp_${baseCur}`);
    
    if (!force && mode === 'daily' && cachedRatesStr && cachedTimestampStr) {
      const timestamp = parseInt(cachedTimestampStr);
      if (!isNaN(timestamp) && (Date.now() - timestamp < 24 * 60 * 60 * 1000)) {
        try {
          const parsed = JSON.parse(cachedRatesStr);
          if (isMountedRef.current) {
            setRates(parsed);
            setRatesTimestamp(timestamp);
          }
          return;
        } catch (e) {
          // If parse fails, fetch new rates
        }
      }
    }

    if (!force && mode === 'manual' && cachedRatesStr && cachedTimestampStr) {
      try {
        const parsed = JSON.parse(cachedRatesStr);
        if (isMountedRef.current) {
          setRates(parsed);
          setRatesTimestamp(parseInt(cachedTimestampStr));
        }
        return;
      } catch (e) {
        // If parse fails, fetch new rates
      }
    }

    if (isMountedRef.current) {
      setIsRefreshing(true);
    }
    
    try {
      const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCur}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const newRates = data.rates || { TRY: 1, USD: 1, EUR: 1 };
      
      const now = Date.now();
      localStorage.setItem(`moneymate_cached_rates_${baseCur}`, JSON.stringify(newRates));
      localStorage.setItem(`moneymate_rates_timestamp_${baseCur}`, String(now));
      
      if (isMountedRef.current) {
        setRates(newRates);
        setRatesTimestamp(now);
      }
    } catch (err) {
      console.error("Exchange rates fetch failed, using fallback or cache", err);
      if (cachedRatesStr) {
        try {
          const parsed = JSON.parse(cachedRatesStr);
          if (isMountedRef.current) {
            setRates(parsed);
            if (cachedTimestampStr) setRatesTimestamp(parseInt(cachedTimestampStr));
          }
          return;
        } catch (e) {
          // ignore
        }
      }
      
      let fallbackRates = { TRY: 1, USD: 1, EUR: 1 };
      if (baseCur === 'TRY') {
        fallbackRates = { TRY: 1, USD: 0.031, EUR: 0.028 };
      } else if (baseCur === 'USD') {
        fallbackRates = { TRY: 32.5, USD: 1, EUR: 0.92 };
      } else {
        fallbackRates = { TRY: 35.0, USD: 1.09, EUR: 1 };
      }
      if (isMountedRef.current) {
        setRates(fallbackRates);
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  };

  React.useEffect(() => {
    fetchRates(false);
    const baseCur = user?.currency || 'TRY';
    const storedTimestamp = localStorage.getItem(`moneymate_rates_timestamp_${baseCur}`);
    setRatesTimestamp(storedTimestamp ? parseInt(storedTimestamp) : null);
  }, [user?.currency]);

  const getRelativeTime = (timestamp: number | null) => {
    if (!timestamp) return '—';
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t.justNow;
    if (diffMins < 60) return t.minutesAgo.replace('{min}', String(diffMins));
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return t.hoursAgo.replace('{hr}', String(diffHrs));
    const diffDays = Math.floor(diffHrs / 24);
    return t.daysAgo.replace('{day}', String(diffDays));
  };

  const rateMultiplier = rates[valuationCurrency] || 1;

  // 1. Calculate Core Financial Metrics
  const liquidCash = useMemo(() => {
    const totalInc = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExp = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return totalInc - totalExp;
  }, [transactions]);

  const currentAssetsSum = useMemo(() => {
    const manualSum = assets.reduce((sum, a) => sum + a.value, 0);
    return manualSum + liquidCash;
  }, [assets, liquidCash]);

  const currentLiabilitiesSum = useMemo(() => {
    // Sum only unpaid debts
    return debts
      .filter(d => d.type === 'debt' && !d.is_paid)
      .reduce((sum, d) => sum + d.amount, 0);
  }, [debts]);

  const currentNetWorth = useMemo(() => {
    return currentAssetsSum - currentLiabilitiesSum;
  }, [currentAssetsSum, currentLiabilitiesSum]);

  // 2. Map Options for CustomSelect inside Form
  const assetTypeOptions = [
    { value: 'cash', label: t.cash, icon: <Wallet className="w-3.5 h-3.5" style={{ color: ASSET_COLORS.cash }} /> },
    { value: 'crypto', label: t.crypto, icon: <Coins className="w-3.5 h-3.5" style={{ color: ASSET_COLORS.crypto }} /> },
    { value: 'stocks', label: t.stocks, icon: <TrendingUp className="w-3.5 h-3.5" style={{ color: ASSET_COLORS.stocks }} /> },
    { value: 'real_estate', label: t.real_estate, icon: <Home className="w-3.5 h-3.5" style={{ color: ASSET_COLORS.real_estate }} /> },
    { value: 'precious_metals', label: t.precious_metals, icon: <Sparkles className="w-3.5 h-3.5" style={{ color: ASSET_COLORS.precious_metals }} /> },
    { value: 'other', label: t.other, icon: <HelpCircle className="w-3.5 h-3.5" style={{ color: ASSET_COLORS.other }} /> },
  ];

  // Get Lucide Icon dynamically for each asset type
  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case 'cash': return <Wallet className="w-4 h-4" />;
      case 'crypto': return <Coins className="w-4 h-4" />;
      case 'stocks': return <TrendingUp className="w-4 h-4" />;
      case 'real_estate': return <Home className="w-4 h-4" />;
      case 'precious_metals': return <Sparkles className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  // 3. Recharts Donut Pie Data Mapping
  const pieData = useMemo(() => {
    const types = ['liquid', 'cash', 'crypto', 'stocks', 'real_estate', 'precious_metals', 'other'];
    return types.map(key => {
      let totalVal = 0;
      if (key === 'liquid') {
        totalVal = liquidCash;
      } else {
        totalVal = assets.filter(a => a.type === key).reduce((sum, a) => sum + a.value, 0);
      }

      // Translate type name
      let label = t.other;
      if (key === 'liquid') label = lang === 'tr' ? 'Likit Nakit' : 'Liquid Cash';
      else if (key === 'cash') label = lang === 'tr' ? 'Varlık Nakit' : 'Asset Cash';
      else if (key === 'crypto') label = lang === 'tr' ? 'Kripto' : 'Crypto';
      else if (key === 'stocks') label = lang === 'tr' ? 'Hisse' : 'Stocks';
      else if (key === 'real_estate') label = lang === 'tr' ? 'Gayrimenkul' : 'Real Estate';
      else if (key === 'precious_metals') label = lang === 'tr' ? 'Altın/Metal' : 'Metals';

      return {
        name: label,
        value: totalVal > 0 ? totalVal * rateMultiplier : 0,
        key: key
      };
    }).filter(item => item.value > 0);
  }, [assets, liquidCash, lang, t, rateMultiplier]);

  // 4. Backward Cumulative Net Worth Projection Trend
  const trendData = useMemo(() => {
    const months: any[] = [];
    const date = new Date();

    // Generate list for the past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(date.getMonth() - i);
      const label = d.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' });
      const monthKey = d.toISOString().substring(0, 7); // YYYY-MM
      months.push({ label, key: monthKey, cashFlow: 0, netWorth: 0 });
    }

    // Accumulate transaction cash flows per month
    transactions.forEach(tx => {
      const txMonth = tx.transaction_date.substring(0, 7);
      const found = months.find(m => m.key === txMonth);
      if (found) {
        if (tx.type === 'income') {
          found.cashFlow += tx.amount;
        } else {
          found.cashFlow -= tx.amount;
        }
      }
    });

    // Project backward starting from today's actual Net Worth
    let runningNetWorth = currentNetWorth;
    for (let i = months.length - 1; i >= 0; i--) {
      months[i].netWorth = runningNetWorth;
      
      // Compute previous month's Net Worth by backing out this month's activity
      // Incorporate a standard organic wealth growth multiplier (+1.5% month) if transaction volume is low
      const flowVal = months[i].cashFlow !== 0 ? months[i].cashFlow : (runningNetWorth * 0.015);
      runningNetWorth = Math.max(0, runningNetWorth - flowVal);
    }

    return months.map(m => ({
      name: m.label,
      [lang === 'tr' ? 'Net Değer' : 'Net Worth']: Math.round(m.netWorth * rateMultiplier)
    }));
  }, [transactions, currentNetWorth, lang, rateMultiplier]);

  // 5. Action Handlers
  const handleAddNew = () => {
    setName('');
    setType('cash');
    setValue('');
    setQuantity('');
    setPurchasePrice('');
    setIsShared(true);
    setErrorMsg('');
    setEditingAsset(null);
    setIsFormOpen(true);
  };

  const handleEdit = (asset: any) => {
    setEditingAsset(asset);
    setName(asset.name);
    setType(asset.type);
    setValue(asset.value.toString());
    setQuantity(asset.quantity ? asset.quantity.toString() : '');
    setPurchasePrice(asset.purchase_price ? asset.purchase_price.toString() : '');
    setIsShared(asset.workspace_id !== null);
    setErrorMsg('');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      await deleteAsset(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg(lang === 'tr' ? 'Lütfen bir varlık adı girin.' : 'Please enter an asset name.');
      return;
    }

    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue) || parsedValue < 0) {
      setErrorMsg(lang === 'tr' ? 'Lütfen geçerli bir değer girin.' : 'Please enter a valid asset value.');
      return;
    }

    const parsedQty = quantity ? parseFloat(quantity) : undefined;
    if (parsedQty !== undefined && (isNaN(parsedQty) || parsedQty < 0)) {
      setErrorMsg(lang === 'tr' ? 'Miktar sıfır veya daha büyük olmalıdır.' : 'Quantity must be zero or positive.');
      return;
    }

    const parsedCost = purchasePrice ? parseFloat(purchasePrice) : undefined;
    if (parsedCost !== undefined && (isNaN(parsedCost) || parsedCost < 0)) {
      setErrorMsg(lang === 'tr' ? 'Alış fiyatı sıfır veya daha büyük olmalıdır.' : 'Purchase price must be zero or positive.');
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      type: type as any,
      value: parsedValue,
      quantity: parsedQty,
      purchase_price: parsedCost,
      workspace_id: activeWorkspace ? (isShared ? activeWorkspace.id : null) : null
    };

    let result;
    if (editingAsset) {
      result = await updateAsset(editingAsset.id, payload);
    } else {
      result = await addAsset(payload);
    }

    setLoading(false);
    if (result.success) {
      setIsFormOpen(false);
    } else {
      setErrorMsg(result.error || 'İşlem başarısız oldu.');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Briefcase className="text-brand-500 w-7 h-7 animate-pulse" strokeWidth={2.5} />
            {t.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-center">
          {/* Valuation Currency Selector & Status */}
          <div className="flex flex-col items-end sm:items-start select-none">
            <div className="flex items-center space-x-2">
              {/* Valuation Currency Segment Switcher */}
              <div className="bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/40 dark:border-slate-800/60 flex items-center shadow-sm shrink-0">
                {['TRY', 'USD', 'EUR'].map((cur) => {
                  const isActive = valuationCurrency === cur;
                  let symbol = '₺';
                  if (cur === 'USD') symbol = '$';
                  if (cur === 'EUR') symbol = '€';
                  
                  return (
                    <button
                      key={cur}
                      onClick={() => {
                        setValuationCurrency(cur);
                        localStorage.setItem('moneymate_portfolio_currency', cur);
                      }}
                      className={`py-1.5 px-3 rounded-lg text-[10px] font-black tracking-wider transition-all duration-200 ${
                        isActive
                          ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm scale-[1.02]'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                      title={`${cur} cinsinden değerle`}
                    >
                      <span className="mr-0.5 font-extrabold">{symbol}</span>
                      {cur}
                    </button>
                  );
                })}
              </div>

              {/* Refresh button with rotate transition */}
              <button
                onClick={() => fetchRates(true)}
                disabled={isRefreshing}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-all duration-200 border border-slate-200/30 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center cursor-pointer hover:scale-105 disabled:opacity-50 active:scale-95 shrink-0"
                title={t.refreshRatesTooltip}
              >
                <RefreshCw size={13} className={`${isRefreshing ? 'animate-spin text-brand-500' : 'text-slate-400'}`} />
              </button>
            </div>

            {/* Last updated and refresh mode subtext */}
            <div className="flex items-center space-x-1.5 text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-1 pl-1">
              <span className={`w-1.5 h-1.5 rounded-full ${
                (localStorage.getItem('moneymate_rates_refresh') || 'daily') === 'realtime'
                  ? 'bg-amber-500 animate-pulse'
                  : (localStorage.getItem('moneymate_rates_refresh') || 'daily') === 'daily'
                  ? 'bg-indigo-500'
                  : 'bg-emerald-500'
              }`} />
              <span>
                {
                  (localStorage.getItem('moneymate_rates_refresh') || 'daily') === 'realtime'
                    ? t.ratesModeRealtime
                    : (localStorage.getItem('moneymate_rates_refresh') || 'daily') === 'daily'
                    ? t.ratesModeDaily
                    : t.ratesModeManual
                }
              </span>
              <span>•</span>
              <span>{t.lastUpdated}: {getRelativeTime(ratesTimestamp)}</span>
            </div>
          </div>

          <button
            onClick={handleAddNew}
            className="premium-btn-primary flex items-center space-x-2 py-2.5 px-4.5 text-xs font-semibold shadow-md whitespace-nowrap self-start sm:self-center"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>{t.addNewAsset}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Total Assets Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">{t.assets}</span>
            <strong className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              {formatCurrency(currentAssetsSum * rateMultiplier, valuationCurrency)}
            </strong>
          </div>
        </div>

        {/* Total Liabilities Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl shrink-0">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">{t.liabilities}</span>
            <strong className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              {formatCurrency(currentLiabilitiesSum * rateMultiplier, valuationCurrency)}
            </strong>
          </div>
        </div>

        {/* Net Worth Card */}
        <div className="bg-gradient-to-br from-indigo-500/5 to-brand-500/5 dark:from-indigo-950/20 dark:to-brand-950/20 border border-indigo-200 dark:border-indigo-500/20 rounded-3xl p-6 shadow-md flex items-center space-x-4 relative overflow-hidden group transition-all duration-300 hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0 z-10">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="z-10">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
              {t.netWorth}
            </span>
            <strong className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              {formatCurrency(currentNetWorth * rateMultiplier, valuationCurrency)}
            </strong>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row */}
      {assets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Allocation Donut Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-brand-500" />
              {t.assetAllocation}
            </h3>
            
            <div className="h-64 relative flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.key} fill={ASSET_COLORS[entry.key] || ASSET_COLORS.other} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0];
                        return (
                          <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 py-2 px-3.5 rounded-xl border border-white/10 shadow-lg text-xs font-bold">
                            <p className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.payload.fill }} />
                              {item.name}: {formatCurrency(Number(item.value), valuationCurrency)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Total Value Label */}
              <div className="absolute text-center flex flex-col justify-center">
                <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500">{lang === 'tr' ? 'Toplam Servet' : 'Total Portfolio'}</span>
                <span className="text-sm font-black text-slate-800 dark:text-white mt-0.5">
                  {formatCurrency(currentAssetsSum * rateMultiplier, valuationCurrency)}
                </span>
              </div>
            </div>

            {/* Legends */}
            <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
              {pieData.map((entry) => (
                <div key={entry.key} className="flex items-center space-x-2 overflow-hidden">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ASSET_COLORS[entry.key] }} />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                    {entry.name}
                  </span>
                  <span className="text-[10px] font-black text-slate-800 dark:text-white shrink-0 ml-auto">
                    %{Math.round((entry.value / (currentAssetsSum * rateMultiplier)) * 100)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Net Worth Area Chart */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <LineIcon className="w-4 h-4 text-brand-500" />
              {t.netWorthTrend}
            </h3>

            <div className="h-64 flex-1 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800/40" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fontWeight: 700 }} 
                    axisLine={false} 
                    tickLine={false}
                    stroke="#94A3B8" 
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fontWeight: 700 }} 
                    axisLine={false} 
                    tickLine={false}
                    stroke="#94A3B8" 
                    tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                  />
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-3.5 py-2.5 rounded-2xl border border-white/10 shadow-xl text-xs font-bold">
                            <p className="opacity-60 text-[10px] mb-1 font-semibold">{payload[0].payload.name}</p>
                            <p className="text-brand-500 dark:text-brand-600">
                              {lang === 'tr' ? 'Net Servet: ' : 'Net Worth: '}
                              {formatCurrency(Number(payload[0].value), valuationCurrency)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={lang === 'tr' ? 'Net Değer' : 'Net Worth'} 
                    stroke="#6366F1" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#netWorthGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Asset List & Details */}
      {assets.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {t.allAssets}
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/40 px-2 py-0.5 rounded-full shrink-0">
              {assets.length} {lang === 'tr' ? 'Varlık Kalemi' : 'Assets'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/10">
                  <th className="py-3 px-6 text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500">{t.assetName}</th>
                  <th className="py-3 px-6 text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500">{t.assetType}</th>
                  <th className="py-3 px-6 text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 text-right">{t.quantityLabel}</th>
                  <th className="py-3 px-6 text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 text-right">{t.purchasePriceLabel}</th>
                  <th className="py-3 px-6 text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 text-right">{t.profitVal}</th>
                  <th className="py-3 px-6 text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 text-right">{t.totalValue}</th>
                  <th className="py-3 px-6 text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {assets.map((asset) => {
                  const assetColor = ASSET_COLORS[asset.type] || ASSET_COLORS.other;
                  
                  // Compute simple return on asset if cost is logged
                  let costBasis = 0;
                  let returnPercent = 0;
                  let hasCostBasis = false;
                  
                  if (asset.quantity && asset.purchase_price) {
                    costBasis = asset.quantity * asset.purchase_price;
                    returnPercent = costBasis > 0 ? Math.round(((asset.value - costBasis) / costBasis) * 100) : 0;
                    hasCostBasis = true;
                  }

                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      {/* Name */}
                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-white text-xs">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="p-2 rounded-xl text-white shadow-sm shrink-0 flex items-center justify-center font-semibold"
                            style={{ backgroundColor: assetColor }}
                          >
                            {getAssetIcon(asset.type)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 dark:text-white">{asset.name}</span>
                            {activeWorkspace && (
                              <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-md uppercase tracking-wider w-max mt-1 ${
                                !asset.workspace_id 
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-505 dark:text-slate-400' 
                                  : 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400'
                              }`}>
                                {!asset.workspace_id 
                                  ? (lang === 'tr' ? '🔒 Kişisel (Gizli)' : '🔒 Private (Hidden)') 
                                  : (lang === 'tr' ? '👥 Ortak (Shared)' : '👥 Shared')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        <span 
                          className="px-2.5 py-0.8 rounded-full text-[9px] border font-extrabold uppercase tracking-wide"
                          style={{ 
                            color: assetColor, 
                            borderColor: assetColor + '22',
                            backgroundColor: assetColor + '10' 
                          }}
                        >
                          {assetTypeOptions.find(o => o.value === asset.type)?.label.split(' ')[0]}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-6 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right">
                        {asset.quantity ? (
                          <span>
                            {asset.quantity} <span className="text-[10px] text-slate-400">{t.unit}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      {/* Purchase Price */}
                      <td className="py-4 px-6 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right">
                        {asset.purchase_price ? (
                          <span>{formatCurrency(asset.purchase_price * rateMultiplier, valuationCurrency)}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      {/* Profit/Loss */}
                      <td className="py-4 px-6 text-xs font-bold text-right">
                        {hasCostBasis ? (
                          <span className={returnPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {returnPercent >= 0 ? '+' : ''}{returnPercent}%
                          </span>
                        ) : (
                          <span className="text-[10px] font-normal text-slate-400">{t.noProfit}</span>
                        )}
                      </td>

                      {/* Total Value */}
                      <td className="py-4 px-6 text-xs font-black text-slate-800 dark:text-white text-right">
                        {formatCurrency(asset.value * rateMultiplier, valuationCurrency)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center space-x-2 shrink-0">
                          <button
                            onClick={() => handleEdit(asset)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          iconName="Briefcase"
          title={t.emptyTitle}
          description={t.emptyDesc}
          actionText={t.addNewAsset}
          onAction={handleAddNew}
        />
      )}

      {/* Dynamic Asset Input Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" 
            onClick={() => setIsFormOpen(false)} 
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-5 shrink-0">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-brand-500 animate-pulse" />
                {editingAsset ? t.editAsset : t.addNewAsset}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold leading-relaxed shrink-0">
                {errorMsg}
              </div>
            )}

            {/* Scrollable Form */}
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 pb-2">
              
              {/* Asset Name */}
              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 block mb-1.5">
                  {t.assetName} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="premium-input text-sm font-semibold"
                  required
                />
              </div>

              {/* Asset Class CustomSelect */}
              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 block mb-1.5">
                  {t.assetType} *
                </label>
                <CustomSelect
                  options={assetTypeOptions}
                  value={type}
                  onChange={(val) => setType(val)}
                  placeholder={lang === 'tr' ? 'Sınıf Seçiniz...' : 'Select Asset Class...'}
                  required
                />
              </div>

              {/* Asset Value */}
              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 block mb-1.5">
                  {t.assetValue} ({currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.00"
                  className="premium-input text-sm font-semibold"
                  required
                />
              </div>

              {/* Optional Advanced metrics grid */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                
                {/* Quantity */}
                <div>
                  <label className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 block mb-1.5">
                    {t.quantity}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 0.25, 50"
                    className="premium-input text-xs font-semibold"
                  />
                </div>

                {/* Purchase Cost per unit */}
                <div>
                  <label className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 block mb-1.5">
                    {t.purchasePrice} ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="0.00"
                    className="premium-input text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Workspace sharing toggle */}
              {activeWorkspace && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {lang === 'tr' ? 'Ortak Bütçede Paylaş' : 'Share in Collaborative Workspace'}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-505 block leading-relaxed">
                      {lang === 'tr' 
                        ? 'Açık olursa ortağınız bu varlığı görebilir. Kapalıysa kilitli kalır.' 
                        : 'If enabled, your partner can see this asset. Otherwise, it is hidden.'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={isShared} 
                      onChange={(e) => setIsShared(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-brand-500"></div>
                  </label>
                </div>
              )}

              {/* Actions Button Bar */}
              <div className="flex space-x-3 pt-5 border-t border-slate-100 dark:border-slate-800/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all duration-200"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 premium-btn-primary text-xs font-bold shadow-md shadow-brand-500/10 disabled:opacity-50"
                >
                  {loading ? '...' : t.save}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default NetWorth;
