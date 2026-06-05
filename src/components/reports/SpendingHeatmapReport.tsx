import React, { useMemo, useState } from 'react';
import { 
  Info,
  Clock
} from 'lucide-react';
import { formatCurrency, formatMonthName, formatShortDate } from '../../utils/formatters';
import type { Transaction, Category } from '../../db/types';

interface SpendingHeatmapReportProps {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  isEn: boolean;
}

export const SpendingHeatmapReport: React.FC<SpendingHeatmapReportProps> = ({
  transactions,
  categories,
  currency,
  isEn
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ date: string; amount: number } | null>(null);

  // 1. Filter expense transactions
  const expenseTxs = useMemo(() => {
    return transactions.filter(t => t.type === 'expense');
  }, [transactions]);

  // Aggregate expenses by exact date "YYYY-MM-DD"
  const spentByDate = useMemo(() => {
    const map: Record<string, number> = {};
    expenseTxs.forEach(t => {
      const dStr = t.transaction_date;
      map[dStr] = (map[dStr] || 0) + t.amount;
    });
    return map;
  }, [expenseTxs]);

  // Find the maximum daily expense in the active period
  const maxDailyExpense = useMemo(() => {
    const values = Object.values(spentByDate);
    if (values.length === 0) return 0;
    return Math.max(...values);
  }, [spentByDate]);

  // 2. Generate Calendar Days list for the last 3 months
  const calendarMonths = useMemo(() => {
    const list = [];
    const now = new Date();
    
    for (let m = 2; m >= 0; m--) {
      const date = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      // Calculate days in month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days = [];

      // Calculate leading empty cells to align weekdays (0 = Sunday, 1 = Monday...)
      // Adjust to start calendar on Monday (0 = Mon, 6 = Sun)
      const firstDayOfWeek = new Date(year, month, 1).getDay();
      const leadingEmptyCells = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

      for (let d = 1; d <= daysInMonth; d++) {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const amt = spentByDate[dStr] || 0;
        days.push({
          day: d,
          dateStr: dStr,
          amount: amt
        });
      }

      list.push({
        monthName: formatMonthName(monthKey, isEn),
        leadingEmptyCells,
        days
      });
    }

    return list;
  }, [spentByDate, isEn]);

  // 3. Weekday vs Weekend Analysis
  const temporalMetrics = useMemo(() => {
    let weekdaySpent = 0;
    let weekendSpent = 0;

    const weekdayCatMap: Record<string, number> = {};
    const weekendCatMap: Record<string, number> = {};

    expenseTxs.forEach(t => {
      // Get day of week (0 = Sunday, 6 = Saturday)
      const day = new Date(t.transaction_date).getDay();
      const isWeekend = day === 0 || day === 6;

      if (isWeekend) {
        weekendSpent += t.amount;
        weekendCatMap[t.category_id] = (weekendCatMap[t.category_id] || 0) + t.amount;
      } else {
        weekdaySpent += t.amount;
        weekdayCatMap[t.category_id] = (weekdayCatMap[t.category_id] || 0) + t.amount;
      }
    });

    const total = weekdaySpent + weekendSpent;
    const weekdayPct = total > 0 ? Math.round((weekdaySpent / total) * 100) : 0;
    const weekendPct = total > 0 ? Math.round((weekendSpent / total) * 100) : 0;

    // Get top categories
    const getTopCategoryName = (catMap: Record<string, number>) => {
      const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
      if (sorted.length === 0) return '';
      const cat = categories.find(c => c.id === sorted[0][0]);
      return cat ? cat.name : (isEn ? 'Other' : 'Diğer');
    };

    return {
      weekdaySpent,
      weekendSpent,
      weekdayPct,
      weekendPct,
      topWeekdayCat: getTopCategoryName(weekdayCatMap),
      topWeekendCat: getTopCategoryName(weekendCatMap),
      total
    };
  }, [expenseTxs, categories, isEn]);

  // Determine heatmap color style dynamically based on expense intensity
  const getCellStyles = (amount: number) => {
    if (amount <= 0) return {};
    
    // Calculate ratio relative to max daily expense
    const ratio = maxDailyExpense > 0 ? amount / maxDailyExpense : 0;
    
    // Smooth opacity scale from 0.15 (very low) to 1.0 (maximum)
    const opacity = 0.15 + ratio * 0.85; 
    
    return {
      backgroundColor: `rgba(16, 185, 129, ${opacity})`,
      borderColor: `rgba(16, 185, 129, ${Math.min(1.0, opacity + 0.15)})`
    };
  };

  // Determine heatmap class names
  const getCellClass = (amount: number) => {
    if (amount <= 0) {
      return 'bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200/10 dark:border-slate-800 text-slate-400 dark:text-slate-500';
    }
    // For hovered or colored days, draw high-contrast bold white text in dark mode and bold dark slate in light mode
    return 'text-slate-800 dark:text-slate-100 border hover:scale-[1.05] shadow-sm hover:shadow-emerald-500/10 transition-transform duration-150';
  };

  // Weekday name abbreviations starting on Monday
  const weekdayAbbrTR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const weekdayAbbrEN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekdays = isEn ? weekdayAbbrEN : weekdayAbbrTR;

  // Bilingual text dictionary
  const text = {
    heatmapTitle: isEn ? 'Spending Heatmap Calendar' : 'Harcama Sıcaklık Takvimi',
    heatmapSubtitle: isEn ? 'Daily spending frequencies over the last 3 months' : 'Son 3 aydaki harcama sıklığınız ve yoğunluğunuz',
    legendLabel: isEn ? 'Legend' : 'Renk Skalası',
    legendLess: isEn ? 'No Expense' : 'Harcama Yok',
    legendMore: isEn ? 'High Expense' : 'Yüksek Gider',
    temporalTitle: isEn ? 'Weekday vs Weekend Habits' : 'Hafta İçi & Hafta Sonu Alışkanlıkları',
    temporalSubtitle: isEn ? 'Distribution of spending based on time periods' : 'Zaman dilimlerine göre harcamalarınızın kümülatif dağılımı',
    weekdayLabel: isEn ? 'Weekdays (Mon - Fri)' : 'Hafta İçi Günleri (Pzt - Cum)',
    weekendLabel: isEn ? 'Weekends (Sat - Sun)' : 'Hafta Sonu Günleri (Cmt - Paz)',
    topCatLabel: isEn ? 'Top Category:' : 'En Çok Harcanan:',
    coachAdvisor: isEn ? 'Behavioral Spending Insights' : 'Harcama Davranış Analizi',
    insightHealthy: isEn
      ? 'Well-balanced lifestyle! Your weekend spending makes up a moderate portion of your wealth outflow. You are maintaining steady cashflow limits.'
      : 'Dengeli finansal yaşam! Hafta sonu giderleriniz bütçenizi zorlamıyor, hafta içi sınırlarınızla mükemmel bir uyum sergiliyor.',
    insightWarning: isEn
      ? 'Alert: Your weekend spending is significantly elevated! Entertainment or Dining out seems to surge. Consider setting a specific Weekend Fun Budget.'
      : 'Tebrikler/Dikkat: Hafta sonu harcamalarınız hafta içine göre oldukça yüksek! Eğlence ve dışarıda yemek giderlerinizi kontrol altına almak için bir "Hafta Sonu Eğlence Bütçesi" atamayı düşünebilirsiniz.'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Weekday vs Weekend Analysis panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main temporal behavior card */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4 hover:shadow-md transition-all duration-200">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-md tracking-tight">
              {text.temporalTitle}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
              {text.temporalSubtitle}
            </p>
          </div>

          <div className="space-y-4 pt-1">
            {/* Split Linear bar */}
            <div className="space-y-1">
              <div className="h-6 w-full rounded-2xl overflow-hidden flex text-[10px] font-black text-white relative shadow-sm border border-slate-200/10 dark:border-slate-800">
                {temporalMetrics.weekdaySpent > 0 && (
                  <div 
                    className="h-full bg-brand-600 dark:bg-brand-500 flex items-center justify-center transition-all duration-500"
                    style={{ width: `${temporalMetrics.weekdayPct}%` }}
                  >
                    %{temporalMetrics.weekdayPct}
                  </div>
                )}
                {temporalMetrics.weekendSpent > 0 && (
                  <div 
                    className="h-full bg-amber-500 flex items-center justify-center transition-all duration-500"
                    style={{ width: `${temporalMetrics.weekendPct}%` }}
                  >
                    %{temporalMetrics.weekendPct}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 pl-0.5">
                <span>{text.weekdayLabel}</span>
                <span>{text.weekendLabel}</span>
              </div>
            </div>

            {/* Split Details Grid */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              {/* Weekdays */}
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/15 dark:bg-slate-900/10 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{text.weekdayLabel}</span>
                <strong className="text-md font-extrabold text-slate-800 dark:text-white block">
                  {formatCurrency(temporalMetrics.weekdaySpent, currency)}
                </strong>
                {temporalMetrics.topWeekdayCat && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block truncate">
                    {text.topCatLabel} <strong className="text-slate-700 dark:text-slate-200">{temporalMetrics.topWeekdayCat}</strong>
                  </span>
                )}
              </div>

              {/* Weekends */}
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/15 dark:bg-slate-900/10 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{text.weekendLabel}</span>
                <strong className="text-md font-extrabold text-amber-600 dark:text-amber-500 block">
                  {formatCurrency(temporalMetrics.weekendSpent, currency)}
                </strong>
                {temporalMetrics.topWeekendCat && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block truncate">
                    {text.topCatLabel} <strong className="text-slate-700 dark:text-slate-200">{temporalMetrics.topWeekendCat}</strong>
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Behavioral analysis coach banner */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-200">
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              {text.coachAdvisor}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
              {temporalMetrics.weekendPct > 35 ? text.insightWarning : text.insightHealthy}
            </p>
          </div>
          
          <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold flex gap-2">
            <Info size={16} className="text-brand-500 shrink-0 mt-0.5" />
            <span>
              {isEn 
                ? 'Time-based reports analyze transaction timestamps to identify cyclical expenditure spikes.'
                : 'Zaman dilimli raporlar, periyodik harcama tepe noktalarını tespit etmek için işlem tarihlerini analiz eder.'}
            </span>
          </div>
        </div>

      </div>

      {/* 2. Heatmap Calendar Grid panel */}
      <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-5 hover:shadow-md transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-md tracking-tight">
              {text.heatmapTitle}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
              {text.heatmapSubtitle}
            </p>
          </div>

          {/* Color scale Legend */}
          <div className="flex items-center gap-2 self-start sm:self-center bg-slate-50 dark:bg-slate-800/40 px-3.5 py-1.8 border border-slate-150 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-0.5">{text.legendLess}</span>
            <div className="flex items-center gap-1.2 px-1">
              <span className="w-2.8 h-2.8 rounded bg-slate-100 dark:bg-slate-800" />
              <span className="w-2.8 h-2.8 rounded bg-emerald-500/20" />
              <span className="w-2.8 h-2.8 rounded bg-emerald-500/40" />
              <span className="w-2.8 h-2.8 rounded bg-emerald-500/75" />
              <span className="w-2.8 h-2.8 rounded bg-emerald-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{text.legendMore}</span>
          </div>
        </div>

        {/* Heatmap Months Container */}
        <div className="space-y-6 pt-1">
          {calendarMonths.map((m, mIdx) => (
            <div key={mIdx} className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-5 last:border-0 last:pb-0">
              <h4 className="text-xs font-black text-slate-800 dark:text-white pl-1 uppercase tracking-wider">
                {m.monthName}
              </h4>
              
              <div className="overflow-x-auto custom-scrollbar">
                <div className="min-w-[320px] max-w-full">
                  {/* Calendar Grid Header */}
                  <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {weekdays.map(d => (
                      <div key={d} className="py-0.5">{d}</div>
                    ))}
                  </div>

                  {/* Calendar Grid Days */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {/* leading empty spaces */}
                    {Array.from({ length: m.leadingEmptyCells }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="aspect-square rounded bg-transparent opacity-0 pointer-events-none" />
                    ))}
                    
                    {/* Month cells */}
                    {m.days.map((dayObj, dIdx) => {
                      const isHovered = hoveredCell?.date === dayObj.dateStr;
                      
                      return (
                        <div
                          key={dayObj.dateStr}
                          style={getCellStyles(dayObj.amount)}
                          className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all duration-150 relative ${
                            isHovered ? 'z-30 scale-[1.03] shadow-md' : 'z-0'
                          } ${getCellClass(dayObj.amount)}`}
                          onMouseEnter={() => setHoveredCell({ date: dayObj.dateStr, amount: dayObj.amount })}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <span>{dayObj.day}</span>
                          
                          {/* Rich Floating Tooltip on Hover */}
                          {isHovered && (() => {
                            const colIndex = (m.leadingEmptyCells + dIdx) % 7;
                            let tooltipClass = "left-1/2 -translate-x-1/2";
                            let arrowClass = "left-1/2 -translate-x-1/2";
                            
                            if (colIndex === 0) {
                              tooltipClass = "left-0";
                              arrowClass = "left-3.5";
                            } else if (colIndex === 6) {
                              tooltipClass = "right-0";
                              arrowClass = "right-3.5";
                            }
                            
                            return (
                              <div className={`absolute top-full mt-1.5 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-slate-950 text-white dark:bg-slate-900 shadow-2xl z-50 text-[10px] font-semibold whitespace-nowrap animate-in fade-in zoom-in-95 duration-100 flex flex-col items-center gap-0.5 ${tooltipClass}`}>
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">
                                  {formatShortDate(dayObj.dateStr)}
                                </span>
                                <strong className="text-white text-xs font-black">
                                  {formatCurrency(dayObj.amount, currency)}
                                </strong>
                                {/* micro arrow pointing up */}
                                <div className={`w-1.5 h-1.5 bg-slate-950 dark:bg-slate-900 absolute bottom-full translate-y-1/2 rotate-45 border-t border-l border-slate-200/10 dark:border-slate-800/10 ${arrowClass}`} />
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
