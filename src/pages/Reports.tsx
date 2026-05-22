import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatMonthName, formatShortDate } from '../utils/formatters';
import { ChartCard } from '../components/charts/ChartCard';

type PeriodType = 'this-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'this-year' | 'custom';

export const Reports: React.FC = () => {
  const { transactions, categories } = useData();
  const { user } = useAuth();
  const currency = user?.currency || 'TRY';

  const [period, setPeriod] = useState<PeriodType>('this-month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ---------------------------------------------------------------
  // CALCULATE DATE BOUNDARIES FOR FILTERS
  // ---------------------------------------------------------------
  const dateBoundaries = useMemo(() => {
    const now = new Date();
    let start = '';
    let end = now.toISOString().split('T')[0];

    switch (period) {
      case 'this-month':
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'last-month':
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        start = prevMonthStart.toISOString().split('T')[0];
        end = prevMonthEnd.toISOString().split('T')[0];
        break;
      case 'last-3-months':
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
        break;
      case 'last-6-months':
        start = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
        break;
      case 'this-year':
        start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      case 'custom':
        start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        end = endDate || now.toISOString().split('T')[0];
        break;
    }

    return { start, end };
  }, [period, startDate, endDate]);

  // Filter transactions belonging to this period
  const periodTxs = useMemo(() => {
    const { start, end } = dateBoundaries;
    return transactions.filter(t => t.transaction_date >= start && t.transaction_date <= end);
  }, [transactions, dateBoundaries]);

  // ---------------------------------------------------------------
  // CHART 1: MONTHLY INCOME VS EXPENSE COMPARISON
  // ---------------------------------------------------------------
  const monthlyCompareData = useMemo(() => {
    // Collect all unique months in the filtered period
    const monthsSet = new Set<string>();
    periodTxs.forEach(t => {
      monthsSet.add(t.transaction_date.substring(0, 7));
    });

    const sortedMonths = Array.from(monthsSet).sort();

    return sortedMonths.map((mStr) => {
      const monthTxs = periodTxs.filter(t => t.transaction_date.startsWith(mStr));
      const inc = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const exp = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      return {
        name: formatMonthName(mStr).split(' ')[0], // only month name
        gelir: inc,
        gider: exp
      };
    });
  }, [periodTxs]);

  // ---------------------------------------------------------------
  // CHART 2: CATEGORY EXPENSE BREAKDOWN (DONUT)
  // ---------------------------------------------------------------
  const categoryDonutData = useMemo(() => {
    const expenseByCategory: { [catId: string]: number } = {};
    periodTxs
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expenseByCategory[t.category_id] = (expenseByCategory[t.category_id] || 0) + t.amount;
      });

    return Object.entries(expenseByCategory).map(([catId, amount]) => {
      const cat = categories.find(c => c.id === catId);
      return {
        name: cat ? cat.name : 'Diğer',
        value: amount,
        color: cat ? cat.color : '#6B7280'
      };
    }).sort((a, b) => b.value - a.value);
  }, [periodTxs, categories]);

  // ---------------------------------------------------------------
  // CHART 3: DAILY SPENDING TREND (AREA)
  // ---------------------------------------------------------------
  const dailySpendingData = useMemo(() => {
    const spentByDate: { [date: string]: number } = {};
    
    periodTxs
      .filter(t => t.type === 'expense')
      .forEach(t => {
        spentByDate[t.transaction_date] = (spentByDate[t.transaction_date] || 0) + t.amount;
      });

    return Object.entries(spentByDate).map(([date, amount]) => ({
      name: formatShortDate(date),
      value: amount,
      rawDate: date
    })).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [periodTxs]);

  // ---------------------------------------------------------------
  // CHART 4: BALANCE PROGRESSION (SON 6 AY BAKIYE DEGISIMI)
  // ---------------------------------------------------------------
  const balanceTrendData = useMemo(() => {
    // Generate last 6 months list YYYY-MM
    const getPastMonthsList = (count: number) => {
      const list = [];
      const date = new Date();
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
        list.push(d.toISOString().substring(0, 7));
      }
      return list;
    };

    const past6Months = getPastMonthsList(6);
    
    return past6Months.map((mStr) => {
      // Calculate total cumulative balance up to this month
      // Net balance is cumulative from all historical transactions up to the end of this month!
      const limitDate = new Date(parseInt(mStr.split('-')[0]), parseInt(mStr.split('-')[1]), 0).toISOString().split('T')[0];
      
      const historicalTxs = transactions.filter(t => t.transaction_date <= limitDate);
      const histIncome = historicalTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const histExpense = historicalTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      return {
        name: formatMonthName(mStr).split(' ')[0],
        value: histIncome - histExpense
      };
    });
  }, [transactions]);

  // Summary Metrics for the Filtered Period
  const periodSummary = useMemo(() => {
    const inc = periodTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const exp = periodTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return {
      income: inc,
      expense: exp,
      net: inc - exp
    };
  }, [periodTxs]);

  return (
    <div className="space-y-6">
      
      {/* Page Title & Period Selector */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Analiz ve Raporlar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Gelir, gider ve birikimlerinizi zengin analitik grafiklerle derinlemesine inceleyin.
          </p>
        </div>

        {/* Filter Selection Panel */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm self-start">
          <button
            onClick={() => setPeriod('this-month')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              period === 'this-month' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Bu Ay
          </button>
          <button
            onClick={() => setPeriod('last-month')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              period === 'last-month' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Geçen Ay
          </button>
          <button
            onClick={() => setPeriod('last-3-months')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              period === 'last-3-months' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Son 3 Ay
          </button>
          <button
            onClick={() => setPeriod('last-6-months')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              period === 'last-6-months' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Son 6 Ay
          </button>
          <button
            onClick={() => setPeriod('this-year')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              period === 'this-year' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Bu Yıl
          </button>
          <button
            onClick={() => setPeriod('custom')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              period === 'custom' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Özel Tarih
          </button>
        </div>
      </div>

      {/* CUSTOM DATE FIELD CONTAINER */}
      {period === 'custom' && (
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300 shadow-sm">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider pl-1">Başlangıç Tarihi</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="premium-input text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider pl-1">Bitiş Tarihi</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="premium-input text-xs"
            />
          </div>
        </div>
      )}

      {/* PERIOD SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Income */}
        <div className="p-4.5 rounded-2xl border border-emerald-100 dark:border-emerald-950/20 bg-emerald-500/5 dark:bg-emerald-500/5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Dönem Toplam Gelir</span>
            <strong className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">
              {formatCurrency(periodSummary.income, currency)}
            </strong>
          </div>
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <TrendingUp size={18} />
          </div>
        </div>

        {/* Expense */}
        <div className="p-4.5 rounded-2xl border border-red-100 dark:border-red-950/20 bg-red-500/5 dark:bg-red-500/5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Dönem Toplam Gider</span>
            <strong className="text-xl font-extrabold text-red-600 dark:text-red-400 block mt-1">
              {formatCurrency(periodSummary.expense, currency)}
            </strong>
          </div>
          <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
            <TrendingUp size={18} className="transform rotate-180" />
          </div>
        </div>

        {/* Net Savings */}
        <div className="p-4.5 rounded-2xl border border-blue-100 dark:border-blue-950/20 bg-blue-500/5 dark:bg-blue-500/5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Dönem Net Tasarruf</span>
            <strong className={`text-xl font-extrabold block mt-1 ${periodSummary.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(periodSummary.net, currency)}
            </strong>
          </div>
          <div className={`p-2 rounded-xl ${periodSummary.net >= 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
            <BarChart3 size={18} />
          </div>
        </div>

      </div>

      {/* CHARTS CONTAINER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly compare */}
        <ChartCard
          title="Gelir / Gider Değişimi"
          subtitle="Dönemsel Karşılaştırma"
          type="bar-compare"
          data={monthlyCompareData}
        />

        {/* Category distribution */}
        <ChartCard
          title="Gider Kategori Dağılımı"
          subtitle="Kategori Bazlı Gider Dağılımı"
          type="pie-category"
          data={categoryDonutData}
        />

        {/* Daily Spending Trend */}
        <ChartCard
          title="Günlük Harcama Trendi"
          subtitle="Dönem İçi Harcama Değişimi"
          type="area-spending"
          data={dailySpendingData}
        />

        {/* 6 Month Cumulative Balance */}
        <ChartCard
          title="Son 6 Aylık Bakiye Değişimi"
          subtitle="Kümülatif Tasarruf Trendi"
          type="line-balance"
          data={balanceTrendData}
        />

      </div>

    </div>
  );
};

export default Reports;
