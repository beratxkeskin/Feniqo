import React, { useState, useMemo } from 'react';
import { Plus, X, Calendar, CheckCircle2, Loader, Copy, Brain } from 'lucide-react';
import * as Icons from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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

  // Akıllı Bütçe Kuralı Koçu (50/30/20 Analizi) Hesaplamaları
  const analysis503020 = useMemo(() => {
    const classifyCategory = (catName: string, catId: string): 'needs' | 'wants' | 'savings' => {
      const nameLower = catName.toLowerCase();
      const idLower = catId.toLowerCase();

      // Savings check
      const savingsKeys = ['tasarruf', 'birikim', 'yatırım', 'yatirim', 'hisse', 'altın', 'altin', 'fon', 'tahvil', 'kripto', 'savings', 'investment'];
      if (savingsKeys.some(k => nameLower.includes(k) || idLower.includes(k))) {
        return 'savings';
      }

      // Needs check
      const needsKeys = ['kira', 'market', 'fatura', 'ulaşım', 'ulasim', 'sağlık', 'saglik', 'eğitim', 'egitim', 'aidat', 'temel', 'needs', 'ihtiyaç', 'ihtiyac', 'vergi', 'sigorta', 'borç', 'borc', 'kredi', 'fatura', 'fat'];
      if (needsKeys.some(k => nameLower.includes(k) || idLower.includes(k))) {
        return 'needs';
      }

      // Wants check
      return 'wants';
    };

    const thisMonthTxs = transactions.filter(t => t.transaction_date.startsWith(selectedMonth));
    const income = thisMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = thisMonthTxs.filter(t => t.type === 'expense');
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

    let needsSum = 0;
    let wantsSum = 0;
    let savingsSum = 0;

    expenses.forEach(t => {
      const cat = categories.find(c => c.id === t.category_id);
      const catName = cat ? cat.name : '';
      const catId = t.category_id || '';

      const group = classifyCategory(catName, catId);
      if (group === 'needs') {
        needsSum += t.amount;
      } else if (group === 'savings') {
        savingsSum += t.amount;
      } else {
        wantsSum += t.amount;
      }
    });

    const baseAmount = income > 0 ? income : (totalExpense > 0 ? totalExpense : 1);
    
    const needsPercent = totalExpense > 0 ? Math.round((needsSum / baseAmount) * 100) : 0;
    const wantsPercent = totalExpense > 0 ? Math.round((wantsSum / baseAmount) * 100) : 0;
    const savingsPercent = totalExpense > 0 ? Math.round((savingsSum / baseAmount) * 100) : 0;

    const denom = (needsSum + wantsSum + savingsSum) || 1;
    const needsProp = Math.round((needsSum / denom) * 100);
    const wantsProp = Math.round((wantsSum / denom) * 100);
    const savingsProp = Math.round((savingsSum / denom) * 100);

    let score: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
    let statusText = 'Dengeli Bütçe';
    let adviceText = '';

    const lang = user?.lang || 'tr';
    const isEn = lang === 'en';

    if (income > 0) {
      if (needsSum === 0 && wantsSum === 0 && savingsSum === 0) {
        statusText = isEn ? 'Unspent' : 'Harcama Yapılmadı';
        adviceText = isEn 
          ? 'You haven\'t made any expenses this month yet. Plan your budget according to the 50/30/20 rule: 50% for Needs, 30% for Wants, 20% for Savings!'
          : 'Bu ay henüz bir harcama yapmadınız. Bütçenizi 50/30/20 kuralına göre planlamaya başlayın: %50 İhtiyaçlar, %30 İstekler, %20 Tasarruf/Yatırım!';
        score = 'excellent';
      } else if (needsPercent <= 50 && wantsPercent <= 30 && savingsPercent >= 20) {
        statusText = isEn ? 'Excellent Health' : 'Kusursuz Bütçe Sağlığı';
        adviceText = isEn 
          ? 'Perfect financial control! You kept your Needs below 50%, your Wants under 30%, and saved more than 20% of your income. Keep it up!'
          : 'Harika bir finansal yönetim! İhtiyaçlarınızı %50, isteklerinizi %30 sınırında tutup gelirinizi %20\'den fazlasını biriktirdiniz. Bu şekilde devam edin!';
        score = 'excellent';
      } else if (wantsPercent > 40) {
        statusText = isEn ? 'High Discretionary Spending' : 'Yüksek İstek Harcaması';
        adviceText = isEn
          ? `Your discretionary spending (Wants) is at %${wantsPercent}, exceeding the ideal 30% target. Try to freeze non-essential subscriptions or delay recreational purchases.`
          : `İstek harcamalarınız gelirinize göre %${wantsPercent} seviyesine ulaşarak ideal hedef olan %30'u aşmış. Bütçenizi dengelemek için lüks tüketimi ve aboneliklerinizi gözden geçirmelisiniz.`;
        score = 'critical';
      } else if (needsPercent > 60) {
        statusText = isEn ? 'High Essential Expenses' : 'Yüksek İhtiyaç Yükü';
        adviceText = isEn
          ? `Essential expenses (Needs) are eating up %${needsPercent} of your income (Ideal: 50%). Consider reviewing fixed bills, negotiating rents, or minimizing basic consumption costs.`
          : `Sabit ve zorunlu giderleriniz (İhtiyaçlar) gelirinize göre %${needsPercent} seviyesine ulaşarak ideal olan %50 limitini aşmış. Sabit faturalarınızı veya temel tüketim masraflarınızı optimize etmelisiniz.`;
        score = 'warning';
      } else if (savingsPercent < 15) {
        statusText = isEn ? 'Low Savings Rate' : 'Düşük Tasarruf Oranı';
        adviceText = isEn
          ? `Your savings and investments are only %${savingsPercent} (Ideal: 20%). Try setting aside at least 20% of your income automatically as soon as you receive your paycheck!`
          : `Tasarruf ve yatırım oranınız %${savingsPercent} ile ideal hedef olan %20'nin altında kalmış. Maaşınız yatar yatmaz en az %20'sini otomatik olarak yatırım hesaplarınıza aktarmayı alışkanlık edinin!`;
        score = 'warning';
      } else {
        statusText = isEn ? 'Healthy & Balanced' : 'Dengeli Bütçe Yönetimi';
        adviceText = isEn
          ? 'Your budget is fairly balanced. Your spending patterns are close to the 50/30/20 rule targets. Good job maintaining financial discipline!'
          : 'Bütçeniz genel olarak oldukça dengeli. Harcama dağılımınız 50/30/20 hedeflerine yakın seyrediyor. Finansal disiplininiz için tebrikler!';
        score = 'good';
      }
    } else {
      if (totalExpense === 0) {
        statusText = isEn ? 'No Data' : 'Veri Yok';
        adviceText = isEn
          ? 'No transactions found for this month yet. Add income and expenses to unlock live 50/30/20 rule coaching analysis!'
          : 'Seçilen ay için henüz hiçbir işlem kaydı bulunmuyor. Gelir ve harcamalarınızı ekledikten sonra canlı 50/30/20 kuralı analizi burada belirecektir!';
        score = 'good';
      } else if (wantsProp > 45) {
        statusText = isEn ? 'High Wants Proportion' : 'Harcamalarda İstek Ağırlığı';
        adviceText = isEn
          ? `Out of your total spending, %${wantsProp} went to discretionary Wants (Ideal target: 30%). You are allocating too much of your cash flow to luxury and leisure instead of savings.`
          : `Toplam harcamalarınızın %${wantsProp} gibi büyük bir kısmı keyfi İsteklere gitmiş (İdeal hedef: %30). Bütçenizi korumak adına dışarıda yemek ve eğlence kalemlerini sınırlamayı düşünün.`;
        score = 'critical';
      } else if (savingsProp < 10) {
        statusText = isEn ? 'Extremely Low Savings' : 'Çok Düşük Tasarruf / Yatırım';
        adviceText = isEn
          ? `Only %${savingsProp} of your expenses are directed towards Savings or Investments (Ideal target: 20%). Try cutting down on dining out and entertainment to boost your wealth-building rate.`
          : `Toplam harcamalarınızın sadece %${savingsProp} kadarı Tasarruf ve Yatırıma ayrılmış (İdeal hedef: %20). Birikim hedeflerinize ve yatırım fonlarınıza daha fazla öncelik vermelisiniz.`;
        score = 'warning';
      } else {
        statusText = isEn ? 'Reasonably Proportioned' : 'Dengeli Harcama Dağılımı';
        adviceText = isEn
          ? `Your spending proportions are quite healthy: Needs are %${needsProp}, Wants are %${wantsProp}, and Savings/Investments are %${savingsProp}. Add your monthly income to get even more precise targets!`
          : `Harcamalarınız kendi içinde dengeli bir şekilde dağılmış: İhtiyaçlar %${needsProp}, İstekler %${wantsProp}, Tasarruflar ise %${savingsProp}. Canlı gelirlerinizi de ekleyerek daha net hedefler alabilirsiniz!`;
        score = 'good';
      }
    }

    return {
      income,
      totalExpense,
      needsSum,
      wantsSum,
      savingsSum,
      needsPercent: income > 0 ? needsPercent : needsProp,
      wantsPercent: income > 0 ? wantsPercent : wantsProp,
      savingsPercent: income > 0 ? savingsPercent : savingsProp,
      score,
      statusText,
      adviceText
    };
  }, [transactions, categories, selectedMonth, user]);

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

      {/* 50/30/20 Smart Budget Rule Coach Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Donut Chart & Status Card */}
        <div className="lg:col-span-1 p-5 rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm space-y-4 hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 dark:bg-brand-500/5 blur-3xl rounded-full pointer-events-none" />
          
          <div className="text-center w-full">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm tracking-tight">
              {user?.lang === 'en' ? '50/30/20 Budget Allocations' : '50/30/20 Bütçe Dağılımı'}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
              {user?.lang === 'en' ? 'Live Month Proportions' : 'Bu Ayki Harcama Dağılımı'}
            </p>
          </div>

          {/* RECHARTS PIE CHART */}
          <div className="w-[170px] h-[170px] relative flex items-center justify-center pt-2">
            {analysis503020.totalExpense > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: user?.lang === 'en' ? 'Needs' : 'İhtiyaçlar', value: analysis503020.needsSum, color: '#3B82F6' },
                        { name: user?.lang === 'en' ? 'Wants' : 'İstekler', value: analysis503020.wantsSum, color: '#EC4899' },
                        { name: user?.lang === 'en' ? 'Savings' : 'Tasarruf/Yatırım', value: analysis503020.savingsSum, color: '#10B981' }
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {[
                        { color: '#3B82F6' },
                        { color: '#EC4899' },
                        { color: '#10B981' }
                      ].map((cell, index) => (
                        <Cell key={`cell-${index}`} fill={cell.color} className="filter drop-shadow-[0_0_8px_var(--cell-color)]" style={{ '--cell-color': cell.color } as any} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Central Status Indicator */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-3 text-center">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Score</span>
                  <span className={`text-base font-black tracking-tight mt-1 ${
                    analysis503020.score === 'excellent' 
                      ? 'text-emerald-500 dark:text-emerald-400' 
                      : analysis503020.score === 'good'
                      ? 'text-brand-500 dark:text-brand-400'
                      : analysis503020.score === 'warning'
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-rose-500 dark:text-rose-400 animate-pulse'
                  }`}>
                    {analysis503020.score === 'excellent' ? '100' : analysis503020.score === 'good' ? '85' : analysis503020.score === 'warning' ? '60' : '40'}
                  </span>
                </div>
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-center text-[10px] font-bold text-slate-400/80 p-4 leading-normal">
                {user?.lang === 'en' ? 'Add expenses to see proportions' : 'Oranları görmek için harcama girin'}
              </div>
            )}
          </div>

          {/* Simple Legend */}
          <div className="flex items-center justify-between w-full text-[10px] font-bold px-1 border-t border-slate-100 dark:border-slate-800/60 pt-3.5 mt-1">
            <div className="flex items-center space-x-1.5 text-blue-500">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
              <span>{user?.lang === 'en' ? 'Needs' : 'İhtiyaç'}: %{analysis503020.needsPercent}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-pink-500">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_5px_rgba(236,72,153,0.5)]" />
              <span>{user?.lang === 'en' ? 'Wants' : 'İstek'}: %{analysis503020.wantsPercent}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
              <span>{user?.lang === 'en' ? 'Savings' : 'Yatırım'}: %{analysis503020.savingsPercent}</span>
            </div>
          </div>

        </div>

        {/* AI Coach Detailed Analysis Card */}
        <div className="lg:col-span-2 p-5 rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
          
          <div className="space-y-4 flex-1">
            {/* Header with status */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60 w-full">
              <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm tracking-tight flex items-center space-x-2">
                <span className="p-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-lg shrink-0">
                  <Brain size={14} className="animate-pulse" />
                </span>
                <span>{user?.lang === 'en' ? 'AI Financial Coach Insights' : 'AI Finansal Bütçe Koçu Raporu'}</span>
              </h4>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                analysis503020.score === 'excellent' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                  : analysis503020.score === 'good'
                  ? 'bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400'
                  : analysis503020.score === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                  : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 animate-pulse'
              }`}>
                {analysis503020.statusText}
              </span>
            </div>

            {/* Sub-bars comparing targets */}
            <div className="space-y-3">
              {/* Needs bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <span>{user?.lang === 'en' ? 'Needs (Essential Expenses)' : 'İhtiyaçlar (Temel Yaşam & Faturalar)'}</span>
                  <span className="flex items-center space-x-1.5 font-semibold">
                    <span className="text-blue-500">%{analysis503020.needsPercent}</span>
                    <span className="text-slate-300 dark:text-slate-600">/</span>
                    <span>50%</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]" 
                    style={{ width: `${Math.min(analysis503020.needsPercent, 100)}%` }} 
                  />
                  {analysis503020.needsPercent > 50 && (
                    <div 
                      className="h-full bg-rose-500 transition-all duration-500 animate-pulse" 
                      style={{ width: `${Math.min(analysis503020.needsPercent - 50, 50)}%` }}
                    />
                  )}
                </div>
              </div>

              {/* Wants bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <span>{user?.lang === 'en' ? 'Wants (Leisure & Luxury)' : 'İstekler (Kafe, Eğlence, Lüks)'}</span>
                  <span className="flex items-center space-x-1.5 font-semibold">
                    <span className="text-pink-500">%{analysis503020.wantsPercent}</span>
                    <span className="text-slate-300 dark:text-slate-600">/</span>
                    <span>30%</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-pink-500 rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(236,72,153,0.5)]" 
                    style={{ width: `${Math.min(analysis503020.wantsPercent, 100)}%` }} 
                  />
                  {analysis503020.wantsPercent > 30 && (
                    <div 
                      className="h-full bg-rose-500 transition-all duration-500 animate-pulse" 
                      style={{ width: `${Math.min(analysis503020.wantsPercent - 30, 70)}%` }}
                    />
                  )}
                </div>
              </div>

              {/* Savings bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <span>{user?.lang === 'en' ? 'Savings & Investments (Altın, Hisse, Birikim)' : 'Tasarruf & Yatırım (Altın, Borsa, Hedefler)'}</span>
                  <span className="flex items-center space-x-1.5 font-semibold">
                    <span className="text-emerald-500">%{analysis503020.savingsPercent}</span>
                    <span className="text-slate-300 dark:text-slate-600">/</span>
                    <span>20%</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" 
                    style={{ width: `${Math.min(analysis503020.savingsPercent, 100)}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* AI Speech Bubble Advice */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-relaxed relative flex items-start space-x-2 mt-4 select-text">
              <span className="text-lg leading-none select-none">💬</span>
              <span>{analysis503020.adviceText}</span>
            </div>

          </div>

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
