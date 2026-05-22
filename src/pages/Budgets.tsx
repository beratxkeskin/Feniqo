import React, { useState, useMemo } from 'react';
import { Plus, X, Calendar, CheckCircle2, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { BudgetCard } from '../components/budgets/BudgetCard';
import { EmptyState } from '../components/common/EmptyState';
import { getCurrencySymbol } from '../utils/formatters';

export const Budgets: React.FC = () => {
  const { user } = useAuth();
  const { budgets, categories, transactions, addOrUpdateBudget } = useData();

  // Date States - Default to current month YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().substring(0, 7);
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // 1. Filter budgets for selected month
  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => b.month === selectedMonth);
  }, [budgets, selectedMonth]);

  // 2. Only show Expense categories for budget limits! (You don't set limits on income)
  const expenseCategories = useMemo(() => {
    return categories.filter(c => c.type === 'expense');
  }, [categories]);

  // 3. Compute Spent for each filtered budget card
  const budgetsWithSpent = useMemo(() => {
    return filteredBudgets.map((b) => {
      const spent = transactions
        .filter(t => 
          t.type === 'expense' && 
          t.category_id === b.category_id && 
          t.transaction_date.startsWith(selectedMonth)
        )
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        budget: b,
        spent,
      };
    });
  }, [filteredBudgets, transactions, selectedMonth]);

  // Automatically select the first category if empty
  useMemo(() => {
    if (expenseCategories.length > 0 && !categoryId) {
      setCategoryId(expenseCategories[0].id);
    }
  }, [expenseCategories, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const parsedLimit = parseFloat(limitAmount);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setFormError('Lütfen sıfırdan büyük geçerli bir limit girin.');
      return;
    }

    if (!categoryId) {
      setFormError('Lütfen bir kategori seçin.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await addOrUpdateBudget({
        category_id: categoryId,
        month: selectedMonth,
        limit_amount: parsedLimit,
      });

      if (res.success) {
        setLimitAmount('');
        setIsFormOpen(false);
      } else {
        setFormError(res.error || 'Bütçe limitiniz kaydedilemedi.');
      }
    } catch (e: any) {
      setFormError('Bir sorun oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Aylık Bütçe Planlaması
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Harcama kategorilerinize aylık limitler koyun ve tasarruf hedeflerinizi yönetin.
          </p>
        </div>

        {/* Add budget & Date picker controls */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-450 dark:text-slate-500">
              <Calendar size={14} />
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="premium-input pl-9 py-2 text-xs font-semibold cursor-pointer max-w-[150px]"
              title="Görüntülenecek ayı seçin"
            />
          </div>

          <button
            onClick={() => setIsFormOpen(true)}
            className="premium-btn-primary flex items-center space-x-2 py-2 px-4 text-xs font-semibold shadow-md whitespace-nowrap"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Limit Belirle</span>
          </button>
        </div>
      </div>

      {/* BUDGET CARDS CONTAINER */}
      {budgetsWithSpent.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgetsWithSpent.map(({ budget, spent }) => (
            <BudgetCard key={budget.id} budget={budget} spent={spent} />
          ))}
        </div>
      ) : (
        <EmptyState
          iconName="PiggyBank"
          title="Bütçe Kaydı Bulunamadı"
          description={`Seçtiğiniz dönem (${selectedMonth}) için herhangi bir kategori bütçe limiti oluşturmadınız. Limitler ekleyerek bütçenizi kontrol edebilirsiniz.`}
          actionText="Bütçe Limiti Belirle"
          onAction={() => setIsFormOpen(true)}
        />
      )}

      {/* CREATE/UPDATE BUDGET MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bütçe Limiti Tanımla</h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900/50">
                  {formError}
                </div>
              )}

              {/* Month Display */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-850/50 rounded-xl border border-slate-100 dark:border-slate-800/50 flex justify-between items-center text-xs">
                <span className="text-slate-400">Dönem:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold">{selectedMonth}</strong>
              </div>

              {/* Category Select */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider pl-1">
                  Kategori *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="premium-input appearance-none bg-no-repeat cursor-pointer text-sm"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
                  required
                >
                  <option value="" disabled>Gider Kategorisi Seçin</option>
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Limit Amount Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider pl-1">
                  Aylık Harcama Limiti *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-base">
                    {getCurrencySymbol(user?.currency || 'TRY')}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    placeholder="0.00"
                    className="premium-input pl-9 text-base font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="premium-btn-secondary py-2 px-4 text-xs font-semibold"
                  disabled={isSubmitting}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="premium-btn-primary py-2 px-4.5 text-xs font-semibold flex items-center space-x-2 shadow-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>Limiti Kaydet</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Budgets;
