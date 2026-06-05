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
  HelpCircle,
  ArrowUpDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatMonthName, formatShortDate } from '../utils/formatters';
import { ChartCard } from '../components/charts/ChartCard';
import { ForecasterReport } from '../components/reports/ForecasterReport';
import { DebtSnowballReport } from '../components/reports/DebtSnowballReport';
import { WealthTrajectoryReport } from '../components/reports/WealthTrajectoryReport';
import { SpendingHeatmapReport } from '../components/reports/SpendingHeatmapReport';

type PeriodType = 'this-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'this-year' | 'custom';

export const Reports: React.FC = () => {
  const { 
    transactions, 
    categories, 
    budgets, 
    recurringTransactions, 
    goals, 
    debts, 
    subscriptions, 
    assets 
  } = useData();
  const { user } = useAuth();
  const currency = user?.currency || 'TRY';
  const isEn = user?.lang === 'en';

  // Premium legend formatter to ensure perfect readability in both light & dark themes
  const renderLegendText = (value: string) => {
    return <span className="text-slate-600 dark:text-slate-300 font-extrabold ml-1.5">{value}</span>;
  };

  const [activeTab, setActiveTab] = useState<'charts' | 'summaries' | 'compare' | 'insights'>('charts');
  const [activeInsightTab, setActiveInsightTab] = useState<'forecaster' | 'snowball' | 'wealth' | 'heatmap'>('forecaster');
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

  // ---------------------------------------------------------------
  // COMPARISON MOD STATES & HOOKS
  // ---------------------------------------------------------------
  const [compareMode, setCompareMode] = useState<'month' | 'year'>('month');
  const [compareMonthA, setCompareMonthA] = useState('');
  const [compareMonthB, setCompareMonthB] = useState('');
  const [compareYearA, setCompareYearA] = useState('');
  const [compareYearB, setCompareYearB] = useState('');

  // Extract unique months and years dynamically from transactions
  const uniqueMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    transactions.forEach(t => {
      monthsSet.add(t.transaction_date.substring(0, 7));
    });
    return Array.from(monthsSet).sort().reverse();
  }, [transactions]);

  const uniqueYears = useMemo(() => {
    const yearsSet = new Set<string>();
    transactions.forEach(t => {
      yearsSet.add(t.transaction_date.substring(0, 4));
    });
    return Array.from(yearsSet).sort().reverse();
  }, [transactions]);

  React.useEffect(() => {
    if (uniqueMonths.length > 0) {
      if (!compareMonthA) setCompareMonthA(uniqueMonths[0]);
      if (!compareMonthB) {
        setCompareMonthB(uniqueMonths[1] || uniqueMonths[0]);
      }
    }
    if (uniqueYears.length > 0) {
      if (!compareYearA) setCompareYearA(uniqueYears[0]);
      if (!compareYearB) {
        setCompareYearB(uniqueYears[1] || uniqueYears[0]);
      }
    }
  }, [uniqueMonths, uniqueYears]);

  const handleSwapPeriods = () => {
    if (compareMode === 'month') {
      const temp = compareMonthA;
      setCompareMonthA(compareMonthB);
      setCompareMonthB(temp);
    } else {
      const temp = compareYearA;
      setCompareYearA(compareYearB);
      setCompareYearB(temp);
    }
  };

  // Dynamic JSON Report Data Export Handler
  const handleExportJSON = () => {
    const exportData = {
      reportType: "Feniqo Comparative Financial Report",
      generatedAt: new Date().toISOString(),
      periodA: comparePeriodTxs.displayA,
      periodB: comparePeriodTxs.displayB,
      comparisonMetrics: compareMetrics,
      categorySpending: compareCategoryData,
      paymentMethodComparison: comparePaymentData,
      cumulativeNetFlow: compareNetFlowData,
      weeklySpendingSplit: compareWeekendData,
      budgetOverrunMatrix: compareBudgetMatris,
      aiCoachRecommendations: compareAIRecommendations
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `feniqo-comparative-report-${comparePeriodTxs.displayA}-vs-${comparePeriodTxs.displayB}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Print Layout Trigger
  const handlePrintReport = () => {
    window.print();
  };

  // Dynamic period filter calculation
  const comparePeriodTxs = useMemo(() => {
    let txsA: typeof transactions = [];
    let txsB: typeof transactions = [];
    let displayA = '';
    let displayB = '';

    if (compareMode === 'month') {
      if (compareMonthA) {
        txsA = transactions.filter(t => t.transaction_date.startsWith(compareMonthA));
        displayA = formatMonthName(compareMonthA, isEn);
      }
      if (compareMonthB) {
        txsB = transactions.filter(t => t.transaction_date.startsWith(compareMonthB));
        displayB = formatMonthName(compareMonthB, isEn);
      }
    } else {
      if (compareYearA) {
        txsA = transactions.filter(t => t.transaction_date.startsWith(compareYearA));
        displayA = compareYearA;
      }
      if (compareYearB) {
        txsB = transactions.filter(t => t.transaction_date.startsWith(compareYearB));
        displayB = compareYearB;
      }
    }

    return { txsA, txsB, displayA, displayB };
  }, [transactions, compareMode, compareMonthA, compareMonthB, compareYearA, compareYearB, isEn]);

  // Calculate metrics A vs B
  const compareMetrics = useMemo(() => {
    const { txsA, txsB } = comparePeriodTxs;

    const calculateStats = (txs: typeof transactions) => {
      const inc = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const exp = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const net = inc - exp;
      const rate = inc > 0 ? Math.max(0, Math.round((net / inc) * 100)) : 0;
      return { income: inc, expense: exp, net, savingsRate: rate };
    };

    const statsA = calculateStats(txsA);
    const statsB = calculateStats(txsB);

    const getChangePct = (valA: number, valB: number) => {
      if (valA === 0) return valB > 0 ? 100 : 0;
      return Math.round(((valB - valA) / valA) * 100);
    };

    return {
      statsA,
      statsB,
      incomeDiff: statsB.income - statsA.income,
      incomeChangePct: getChangePct(statsA.income, statsB.income),
      expenseDiff: statsB.expense - statsA.expense,
      expenseChangePct: getChangePct(statsA.expense, statsB.expense),
      netDiff: statsB.net - statsA.net,
      netChangePct: getChangePct(statsA.net, statsB.net),
      rateDiff: statsB.savingsRate - statsA.savingsRate
    };
  }, [comparePeriodTxs]);

  // Grouped Category Gider Comparison Data
  const compareCategoryData = useMemo(() => {
    const { txsA, txsB } = comparePeriodTxs;
    
    const expA: Record<string, number> = {};
    txsA.filter(t => t.type === 'expense').forEach(t => {
      expA[t.category_id] = (expA[t.category_id] || 0) + t.amount;
    });

    const expB: Record<string, number> = {};
    txsB.filter(t => t.type === 'expense').forEach(t => {
      expB[t.category_id] = (expB[t.category_id] || 0) + t.amount;
    });

    const allCatIds = Array.from(new Set([...Object.keys(expA), ...Object.keys(expB)]));

    return allCatIds.map(catId => {
      const cat = categories.find(c => c.id === catId);
      const name = cat ? cat.name : (isEn ? 'Other' : 'Diğer');
      return {
        name,
        color: cat ? cat.color : '#6B7280',
        valA: expA[catId] || 0,
        valB: expB[catId] || 0,
        catId
      };
    }).sort((a, b) => Math.max(b.valA, b.valB) - Math.max(a.valA, a.valB));
  }, [comparePeriodTxs, categories, isEn]);

  // Spending Velocity (Cumulative Day 1 to 31 / Month 1 to 12)
  const compareVelocityData = useMemo(() => {
    const { txsA, txsB } = comparePeriodTxs;

    const calculateCumulative = (txs: typeof transactions) => {
      const dailyExpenses = new Array(32).fill(0);
      txs.filter(t => t.type === 'expense').forEach(t => {
        const day = parseInt(t.transaction_date.substring(8, 10));
        if (day >= 1 && day <= 31) {
          dailyExpenses[day] += t.amount;
        }
      });

      const cumulative = [];
      let total = 0;
      for (let d = 1; d <= 31; d++) {
        total += dailyExpenses[d];
        cumulative[d] = total;
      }
      return cumulative;
    };

    const cumA = calculateCumulative(txsA);
    const cumB = calculateCumulative(txsB);

    const result = [];
    
    if (compareMode === 'month') {
      for (let d = 1; d <= 31; d++) {
        result.push({
          name: isEn ? `Day ${d}` : `${d}. Gün`,
          valA: cumA[d],
          valB: cumB[d]
        });
      }
    } else {
      const getMonthlyTotal = (txs: typeof transactions) => {
        const monthly = new Array(13).fill(0);
        txs.filter(t => t.type === 'expense').forEach(t => {
          const month = parseInt(t.transaction_date.substring(5, 7));
          monthly[month] += t.amount;
        });
        const cumulative = [];
        let total = 0;
        for (let m = 1; m <= 12; m++) {
          total += monthly[m];
          cumulative[m] = total;
        }
        return cumulative;
      };
      
      const yearCumA = getMonthlyTotal(txsA);
      const yearCumB = getMonthlyTotal(txsB);
      
      const monthNamesTR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      const monthNamesEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let m = 1; m <= 12; m++) {
        result.push({
          name: isEn ? monthNamesEN[m - 1] : monthNamesTR[m - 1],
          valA: yearCumA[m],
          valB: yearCumB[m]
        });
      }
    }

    return result;
  }, [comparePeriodTxs, compareMode, isEn]);

  // Translations dictionary for dual-language support (TR & EN)
  const t = useMemo(() => {
    return {
      title: isEn ? 'Analytics & Reports' : 'Analiz ve Raporlar',
      subtitle: isEn ? 'Explore your income, expenses, and savings with rich analytical charts.' : 'Gelir, gider ve birikimlerinizi zengin analitik grafiklerle derinlemesine inceleyin.',
      tabCharts: isEn ? 'Graphical Charts' : 'Grafik Analizleri',
      tabSummaries: isEn ? 'Monthly Summaries' : 'Aylık Finans Özetleri',
      tabCompare: isEn ? 'Comparative Analytics' : 'Karşılaştırma Analizi',
      
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
      chart5Title: isEn ? 'Budget vs Actual Radar' : 'Bütçe vs Harcama Radar Analizi',
      chart5Subtitle: isEn ? 'Category Limit Compliance' : 'Kategori Limitlerine Uyum Analizi',
      chart6Title: isEn ? 'Payment Method Breakdown' : 'Ödeme Yöntemi Dağılımı',
      chart6Subtitle: isEn ? 'Share by Transaction Channel' : 'Ödeme Kanalları Dağılım Payları',
       chart7Title: isEn ? 'Cumulative Spending & Predictive Forecast' : 'Kümülatif Gider & Prediktif Bakiye Tahmini',
      chart7Subtitle: isEn ? 'Month-End AI Forecast Overlay' : 'Ay Sonu Harcama Eğrisi Projeksiyonu',
      
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
        : 'Bu ay en çok harcemayı {category} kategorisinde yaptınız. Bu kategorideki toplam harcamanız {amount} oldu ve tüm aylık harcamalarınızın %{percentage} kadarına denk geliyor.',
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
      
      // Comparison Mode strings
      compareModeLabel: isEn ? 'Comparison Type' : 'Karşılaştırma Türü',
      compareMonthMode: isEn ? 'Month vs Month' : 'Ay Bazlı Karşılaştırma',
      compareYearMode: isEn ? 'Year vs Year' : 'Yıl Bazlı Karşılaştırma',
      periodALabel: isEn ? 'Period A' : 'Dönem A',
      periodBLabel: isEn ? 'Period B (Target)' : 'Dönem B (Hedef / Karşılaştırılan)',
      swapLabel: isEn ? 'Swap Periods' : 'Dönemleri Değiştir',
      comparisonMetrics: isEn ? 'Comparative Metrics' : 'Karşılaştırmalı Finans Metrikleri',
      incomeDiff: isEn ? 'Income Shift' : 'Gelir Değişimi',
      expenseDiff: isEn ? 'Expense Shift' : 'Gider Değişimi',
      netDiff: isEn ? 'Savings Shift' : 'Birikim Değişimi',
      savingsRateDiff: isEn ? 'Savings Rate Difference' : 'Tasarruf Oranı Farkı',
      chartCompareCategoryTitle: isEn ? 'Category-wise Side-by-side Spending' : 'Kategori Bazlı Yan Yana Harcamalar',
      chartCompareCategorySubtitle: isEn ? 'Category spending in A vs B' : 'Kategorilerde A vs B dönemleri harcama kıyaslaması',
      chartCompareVelocityTitle: isEn ? 'Cumulative Spending Velocity' : 'Kümülatif Harcama Hızı (İvme Kıyaslama)',
      chartCompareVelocitySubtitle: isEn ? 'Shows the rate and speed of expense progression' : 'Dönem içi harcama birikim hızını ve ivmesini gösterir',
      tableCategory: isEn ? 'Category' : 'Kategori',
      tablePeriodA: isEn ? 'Period A' : 'A Dönemi',
      tablePeriodB: isEn ? 'Period B' : 'B Dönemi',
      tableDiff: isEn ? 'Difference' : 'Net Fark',
      tablePctChange: isEn ? 'Change %' : 'Değişim %',
      aiReportHeading: isEn ? '📈 Dynamic Financial Comparison Report' : '📈 Dinamik Karşılaştırmalı Finans Analizi',
      noComparisonData: isEn ? 'No transaction data found for the selected comparison periods.' : 'Seçilen karşılaştırma periyotları için işlem verisi bulunamadı.',
      compareIntro: isEn 
        ? 'Comparative analysis between {periodA} and {periodB}:' 
        : '{periodA} ile {periodB} dönemlerinin karşılaştırmalı analizi:',
      compareIncomeIncrease: isEn 
        ? 'Your income increased by **{pct}%** (+{diff}) in Period B. Great!' 
        : 'Geliriniz B döneminde **%{pct}** (+{diff}) oranında artış gösterdi. Harika!',
      compareIncomeDecrease: isEn 
        ? 'Your income decreased by **{pct}%** (-{diff}) in Period B. Consider looking for active income streams.' 
        : 'Geliriniz B döneminde **%{pct}** (-{diff}) düştü. Ek gelir kaynaklarını gözden geçirmelisiniz.',
      compareExpenseIncrease: isEn 
        ? '⚠️ Your expenses increased by **{pct}%** (+{diff}) in Period B. Watch your flexible limits.' 
        : '⚠️ Harcamalarınız B döneminde **%{pct}** (+{diff}) arttı. Keyfi giderlerinize sınır getirmelisiniz.',
      compareExpenseDecrease: isEn 
        ? '🎉 Success! Your expenses decreased by **{pct}%** (-{diff}) in Period B. Excellent budgeting!' 
        : '🎉 Tebrikler! Harcamalarınız B döneminde **%{pct}** (-{diff}) azaldı. Bütçe yönetiminiz takdire şayan!',
      compareSavingsBetter: isEn 
        ? 'Your savings rate improved by **{diff}%** (from {rateA}% to {rateB}%).' 
        : 'Tasarruf oranınız **%{diff}** arttı (%{rateA}\'dan %{rateB}\'ye yükseldi).',
      compareSavingsWorse: isEn 
        ? 'Your savings rate dropped by **{diff}%** (from {rateA}% to {rateB}%).' 
        : 'Tasarruf oranınız **%{diff}** geriledi (%{rateA}\'dan %{rateB}\'ye düştü).',
      compareTopIncrease: isEn 
        ? 'The highest increase in expenses was in **{category}** with a surge of **+{diff}**.' 
        : 'En yüksek gider artışı **{category}** kategorisinde **+{diff}** olarak gerçekleşti.',
      compareTopDecrease: isEn 
        ? 'You saved the most in **{category}** with a reduction of **-{diff}**.' 
        : 'En ghost harcama tasarrufunu **{category}** kategorisinde **-{diff}** azaltarak yaptınız.',
      comparePaymentTitle: isEn ? 'Payment Method Comparison' : 'Ödeme Yöntemi Karşılaştırması',
      comparePaymentSubtitle: isEn ? 'Side-by-side transaction flow comparison' : 'Ödeme kanalları yan yana harcama kıyaslaması',
      compareNetFlowTitle: isEn ? 'Cumulative Net Cash Flow' : 'Kümülatif Net Nakit Akışı',
      compareNetFlowSubtitle: isEn ? 'Day-by-day cumulative Income - Expense progression' : 'Günlük net Gelir - Gider kümülatif birikim kıyaslaması',
      weekdaySpent: isEn ? 'Weekday Spent' : 'Hafta İçi Harcaması',
      weekendSpent: isEn ? 'Weekend Spent' : 'Hafta Sonu Harcaması',
      budgetOverruns: isEn ? 'Budget Overrun Categories' : 'Limit Aşımı Yaşayan Kategoriler',
      actionableRecs: isEn ? '📊 Strategic Financial Recommendations' : '📊 Stratejik Finansal Öneriler',
      exportPDF: isEn ? 'Print / Export PDF' : 'Raporu Yazdır / PDF Yap',
      exportJSON: isEn ? 'Download Data (JSON)' : 'Verileri İndir (JSON)'
    };
  }, [isEn]);

  // AI dynamic insight engine calculations
  const aiCompareInsights = useMemo(() => {
    const { statsA, statsB, incomeDiff, incomeChangePct, expenseDiff, expenseChangePct, rateDiff } = compareMetrics;
    
    if (statsA.income === 0 && statsA.expense === 0 && statsB.income === 0 && statsB.expense === 0) {
      return [];
    }

    const insights: string[] = [];

    // Income
    if (incomeDiff > 0) {
      insights.push(
        t.compareIncomeIncrease
          .replace('{pct}', String(incomeChangePct))
          .replace('{diff}', formatCurrency(incomeDiff, currency))
      );
    } else if (incomeDiff < 0) {
      insights.push(
        t.compareIncomeDecrease
          .replace('{pct}', String(Math.abs(incomeChangePct)))
          .replace('{diff}', formatCurrency(Math.abs(incomeDiff), currency))
      );
    }

    // Expenses
    if (expenseDiff > 0) {
      insights.push(
        t.compareExpenseIncrease
          .replace('{pct}', String(expenseChangePct))
          .replace('{diff}', formatCurrency(expenseDiff, currency))
      );
    } else if (expenseDiff < 0) {
      insights.push(
        t.compareExpenseDecrease
          .replace('{pct}', String(Math.abs(expenseChangePct)))
          .replace('{diff}', formatCurrency(Math.abs(expenseDiff), currency))
      );
    }

    // Savings Rate
    if (rateDiff > 0) {
      insights.push(
        t.compareSavingsBetter
          .replace('{diff}', String(rateDiff))
          .replace('{rateA}', String(statsA.savingsRate))
          .replace('{rateB}', String(statsB.savingsRate))
      );
    } else if (rateDiff < 0) {
      insights.push(
        t.compareSavingsWorse
          .replace('{diff}', String(Math.abs(rateDiff)))
          .replace('{rateA}', String(statsA.savingsRate))
          .replace('{rateB}', String(statsB.savingsRate))
      );
    }

    // Category Shifts
    const categoryShifts = compareCategoryData.map(c => ({
      ...c,
      diff: c.valB - c.valA
    })).sort((a, b) => b.diff - a.diff);

    // Max Increase
    const topIncrease = categoryShifts[0];
    if (topIncrease && topIncrease.diff > 0) {
      insights.push(
        t.compareTopIncrease
          .replace('{category}', topIncrease.name)
          .replace('{diff}', formatCurrency(topIncrease.diff, currency))
      );
    }

    // Max Decrease
    const topDecrease = [...categoryShifts].sort((a, b) => a.diff - b.diff)[0];
    if (topDecrease && topDecrease.diff < 0) {
      insights.push(
        t.compareTopDecrease
          .replace('{category}', topDecrease.name)
          .replace('{diff}', formatCurrency(Math.abs(topDecrease.diff), currency))
      );
    }

    return insights;
  }, [compareMetrics, compareCategoryData, t, currency]);

  // CHART 6 COMPARISON: SIDE BY SIDE PAYMENT METHOD BREAKDOWN
  const comparePaymentData = useMemo(() => {
    const { txsA, txsB } = comparePeriodTxs;
    
    const payA: Record<string, number> = {};
    txsA.filter(t => t.type === 'expense').forEach(t => {
      const method = t.payment_method || (isEn ? 'Other' : 'Diğer');
      payA[method] = (payA[method] || 0) + t.amount;
    });

    const payB: Record<string, number> = {};
    txsB.filter(t => t.type === 'expense').forEach(t => {
      const method = t.payment_method || (isEn ? 'Other' : 'Diğer');
      payB[method] = (payB[method] || 0) + t.amount;
    });

    const allMethods = Array.from(new Set([...Object.keys(payA), ...Object.keys(payB)]));

    return allMethods.map(method => {
      let name = method;
      if (isEn) {
        if (method === 'Nakit') name = 'Cash';
        else if (method === 'Kredi Kartı') name = 'Credit Card';
        else if (method === 'Banka Kartı') name = 'Debit Card';
        else if (method === 'Havale/EFT') name = 'Bank Transfer';
        else if (method === 'Diğer') name = 'Other';
      } else {
        if (method === 'Cash') name = 'Nakit';
        else if (method === 'Credit Card') name = 'Kredi Kartı';
        else if (method === 'Debit Card') name = 'Banka Kartı';
        else if (method === 'Bank Transfer') name = 'Havale/EFT';
        else if (method === 'Other') name = 'Diğer';
      }

      const methodColors: Record<string, string> = {
        'Nakit': '#10B981', 'Cash': '#10B981',
        'Kredi Kartı': '#3B82F6', 'Credit Card': '#3B82F6',
        'Banka Kartı': '#8B5CF6', 'Debit Card': '#8B5CF6',
        'Havale/EFT': '#F59E0B', 'Bank Transfer': '#F59E0B',
        'Diğer': '#6B7280', 'Other': '#6B7280'
      };

      return {
        name,
        valA: payA[method] || 0,
        valB: payB[method] || 0,
        color: methodColors[method] || methodColors[name] || '#6B7280'
      };
    }).sort((a, b) => Math.max(b.valA, b.valB) - Math.max(a.valA, a.valB));
  }, [comparePeriodTxs, isEn]);

  // CHART 7 COMPARISON: CUMULATIVE NET CASH FLOW (INCOME - EXPENSE PROGRESSION)
  const compareNetFlowData = useMemo(() => {
    const { txsA, txsB } = comparePeriodTxs;

    const calculateNetCumulative = (txs: typeof transactions) => {
      const dailyNet = new Array(32).fill(0);
      txs.forEach(t => {
        const day = parseInt(t.transaction_date.substring(8, 10));
        if (day >= 1 && day <= 31) {
          if (t.type === 'income') {
            dailyNet[day] += t.amount;
          } else {
            dailyNet[day] -= t.amount;
          }
        }
      });

      const cumulative = [];
      let total = 0;
      for (let d = 1; d <= 31; d++) {
        total += dailyNet[d];
        cumulative[d] = total;
      }
      return cumulative;
    };

    const cumA = calculateNetCumulative(txsA);
    const cumB = calculateNetCumulative(txsB);

    const result = [];
    if (compareMode === 'month') {
      for (let d = 1; d <= 31; d++) {
        result.push({
          name: isEn ? `Day ${d}` : `${d}. Gün`,
          valA: cumA[d],
          valB: cumB[d]
        });
      }
    } else {
      const getMonthlyNet = (txs: typeof transactions) => {
        const monthly = new Array(13).fill(0);
        txs.forEach(t => {
          const month = parseInt(t.transaction_date.substring(5, 7));
          if (t.type === 'income') {
            monthly[month] += t.amount;
          } else {
            monthly[month] -= t.amount;
          }
        });
        const cumulative = [];
        let total = 0;
        for (let m = 1; m <= 12; m++) {
          total += monthly[m];
          cumulative[m] = total;
        }
        return cumulative;
      };
      
      const yearCumA = getMonthlyNet(txsA);
      const yearCumB = getMonthlyNet(txsB);
      
      const monthNamesTR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      const monthNamesEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let m = 1; m <= 12; m++) {
        result.push({
          name: isEn ? monthNamesEN[m - 1] : monthNamesTR[m - 1],
          valA: yearCumA[m],
          valB: yearCumB[m]
        });
      }
    }

    return result;
  }, [comparePeriodTxs, compareMode, isEn]);

  // COMPARATIVE METRIC: WEEKDAY VS WEEKEND SPENDING SPLIT
  const compareWeekendData = useMemo(() => {
    const { txsA, txsB } = comparePeriodTxs;

    const calcSplit = (txs: typeof transactions) => {
      let weekday = 0;
      let weekend = 0;
      txs.filter(t => t.type === 'expense').forEach(t => {
        const day = new Date(t.transaction_date).getDay();
        if (day === 0 || day === 6) {
          weekend += t.amount;
        } else {
          weekday += t.amount;
        }
      });
      return { weekday, weekend };
    };

    const splitA = calcSplit(txsA);
    const splitB = calcSplit(txsB);

    return { splitA, splitB };
  }, [comparePeriodTxs]);

  // COMPARATIVE METRIC: BUDGET OVERRUN MATRIS
  const compareBudgetMatris = useMemo(() => {
    const { txsA, txsB } = comparePeriodTxs;
    
    const getMonthsInTxs = (txs: typeof transactions) => {
      const months = new Set<string>();
      txs.forEach(t => months.add(t.transaction_date.substring(0, 7)));
      return Array.from(months);
    };
    
    const monthsA = getMonthsInTxs(txsA);
    const monthsB = getMonthsInTxs(txsB);
    
    const calcExceeds = (txs: typeof transactions, months: string[]) => {
      const exceedsList: Array<{ catId: string, name: string, spent: number, limit: number, overrun: number }> = [];
      
      categories.forEach(cat => {
        const spent = txs
          .filter(t => t.type === 'expense' && t.category_id === cat.id)
          .reduce((sum, t) => sum + t.amount, 0);
          
        const limit = budgets
          .filter(b => b.category_id === cat.id && months.includes(b.month))
          .reduce((sum, b) => sum + b.limit_amount, 0);
          
        if (limit > 0 && spent > limit) {
          exceedsList.push({
            catId: cat.id,
            name: cat.name,
            spent,
            limit,
            overrun: spent - limit
          });
        }
      });
      
      return exceedsList;
    };

    const listA = calcExceeds(txsA, monthsA);
    const listB = calcExceeds(txsB, monthsB);
    
    return { listA, listB };
  }, [comparePeriodTxs, categories, budgets]);

  // COMPARATIVE METRIC: AI COACH RECOMMENDATIONS
  const compareAIRecommendations = useMemo(() => {
    const { listA, listB } = compareBudgetMatris;
    const { expenseDiff } = compareMetrics;
    const recs: string[] = [];

    if (expenseDiff > 0) {
      recs.push(
        isEn
          ? "🎯 **Actionable Limit Correction:** Your expenses increased in Period B. We recommend setting a strict category limit ceiling for your top overrun categories next month."
          : "🎯 **Bütçe Sınırı Optimizasyonu:** Harcamalarınız B döneminde artış gösterdi. Gelecek ay en çok harcama artışı gösteren kategoriler için acilen üst sınır bütçe limitleri tanımlamalısınız."
      );
    }

    if (listB.length > listA.length) {
      const overruns = listB.map(l => l.name).join(', ');
      recs.push(
        isEn
          ? `⚠️ **Budget Adherence Advice:** You exceeded more budget limits in Period B (${listB.length} categories: ${overruns}). Consider activating mobile alert notifications when you approach 80% of these limits.`
          : `⚠️ **Bütçe Disiplini Önerisi:** B döneminde bütçe limitlerinizi aşan kategori sayısı arttı (${listB.length} kategori: ${overruns}). Bu kategorilerde harcama seviyeniz %80'e ulaştığında anlık uyarı alacak şekilde bütçe bildirimlerini aktif etmelisiniz.`
      );
    } else if (listB.length > 0) {
      recs.push(
        isEn
          ? "🎉 **Budget Maintenance Advice:** You maintained a healthy overrun profile. For categories still exceeding limit boundaries, try trimming small subscription bills to balance outflows."
          : "🎉 **Bütçe Koruma Önerisi:** Bütçe aşım sayısını dengede tutmayı başardınız. Yine de limit sınırını aşan az sayıdaki kategori için ufak tefek gereksiz sabit abonelikleri kısarak bütçe dengesi sağlayabilirsiniz."
      );
    }

    const { splitA, splitB } = compareWeekendData;
    const isWeekendBHigher = splitB.weekend > splitA.weekend;
    if (isWeekendBHigher && splitB.weekend > 0) {
      recs.push(
        isEn
          ? "🏖️ **Weekend Savings Strategy:** Period B shows weekend spent expansion. Implementing a weekend 'social spent ceiling' of 500 TL can prevent rapid discretionary cash drainage."
          : "🏖️ **Hafta Sonu Tasarruf Stratejisi:** B döneminde hafta sonu harcamalarınızda belirgin bir artış görüldü. Cumartesi ve Pazar günleri için 500 TL'lik bir 'sosyal harcama üst limiti' belirlemek, keyfi bütçe erimelerini önleyecektir."
      );
    }

    if (recs.length === 0) {
      recs.push(
        isEn
          ? "✨ **General Wealth Advice:** Both periods look extremely stable. We advise routing your net savings directly into compound goals or high-yield investments to accelerate your financial freedom trajectory."
          : "✨ **Genel Birikim Tavsiyesi:** Her iki dönem de oldukça kararlı görünüyor. Finansal özgürlük ivmenizi hızlandırmak için elde ettiğiniz net birikimleri doğrudan vadeli hedeflerinize veya yatırımlara yönlendirmenizi tavsiye ederiz."
      );
    }

    return recs;
  }, [compareBudgetMatris, compareMetrics, compareWeekendData, isEn]);

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
        gider: exp,
        tasarruf: inc - exp
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

  // Extract unique months in period to aggregate limits accurately
  const periodMonths = useMemo(() => {
    const { start, end } = dateBoundaries;
    if (!start || !end) return [];
    const months: string[] = [];
    const current = new Date(start);
    const stop = new Date(end);
    while (current <= stop) {
      const mStr = current.toISOString().substring(0, 7);
      if (!months.includes(mStr)) {
        months.push(mStr);
      }
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  }, [dateBoundaries]);

  // CHART 5: BUDGET VS ACTUAL EXPENDITURE RADAR
  const radarBudgetData = useMemo(() => {
    const expenseCategories = categories.filter(c => c.type === 'expense');
    
    const results = expenseCategories.map(cat => {
      const spent = periodTxs
        .filter(t => t.type === 'expense' && t.category_id === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
        
      const limit = budgets
        .filter(b => b.category_id === cat.id && periodMonths.includes(b.month))
        .reduce((sum, b) => sum + b.limit_amount, 0);
        
      return {
        name: cat.name,
        spent,
        limit
      };
    });
    
    return results
      .filter(r => r.spent > 0 || r.limit > 0)
      .sort((a, b) => Math.max(b.spent, b.limit) - Math.max(a.spent, a.limit))
      .slice(0, 6);
  }, [categories, budgets, periodTxs, periodMonths]);

  // CHART 6: PAYMENT METHOD BREAKDOWN
  const paymentMethodData = useMemo(() => {
    const methodTotals: Record<string, number> = {};
    const expenseTxs = periodTxs.filter(t => t.type === 'expense');
    
    expenseTxs.forEach(t => {
      const method = t.payment_method || (isEn ? 'Other' : 'Diğer');
      methodTotals[method] = (methodTotals[method] || 0) + t.amount;
    });

    const methodColors: Record<string, string> = {
      'Nakit': '#10B981',
      'Cash': '#10B981',
      'Kredi Kartı': '#3B82F6',
      'Credit Card': '#3B82F6',
      'Banka Kartı': '#8B5CF6',
      'Debit Card': '#8B5CF6',
      'Havale/EFT': '#F59E0B',
      'Bank Transfer': '#F59E0B',
      'Diğer': '#6B7280',
      'Other': '#6B7280'
    };

    return Object.entries(methodTotals).map(([method, total]) => {
      let name = method;
      if (isEn) {
        if (method === 'Nakit') name = 'Cash';
        else if (method === 'Kredi Kartı') name = 'Credit Card';
        else if (method === 'Banka Kartı') name = 'Debit Card';
        else if (method === 'Havale/EFT') name = 'Bank Transfer';
        else if (method === 'Diğer') name = 'Other';
      } else {
        if (method === 'Cash') name = 'Nakit';
        else if (method === 'Credit Card') name = 'Kredi Kartı';
        else if (method === 'Debit Card') name = 'Banka Kartı';
        else if (method === 'Bank Transfer') name = 'Havale/EFT';
        else if (method === 'Other') name = 'Diğer';
      }

      return {
        name,
        value: total,
        color: methodColors[method] || methodColors[name] || '#6B7280'
      };
    }).sort((a, b) => b.value - a.value);
  }, [periodTxs, isEn]);

  // CHART 7: CUMULATIVE SPENDING & AI FORECAST SPLINE
  const cumulativeForecastData = useMemo(() => {
    const { start, end } = dateBoundaries;
    if (!start || !end) return [];

    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    
    const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const maxDays = Math.min(31, totalDays);

    const dailyExpenses = new Array(maxDays + 1).fill(0);
    const expenseTxs = periodTxs.filter(t => t.type === 'expense');

    expenseTxs.forEach(t => {
      const tDateObj = new Date(t.transaction_date);
      const dayDiff = Math.floor((tDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (dayDiff >= 1 && dayDiff <= maxDays) {
        dailyExpenses[dayDiff] += t.amount;
      }
    });

    const todayStr = new Date().toISOString().split('T')[0];
    let currentDayIndex = maxDays;

    if (start <= todayStr && end >= todayStr) {
      const todayObj = new Date(todayStr);
      currentDayIndex = Math.floor((todayObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      currentDayIndex = Math.min(maxDays, Math.max(1, currentDayIndex));
    } else if (end < todayStr) {
      currentDayIndex = maxDays;
    } else {
      currentDayIndex = 1;
    }

    const cumulativeSpent: number[] = new Array(maxDays + 1).fill(0);
    let total = 0;
    for (let d = 1; d <= maxDays; d++) {
      total += dailyExpenses[d];
      cumulativeSpent[d] = total;
    }

    const spentSoFar = cumulativeSpent[currentDayIndex];
    const dailyVelocity = currentDayIndex > 0 ? (spentSoFar / currentDayIndex) : 0;

    const result = [];
    for (let d = 1; d <= maxDays; d++) {
      let spentVal: number | undefined = undefined;
      let forecastVal: number = 0;

      if (d <= currentDayIndex) {
        spentVal = cumulativeSpent[d];
        forecastVal = spentVal;
      } else {
        spentVal = undefined;
        forecastVal = cumulativeSpent[currentDayIndex] + (d - currentDayIndex) * dailyVelocity;
      }

      result.push({
        name: isEn ? `D${d}` : `${d}. Gün`,
        spent: spentVal,
        forecast: Math.round(forecastVal)
      });
    }

    return result;
  }, [periodTxs, dateBoundaries, isEn]);

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

  const avgMonthlyIncome = useMemo(() => {
    const incomeTxs = transactions.filter(t => t.type === 'income');
    if (incomeTxs.length === 0) return 0;
    const amountsByMonth: Record<string, number> = {};
    incomeTxs.forEach(t => {
      const mStr = t.transaction_date.substring(0, 7);
      amountsByMonth[mStr] = (amountsByMonth[mStr] || 0) + t.amount;
    });
    const months = Object.keys(amountsByMonth);
    const totalIncome = Object.values(amountsByMonth).reduce((sum, a) => sum + a, 0);
    return totalIncome / Math.max(1, months.length);
  }, [transactions]);

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
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/40 self-start max-w-full overflow-x-auto scrollbar-none gap-1">
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
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
            className={`flex items-center space-x-2 py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'summaries' 
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/40 dark:border-slate-800/40' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>{t.tabSummaries}</span>
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'compare' 
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/40 dark:border-slate-800/40' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <BarChart3 size={14} />
            <span>{t.tabCompare}</span>
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'insights' 
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/40 dark:border-slate-800/40' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Sparkles size={14} className="text-brand-600 dark:text-brand-400" />
            <span>{isEn ? 'Premium Insights 💎' : 'Premium Analizler 💎'}</span>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartCard
                title={t.chart1Title}
                subtitle={t.chart1Subtitle}
                type="composed-savings"
                data={monthlyCompareData}
              />
            </div>
            <ChartCard
              title={t.chart2Title}
              subtitle={t.chart2Subtitle}
              type="pie-category"
              data={categoryDonutData}
            />
            <ChartCard
              title={t.chart5Title}
              subtitle={t.chart5Subtitle}
              type="radar-budget"
              data={radarBudgetData}
            />
            <ChartCard
              title={t.chart6Title}
              subtitle={t.chart6Subtitle}
              type="pie-payment"
              data={paymentMethodData}
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
            <div className="lg:col-span-2 xl:col-span-3">
              <ChartCard
                title={t.chart7Title}
                subtitle={t.chart7Subtitle}
                type="area-forecast"
                data={cumulativeForecastData}
              />
            </div>
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

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: COMPARATIVE ANALYTICS VIEW                             */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'compare' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Controls Cockpit */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-sm space-y-4">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-end flex-1 gap-4">
                {/* Mode switch */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 whitespace-nowrap">
                    {t.compareModeLabel}
                  </label>
                  <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700/40 w-fit">
                    <button
                      onClick={() => setCompareMode('month')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                        compareMode === 'month' 
                          ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {t.compareMonthMode}
                    </button>
                    <button
                      onClick={() => setCompareMode('year')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                        compareMode === 'year' 
                          ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {t.compareYearMode}
                    </button>
                  </div>
                </div>

                {/* Swap indicator & Selects */}
                <div className="flex-1 flex items-end justify-center sm:justify-start gap-4">
                  {/* Period A Select */}
                  <div className="space-y-1.5 flex-1 max-w-[260px]">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 whitespace-nowrap">
                      {t.periodALabel}
                    </label>
                    {compareMode === 'month' ? (
                      <select
                        value={compareMonthA}
                        onChange={(e) => setCompareMonthA(e.target.value)}
                        className="premium-input text-xs py-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-pointer"
                      >
                        {uniqueMonths.map(m => (
                          <option key={m} value={m}>{formatMonthName(m, isEn)}</option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={compareYearA}
                        onChange={(e) => setCompareYearA(e.target.value)}
                        className="premium-input text-xs py-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-pointer"
                      >
                        {uniqueYears.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Swap Button */}
                  <button
                    onClick={handleSwapPeriods}
                    title={t.swapLabel}
                    className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-700/80 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 h-[34px] w-[34px] flex items-center justify-center"
                  >
                    <ArrowUpDown size={16} className="transform rotate-90 text-brand-600 dark:text-brand-400" />
                  </button>

                  {/* Period B Select */}
                  <div className="space-y-1.5 flex-1 max-w-[260px]">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 whitespace-nowrap">
                      {t.periodBLabel}
                    </label>
                    {compareMode === 'month' ? (
                      <select
                        value={compareMonthB}
                        onChange={(e) => setCompareMonthB(e.target.value)}
                        className="premium-input text-xs py-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-pointer"
                      >
                        {uniqueMonths.map(m => (
                          <option key={m} value={m}>{formatMonthName(m, isEn)}</option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={compareYearB}
                        onChange={(e) => setCompareYearB(e.target.value)}
                        className="premium-input text-xs py-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-pointer"
                      >
                        {uniqueYears.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Action Buttons cockpit */}
              <div className="flex items-center gap-2 self-start xl:self-end">
                <button
                  onClick={handlePrintReport}
                  className="py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Sparkles size={14} className="text-brand-500 animate-pulse" />
                  <span>{t.exportPDF}</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="py-2 px-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-md shadow-brand-500/10 cursor-pointer"
                >
                  <span>{t.exportJSON}</span>
                </button>
              </div>
            </div>
          </div>

          {/* If no data in either period */}
          {comparePeriodTxs.txsA.length === 0 && comparePeriodTxs.txsB.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
              <HelpCircle size={40} className="mx-auto text-slate-400 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">{t.noComparisonData}</p>
            </div>
          ) : (
            <>
              {/* Comparison Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
                {/* Total Income Comparison */}
                <div className="p-4.5 bg-emerald-500/5 border border-emerald-100/70 dark:border-emerald-950/30 rounded-2xl flex flex-col justify-between space-y-3.5 relative shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      {t.incomeDiff}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
                      compareMetrics.incomeDiff >= 0 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-red-500/10 text-red-600'
                    }`}>
                      {compareMetrics.incomeChangePct >= 0 ? '+' : ''}{compareMetrics.incomeChangePct}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/40">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{isEn ? 'Period A' : 'A Dönemi'}</span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">{formatCurrency(compareMetrics.statsA.income, currency)}</span>
                    </div>
                    <div className="flex flex-col border-l border-slate-100 dark:border-slate-800/40 pl-2">
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{isEn ? 'Period B' : 'B Dönemi'}</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{formatCurrency(compareMetrics.statsB.income, currency)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{isEn ? 'Net Shift' : 'Net Değişim'}</span>
                    <strong className={`text-base font-black tracking-tight ${compareMetrics.incomeDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {compareMetrics.incomeDiff >= 0 ? '+' : ''}{formatCurrency(compareMetrics.incomeDiff, currency)}
                    </strong>
                  </div>
                </div>

                {/* Total Expense Comparison */}
                <div className="p-4.5 bg-red-500/5 border border-red-100/70 dark:border-red-950/30 rounded-2xl flex flex-col justify-between space-y-3.5 relative shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      {t.expenseDiff}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
                      compareMetrics.expenseDiff <= 0 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-red-500/10 text-red-600'
                    }`}>
                      {compareMetrics.expenseChangePct >= 0 ? '+' : ''}{compareMetrics.expenseChangePct}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/40">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{isEn ? 'Period A' : 'A Dönemi'}</span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">{formatCurrency(compareMetrics.statsA.expense, currency)}</span>
                    </div>
                    <div className="flex flex-col border-l border-slate-100 dark:border-slate-800/40 pl-2">
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{isEn ? 'Period B' : 'B Dönemi'}</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{formatCurrency(compareMetrics.statsB.expense, currency)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{isEn ? 'Net Shift' : 'Net Değişim'}</span>
                    <strong className={`text-base font-black tracking-tight ${compareMetrics.expenseDiff <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {compareMetrics.expenseDiff >= 0 ? '+' : ''}{formatCurrency(compareMetrics.expenseDiff, currency)}
                    </strong>
                  </div>
                </div>

                {/* Net Savings Comparison */}
                <div className="p-4.5 bg-blue-500/5 border border-blue-100/70 dark:border-blue-950/30 rounded-2xl flex flex-col justify-between space-y-3.5 relative shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      {t.netDiff}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
                      compareMetrics.netDiff >= 0 
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                        : 'bg-red-500/10 text-red-600'
                    }`}>
                      {compareMetrics.netChangePct >= 0 ? '+' : ''}{compareMetrics.netChangePct}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/40">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{isEn ? 'Period A' : 'A Dönemi'}</span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">{formatCurrency(compareMetrics.statsA.net, currency)}</span>
                    </div>
                    <div className="flex flex-col border-l border-slate-100 dark:border-slate-800/40 pl-2">
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{isEn ? 'Period B' : 'B Dönemi'}</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{formatCurrency(compareMetrics.statsB.net, currency)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{isEn ? 'Net Shift' : 'Net Değişim'}</span>
                    <strong className={`text-base font-black tracking-tight ${compareMetrics.netDiff >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                      {compareMetrics.netDiff >= 0 ? '+' : ''}{formatCurrency(compareMetrics.netDiff, currency)}
                    </strong>
                  </div>
                </div>

                {/* Savings Rate Comparison */}
                <div className="p-4.5 bg-purple-500/5 border border-purple-100/70 dark:border-purple-950/30 rounded-2xl flex flex-col justify-between space-y-3.5 relative shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      {t.savingsRateDiff}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
                      compareMetrics.rateDiff >= 0 
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' 
                        : 'bg-red-500/10 text-red-600'
                    }`}>
                      {compareMetrics.rateDiff >= 0 ? '+' : ''}{compareMetrics.rateDiff}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/40">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{isEn ? 'Period A' : 'A Dönemi'}</span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">%{compareMetrics.statsA.savingsRate}</span>
                    </div>
                    <div className="flex flex-col border-l border-slate-100 dark:border-slate-800/40 pl-2">
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{isEn ? 'Period B' : 'B Dönemi'}</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">%{compareMetrics.statsB.savingsRate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{isEn ? 'Net Shift' : 'Net Değişim'}</span>
                    <strong className={`text-base font-black tracking-tight ${compareMetrics.rateDiff >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                      {compareMetrics.rateDiff >= 0 ? '+' : ''}{compareMetrics.rateDiff}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* Comparative Split Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Hafta İçi vs. Hafta Sonu Split Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-sm space-y-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles size={16} className="text-brand-500" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {isEn ? 'Weekday vs. Weekend Habits Shift' : 'Hafta İçi / Hafta Sonu Harcama Değişimi'}
                    </h4>
                  </div>
                  <div className="space-y-4">
                    {/* Period A */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500">
                        <span>A: {comparePeriodTxs.displayA}</span>
                        <span>
                          {t.weekdaySpent}: {formatCurrency(compareWeekendData.splitA.weekday, currency)} | {t.weekendSpent}: {formatCurrency(compareWeekendData.splitA.weekend, currency)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden">
                        <div 
                          className="h-full bg-brand-500 transition-all" 
                          style={{ width: `${compareWeekendData.splitA.weekday + compareWeekendData.splitA.weekend > 0 ? (compareWeekendData.splitA.weekday / (compareWeekendData.splitA.weekday + compareWeekendData.splitA.weekend)) * 100 : 50}%` }} 
                        />
                        <div 
                          className="h-full bg-amber-500 transition-all" 
                          style={{ width: `${compareWeekendData.splitA.weekday + compareWeekendData.splitA.weekend > 0 ? (compareWeekendData.splitA.weekend / (compareWeekendData.splitA.weekday + compareWeekendData.splitA.weekend)) * 100 : 50}%` }} 
                        />
                      </div>
                    </div>
                    {/* Period B */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500">
                        <span>B: {comparePeriodTxs.displayB}</span>
                        <span>
                          {t.weekdaySpent}: {formatCurrency(compareWeekendData.splitB.weekday, currency)} | {t.weekendSpent}: {formatCurrency(compareWeekendData.splitB.weekend, currency)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden">
                        <div 
                          className="h-full bg-brand-500 transition-all" 
                          style={{ width: `${compareWeekendData.splitB.weekday + compareWeekendData.splitB.weekend > 0 ? (compareWeekendData.splitB.weekday / (compareWeekendData.splitB.weekday + compareWeekendData.splitB.weekend)) * 100 : 50}%` }} 
                        />
                        <div 
                          className="h-full bg-amber-500 transition-all" 
                          style={{ width: `${compareWeekendData.splitB.weekday + compareWeekendData.splitB.weekend > 0 ? (compareWeekendData.splitB.weekend / (compareWeekendData.splitB.weekday + compareWeekendData.splitB.weekend)) * 100 : 50}%` }} 
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-center space-x-6 text-[10px] font-bold pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 bg-brand-500 rounded-full inline-block" />
                        <span className="text-slate-500">{t.weekdaySpent}</span>
                      </span>
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" />
                        <span className="text-slate-500">{t.weekendSpent}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Karşılaştırmalı Bütçe Aşım Limit Matrisi */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-sm space-y-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles size={16} className="text-red-500" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {isEn ? 'Budget Limit Compliance Matrix' : 'Karşılaştırmalı Limit Aşım Matrisi'}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Period A */}
                    <div className="p-3.5 bg-slate-50/50 dark:bg-slate-800/25 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">A: {comparePeriodTxs.displayA}</span>
                      <strong className="text-lg font-black text-slate-800 dark:text-slate-100 block">
                        {compareBudgetMatris.listA.length} {isEn ? 'Limits Exceeded' : 'Limit Aşımı'}
                      </strong>
                      <div className="text-[9px] font-semibold text-slate-400 truncate max-w-full">
                        {compareBudgetMatris.listA.length > 0 ? compareBudgetMatris.listA.map(l => l.name).join(', ') : (isEn ? '0 Overruns' : 'Mükemmel Uyum')}
                      </div>
                    </div>
                    {/* Period B */}
                    <div className="p-3.5 bg-slate-50/50 dark:bg-slate-800/25 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">B: {comparePeriodTxs.displayB}</span>
                      <strong className="text-lg font-black text-slate-800 dark:text-slate-100 block">
                        {compareBudgetMatris.listB.length} {isEn ? 'Limits Exceeded' : 'Limit Aşımı'}
                      </strong>
                      <div className="text-[9px] font-semibold text-slate-400 truncate max-w-full">
                        {compareBudgetMatris.listB.length > 0 ? compareBudgetMatris.listB.map(l => l.name).join(', ') : (isEn ? '0 Overruns' : 'Mükemmel Uyum')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Charts Container */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Grouped Category Spending Bar Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {t.chartCompareCategoryTitle}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-0.5">
                      {t.chartCompareCategorySubtitle}
                    </p>
                  </div>
                  
                  <div className="h-[300px] flex items-center justify-center">
                    {compareCategoryData.length === 0 ? (
                      <span className="text-xs font-semibold text-slate-400">{t.noExpenses}</span>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={compareCategoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#1E293B' : '#E2E8F0'} vertical={false} />
                          <XAxis dataKey="name" stroke={document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#4B5563'} fontSize={9} tickLine={false} />
                          <YAxis stroke={document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#4B5563'} fontSize={9} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: document.documentElement.classList.contains('dark') ? '#0F172A' : '#FFFFFF',
                              borderColor: document.documentElement.classList.contains('dark') ? '#334155' : '#E2E8F0',
                              borderRadius: '12px',
                              fontSize: '11px'
                            }} 
                            cursor={{ fill: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.02)' }}
                          />
                          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} formatter={renderLegendText} />
                          <Bar name={`${t.tablePeriodA} (${comparePeriodTxs.displayA})`} dataKey="valA" fill="rgb(var(--brand-500))" radius={[4, 4, 0, 0]} maxBarSize={20} />
                          <Bar name={`${t.tablePeriodB} (${comparePeriodTxs.displayB})`} dataKey="valB" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* 2. Cumulative Spending Velocity Line Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {t.chartCompareVelocityTitle}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-0.5">
                      {t.chartCompareVelocitySubtitle}
                    </p>
                  </div>
                  
                  <div className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={compareVelocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradVelA" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="rgb(var(--brand-500))" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="rgb(var(--brand-500))" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="gradVelB" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#1E293B' : '#E2E8F0'} vertical={false} />
                        <XAxis dataKey="name" stroke={document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#4B5563'} fontSize={9} tickLine={false} />
                        <YAxis stroke={document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#4B5563'} fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: document.documentElement.classList.contains('dark') ? '#0F172A' : '#FFFFFF',
                            borderColor: document.documentElement.classList.contains('dark') ? '#334155' : '#E2E8F0',
                            borderRadius: '12px',
                            fontSize: '11px'
                          }} 
                          cursor={{ stroke: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} formatter={renderLegendText} />
                        <Area name={`${t.tablePeriodA} (${comparePeriodTxs.displayA})`} type="monotone" dataKey="valA" stroke="rgb(var(--brand-500))" strokeWidth={2.5} fillOpacity={1} fill="url(#gradVelA)" />
                        <Area name={`${t.tablePeriodB} (${comparePeriodTxs.displayB})`} type="monotone" dataKey="valB" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#gradVelB)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. Grouped Payment Method Spending Bar Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {t.comparePaymentTitle}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-0.5">
                      {t.comparePaymentSubtitle}
                    </p>
                  </div>
                  <div className="h-[300px] flex items-center justify-center">
                    {comparePaymentData.length === 0 ? (
                      <span className="text-xs font-semibold text-slate-400">{t.noExpenses}</span>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparePaymentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#1E293B' : '#E2E8F0'} vertical={false} />
                          <XAxis dataKey="name" stroke={document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#4B5563'} fontSize={9} tickLine={false} />
                          <YAxis stroke={document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#4B5563'} fontSize={9} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: document.documentElement.classList.contains('dark') ? '#0F172A' : '#FFFFFF',
                              borderColor: document.documentElement.classList.contains('dark') ? '#334155' : '#E2E8F0',
                              borderRadius: '12px',
                              fontSize: '11px'
                            }} 
                            cursor={{ fill: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.02)' }}
                          />
                          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} formatter={renderLegendText} />
                          <Bar name={`${t.tablePeriodA} (${comparePeriodTxs.displayA})`} dataKey="valA" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                          <Bar name={`${t.tablePeriodB} (${comparePeriodTxs.displayB})`} dataKey="valB" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* 4. Cumulative Net Cash Flow Area Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {t.compareNetFlowTitle}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-0.5">
                      {t.compareNetFlowSubtitle}
                    </p>
                  </div>
                  <div className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={compareNetFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradNetA" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="gradNetB" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#1E293B' : '#E2E8F0'} vertical={false} />
                        <XAxis dataKey="name" stroke={document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#4B5563'} fontSize={9} tickLine={false} />
                        <YAxis stroke={document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#4B5563'} fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: document.documentElement.classList.contains('dark') ? '#0F172A' : '#FFFFFF',
                            borderColor: document.documentElement.classList.contains('dark') ? '#334155' : '#E2E8F0',
                            borderRadius: '12px',
                            fontSize: '11px'
                          }} 
                          cursor={{ stroke: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} formatter={renderLegendText} />
                        <Area name={`${t.tablePeriodA} (${comparePeriodTxs.displayA})`} type="monotone" dataKey="valA" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#gradNetA)" />
                        <Area name={`${t.tablePeriodB} (${comparePeriodTxs.displayB})`} type="monotone" dataKey="valB" stroke="#8B5CF6" strokeWidth={2.5} fillOpacity={1} fill="url(#gradNetB)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Dynamic Analist Coach Insight Banner */}
              {aiCompareInsights.length > 0 && (
                <div className="p-5 bg-brand-500/5 dark:bg-brand-500/5 rounded-3xl border border-brand-100 dark:border-brand-950/30 text-slate-800 dark:text-slate-200 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400">
                    <TrendingUp size={18} className="animate-pulse" />
                    <h4 className="text-xs font-black uppercase tracking-wider">{t.aiReportHeading}</h4>
                  </div>
                  <div className="space-y-2 text-xs font-semibold leading-relaxed">
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      {t.compareIntro.replace('{periodA}', comparePeriodTxs.displayA).replace('{periodB}', comparePeriodTxs.displayB)}
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
                      {aiCompareInsights.map((insight, idx) => (
                        <li key={idx} dangerouslySetInnerHTML={{ __html: insight }} />
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Detailed Category Comparison List/Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
                  {t.comparisonMetrics}
                </h3>
                <div className="overflow-x-auto custom-scrollbar pb-2">
                  <table className="w-full text-xs min-w-[650px]">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[9px]">
                        <th className="text-left py-3 font-extrabold whitespace-nowrap w-[24%]">{t.tableCategory}</th>
                        <th className="text-left py-3 font-extrabold whitespace-nowrap w-[19%] pl-4">{t.tablePeriodA} ({comparePeriodTxs.displayA})</th>
                        <th className="text-left py-3 font-extrabold whitespace-nowrap w-[19%] pl-4">{t.tablePeriodB} ({comparePeriodTxs.displayB})</th>
                        <th className="text-left py-3 font-extrabold whitespace-nowrap w-[19%] pl-4">{t.tableDiff}</th>
                        <th className="text-right py-3 font-extrabold whitespace-nowrap w-[19%]">{t.tablePctChange}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium">
                      {compareCategoryData.map((cat) => {
                        const diff = cat.valB - cat.valA;
                        const pct = cat.valA === 0 ? (cat.valB > 0 ? 100 : 0) : Math.round((diff / cat.valA) * 100);
                        
                        return (
                          <tr key={cat.catId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all text-slate-700 dark:text-slate-300">
                            <td className="py-3 flex items-center space-x-2 whitespace-nowrap">
                              <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: cat.color }} />
                              <span className="font-extrabold text-slate-800 dark:text-slate-200">{cat.name}</span>
                            </td>
                            <td className="text-left py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap pl-4">
                              {formatCurrency(cat.valA, currency)}
                            </td>
                            <td className="text-left py-3 font-extrabold text-slate-800 dark:text-slate-100 whitespace-nowrap pl-4">
                              {formatCurrency(cat.valB, currency)}
                            </td>
                            <td className={`text-left py-3 font-extrabold whitespace-nowrap pl-4 ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                              {diff > 0 ? '+' : ''}{formatCurrency(diff, currency)}
                            </td>
                            <td className="text-right py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 font-black px-1.5 py-0.5 rounded ${
                                diff > 0 
                                  ? 'bg-red-500/10 text-red-500' 
                                  : diff < 0 
                                    ? 'bg-emerald-500/10 text-emerald-500' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}>
                                {diff > 0 ? <ArrowUpRight size={10} /> : diff < 0 ? <ArrowDownRight size={10} /> : null}
                                {pct > 0 ? '+' : ''}{pct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: PREMIUM ANALYTICS INSIGHTS VIEW                        */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'insights' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Sub Tab Navigation bar */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/40 max-w-full overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveInsightTab('forecaster')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                activeInsightTab === 'forecaster'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/40 dark:border-slate-800/40'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {isEn ? 'Committed Costs' : 'Sabit Gider Tahmini'}
            </button>
            <button
              onClick={() => setActiveInsightTab('snowball')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                activeInsightTab === 'snowball'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/40 dark:border-slate-800/40'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {isEn ? 'Debt Snowball' : 'Borç Kartopu'}
            </button>
            <button
              onClick={() => setActiveInsightTab('wealth')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                activeInsightTab === 'wealth'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/40 dark:border-slate-800/40'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {isEn ? 'FI/RE & Wealth' : 'FI/RE & Servet Projeksiyonu'}
            </button>
            <button
              onClick={() => setActiveInsightTab('heatmap')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                activeInsightTab === 'heatmap'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/40 dark:border-slate-800/40'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {isEn ? 'Spending Heatmap' : 'Harcama Sıcaklık Takvimi'}
            </button>
          </div>

          {/* Sub Tab Contents */}
          <div className="pt-2">
            {activeInsightTab === 'forecaster' && (
              <ForecasterReport
                subscriptions={subscriptions}
                recurringTransactions={recurringTransactions}
                transactions={transactions}
                currency={currency}
                isEn={isEn}
              />
            )}
            {activeInsightTab === 'snowball' && (
              <DebtSnowballReport
                debts={debts}
                avgMonthlyIncome={avgMonthlyIncome}
                currency={currency}
                isEn={isEn}
              />
            )}
            {activeInsightTab === 'wealth' && (
              <WealthTrajectoryReport
                assets={assets}
                goals={goals}
                transactions={transactions}
                currency={currency}
                isEn={isEn}
              />
            )}
            {activeInsightTab === 'heatmap' && (
              <SpendingHeatmapReport
                transactions={transactions}
                categories={categories}
                currency={currency}
                isEn={isEn}
              />
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default Reports;
