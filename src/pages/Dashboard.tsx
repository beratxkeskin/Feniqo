import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, calculateSavingsRate, formatMonthName } from '../utils/formatters';
import { StatCard } from '../components/common/StatCard';
import { ChartCard } from '../components/charts/ChartCard';
import { BudgetProgress } from '../components/budgets/BudgetProgress';
import { TransactionList } from '../components/transactions/TransactionList';
import { TransactionForm } from '../components/forms/TransactionForm';
import { EmptyState } from '../components/common/EmptyState';

export const Dashboard: React.FC = () => {
  const { transactions, categories, budgets } = useData();
  const { user } = useAuth();
  const currency = user?.currency || 'TRY';

  const [isModalOpen, setIsModalOpen] = useState(false);

  // ---------------------------------------------------------------
  // DATE HELPERS & CALCULATIONS
  // ---------------------------------------------------------------
  const currentMonthStr = new Date().toISOString().substring(0, 7); // 'YYYY-MM'

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

  // Filter Budgets with >80% usage for Alerts
  const budgetAlerts = budgetsWithProgress.filter(b => b.percentage >= 80);

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

  return (
    <div className="space-y-6">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gösterge Paneli
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Finansal durumunuzun anlık özeti ve bütçe analizleri.
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="premium-btn-primary self-start sm:self-center flex items-center space-x-2 py-2 px-4.5 text-sm shadow-md"
        >
          <Icons.Plus size={16} strokeWidth={2.5} />
          <span>Hızlı İşlem Ekle</span>
        </button>
      </div>

      {/* STAT CARDS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Aylık Gelir"
          value={formatCurrency(totalIncome, currency)}
          iconName="ArrowUpRight"
          variant="success"
          subtext="Bu ay kazanılan"
        />
        <StatCard
          title="Aylık Gider"
          value={formatCurrency(totalExpense, currency)}
          iconName="ArrowDownLeft"
          variant="danger"
          subtext="Bu ay harcanan"
        />
        <StatCard
          title="Kalan Bakiye"
          value={formatCurrency(balance, currency)}
          iconName="Wallet"
          variant={balance >= 0 ? 'info' : 'danger'}
          subtext="Ay sonuna kalan"
        />
        <StatCard
          title="Tasarruf Oranı"
          value={`%${savingsRate}`}
          iconName="Percent"
          variant="primary"
          subtext={`En çok: ${topCategoryName}`}
        />
      </div>

      {/* BUDGET ALERTS SECTION */}
      {budgetAlerts.length > 0 && (
        <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {budgetAlerts.map(alert => {
            const cat = categories.find(c => c.id === alert.category_id);
            const isCritical = alert.percentage >= 100;
            
            return (
              <div 
                key={alert.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  isCritical 
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300'
                    : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${isCritical ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    <Icons.AlertTriangle size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wider">
                      {isCritical ? 'Kritik Bütçe Aşımı!' : 'Bütçe Limitine Yaklaşıldı!'}
                    </h5>
                    <p className="text-xs font-medium opacity-90 mt-0.5">
                      <strong>{cat?.name}</strong> kategorisindeki harcamanız bütçe limitinizin <strong>%{alert.percentage}</strong> kadarına ulaştı!
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-block text-[10px] font-bold tracking-widest bg-white dark:bg-slate-900/40 px-2 py-1 rounded-lg">
                  {formatCurrency(alert.spent, currency)} / {formatCurrency(alert.limit_amount, currency)}
                </span>
              </div>
            );
          })}
        </div>
      )}

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
              actionText="İlk İşlemi Ekle"
              onAction={() => setIsModalOpen(true)}
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
                <Icons.PiggyBank size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
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
                className="p-1.5 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
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
