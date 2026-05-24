import React, { useState, useMemo } from 'react';
import { Plus, X, Calendar, CheckCircle2, Loader, Copy, Brain } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { BudgetCard } from '../components/budgets/BudgetCard';
import { EmptyState } from '../components/common/EmptyState';
import { getCurrencySymbol } from '../utils/formatters';
import { CustomSelect } from '../components/common/CustomSelect';

export const Budgets: React.FC = () => {
  const { user } = useAuth();
  const { budgets, categories, transactions, addOrUpdateBudget, copyBudgets, currentUserRole } = useData();

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

  // Dynamic thresholds
  const warningThreshold = useMemo(() => {
    return parseInt(localStorage.getItem('moneymate_budget_warning_threshold') || '50');
  }, []);


  // Filter budgets exceeding warning threshold
  const budgetsExceedingWarning = useMemo(() => {
    return budgetsWithSpent.map(({ budget, spent }) => {
      const percentage = budget.limit_amount > 0 ? Math.round((spent / budget.limit_amount) * 100) : 0;
      return {
        budget,
        spent,
        percentage
      };
    }).filter(b => b.percentage >= warningThreshold)
      .sort((a, b) => b.percentage - a.percentage);
  }, [budgetsWithSpent, warningThreshold]);

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

  const [isCopying, setIsCopying] = useState(false);

  // Calculate previous month
  const previousMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    if (month === 1) {
      return `${year - 1}-12`;
    }
    const prevMonth = month - 1;
    return `${year}-${prevMonth < 10 ? '0' : ''}${prevMonth}`;
  }, [selectedMonth]);

  // Filter previous month's budgets
  const previousBudgets = useMemo(() => {
    return budgets.filter(b => b.month === previousMonth);
  }, [budgets, previousMonth]);

  const showCopyButton = filteredBudgets.length === 0 && previousBudgets.length > 0;

  const handleCopyPreviousBudget = async () => {
    if (previousBudgets.length === 0) return;
    setIsCopying(true);
    setFormError('');
    try {
      const res = await copyBudgets(previousMonth, selectedMonth);
      if (!res.success) {
        setFormError(res.error || 'Bütçeler kopyalanamadı.');
      }
    } catch (err) {
      setFormError('Kopyalama sırasında bir hata oluştu.');
    } finally {
      setIsCopying(false);
    }
  };

  const categoryOptions = useMemo(() => {
    return expenseCategories.map((cat) => {
      const IconComponent = (Icons as any)[cat.icon || 'HelpCircle'];
      return {
        value: cat.id,
        label: cat.name,
        color: cat.color,
        icon: IconComponent ? <IconComponent className="w-3.5 h-3.5" /> : null,
      };
    });
  }, [expenseCategories]);

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
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Calendar size={14} />
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker()}
              className="premium-input pl-9 pr-8 py-2 text-xs font-semibold cursor-pointer w-[180px]"
              title="Görüntülenecek ayı seçin"
            />
          </div>

          {currentUserRole === 'admin' && showCopyButton && (
            <button
              onClick={handleCopyPreviousBudget}
              disabled={isCopying}
              className="premium-btn-secondary flex items-center space-x-2 py-2 px-4 text-xs font-semibold border border-dashed border-brand-500/40 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 text-brand-600 dark:text-brand-400 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap animate-in fade-in duration-200"
            >
              {isCopying ? (
                <Loader size={12} className="animate-spin text-brand-500" />
              ) : (
                <Copy size={12} />
              )}
              <span>Önceki Aydan Kopyala</span>
            </button>
          )}

          {currentUserRole === 'admin' && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="premium-btn-primary flex items-center space-x-2 py-2 px-4 text-xs font-semibold shadow-md whitespace-nowrap"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Limit Belirle</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Coach Alert Suggestion Banner */}
      {budgetsExceedingWarning.length > 0 && (
        <div className="p-5 rounded-3xl border border-indigo-200 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/50 to-brand-50/50 dark:from-indigo-950/10 dark:to-brand-950/10 text-slate-800 dark:text-slate-200 flex items-start space-x-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 mb-6">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 animate-pulse">
            <Brain size={22} />
          </div>
          <div className="space-y-1.5">
            <h5 className="font-bold text-sm uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <span>{user?.lang === 'en' ? 'AI Financial Coach Alert' : 'AI Finansal Bütçe Koçu'}</span>
              <span className="text-[10px] bg-indigo-500/10 px-2.5 py-0.5 rounded-full font-bold tracking-normal text-indigo-600 dark:text-indigo-400">
                {user?.lang === 'en' ? 'Live Analysis' : 'Canlı Analiz'}
              </span>
            </h5>
            <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
              {user?.lang === 'en' ? (
                <>You have budget items close to or exceeding limits. To balance your monthly budget, consider pausing non-essential subscriptions or postponing discretionary shopping in the <strong>{categories.find(c => c.id === budgetsExceedingWarning[0].budget.category_id)?.name}</strong> category.</>
              ) : (
                <>Belirlediğiniz bütçe limitlerine yaklaşıyorsunuz veya limitleri aştınız. Aylık bütçenizi dengelemek için bu dönem <strong>{categories.find(c => c.id === budgetsExceedingWarning[0].budget.category_id)?.name}</strong> kategorisindeki zorunlu olmayan değişken harcamalarınızı ertelemenizi tavsiye ederim.</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* BUDGET CARDS CONTAINER */}
      {budgetsWithSpent.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgetsWithSpent.map(({ budget, spent }) => (
            <BudgetCard key={budget.id} budget={budget} spent={spent} />
          ))}
        </div>
      ) : (
        <EmptyState
          iconName="PieChart"
          title="Bütçe Kaydı Bulunamadı"
          description={`Seçtiğiniz dönem (${selectedMonth}) için herhangi bir kategori bütçe limiti oluşturmadınız. Limitler ekleyerek bütçenizi kontrol edebilirsiniz.`}
          actionText={currentUserRole === 'admin' ? "Bütçe Limiti Belirle" : undefined}
          onAction={currentUserRole === 'admin' ? () => setIsFormOpen(true) : undefined}
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
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
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
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50 flex justify-between items-center text-xs">
                <span className="text-slate-400">Dönem:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold">{selectedMonth}</strong>
              </div>

              {/* Category Select */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
                  Kategori *
                </label>
                <CustomSelect
                  options={categoryOptions}
                  value={categoryId}
                  onChange={setCategoryId}
                  placeholder="Gider Kategorisi Seçin"
                  required
                />
              </div>

              {/* Limit Amount Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
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
