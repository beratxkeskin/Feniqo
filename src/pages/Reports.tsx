import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart, 
  Sparkles,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatMonthName, formatShortDate } from '../utils/formatters';
import { ChartCard } from '../components/charts/ChartCard';

type PeriodType = 'this-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'this-year' | 'custom';

export const Reports: React.FC = () => {
  const { transactions, categories, budgets } = useData();
  const { user } = useAuth();
  const currency = user?.currency || 'TRY';
  const isEn = user?.lang === 'en';

  const [activeTab, setActiveTab] = useState<'charts' | 'summaries'>('charts');
  const [period, setPeriod] = useState<PeriodType>('this-month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Selected month for detailed monthly summary
  const [selectedMonthStr, setSelectedMonthStr] = useState<string | null>(null);

  // Dynamically load the savings target rate from settings (default to 20)
  const savingsTarget = useMemo(() => {
    const stored = localStorage.getItem('moneymate_savings_target');
    return stored ? parseInt(stored) : 20;
  }, []);

  // Translations dictionary for dual-language support (TR & EN)
  const t = useMemo(() => {
    return {
      title: isEn ? 'Analytics & Reports' : 'Analiz ve Raporlar',
      subtitle: isEn ? 'Explore your income, expenses, and savings with rich analytical charts.' : 'Gelir, gider ve birikimlerinizi zengin analitik grafiklerle derinlemesine inceleyin.',
      tabCharts: isEn ? 'Graphical Charts' : 'Grafik Analizleri',
      tabSummaries: isEn ? 'Monthly Summaries' : 'Aylık Finans Özetleri',
      
      // Charts tab translations
      thisMonth: isEn ? 'This Month' : 'Bu Ay',
      lastMonth: isEn ? 'Last Month' : 'Geçen Ay',
      last3Months: isEn ? 'Last 3 Months' : 'Son 3 Ay',
      last6Months: isEn ? 'Last 6 Months' : 'Son 6 Ay',
      thisYear: isEn ? 'This Year' : 'Bu Yıl',
      customDate: isEn ? 'Custom Date' : 'Özel Tarih',
      startDateLabel: isEn ? 'Start Date' : 'Başlangıç Tarihi',
      endDateLabel: isEn ? 'End Date' : 'Bitiş Tarihi',
      periodIncome: isEn ? 'Period Total Income' : 'Dönem Toplam Gelir',
      periodExpense: isEn ? 'Period Total Expense' : 'Dönem Toplam Gider',
      periodNet: isEn ? 'Period Net Savings' : 'Dönem Net Tasarruf',
      chart1Title: isEn ? 'Income / Expense Change' : 'Gelir / Gider Değişimi',
      chart1Subtitle: isEn ? 'Period Comparison' : 'Dönemsel Karşılaştırma',
      chart2Title: isEn ? 'Expense Category Distribution' : 'Gider Kategori Dağılımı',
      chart2Subtitle: isEn ? 'Category-wise Expenses' : 'Kategori Bazlı Gider Dağılımı',
      chart3Title: isEn ? 'Daily Spending Trend' : 'Günlük Harcama Trendi',
      chart3Subtitle: isEn ? 'Spending Trends over Period' : 'Dönem İçi Harcama Değişimi',
      chart4Title: isEn ? 'Last 6 Months Balance Change' : 'Son 6 Aylık Bakiye Değişimi',
      chart4Subtitle: isEn ? 'Cumulative Savings Trend' : 'Kümülatif Tasarruf Trendi',
      
      // Monthly Summaries tab translations
      noData: isEn ? 'No transaction data available yet.' : 'Henüz hesaplanacak işlem bulunmuyor.',
      monthListHeader: isEn ? 'Historical Months' : 'Geçmiş Aylar',
      selectMonthPrompt: isEn ? 'Select a month from the list to view its financial digest.' : 'Finansal özet raporunu incelemek için listeden bir ay seçin.',
      summaryReportTitle: isEn ? 'Monthly Financial Digest' : 'Aylık Finansal Özet Raporu',
      performanceMetrics: isEn ? 'Monthly Summary Report' : 'Aylık Özet Raporu',
      incomeLabel: isEn ? 'Total Income' : 'Toplam Gelir',
      expenseLabel: isEn ? 'Total Expense' : 'Toplam Gider',
      netLabel: isEn ? 'Net Balance' : 'Net Bakiye',
      savingsRateLabel: isEn ? 'Savings Rate' : 'Tasarruf Oranı',
      topCategoryLabel: isEn ? 'Top Spending Category' : 'En Çok Harcama Yapılan Kategori',
      momChangesTitle: isEn ? 'Month-Over-Month Changes' : 'Geçen Aya Göre Değişim Raporu',
      comparedTo: isEn ? 'vs previous month' : 'önceki aya göre',
      increase: isEn ? 'increased' : 'arttı',
      decrease: isEn ? 'decreased' : 'azaldı',
      noChange: isEn ? 'no change' : 'değişim yok',
      savingsPerformance: isEn ? 'Savings Performance & Tips' : 'Birikim Performansı ve Öneriler',
      noExpenses: isEn ? 'No expenses recorded in this month.' : 'Bu ay herhangi bir harcama yapılmadı.',
      topCategoryText: isEn 
        ? 'Your top spending was in {category} with {amount}, making up {percentage}% of this month\'s total expenses.' 
        : 'Bu ay en çok harcamayı {category} kategorisinde yaptınız. Bu kategorideki toplam harcamanız {amount} oldu ve tüm aylık harcamalarınızın %{percentage} kadarına denk geliyor.',
      incomeChangeText: isEn ? 'Income' : 'Geliriniz',
      expenseChangeText: isEn ? 'Expenses' : 'Harcamalarınız',
      netChangeText: isEn ? 'Net Savings' : 'Net Tasarrufunuz',
      changeBetter: isEn ? 'improved' : 'iyileşti',
      changeWorse: isEn ? 'declined' : 'geriledi',
      coachBest: isEn 
        ? 'Outstanding savings rate! You managed to save a substantial portion of your income. Consider routing this into investments or high-yield savings goals.' 
        : 'Harika bir tasarruf oranı! Gelirinizin büyük bir kısmını biriktirmeyi başardınız. Bu birikimi yatırımlarda değerlendirmeyi veya tasarruf hedeflerinize aktarmayı düşünebilirsiniz.',
      coachGood: isEn 
        ? 'Healthy savings rate. You are matching or exceeding the general rule of saving 20%. Try to trim minor subscriptions to save even more.' 
        : 'Sağlıklı bir tasarruf oranı. Genel kabul gören %20 birikim kuralına ulaştınız veya aştınız. Küçük abonelikleri gözden geçirerek oranı daha da yükseltebilirsiniz.',
      coachLow: isEn 
        ? 'Your savings rate is relatively low. Review your discretionary spending and stay close to your category budgets next month.' 
        : 'Tasarruf oranınız düşük seviyede. Zorunlu olmayan keyfi harcamalarınızı gözden geçirmek ve gelecek ay kategori bütçelerinize sadık kalmak faydalı olabilir.',
      coachNegative: isEn 
        ? 'You spent more than you earned this month. Review non-essential expenses and try to cut down fixed costs where possible.' 
        : 'Bu ay kazandığınızdan daha fazlasını harcadınız. Acil durumlar dışında zorunlu olmayan giderleri azaltmaya ve sabit maliyetleri kısmaya çalışmalısınız.',
      trendTitle: isEn ? 'Category Trend Analysis' : 'Kategori Trend Analizi',
      trendSubtitle: isEn ? 'Smart insights on your spending shifts and budget limits' : 'Harcama değişimleriniz ve bütçe limitlerinize dair akıllı tespitler',
      trendNoData: isEn 
        ? 'No significant category trends or budget overruns detected for this month yet. As you record more transactions, you will see deep insights about your spending habits here.' 
        : 'Bu ay için henüz belirgin bir kategori trendi veya bütçe aşımı tespit edilmedi. Daha fazla harcama kaydettikçe burada harcama alışkanlıklarınıza dair derin analizler göreceksiniz.',
    };
  }, [isEn]);

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
        name: formatMonthName(mStr, isEn).split(' ')[0], // only month name
        gelir: inc,
        gider: exp
      };
    });
  }, [periodTxs, isEn]);

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
        name: cat ? cat.name : (isEn ? 'Other' : 'Diğer'),
        value: amount,
        color: cat ? cat.color : '#6B7280'
      };
    }).sort((a, b) => b.value - a.value);
  }, [periodTxs, categories, isEn]);

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
      const limitDate = new Date(parseInt(mStr.split('-')[0]), parseInt(mStr.split('-')[1]), 0).toISOString().split('T')[0];
      
      const historicalTxs = transactions.filter(t => t.transaction_date <= limitDate);
      const histIncome = historicalTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const histExpense = historicalTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      return {
        name: formatMonthName(mStr, isEn).split(' ')[0],
        value: histIncome - histExpense
      };
    });
  }, [transactions, isEn]);

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

  // ---------------------------------------------------------------
  // MONTHLY FINANCIAL DIGESTS CALCULATION (Aylık Finans Özetleri)
  // ---------------------------------------------------------------
  const monthlySummaries = useMemo(() => {
    if (transactions.length === 0) return [];

    // Find all unique months in format "YYYY-MM"
    const monthsSet = new Set<string>();
    transactions.forEach(t => {
      monthsSet.add(t.transaction_date.substring(0, 7));
    });

    // Sort months descending (newest first)
    const sortedMonths = Array.from(monthsSet).sort().reverse();

    return sortedMonths.map((monthStr) => {
      const monthTxs = transactions.filter(t => t.transaction_date.startsWith(monthStr));
      const income = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const net = income - expense;
      const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;

      // Group expenses by category
      const expenseByCat: { [catId: string]: number } = {};
      monthTxs.filter(t => t.type === 'expense').forEach(t => {
        expenseByCat[t.category_id] = (expenseByCat[t.category_id] || 0) + t.amount;
      });

      let topCategoryName = '';
      let topCategoryColor = '';
      let topCategoryAmount = 0;

      const topCatEntry = Object.entries(expenseByCat).sort((a, b) => b[1] - a[1])[0];
      if (topCatEntry) {
        const [catId, amount] = topCatEntry;
        const cat = categories.find(c => c.id === catId);
        topCategoryName = cat ? cat.name : (isEn ? 'Other' : 'Diğer');
        topCategoryColor = cat ? cat.color : '#6B7280';
        topCategoryAmount = amount;
      }

      // Calculate changes compared to previous month (T-1)
      const [year, month] = monthStr.split('-').map(Number);
      const prevMonthNum = month === 1 ? 12 : month - 1;
      const prevYearNum = month === 1 ? year - 1 : year;
      const prevMonthStr = `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}`;

      const prevMonthTxs = transactions.filter(t => t.transaction_date.startsWith(prevMonthStr));
      
      const prevIncome = prevMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const prevExpense = prevMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const prevNet = prevIncome - prevExpense;

      const calculatePctChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const incomeChange = calculatePctChange(income, prevIncome);
      const expenseChange = calculatePctChange(expense, prevExpense);
      const netChange = calculatePctChange(net, prevNet);

      return {
        monthStr,
        income,
        expense,
        net,
        savingsRate,
        topCategory: topCategoryAmount > 0 ? {
          name: topCategoryName,
          color: topCategoryColor,
          amount: topCategoryAmount
        } : null,
        changes: {
          hasPrev: transactions.some(t => t.transaction_date.startsWith(prevMonthStr)),
          incomeChange,
          expenseChange,
          netChange,
          prevMonthStr
        }
      };
    });
  }, [transactions, categories, isEn]);

  // Set default selected month on mount or when summaries change
  useMemo(() => {
    if (monthlySummaries.length > 0 && !selectedMonthStr) {
      setSelectedMonthStr(monthlySummaries[0].monthStr);
    }
  }, [monthlySummaries, selectedMonthStr]);

  const activeSummary = useMemo(() => {
    return monthlySummaries.find(s => s.monthStr === selectedMonthStr) || null;
  }, [monthlySummaries, selectedMonthStr]);

  // Helper to shift months chronologically
  const getPrevMonthStr = (mStr: string, offset: number = 1): string => {
    const [year, month] = mStr.split('-').map(Number);
    let targetMonth = month - offset;
    let targetYear = year;
    while (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    return `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
  };

  // Dynamic Category Trend Analysis Engine
  const categoryTrends = useMemo(() => {
    if (!selectedMonthStr || transactions.length === 0) return [];

    const T = selectedMonthStr;
    const T1 = getPrevMonthStr(T, 1);
    const T2 = getPrevMonthStr(T, 2);

    // Helper to calculate total spending per category in a specific month
    const getCategoryExpensesForMonth = (monthStr: string) => {
      const monthTxs = transactions.filter(
        t => t.transaction_date.startsWith(monthStr) && t.type === 'expense'
      );
      const totals: { [catId: string]: number } = {};
      monthTxs.forEach(t => {
        totals[t.category_id] = (totals[t.category_id] || 0) + t.amount;
      });
      return totals;
    };

    const expT = getCategoryExpensesForMonth(T);
    const expT1 = getCategoryExpensesForMonth(T1);
    const expT2 = getCategoryExpensesForMonth(T2);

    const trends: Array<{
      id: string;
      type: 'exceed' | 'increase' | 'decrease';
      message: string;
      categoryColor: string;
      categoryName: string;
      badgeText: string;
      badgeColor: 'red' | 'green' | 'amber';
      rawPercentage?: number;
      rawMonths?: number;
    }> = [];

    categories.forEach(cat => {
      const cId = cat.id;
      const name = cat.name;
      const color = cat.color;

      const valT = expT[cId] || 0;
      const valT1 = expT1[cId] || 0;
      const valT2 = expT2[cId] || 0;

      // --- 1. BUDGET EXCEED CHECK ---
      const budgetT = budgets.find(b => b.category_id === cId && b.month === T);
      const budgetT1 = budgets.find(b => b.category_id === cId && b.month === T1);
      const budgetT2 = budgets.find(b => b.category_id === cId && b.month === T2);

      const limitT = budgetT ? budgetT.limit_amount : 0;
      const limitT1 = budgetT1 ? budgetT1.limit_amount : 0;
      const limitT2 = budgetT2 ? budgetT2.limit_amount : 0;

      const isExceededT = limitT > 0 && valT > limitT;
      const isExceededT1 = limitT1 > 0 && valT1 > limitT1;
      const isExceededT2 = limitT2 > 0 && valT2 > limitT2;

      if (isExceededT) {
        let monthsCount = 1;
        if (isExceededT1) {
          monthsCount = 2;
          if (isExceededT2) {
            monthsCount = 3;
          }
        }

        if (monthsCount >= 2) {
          const msg = isEn
            ? `Your ${name} expenses have been exceeding the budget limit for ${monthsCount} months.`
            : `${name} harcamaların bütçe limitini ${monthsCount} aydır aşıyor.`;

          trends.push({
            id: `exceed-${cId}`,
            type: 'exceed',
            message: msg,
            categoryColor: color,
            categoryName: name,
            badgeText: isEn ? 'Budget Overrun' : 'Bütçe Aşımı',
            badgeColor: 'amber',
            rawMonths: monthsCount
          });
        }
      }

      // --- 2. 3-MONTH TREND CHECK ---
      const avgPrev = (valT1 + valT2) / 2;
      if (valT > 0 && avgPrev > 0) {
        const pct = Math.round(((valT - avgPrev) / avgPrev) * 100);
        if (Math.abs(pct) >= 5) {
          if (pct > 0) {
            const msg = isEn
              ? `Your ${name} expenses increased by ${pct}% over the last 3 months.`
              : `${name} harcamaların son 3 ayda %${pct} arttı.`;

            trends.push({
              id: `trend3m-${cId}`,
              type: 'increase',
              message: msg,
              categoryColor: color,
              categoryName: name,
              badgeText: isEn ? '3-Month Increase' : '3 Aylık Artış',
              badgeColor: 'red',
              rawPercentage: pct
            });
          } else {
            const msg = isEn
              ? `Your ${name} expenses decreased by ${Math.abs(pct)}% over the last 3 months.`
              : `${name} harcamaların son 3 ayda %${Math.abs(pct)} azaldı.`;

            trends.push({
              id: `trend3m-${cId}`,
              type: 'decrease',
              message: msg,
              categoryColor: color,
              categoryName: name,
              badgeText: isEn ? '3-Month Decrease' : '3 Aylık Düşüş',
              badgeColor: 'green',
              rawPercentage: Math.abs(pct)
            });
          }
        }
      }

      // --- 3. MoM TREND CHECK ---
      const has3mTrend = trends.some(t => t.id === `trend3m-${cId}`);
      if (!has3mTrend && valT > 0 && valT1 > 0) {
        const pct = Math.round(((valT - valT1) / valT1) * 100);
        if (Math.abs(pct) >= 5) {
          if (pct > 0) {
            const msg = isEn
              ? `Your ${name} expenses increased by ${pct}% compared to last month.`
              : `${name} harcamaların geçen aya göre %${pct} arttı.`;

            trends.push({
              id: `trendMoM-${cId}`,
              type: 'increase',
              message: msg,
              categoryColor: color,
              categoryName: name,
              badgeText: isEn ? 'MoM Increase' : 'Aylık Artış',
              badgeColor: 'red',
              rawPercentage: pct
            });
          } else {
            const msg = isEn
              ? `Your ${name} expenses decreased by ${Math.abs(pct)}% compared to last month.`
              : `${name} harcamaların geçen aya göre %${Math.abs(pct)} azaldı.`;

            trends.push({
              id: `trendMoM-${cId}`,
              type: 'decrease',
              message: msg,
              categoryColor: color,
              categoryName: name,
              badgeText: isEn ? 'MoM Decrease' : 'Aylık Düşüş',
              badgeColor: 'green',
              rawPercentage: Math.abs(pct)
            });
          }
        }
      }
    });

    // Sort trends: budget exceed first, then highest absolute percentage change
    return trends.sort((a, b) => {
      const aPriority = a.type === 'exceed' ? 3 : 2;
      const bPriority = b.type === 'exceed' ? 3 : 2;
      if (aPriority !== bPriority) return bPriority - aPriority;

      const aVal = a.rawPercentage || 0;
      const bVal = b.rawPercentage || 0;
      return bVal - aVal;
    });
  }, [selectedMonthStr, transactions, categories, budgets, isEn]);

  return (
    <div className="space-y-6">
      
      {/* Page Title & Tab Selector */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 size={24} className="text-brand-600 dark:text-brand-400" />
            {t.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t.subtitle}
          </p>
        </div>

        {/* Dynamic Tab Selector */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/40 self-start">
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'charts' 
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/40 dark:border-slate-800/40' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <PieChart size={14} />
            <span>{t.tabCharts}</span>
          </button>
          <button
            onClick={() => setActiveTab('summaries')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'summaries' 
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/40 dark:border-slate-800/40' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>{t.tabSummaries}</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: GRAPHICAL CHARTS VIEW                                  */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          {/* Filter Selection Panel */}
          <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm self-start">
            <button
              onClick={() => setPeriod('this-month')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                period === 'this-month' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.thisMonth}
            </button>
            <button
              onClick={() => setPeriod('last-month')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                period === 'last-month' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.lastMonth}
            </button>
            <button
              onClick={() => setPeriod('last-3-months')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                period === 'last-3-months' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.last3Months}
            </button>
            <button
              onClick={() => setPeriod('last-6-months')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                period === 'last-6-months' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.last6Months}
            </button>
            <button
              onClick={() => setPeriod('this-year')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                period === 'this-year' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.thisYear}
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                period === 'custom' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.customDate}
            </button>
          </div>

          {/* CUSTOM DATE FIELD CONTAINER */}
          {period === 'custom' && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300 shadow-sm">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider pl-1">{t.startDateLabel}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="premium-input text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider pl-1">{t.endDateLabel}</label>
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
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{t.periodIncome}</span>
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
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{t.periodExpense}</span>
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
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{t.periodNet}</span>
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
            <ChartCard
              title={t.chart1Title}
              subtitle={t.chart1Subtitle}
              type="bar-compare"
              data={monthlyCompareData}
            />
            <ChartCard
              title={t.chart2Title}
              subtitle={t.chart2Subtitle}
              type="pie-category"
              data={categoryDonutData}
            />
            <ChartCard
              title={t.chart3Title}
              subtitle={t.chart3Subtitle}
              type="area-spending"
              data={dailySpendingData}
            />
            <ChartCard
              title={t.chart4Title}
              subtitle={t.chart4Subtitle}
              type="line-balance"
              data={balanceTrendData}
            />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: MONTHLY SUMMARIES VIEW                                 */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'summaries' && (
        <div className="animate-in fade-in duration-300">
          {transactions.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
              <HelpCircle size={40} className="mx-auto text-slate-400 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">{t.noData}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Right Column (Desktop) / Top (Mobile): Months list grid */}
              <div className="lg:col-span-4 space-y-4 order-1 lg:order-2">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
                  {t.monthListHeader}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 md:max-h-[600px] md:overflow-y-auto pr-1 gap-3.5 custom-scrollbar">
                  {monthlySummaries.map((summary) => {
                    const isSelected = selectedMonthStr === summary.monthStr;
                    return (
                      <button
                        key={summary.monthStr}
                        onClick={() => setSelectedMonthStr(summary.monthStr)}
                        className={`text-left p-4.5 rounded-2xl border transition-all duration-200 flex items-center justify-between group ${
                          isSelected
                            ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-500/10 scale-[1.01]'
                            : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <span className={`text-sm font-extrabold block transition-colors ${isSelected ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                            {formatMonthName(summary.monthStr, isEn)}
                          </span>
                          <span className={`text-[10px] font-semibold block uppercase tracking-wider ${isSelected ? 'text-brand-100' : 'text-slate-400 dark:text-slate-500'}`}>
                            {t.netLabel}: {formatCurrency(summary.net, currency)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                            isSelected 
                              ? 'bg-brand-700/45 text-white' 
                              : 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                          }`}>
                            %{summary.savingsRate}
                          </span>
                          <ChevronRight size={16} className={`transition-transform duration-200 ${
                            isSelected ? 'translate-x-1 text-white' : 'text-slate-400 group-hover:translate-x-0.5'
                          }`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Left Column (Desktop) / Bottom (Mobile): Expanded details report view */}
              <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
                {activeSummary ? (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-6 shadow-sm space-y-6 animate-in slide-in-from-left-3 duration-300">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-5">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-2xl">
                          <Calendar size={22} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none">
                            {formatMonthName(activeSummary.monthStr, isEn)}
                          </h3>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1.5 inline-block">
                            {t.summaryReportTitle}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-extrabold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.8 rounded-lg tracking-wider uppercase">
                        {t.performanceMetrics}
                      </span>
                    </div>

                    {/* Primary Grid Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Income */}
                      <div className="p-4 bg-emerald-500/5 border border-emerald-100 dark:border-emerald-950/20 rounded-2xl space-y-1.5 relative overflow-hidden">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{t.incomeLabel}</span>
                        <strong className="text-md font-extrabold text-emerald-600 dark:text-emerald-400 block truncate">
                          {formatCurrency(activeSummary.income, currency)}
                        </strong>
                        {activeSummary.changes.hasPrev && (
                          <div className="flex items-center space-x-1 text-[10px] font-bold">
                            {activeSummary.changes.incomeChange > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                                <ArrowUpRight size={12} className="mr-0.5" />
                                +{activeSummary.changes.incomeChange}%
                              </span>
                            ) : activeSummary.changes.incomeChange < 0 ? (
                              <span className="text-red-600 dark:text-red-400 flex items-center">
                                <ArrowDownRight size={12} className="mr-0.5" />
                                {activeSummary.changes.incomeChange}%
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">0%</span>
                            )}
                            <span className="text-slate-400 dark:text-slate-500 text-[8px] font-semibold lowercase">/ {t.comparedTo}</span>
                          </div>
                        )}
                      </div>

                      {/* Expense */}
                      <div className="p-4 bg-red-500/5 border border-red-100 dark:border-red-950/20 rounded-2xl space-y-1.5 relative overflow-hidden">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{t.expenseLabel}</span>
                        <strong className="text-md font-extrabold text-red-600 dark:text-red-400 block truncate">
                          {formatCurrency(activeSummary.expense, currency)}
                        </strong>
                        {activeSummary.changes.hasPrev && (
                          <div className="flex items-center space-x-1 text-[10px] font-bold">
                            {activeSummary.changes.expenseChange < 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                                <ArrowDownRight size={12} className="mr-0.5" />
                                {activeSummary.changes.expenseChange}%
                              </span>
                            ) : activeSummary.changes.expenseChange > 0 ? (
                              <span className="text-red-600 dark:text-red-400 flex items-center">
                                <ArrowUpRight size={12} className="mr-0.5" />
                                +{activeSummary.changes.expenseChange}%
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">0%</span>
                            )}
                            <span className="text-slate-400 dark:text-slate-500 text-[8px] font-semibold lowercase">/ {t.comparedTo}</span>
                          </div>
                        )}
                      </div>

                      {/* Net Balance */}
                      <div className="p-4 bg-blue-500/5 border border-blue-100 dark:border-blue-950/20 rounded-2xl space-y-1.5 relative overflow-hidden">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{t.netLabel}</span>
                        <strong className={`text-md font-extrabold block truncate ${activeSummary.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(activeSummary.net, currency)}
                        </strong>
                        {activeSummary.changes.hasPrev && (
                          <div className="flex items-center space-x-1 text-[10px] font-bold">
                            {activeSummary.net >= 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                                <ArrowUpRight size={12} className="mr-0.5" />
                                {activeSummary.changes.netChange > 0 ? `+${activeSummary.changes.netChange}%` : `${activeSummary.changes.netChange}%`}
                              </span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400 flex items-center">
                                <ArrowDownRight size={12} className="mr-0.5" />
                                {activeSummary.changes.netChange}%
                              </span>
                            )}
                            <span className="text-slate-400 dark:text-slate-500 text-[8px] font-semibold lowercase">/ {t.comparedTo}</span>
                          </div>
                        )}
                      </div>

                      {/* Savings Rate */}
                      <div className="p-4 bg-purple-500/5 border border-purple-100 dark:border-purple-950/20 rounded-2xl space-y-1.5 relative overflow-hidden">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{t.savingsRateLabel}</span>
                        <strong className="text-md font-extrabold text-purple-600 dark:text-purple-400 block truncate">
                          %{activeSummary.savingsRate}
                        </strong>
                        <div className="h-1 w-full bg-purple-100 dark:bg-purple-950/40 rounded-full overflow-hidden mt-1">
                          <div 
                            className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, activeSummary.savingsRate)}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Progress details & Local Finance Coach advise block */}
                    <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/45 dark:bg-slate-800/25 space-y-4">
                      <div className="flex items-center space-x-2 text-slate-900 dark:text-white">
                        <Sparkles size={16} className="text-brand-500" />
                        <h4 className="text-xs font-extrabold uppercase tracking-wider">{t.savingsPerformance}</h4>
                      </div>
                      
                      {/* Savings rate linear progress with milestones */}
                      <div className="space-y-1.5">
                        <div className="h-4 w-full relative text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          <span className="absolute left-0">%0</span>
                          <span 
                            className="absolute -translate-x-1/2 whitespace-nowrap text-brand-600 dark:text-brand-400 transition-all duration-300"
                            style={{ left: `${savingsTarget}%` }}
                          >
                            %{savingsTarget} {isEn ? 'Milestone' : 'Hedefi'}
                          </span>
                          <span className="absolute right-0">%100</span>
                        </div>
                         <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full relative">
                          {/* target mark line */}
                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-600 z-10 transition-all duration-300" 
                            style={{ left: `${savingsTarget}%` }}
                          />
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 via-brand-500 to-emerald-500 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, activeSummary.savingsRate)}%` }} 
                          />
                          {/* current percentage marker */}
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-brand-600 dark:bg-brand-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white dark:border-slate-900 shadow-md shadow-brand-500/20 z-20 flex items-center justify-center h-5 whitespace-nowrap transition-all duration-500"
                            style={{ left: `${Math.min(100, activeSummary.savingsRate)}%` }}
                          >
                            %{activeSummary.savingsRate}
                          </div>
                        </div>
                      </div>

                      {/* Coach dynamic text based on performance */}
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
                        {activeSummary.savingsRate >= savingsTarget + 10 
                          ? t.coachBest 
                          : activeSummary.savingsRate >= savingsTarget 
                            ? t.coachGood.replace('20%', `${savingsTarget}%`).replace('%20', `%${savingsTarget}`)
                            : activeSummary.savingsRate > 0 
                              ? t.coachLow 
                              : t.coachNegative
                        }
                      </p>
                    </div>

                    {/* Top Spending Category banner */}
                    {activeSummary.topCategory ? (
                      <div 
                        className="p-5 rounded-2xl border flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all"
                        style={{ 
                          borderColor: `${activeSummary.topCategory.color}25`, 
                          backgroundColor: `${activeSummary.topCategory.color}05`
                        }}
                      >
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            {t.topCategoryLabel}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span 
                              className="w-3.5 h-3.5 rounded-lg inline-block border shadow-sm" 
                              style={{ backgroundColor: activeSummary.topCategory.color, borderColor: `${activeSummary.topCategory.color}50` }} 
                            />
                            {activeSummary.topCategory.name}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                            {t.topCategoryText
                              .replace('{category}', activeSummary.topCategory.name)
                              .replace('{amount}', formatCurrency(activeSummary.topCategory.amount, currency))
                              .replace('{percentage}', String(Math.round((activeSummary.topCategory.amount / activeSummary.expense) * 100)))}
                          </p>
                        </div>
                        <div 
                          className="self-start md:self-center px-4 py-2 rounded-2xl font-black text-sm text-center border shadow-sm shrink-0"
                          style={{ 
                            color: activeSummary.topCategory.color, 
                            borderColor: `${activeSummary.topCategory.color}30`,
                            backgroundColor: `${activeSummary.topCategory.color}10`
                          }}
                        >
                          {formatCurrency(activeSummary.topCategory.amount, currency)}
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 text-center">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{t.noExpenses}</span>
                      </div>
                    )}

                    {/* Month-Over-Month Comparison Detailed list */}
                    {activeSummary.changes.hasPrev && (
                      <div className="space-y-3 pt-3">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-1">
                          {t.momChangesTitle}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                          {/* Income MoM Card */}
                          <div className={`p-4.5 rounded-2xl border flex items-center justify-between ${
                            activeSummary.changes.incomeChange >= 0
                              ? 'bg-emerald-500/5 border-emerald-100 dark:border-emerald-950/10 text-emerald-700 dark:text-emerald-400'
                              : 'bg-red-500/5 border-red-100 dark:border-red-950/10 text-red-700 dark:text-red-400'
                          }`}>
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{t.incomeChangeText}</span>
                              <span className="text-xs font-black">
                                {activeSummary.changes.incomeChange > 0 ? `+${activeSummary.changes.incomeChange}%` : `${activeSummary.changes.incomeChange}%`}
                              </span>
                            </div>
                            {activeSummary.changes.incomeChange >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                          </div>

                          {/* Expense MoM Card */}
                          <div className={`p-4.5 rounded-2xl border flex items-center justify-between ${
                            activeSummary.changes.expenseChange <= 0
                              ? 'bg-emerald-500/5 border-emerald-100 dark:border-emerald-950/10 text-emerald-700 dark:text-emerald-400'
                              : 'bg-red-500/5 border-red-100 dark:border-red-950/10 text-red-700 dark:text-red-400'
                          }`}>
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{t.expenseChangeText}</span>
                              <span className="text-xs font-black">
                                {activeSummary.changes.expenseChange > 0 ? `+${activeSummary.changes.expenseChange}%` : `${activeSummary.changes.expenseChange}%`}
                              </span>
                            </div>
                            {activeSummary.changes.expenseChange <= 0 ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                          </div>

                          {/* Net MoM Card */}
                          <div className={`p-4.5 rounded-2xl border flex items-center justify-between ${
                            activeSummary.changes.netChange >= 0
                              ? 'bg-emerald-500/5 border-emerald-100 dark:border-emerald-950/10 text-emerald-700 dark:text-emerald-400'
                              : 'bg-red-500/5 border-red-100 dark:border-red-950/10 text-red-700 dark:text-red-400'
                          }`}>
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{t.netChangeText}</span>
                              <span className="text-xs font-black">
                                {activeSummary.changes.netChange > 0 ? `+${activeSummary.changes.netChange}%` : `${activeSummary.changes.netChange}%`}
                              </span>
                            </div>
                            {activeSummary.changes.netChange >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Kategori Trend Analizi (Category Trend Analysis) */}
                    <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800/60 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pl-1">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Sparkles size={14} className="text-brand-500" />
                            {t.trendTitle}
                          </h4>
                          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                            {t.trendSubtitle}
                          </p>
                        </div>
                      </div>

                      {categoryTrends.length === 0 ? (
                        <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 text-center">
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold leading-relaxed block max-w-lg mx-auto">
                            {t.trendNoData}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {categoryTrends.map((trend) => {
                            return (
                              <div
                                key={trend.id}
                                className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/45 dark:bg-slate-800/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/35 group shadow-sm"
                              >
                                <div className="flex items-center space-x-3">
                                  {/* Color Indicator */}
                                  <div
                                    className="w-2.5 h-2.5 rounded-full shrink-0 border shadow-sm group-hover:scale-110 transition-transform duration-200"
                                    style={{
                                      backgroundColor: trend.categoryColor,
                                      borderColor: `${trend.categoryColor}60`,
                                    }}
                                  />
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {trend.message}
                                  </span>
                                </div>

                                {/* Status Badge */}
                                <span
                                  className={`self-start sm:self-center px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase border shrink-0 ${
                                    trend.badgeColor === 'red'
                                      ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                                      : trend.badgeColor === 'green'
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                                  }`}
                                >
                                  {trend.badgeText}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="p-12 text-center border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center">
                    <span className="text-xs text-slate-400 font-semibold">{t.selectMonthPrompt}</span>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Reports;
