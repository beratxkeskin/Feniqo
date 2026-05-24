import React, { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, calculateSavingsRate, formatMonthName } from '../utils/formatters';
import { calculateMoneyScore } from '../utils/scoreCalculator';
import { calculateSpendingForecast } from '../utils/predictiveAnalytics';
import { StatCard } from '../components/common/StatCard';
import { ChartCard } from '../components/charts/ChartCard';
import { BudgetProgress } from '../components/budgets/BudgetProgress';
import { TransactionList } from '../components/transactions/TransactionList';
import { TransactionForm } from '../components/forms/TransactionForm';
import { EmptyState } from '../components/common/EmptyState';
import { MoneyScoreGauge } from '../components/dashboard/MoneyScoreGauge';

export const Dashboard: React.FC = () => {
  const { transactions, categories, budgets, debts, goals, assets, currentUserRole } = useData();
  const { user } = useAuth();
  const currency = user?.currency || 'TRY';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNetWorthVisible, setIsNetWorthVisible] = useState(() => {
    const saved = localStorage.getItem('moneymate_networth_visible');
    return saved !== 'false';
  });

  const toggleNetWorth = () => {
    const newValue = !isNetWorthVisible;
    setIsNetWorthVisible(newValue);
    localStorage.setItem('moneymate_networth_visible', newValue.toString());
  };

  // ---------------------------------------------------------------
  // DATE HELPERS & CALCULATIONS
  // ---------------------------------------------------------------
  const currentMonthStr = new Date().toISOString().substring(0, 7); // 'YYYY-MM'

  // Global Net Worth (Liquid + Assets - Debts)
  const globalNetWorth = useMemo(() => {
    const totalInc = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExp = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const liquidCash = totalInc - totalExp;
    
    const assetsSum = assets.reduce((sum, a) => sum + a.value, 0);
    const debtsSum = debts.filter(d => d.type === 'debt' && !d.is_paid).reduce((sum, d) => sum + d.amount, 0);
    
    return liquidCash + assetsSum - debtsSum;
  }, [transactions, assets, debts]);

  // Current Month Transactions
  const currentMonthTxs = transactions.filter(t => t.transaction_date.startsWith(currentMonthStr));

  // 1. Total Income & Expense this month
  const totalIncome = currentMonthTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = currentMonthTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const savingsRate = calculateSavingsRate(totalIncome, totalExpense);

  // 2. Resolve Top Expense Category
  const expenseByCategory: { [catId: string]: number } = {};
  currentMonthTxs
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expenseByCategory[t.category_id] = (expenseByCategory[t.category_id] || 0) + t.amount;
    });

  let topCategoryId = '';
  let maxExpense = 0;
  Object.entries(expenseByCategory).forEach(([catId, amount]) => {
    if (amount > maxExpense) {
      maxExpense = amount;
      topCategoryId = catId;
    }
  });

  const topCategoryObj = categories.find(c => c.id === topCategoryId);
  const topCategoryName = topCategoryObj ? topCategoryObj.name : 'Gider Yok';

  // 3. Son 5 İşlem
  const recentTransactions = transactions.slice(0, 5);

  // 4. Bütçe Durumları (Current Month Budgets with actual spent calculation)
  const currentMonthBudgets = budgets.filter(b => b.month === currentMonthStr);
  const budgetsWithProgress = currentMonthBudgets.map(b => {
    const spent = currentMonthTxs
      .filter(t => t.type === 'expense' && t.category_id === b.category_id)
      .reduce((sum, t) => sum + t.amount, 0);
    const percentage = b.limit_amount > 0 ? Math.round((spent / b.limit_amount) * 100) : 0;
    
    return {
      ...b,
      spent,
      percentage
    };
  });

  // Dynamic threshold limits for alerts
  const warningThreshold = parseInt(localStorage.getItem('moneymate_budget_warning_threshold') || '50');
  const criticalThreshold = parseInt(localStorage.getItem('moneymate_budget_critical_threshold') || '80');
  const blockThreshold = parseInt(localStorage.getItem('moneymate_budget_block_threshold') || '100');

  // Filter Budgets with warning usage for Alerts
  const budgetAlerts = budgetsWithProgress.filter(b => b.percentage >= warningThreshold);

  // 5. Chart 1: Gelir ve Gider Karşılaştırması (Past 4 Months including this)
  const getPastMonths = (count: number) => {
    const list = [];
    const date = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      list.push(d.toISOString().substring(0, 7));
    }
    return list;
  };

  const pastMonths = getPastMonths(4);
  const monthlyCompareData = pastMonths.map(month => {
    const monthTxs = transactions.filter(t => t.transaction_date.startsWith(month));
    const inc = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const exp = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    return {
      name: formatMonthName(month).split(' ')[0], // just month name, e.g. "Mayıs"
      gelir: inc,
      gider: exp
    };
  });

  // 6. Chart 2: Kategoriye Göre Gider Dağılımı (Donut Chart)
  const categoryDistributionData = Object.entries(expenseByCategory).map(([catId, amount]) => {
    const cat = categories.find(c => c.id === catId);
    return {
      name: cat ? cat.name : 'Diğer',
      value: amount,
      color: cat ? cat.color : '#6B7280'
    };
  }).sort((a, b) => b.value - a.value);

  // 7. MoneyScore™ Finansal Sağlık Skoru Hesaplaması
  const scoreData = useMemo(() => {
    return calculateMoneyScore(transactions, budgets, debts, goals, categories, currentMonthStr);
  }, [transactions, budgets, debts, goals, categories, currentMonthStr]);

  // 7.5. AI Finansal Harcama Tahmini (Predictive Analytics)
  const forecastData = useMemo(() => {
    return calculateSpendingForecast(transactions, currentMonthStr);
  }, [transactions, currentMonthStr]);

  // 8. Geçen Ay Verileri (Trend Karşılaştırması)
  const prevMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().substring(0, 7);
  }, []);

  const prevMonthTxs = useMemo(() => transactions.filter(t => t.transaction_date.startsWith(prevMonth)), [transactions, prevMonth]);
  
  const prevIncome = useMemo(() => prevMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0), [prevMonthTxs]);
  const prevExpense = useMemo(() => prevMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0), [prevMonthTxs]);

  const incomeTrend = prevIncome > 0 ? Math.round(((totalIncome - prevIncome) / prevIncome) * 100) : null;
  const expenseTrend = prevExpense > 0 ? Math.round(((totalExpense - prevExpense) / prevExpense) * 100) : null;

  // Gider/gelir progress oranı (harcama / gelir yüzdesi)
  const spendingRatio = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;
  // Bütçe doluluk ortalaması
  const avgBudgetUsage = budgetsWithProgress.length > 0
    ? Math.round(budgetsWithProgress.reduce((sum, b) => sum + Math.min(b.percentage, 100), 0) / budgetsWithProgress.length)
    : 0;
  // Ayın kaçıncı günü (ilerleme)
  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100);

  return (
    <div className="space-y-6">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Gösterge Paneli
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Finansal durumunuzun anlık özeti ve bütçe analizleri.
            </p>
          </div>
          
          {/* Global Net Worth Badge */}
          <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-slate-800" />
          
          <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
            <a href="#/networth" className="flex items-center space-x-3 cursor-pointer" title="Varlıklarım sayfasına git">
              <div className="p-2 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl ring-1 ring-brand-500/20 group-hover:scale-105 transition-transform duration-200">
                <Icons.Wallet size={18} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1 group-hover:text-brand-500 transition-colors">
                  Toplam Net Varlık
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">
                    {isNetWorthVisible ? formatCurrency(globalNetWorth, currency) : '****'}
                  </span>
                </div>
              </div>
            </a>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleNetWorth(); }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
              title="Gizle/Göster"
            >
              {isNetWorthVisible ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
            </button>
          </div>
        </div>
        
        {currentUserRole !== 'viewer' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="premium-btn-primary self-start md:self-center flex items-center space-x-2 py-2 px-4.5 text-sm shadow-md"
          >
            <Icons.Plus size={16} strokeWidth={2.5} />
            <span>Hızlı İşlem Ekle</span>
          </button>
        )}
      </div>

      {/* MONEYSCORE HERO + STAT CARDS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* MoneyScore Gauge - Left Column */}
        <div className="lg:col-span-5">
          <MoneyScoreGauge scoreData={scoreData} />
        </div>

        {/* Stat Cards - Right Column (2x2 grid) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title="Aylık Gelir"
            value={formatCurrency(totalIncome, currency)}
            iconName="ArrowUpRight"
            variant="success"
            subtext="Bu ay kazanılan"
            trend={incomeTrend != null ? { value: `%${Math.abs(incomeTrend)}`, isPositive: incomeTrend >= 0 } : undefined}
            progress={monthProgress}
            progressLabel={`Ayın ${dayOfMonth}. günü / ${daysInMonth} gün`}
          />
          <StatCard
            title="Aylık Gider"
            value={formatCurrency(totalExpense, currency)}
            iconName="ArrowDownLeft"
            variant="danger"
            subtext="Bu ay harcanan"
            trend={expenseTrend != null ? { value: `%${Math.abs(expenseTrend)}`, isPositive: expenseTrend <= 0 } : undefined}
            progress={spendingRatio}
            progressLabel="Gelire oranla harcanan"
          />
          <StatCard
            title="Kalan Bakiye"
            value={formatCurrency(balance, currency)}
            iconName="Wallet"
            variant={balance >= 0 ? 'info' : 'danger'}
            subtext="Ay sonuna kalan"
            progress={totalIncome > 0 ? Math.max(0, Math.round((balance / totalIncome) * 100)) : 0}
            progressLabel="Gelirinizin kalan kısmı"
          />
          <StatCard
            title="Tasarruf Oranı"
            value={`%${savingsRate}`}
            iconName="Percent"
            variant="primary"
            subtext={`En çok: ${topCategoryName}`}
            progress={avgBudgetUsage}
            progressLabel="Ort. bütçe kullanımı"
          />
        </div>
      </div>

      {/* BUDGET ALERTS SECTION */}
      {budgetAlerts.length > 0 && (
        <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {budgetAlerts.map(alert => {
            const cat = categories.find(c => c.id === alert.category_id);
            const isBlocked = alert.percentage >= blockThreshold;
            const isCritical = alert.percentage >= criticalThreshold;

            let cardStyles = 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/50 text-yellow-800 dark:text-yellow-300';
            let iconStyles = 'bg-yellow-500/10 text-yellow-500';
            let titleText = user?.lang === 'en' ? 'Budget Nearing Limit!' : 'Bütçe Doluyor Uyarısı!';
            
            if (isBlocked) {
              cardStyles = 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300 animate-pulse';
              iconStyles = 'bg-red-500/10 text-red-500';
              titleText = user?.lang === 'en' ? 'Budget Completely Exceeded!' : 'Bütçe Tamamen Aşıldı!';
            } else if (isCritical) {
              cardStyles = 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300';
              iconStyles = 'bg-amber-500/10 text-amber-500';
              titleText = user?.lang === 'en' ? 'Critical Budget Threshold!' : 'Kritik Bütçe Eşiği!';
            }
            
            return (
              <div 
                key={alert.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${cardStyles}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${iconStyles}`}>
                    <Icons.AlertTriangle size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wider">
                      {titleText}
                    </h5>
                    <p className="text-xs font-medium opacity-90 mt-0.5">
                      {user?.lang === 'en' ? (
                        <>Your spending in <strong>{cat?.name}</strong> category has reached <strong>%{alert.percentage}</strong> of your budget limit!</>
                      ) : (
                        <><strong>{cat?.name}</strong> kategorisindeki harcamanız bütçe limitinizin <strong>%{alert.percentage}</strong> kadarına ulaştı!</>
                      )}
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-block text-[10px] font-bold tracking-widest bg-white dark:bg-slate-900/40 px-2 py-1 rounded-lg">
                  {formatCurrency(alert.spent, currency)} / {formatCurrency(alert.limit_amount, currency)}
                </span>
              </div>
            );
          })}

          {/* AI Coach Alert Suggestion Banner */}
          <div className="relative overflow-hidden p-4 rounded-2xl border border-indigo-500/20 bg-white dark:bg-slate-900 shadow-sm flex items-start space-x-3.5 mt-2 animate-in fade-in slide-in-from-top-1 duration-300 group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:bg-indigo-500/20" />
            
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-indigo-500/20 z-10 group-hover:scale-105 transition-transform duration-300">
              <Icons.Brain size={18} className="animate-pulse" />
            </div>
            <div className="space-y-1.5 z-10">
              <h5 className="font-bold text-xs uppercase tracking-widest text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                <span>{user?.lang === 'en' ? 'AI Financial Coach Alert' : 'AI Finansal Koç Bildirimi'}</span>
                <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold tracking-widest text-indigo-600 dark:text-indigo-400 animate-pulse">
                  {user?.lang === 'en' ? 'Live Analysis' : 'Canlı Analiz'}
                </span>
              </h5>
              <p className="text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                {user?.lang === 'en' ? (
                  <>You have budget items close to or exceeding limits. To balance your monthly budget, consider pausing non-essential subscriptions or postponing discretionary shopping in the <strong className="text-slate-900 dark:text-white">{categories.find(c => c.id === budgetAlerts[0].category_id)?.name}</strong> category.</>
                ) : (
                  <>Belirlediğiniz bütçe limitlerine yaklaşıyorsunuz veya limitleri aştınız. Aylık bütçenizi dengelemek için bu dönem <strong className="text-slate-900 dark:text-white">{categories.find(c => c.id === budgetAlerts[0].category_id)?.name}</strong> kategorisindeki zorunlu olmayan değişken harcamalarınızı ertelemenizi tavsiye ederim.</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI PREDICTIVE ANALYTICS CARD */}
      <div className="relative overflow-hidden p-5 rounded-2xl border border-indigo-500/20 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300 group">
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none transition-opacity group-hover:bg-indigo-500/20" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 dark:bg-slate-800 rounded-xl shadow-sm border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/10 group-hover:scale-105 transition-transform duration-300">
              <Icons.Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Akıllı Harcama Tahmini
                <span className="text-[9px] uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">Yapay Zeka</span>
              </h3>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1 max-w-lg leading-relaxed">
                {forecastData.message}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6 md:border-l border-indigo-500/20 md:pl-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Ay Sonu Tahmini</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {formatCurrency(forecastData.projectedExpense, currency)}
                </span>
                {forecastData.trendPercentage !== 0 && (
                  <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-md ${forecastData.trendPercentage > 0 ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                    {forecastData.trendPercentage > 0 ? '↗' : '↘'} %{Math.abs(forecastData.trendPercentage)}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Tahmini Bakiye</p>
              <span className={`text-xl font-extrabold tracking-tight ${forecastData.isSafe ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(forecastData.projectedBalance, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Double Bar Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Aylık Finansal Karşılaştırma"
            subtitle="Gelir ve Gider Mukayesesi"
            type="bar-compare"
            data={monthlyCompareData}
          />
        </div>

        {/* Donut Chart */}
        <div className="lg:col-span-1">
          <ChartCard
            title="Bu Ay Harcama Dağılımı"
            subtitle="Kategorilere Göre Dağılım"
            type="pie-category"
            data={categoryDistributionData}
          />
        </div>

      </div>

      {/* FOOTER SPLIT: RECENT TRANSACTIONS & BUDGET TRACKING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Son İşlemler</h3>
            <a 
              href="#/transactions" 
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1"
            >
              <span>Tümünü Gör</span>
              <Icons.ChevronRight size={14} />
            </a>
          </div>

          {recentTransactions.length > 0 ? (
            <TransactionList 
              transactions={recentTransactions} 
              onEdit={() => { window.location.hash = '#/transactions'; }} 
            />
          ) : (
            <EmptyState
              iconName="Inbox"
              title="Henüz İşlem Yok"
              description="Bu aya ait herhangi bir finansal işlem kaydetmediniz. Gelir veya gider ekleyerek başlayabilirsiniz."
              actionText={currentUserRole !== 'viewer' ? "İlk İşlemi Ekle" : undefined}
              onAction={currentUserRole !== 'viewer' ? () => setIsModalOpen(true) : undefined}
            />
          )}
        </div>

        {/* Budget Progress Bars summary */}
        <div className="lg:col-span-1 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Bütçe Takibi</h3>
            <a 
              href="#/budgets" 
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1"
            >
              <span>Limitleri Düzenle</span>
              <Icons.ChevronRight size={14} />
            </a>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-5">
            {budgetsWithProgress.length > 0 ? (
              <div className="space-y-4">
                {budgetsWithProgress.slice(0, 3).map((budget) => {
                  const cat = categories.find(c => c.id === budget.category_id);
                  return (
                    <div key={budget.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: cat?.color }} />
                          <span>{cat?.name}</span>
                        </span>
                      </div>
                      <BudgetProgress spent={budget.spent} limit={budget.limit_amount} showDetails={false} />
                    </div>
                  );
                })}
                {budgetsWithProgress.length > 3 && (
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 text-center tracking-wider uppercase pt-1">
                    ve {budgetsWithProgress.length - 3} bütçe limiti daha var.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500 space-y-3">
                <Icons.PieChart size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-medium max-w-[200px] mx-auto leading-relaxed">
                  Henüz bu ay için kategori limitleri oluşturmadınız.
                </p>
                <button
                  onClick={() => { window.location.hash = '#/budgets'; }}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline inline-block pt-1"
                >
                  Bütçe Oluştur
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* QUICK TRANSACTION ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Yeni Gelir / Gider İşlemi Ekle</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <Icons.X size={18} />
              </button>
            </div>
            <TransactionForm onSuccess={() => setIsModalOpen(false)} onCancel={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
