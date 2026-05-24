import React from 'react';
import { Search, X, Filter, TrendingUp, TrendingDown, Layers, CreditCard, Wallet, FileText } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getCurrencySymbol } from '../../utils/formatters';
import { CustomSelect } from '../common/CustomSelect';

export interface FilterState {
  search: string;
  type: 'all' | 'income' | 'expense';
  categoryId: string;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  selectedTag: string;
}

interface TransactionFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onClear: () => void;
}

const PAYMENT_METHODS = ['Nakit', 'Kredi Kartı', 'Banka Kartı', 'Havale/EFT', 'Diğer'];

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  setFilters,
  onClear,
}) => {
  const { user } = useAuth();
  const isEn = user?.lang === 'en';
  const { categories, transactions } = useData();
  const currencySymbol = getCurrencySymbol(user?.currency || 'TRY');

  // Dynamic Tag Cloud Calculation
  const allUniqueTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    transactions.forEach(tx => {
      if (tx.tags) {
        tx.tags.forEach(t => tagsSet.add(t.toLowerCase()));
      }
    });
    return Array.from(tagsSet).sort();
  }, [transactions]);

  const handleSelectChange = (name: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const typeOptions = [
    { value: 'all', label: isEn ? 'All (Income & Expense)' : 'Tümü (Gelir & Gider)', icon: <Layers className="w-3.5 h-3.5" /> },
    { value: 'expense', label: isEn ? 'Only Expenses' : 'Sadece Giderler', icon: <TrendingDown className="w-3.5 h-3.5 text-red-500" /> },
    { value: 'income', label: isEn ? 'Only Income' : 'Sadece Gelirler', icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> },
  ];

  const categoryOptions = React.useMemo(() => {
    const baseOpts = categories.map((cat) => {
      const IconComponent = (Icons as any)[cat.icon || 'HelpCircle'];
      return {
        value: cat.id,
        label: `[${cat.type === 'income' ? (isEn ? 'INCOME' : 'GELİR') : (isEn ? 'EXPENSE' : 'GİDER')}] ${cat.name}`,
        color: cat.color,
        icon: IconComponent ? <IconComponent className="w-3.5 h-3.5" /> : null,
      };
    });
    return [{ value: '', label: isEn ? 'All Categories' : 'Tüm Kategoriler' }, ...baseOpts];
  }, [categories, isEn]);

  const paymentMethodOptions = React.useMemo(() => {
    const baseOpts = PAYMENT_METHODS.map(method => {
      const icon = method.toLowerCase().includes('kart') 
        ? <CreditCard className="w-3.5 h-3.5" /> 
        : method.toLowerCase().includes('nakit')
        ? <Wallet className="w-3.5 h-3.5" />
        : <FileText className="w-3.5 h-3.5" />;
      return {
        value: method,
        label: method,
        icon,
      };
    });
    return [{ value: '', label: isEn ? 'All Methods' : 'Tüm Yöntemler' }, ...baseOpts];
  }, [isEn]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4 transition-all duration-200">
      
      {/* Header and Toggle info */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
          <Filter size={18} className="text-brand-500" />
          <h3 className="font-semibold text-sm">Gelişmiş Arama ve Filtreleme</h3>
        </div>
        <button
          onClick={onClear}
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center space-x-1 hover:underline"
        >
          <X size={14} />
          <span>Filtreleri Temizle</span>
        </button>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Search */}
        <div className="space-y-1.5 col-span-1 sm:col-span-2">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Açıklamada Ara</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={15} />
            </span>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder="Fatura, market vb. yazın..."
              className="premium-input pl-9 text-xs"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">İşlem Türü</label>
          <CustomSelect
            options={typeOptions}
            value={filters.type}
            onChange={(val) => handleSelectChange('type', val)}
          />
        </div>

        {/* Category Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kategori</label>
          <CustomSelect
            options={categoryOptions}
            value={filters.categoryId}
            onChange={(val) => handleSelectChange('categoryId', val)}
          />
        </div>

        {/* Start Date */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Başlangıç Tarihi</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleChange}
            className="premium-input text-xs cursor-pointer"
          />
        </div>

        {/* End Date */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Bitiş Tarihi</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleChange}
            className="premium-input text-xs cursor-pointer"
          />
        </div>

        {/* Min Amount */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Min Tutar ({currencySymbol})</label>
          <input
            type="number"
            name="minAmount"
            value={filters.minAmount}
            onChange={handleChange}
            placeholder="En az..."
            min="0"
            className="premium-input text-xs"
          />
        </div>

        {/* Max Amount */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Max Tutar ({currencySymbol})</label>
          <input
            type="number"
            name="maxAmount"
            value={filters.maxAmount}
            onChange={handleChange}
            placeholder="En çok..."
            min="0"
            className="premium-input text-xs"
          />
        </div>

        {/* Payment Method */}
        <div className="space-y-1.5 col-span-1 sm:col-span-2 lg:col-span-1">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ödeme Yöntemi</label>
          <CustomSelect
            options={paymentMethodOptions}
            value={filters.paymentMethod}
            onChange={(val) => handleSelectChange('paymentMethod', val)}
          />
        </div>

      </div>

      {/* Dynamic Tag Cloud */}
      {allUniqueTags.length > 0 && (
        <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
            {isEn ? 'Filter by Tag:' : 'Etikete Göre Filtrele:'}
          </span>
          {allUniqueTags.map(tag => {
            const isSelected = filters.selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setFilters(prev => ({
                  ...prev,
                  selectedTag: isSelected ? '' : tag
                }))}
                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default TransactionFilters;
