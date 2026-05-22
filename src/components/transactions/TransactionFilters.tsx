import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getCurrencySymbol } from '../../utils/formatters';

export interface FilterState {
  search: string;
  type: 'all' | 'income' | 'expense';
  categoryId: string;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
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
  const { categories } = useData();
  const currencySymbol = getCurrencySymbol(user?.currency || 'TRY');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
          <select
            name="type"
            value={filters.type}
            onChange={handleChange}
            className="premium-input text-xs appearance-none cursor-pointer bg-no-repeat"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
          >
            <option value="all">Tümü (Gelir & Gider)</option>
            <option value="expense">Sadece Giderler</option>
            <option value="income">Sadece Gelirler</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kategori</label>
          <select
            name="categoryId"
            value={filters.categoryId}
            onChange={handleChange}
            className="premium-input text-xs appearance-none cursor-pointer bg-no-repeat"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                [{cat.type === 'income' ? 'GELİR' : 'GİDER'}] {cat.name}
              </option>
            ))}
          </select>
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
          <select
            name="paymentMethod"
            value={filters.paymentMethod}
            onChange={handleChange}
            className="premium-input text-xs appearance-none cursor-pointer bg-no-repeat"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
          >
            <option value="">Tüm Yöntemler</option>
            {PAYMENT_METHODS.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

      </div>
    </div>
  );
};

export default TransactionFilters;
