import React, { useState, useMemo } from 'react';
import { 
  TrendingDown, 
  CheckCircle2, 
  Coins, 
  TrendingUp,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import type { Debt } from '../../db/types';

interface DebtSnowballReportProps {
  debts: Debt[];
  avgMonthlyIncome: number;
  currency: string;
  isEn: boolean;
}

export const DebtSnowballReport: React.FC<DebtSnowballReportProps> = ({
  debts,
  avgMonthlyIncome,
  currency,
  isEn
}) => {
  const isDark = document.documentElement.classList.contains('dark');
  const textFill = isDark ? '#9CA3AF' : '#4B5563';
  const gridStroke = isDark ? '#1E293B' : '#E2E8F0';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#E2E8F0';

  // Filter unpaid debts and receivables
  const unpaidDebts = useMemo(() => debts.filter(d => d.type === 'debt' && !d.is_paid), [debts]);
  const unpaidReceivables = useMemo(() => debts.filter(d => d.type === 'receivable' && !d.is_paid), [debts]);

  const totalDebt = useMemo(() => unpaidDebts.reduce((sum, d) => sum + Number(d.amount), 0), [unpaidDebts]);
  const totalReceivable = useMemo(() => unpaidReceivables.reduce((sum, d) => sum + Number(d.amount), 0), [unpaidReceivables]);

  // Debt-to-Income Health (Total Debt / Avg Monthly Income)
  const dtiRatio = useMemo(() => {
    if (avgMonthlyIncome <= 0) return 0;
    return Math.round((totalDebt / avgMonthlyIncome) * 100);
  }, [totalDebt, avgMonthlyIncome]);

  // Setup interactive user slider for monthly payoff allocation
  // Default allocation: 10% of monthly income, or minimum 1000
  const defaultPayoffAlloc = useMemo(() => {
    const calculated = Math.round(avgMonthlyIncome * 0.15);
    return Math.max(1000, calculated || 1000);
  }, [avgMonthlyIncome]);

  const [monthlyAlloc, setMonthlyAlloc] = useState<number>(defaultPayoffAlloc);

  // Debt Snowball Simulation Logic (paying off debts from smallest to largest amount)
  const simulation = useMemo(() => {
    if (unpaidDebts.length === 0 || monthlyAlloc <= 0) {
      return { monthsToFree: 0, timeline: [], payoffList: [] };
    }

    // Sort debts by amount ascending (Smallest-first Debt Snowball method)
    const sortedDebts = [...unpaidDebts]
      .map(d => ({ id: d.id, title: d.title, remaining: Number(d.amount), total: Number(d.amount) }))
      .sort((a, b) => a.total - b.total);

    const timeline = [];
    const payoffList: Array<{ title: string; month: number; year: number; dateStr: string }> = [];
    
    let currentMonth = new Date();
    let totalRemaining = totalDebt;
    let step = 0;
    const maxSteps = 120; // 10 years limit to prevent infinite loop

    // Initial state
    timeline.push({
      name: isEn ? 'Start' : 'Başlangıç',
      kalanBorc: totalRemaining,
      step: 0
    });

    while (totalRemaining > 0 && step < maxSteps) {
      step++;
      
      // Advance month
      const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + step, 1);
      const mStr = nextMonth.toLocaleDateString(isEn ? 'en-US' : 'tr-TR', { month: 'short', year: '2-digit' });

      let monthlyBudget = monthlyAlloc;

      // Apply budget to debts in sorted order
      for (const debt of sortedDebts) {
        if (debt.remaining <= 0) continue;

        if (monthlyBudget >= debt.remaining) {
          // Payoff debt completely
          monthlyBudget -= debt.remaining;
          debt.remaining = 0;
          
          payoffList.push({
            title: debt.title,
            month: nextMonth.getMonth() + 1,
            year: nextMonth.getFullYear(),
            dateStr: nextMonth.toLocaleDateString(isEn ? 'en-US' : 'tr-TR', { month: 'long', year: 'numeric' })
          });
        } else {
          // Partially pay
          debt.remaining -= monthlyBudget;
          monthlyBudget = 0;
          break; // budget exhausted for this month
        }
      }

      totalRemaining = sortedDebts.reduce((sum, d) => sum + d.remaining, 0);

      timeline.push({
        name: mStr,
        kalanBorc: Math.round(totalRemaining),
        step
      });
    }

    return {
      monthsToFree: step,
      timeline,
      payoffList
    };
  }, [unpaidDebts, totalDebt, monthlyAlloc, isEn]);

  // Bilingual text configurations
  const text = {
    debtsTab: isEn ? 'Debt Snowball & Payoff' : 'Borç Kartopu Simülatörü',
    totalDebtLabel: isEn ? 'Total Active Debts' : 'Toplam Aktif Borçlarınız',
    receivablesLabel: isEn ? 'Active Receivables' : 'Aktif Alacaklarınız',
    dtiLabel: isEn ? 'Debt-to-Income Score' : 'Borç / Gelir Katsayısı',
    dtiHealthy: isEn ? 'Excellent Health' : 'Çok Güvenli Borç Yükü',
    dtiWarning: isEn ? 'Caution Alert' : 'Dikkat Seviyesi',
    dtiCritical: isEn ? 'Critical Overhead' : 'Kritik Borç Yoğunluğu',
    dtiDesc: isEn 
      ? 'Compares your total debt balance against your average monthly income.' 
      : 'Toplam borç yükünüzün aylık ortalama gelirinize olan katsayısı.',
    allocLabel: isEn ? 'Monthly Payoff Allocation' : 'Borç Ödemeye Ayrılan Aylık Bütçe',
    allocDesc: isEn
      ? 'Drag to adjust your planned monthly payoff amount to see how it affects your freedom timeline.'
      : 'Aylık ayırabileceğiniz ödeme bütçesini değiştirerek borçsuzluğa ulaşma hızınızı kıyaslayın.',
    freedomEta: isEn ? 'Months to Debt-Free' : 'Borçların Sıfırlanma Süresi',
    months: isEn ? 'months' : 'ay',
    years: isEn ? 'years' : 'yıl',
    payoffTimelineTitle: isEn ? 'Debt Snowball Reduction Path' : 'Borç Kartopu Azalma Grafiği',
    payoffTimelineSubtitle: isEn ? 'Simulated debt balance projection over upcoming months' : 'Gelecek aylarda borç bakiye düşüş hızı simülasyonu',
    debtFreeBanner: isEn ? '🎉 Debt-Free Target Date:' : '🎉 Borçsuzluğa Ulaşacağınız Hedef Tarih:',
    receivablesDesc: isEn
      ? 'Collect outstanding receivables to accelerate your snowball effect even further.'
      : 'Alacaklarınızı tahsil ederek borç kapama hızınızı ve kartopu etkisini daha da hızlandırabilirsiniz.',
    coachTitle: isEn ? 'Debt-to-Income Insights' : 'Borç & Gelir Durumu İncelemesi',
    insightHealthy: isEn
      ? 'Superb! Your total debt is below 50% of a single month\'s income. Your leverage is very low and your debt health is pristine.'
      : 'Mükemmel! Toplam borcunuz bir aylık gelirinizin %50\'sinin altında. Finansal borç yükünüz son derece hafif ve sürdürülebilir.',
    insightWarning: isEn
      ? 'Warning: Your debt spans 1x-3x of your monthly income. Focus on clearing smaller balances first to gain momentum.'
      : 'Dikkat: Borç yükünüz aylık gelirinizin 1 ila 3 katı arasında. Kartopu metodunu izleyerek önce ufak borçları kapatıp ivme kazanın.',
    insightCritical: isEn
      ? 'Critical! Debt exceeds 3x your monthly income. Stop taking additional loans immediately. Maximize your monthly allocation to avoid compound interest fees.'
      : 'Kritik Seviye! Toplam borcunuz aylık gelirinizin 3 katını aşmış durumda. Yeni borç almayı acilen durdurmalı ve sabit ödeme bütçenizi artırmalısınız.',
    payoffTimelineTableHeader: isEn ? 'Payoff Milestone Schedule' : 'Borç Kapanış Takvimi',
    tableDebtTitle: isEn ? 'Debt Account' : 'Borç Kalemi',
    tablePayoffDate: isEn ? 'Target Cleared Date' : 'Kapanış Hedefi'
  };

  const dtiBadgeColor = dtiRatio < 50 ? 'emerald' : dtiRatio < 200 ? 'amber' : 'red';
  const dtiBadgeText = dtiRatio < 50 ? text.dtiHealthy : dtiRatio < 200 ? text.dtiWarning : text.dtiCritical;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="p-3 rounded-xl border shadow-xl text-xs space-y-1 font-semibold z-50 animate-in fade-in duration-100"
          style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
        >
          <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">
            {payload[0]?.payload?.name}
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {isEn ? 'Remaining Debt' : 'Kalan Borç'}:
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(payload[0]?.value || 0, currency)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Quick Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Debts */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl">
            <TrendingDown size={22} />
          </div>
          <div className="space-y-0.5 truncate">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{text.totalDebtLabel}</span>
            <strong className="text-lg font-extrabold text-red-600 dark:text-red-400 block">
              {formatCurrency(totalDebt, currency)}
            </strong>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              {unpaidDebts.length} {isEn ? 'unpaid entries' : 'aktif borç kaydı'}
            </span>
          </div>
        </div>

        {/* Total Receivables */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <TrendingUp size={22} />
          </div>
          <div className="space-y-0.5 truncate">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{text.receivablesLabel}</span>
            <strong className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 block">
              {formatCurrency(totalReceivable, currency)}
            </strong>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              {unpaidReceivables.length} {isEn ? 'unpaid receipts' : 'aktif alacak kaydı'}
            </span>
          </div>
        </div>

        {/* DTI Health Metric */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Coins size={22} />
          </div>
          <div className="space-y-0.5 truncate">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{text.dtiLabel}</span>
            <strong className={`text-lg font-extrabold block ${
              dtiBadgeColor === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : dtiBadgeColor === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-450'
            }`}>
              %{dtiRatio}
            </strong>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded bg-${dtiBadgeColor}-500/10 text-${dtiBadgeColor}-600 dark:text-${dtiBadgeColor}-400 inline-block`}>
              {dtiBadgeText}
            </span>
          </div>
        </div>
      </div>

      {/* 2. DTI Health Advisor & Receivables */}
      <div className={`p-5 rounded-2xl border shadow-sm ${
        dtiBadgeColor === 'emerald' 
          ? 'bg-emerald-500/5 border-emerald-100 dark:border-emerald-950/20' 
          : dtiBadgeColor === 'amber' 
            ? 'bg-amber-500/5 border-amber-100 dark:border-amber-950/20' 
            : 'bg-red-500/5 border-red-100 dark:border-red-950/20'
      }`}>
        <div className="space-y-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Info size={14} className={dtiBadgeColor === 'emerald' ? 'text-emerald-500' : dtiBadgeColor === 'amber' ? 'text-amber-500' : 'text-red-500'} />
            {text.coachTitle}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
            {dtiRatio < 50 ? text.insightHealthy : dtiRatio < 200 ? text.insightWarning : text.insightCritical}
            {totalReceivable > 0 && ' ' + text.receivablesDesc}
          </p>
        </div>
      </div>

      {/* 3. Debt Snowball Interactive Simulator Cockpit */}
      {totalDebt > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Interactive controls and timeline */}
          <div className="lg:col-span-4 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between space-y-6">
            
            {/* Payoff allocation slider controller */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {text.allocLabel}
                </h3>
                <span className="text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-xl">
                  {formatCurrency(monthlyAlloc, currency)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {text.allocDesc}
              </p>
              
              <div className="space-y-2 pt-2">
                <input
                  type="range"
                  min={Math.max(500, Math.round(defaultPayoffAlloc * 0.1))}
                  max={Math.max(10000, Math.round(defaultPayoffAlloc * 4))}
                  step={250}
                  value={monthlyAlloc}
                  onChange={(e) => setMonthlyAlloc(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
                />
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>{formatCurrency(Math.max(500, Math.round(defaultPayoffAlloc * 0.1)), currency)}</span>
                  <span>{formatCurrency(Math.max(10000, Math.round(defaultPayoffAlloc * 4)), currency)}</span>
                </div>
              </div>
            </div>

            {/* ETA to Debt Free Counter */}
            <div className="p-4.5 rounded-2xl border border-brand-100 dark:border-brand-950/20 bg-brand-500/5 dark:bg-brand-500/5 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {text.freedomEta}
              </span>
              <strong className="text-3xl font-black text-brand-600 dark:text-brand-400 block tracking-tight">
                {simulation.monthsToFree} <span className="text-lg font-bold text-slate-500 dark:text-slate-400">{text.months}</span>
              </strong>
              {simulation.payoffList.length > 0 && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                  {text.debtFreeBanner} <strong className="text-slate-700 dark:text-slate-200">{simulation.payoffList[simulation.payoffList.length - 1].dateStr}</strong>
                </span>
              )}
            </div>

          </div>

          {/* Payoff Projection Area Chart */}
          <div className="lg:col-span-8 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col space-y-4 justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-md tracking-tight">
                {text.payoffTimelineTitle}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                {text.payoffTimelineSubtitle}
              </p>
            </div>
            
            <div className="h-[250px] w-full flex items-center justify-center pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulation.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSnowball" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="name" stroke={textFill} fontSize={9} tickLine={false} />
                  <YAxis stroke={textFill} fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    name="Kalan Borç" 
                    type="monotone" 
                    dataKey="kalanBorc" 
                    stroke="#EF4444" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorSnowball)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Debt Snowball Payoff order timeline table details */}
          {simulation.payoffList.length > 0 && (
            <div className="lg:col-span-12 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight border-b border-slate-100 dark:border-slate-800 pb-3">
                {text.payoffTimelineTableHeader}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {simulation.payoffList.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/40 flex items-center justify-between group hover:border-slate-200 dark:hover:border-slate-700/60 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-black shrink-0">
                        {idx + 1}
                      </span>
                      <div className="space-y-0.5 truncate">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block truncate group-hover:text-emerald-500 dark:group-hover:text-emerald-450 transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold block uppercase tracking-wider">
                          {item.dateStr}
                        </span>
                      </div>
                    </div>
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-slate-250 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
          <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
          <p className="text-slate-800 dark:text-slate-200 font-extrabold text-sm">{isEn ? 'All Debt-Free!' : 'Borcunuz bulunmuyor!'}</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mt-1">{isEn ? 'Congratulations on maintaining perfect credit leverage.' : 'Tebrikler, mali dengenizi korumayı başardınız.'}</p>
        </div>
      )}

    </div>
  );
};
