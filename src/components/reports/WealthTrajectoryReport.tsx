import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Target, 
  ShieldCheck, 
  DollarSign, 
  Hourglass,
  Sliders
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
import type { Asset, Goal, Transaction } from '../../db/types';

interface WealthTrajectoryReportProps {
  assets: Asset[];
  goals: Goal[];
  transactions: Transaction[];
  currency: string;
  isEn: boolean;
}

export const WealthTrajectoryReport: React.FC<WealthTrajectoryReportProps> = ({
  assets,
  goals,
  transactions,
  currency,
  isEn
}) => {
  const isDark = document.documentElement.classList.contains('dark');
  const textFill = isDark ? '#9CA3AF' : '#4B5563';
  const gridStroke = isDark ? '#1E293B' : '#E2E8F0';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#E2E8F0';

  // 1. Calculate active Net Worth
  const totalNetWorth = useMemo(() => {
    return assets.reduce((sum, a) => sum + Number(a.value || 0), 0);
  }, [assets]);

  // Calculate historical monthly average income and expenses
  const averageMetrics = useMemo(() => {
    const amountsByMonthInc: Record<string, number> = {};
    const amountsByMonthExp: Record<string, number> = {};

    transactions.forEach(t => {
      const mStr = t.transaction_date.substring(0, 7);
      if (t.type === 'income') {
        amountsByMonthInc[mStr] = (amountsByMonthInc[mStr] || 0) + t.amount;
      } else {
        amountsByMonthExp[mStr] = (amountsByMonthExp[mStr] || 0) + t.amount;
      }
    });

    const months = Array.from(new Set([...Object.keys(amountsByMonthInc), ...Object.keys(amountsByMonthExp)]));
    if (months.length === 0) return { income: 0, expense: 0, savings: 0 };

    const totalInc = Object.values(amountsByMonthInc).reduce((sum, a) => sum + a, 0);
    const totalExp = Object.values(amountsByMonthExp).reduce((sum, a) => sum + a, 0);
    const monthsCount = Math.max(1, months.length);

    const avgInc = totalInc / monthsCount;
    const avgExp = totalExp / monthsCount;

    return {
      income: avgInc,
      expense: avgExp,
      savings: Math.max(0, avgInc - avgExp)
    };
  }, [transactions]);

  // FI/RE Runway Months: Net Worth / Monthly Expenses
  const runwayMonths = useMemo(() => {
    if (averageMetrics.expense <= 0) return totalNetWorth > 0 ? 999 : 0;
    return Math.round(totalNetWorth / averageMetrics.expense);
  }, [totalNetWorth, averageMetrics]);

  // User interactive state parameters
  const [yearsProjected, setYearsProjected] = useState<5 | 10 | 20>(10);
  const [annualReturn, setAnnualReturn] = useState<number>(10); // 10% expected annual compound return

  // 2. Generate future compound interest wealth trajectory simulation data
  const wealthTimeline = useMemo(() => {
    const data = [];
    let net = totalNetWorth;
    const monthlySaving = averageMetrics.savings;
    const annualReturnRate = annualReturn / 100;
    
    // Initial year 0
    data.push({
      name: isEn ? 'Year 0' : 'Başlangıç',
      netDeger: Math.round(net),
      label: isEn ? 'Year 0' : 'Başlangıç'
    });

    for (let y = 1; y <= yearsProjected; y++) {
      // Net Worth compounded at annualReturnRate plus 12 months of savings
      net = (net * (1 + annualReturnRate)) + (monthlySaving * 12);
      
      data.push({
        name: isEn ? `Yr ${y}` : `${y}. Yıl`,
        netDeger: Math.round(net),
        label: isEn ? `Year ${y}` : `${y}. Yıl Projeksiyonu`
      });
    }

    return data;
  }, [totalNetWorth, averageMetrics.savings, annualReturn, yearsProjected, isEn]);

  // Bilingual text dictionary
  const text = {
    netWorth: isEn ? 'Net Worth Asset Value' : 'Toplam Net Değeriniz',
    savingsSpeed: isEn ? 'Monthly Savings Velocity' : 'Aylık Birikim Hızınız',
    runway: isEn ? 'Financial Freedom Runway' : 'Finansal Özgürlük Pisti',
    runwayDesc: isEn 
      ? 'Estimated months you can sustain your lifestyle relying solely on net worth.'
      : 'Geliriniz tamamen kesilse dahi mevcut varlıklarınızla yaşayabileceğiniz süre.',
    projTitle: isEn ? 'Wealth Compounding Projector' : 'Servet Katlanma Projeksiyonu',
    projSubtitle: isEn ? 'Expected net worth growth over years including compound returns' : 'Yıllık bileşik getiri ve birikim hızıyla net değer büyümesi',
    years5: isEn ? '5 Years' : '5 Yıl',
    years10: isEn ? '10 Years' : '10 Yıl',
    years20: isEn ? '20 Years' : '20 Yıl',
    rateLabel: isEn ? 'Expected Annual Return' : 'Beklenen Yıllık Yatırım Getirisi',
    goalsTitle: isEn ? 'Savings Goals ETA' : 'Hedeflere Ulaşma Süreleri',
    goalsSubtitle: isEn ? 'Timeline projections for your active savings targets' : 'Aktif hedeflerinize mevcut birikim hızınızla tahmini ulaşma vakitleri',
    noActiveGoals: isEn ? 'No active savings goals found.' : 'Aktif birikim hedefi bulunmuyor.',
    goalsTableHeader: isEn ? 'Savings Milestones' : 'Tasarruf Yol Haritası',
    monthsLeft: isEn ? 'months left' : 'ay kaldı',
    completed: isEn ? 'Completed' : 'Tamamlandı',
    infRunway: isEn ? 'Infinite Runway' : 'Sonsuz Özgürlük',
    coachTitle: isEn ? 'FI/RE & Financial Freedom Coach' : 'Finansal Özgürlük Analizi',
    insightGood: isEn
      ? 'Superb financial runway! Your assets can sustain your lifestyle for more than 12 months. Focus on routing wealth into productive investments.'
      : 'Harika bir finansal pist! Varlıklarınız sizi 12 aydan daha uzun süre destekleyebilir. Şimdi varlıklarınızı üretken yatırımlara yönlendirmeye odaklanın.',
    insightLow: isEn
      ? 'Your financial runway is relatively short (under 6 months). Focus on building a robust emergency fund before entering volatile investments.'
      : 'Finansal hareket alanınız kısıtlı (6 aydan kısa). Riskli yatırımlara girmeden önce kendinize en az 6 aylık bir acil durum fonu oluşturmalısınız.',
    insightFire: isEn
      ? 'Incredible! You have reached full FI/RE potential (over 120 months runway). You are financially free and your assets can work for you!'
      : 'İnanılmaz! Tam finansal özgürlük eşiğini aştınız (10 yıldan fazla birikim pisti). Artık finansal olarak özgürsünüz, varlıklarınız sizin yerinize çalışabilir!'
  };

  const runwayStatus = runwayMonths >= 120 ? 'fire' : runwayMonths >= 12 ? 'good' : 'low';
  const runwayBadgeColor = runwayStatus === 'fire' ? 'purple' : runwayStatus === 'good' ? 'emerald' : 'amber';
  
  const runwayBadgeText = runwayStatus === 'fire' 
    ? text.infRunway 
    : runwayStatus === 'good' 
      ? (isEn ? 'Stable Runway' : 'Güvenli Pist') 
      : (isEn ? 'Short Runway' : 'Kısıtlı Pist');

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="p-3.5 rounded-xl border shadow-xl text-xs space-y-1 font-semibold z-50 animate-in fade-in duration-100"
          style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
        >
          <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">
            {payload[0]?.payload?.label}
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {isEn ? 'Projected Net Worth' : 'Tahmini Servet'}:
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
      
      {/* 1. Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Net Worth */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <TrendingUp size={22} />
          </div>
          <div className="space-y-0.5 truncate">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{text.netWorth}</span>
            <strong className="text-lg font-extrabold text-slate-900 dark:text-white block">
              {formatCurrency(totalNetWorth, currency)}
            </strong>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              {assets.length} {isEn ? 'assets owned' : 'aktif varlık'}
            </span>
          </div>
        </div>

        {/* Savings Speed */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-2xl">
            <DollarSign size={22} />
          </div>
          <div className="space-y-0.5 truncate">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{text.savingsSpeed}</span>
            <strong className="text-lg font-extrabold text-brand-600 dark:text-brand-400 block">
              {formatCurrency(averageMetrics.savings, currency)}
            </strong>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              {isEn ? 'Monthly average surplus' : 'Aylık ortalama tasarruf'}
            </span>
          </div>
        </div>

        {/* Freedom Runway Months */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl">
            <Hourglass size={22} />
          </div>
          <div className="space-y-0.5 truncate">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{text.runway}</span>
            <strong className="text-lg font-extrabold text-slate-900 dark:text-white block">
              {runwayMonths >= 999 ? '999+' : runwayMonths} <span className="text-xs font-bold text-slate-400">{isEn ? 'Months' : 'Ay'}</span>
            </strong>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded bg-${runwayBadgeColor}-500/10 text-${runwayBadgeColor}-600 dark:text-${runwayBadgeColor}-400 inline-block`}>
              {runwayBadgeText}
            </span>
          </div>
        </div>
      </div>

      {/* 2. FI/RE Runway Advisor Coach */}
      <div className={`p-5 rounded-2xl border shadow-sm ${
        runwayStatus === 'fire' 
          ? 'bg-purple-500/5 border-purple-100 dark:border-purple-950/20' 
          : runwayStatus === 'good' 
            ? 'bg-emerald-500/5 border-emerald-100 dark:border-emerald-950/20' 
            : 'bg-amber-500/5 border-amber-100 dark:border-amber-950/20'
      }`}>
        <div className="space-y-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={14} className={runwayStatus === 'fire' ? 'text-purple-500' : runwayStatus === 'good' ? 'text-emerald-500' : 'text-amber-500'} />
            {text.coachTitle}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed font-semibold">
            {runwayStatus === 'fire' ? text.insightFire : runwayStatus === 'good' ? text.insightGood : text.insightLow}
          </p>
        </div>
      </div>

      {/* 3. Wealth Compound Area Chart & Controllers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Projector Controls sidebar */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Timeline selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
                {isEn ? 'Projection Timeline' : 'Tahmin Zaman Çizelgesi'}
              </label>
              <div className="grid grid-cols-3 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/40 dark:border-slate-700/30">
                <button
                  onClick={() => setYearsProjected(5)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    yearsProjected === 5
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-450 shadow-sm border border-slate-200/30 dark:border-slate-800/35'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {text.years5}
                </button>
                <button
                  onClick={() => setYearsProjected(10)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    yearsProjected === 10
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-450 shadow-sm border border-slate-200/30 dark:border-slate-800/35'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {text.years10}
                </button>
                <button
                  onClick={() => setYearsProjected(20)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    yearsProjected === 20
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-450 shadow-sm border border-slate-200/30 dark:border-slate-800/35'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {text.years20}
                </button>
              </div>
            </div>

            {/* expected annual return rate slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
                  {text.rateLabel}
                </label>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                  %{annualReturn}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={annualReturn}
                onChange={(e) => setAnnualReturn(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none animate-in fade-in"
              />
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5 pr-0.5">
                <span>%0</span>
                <span>%50</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/20 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold flex gap-2">
            <Sliders size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>
              {isEn 
                ? 'Simulates compounding returns based on current net worth and average savings. Projections are mathematically estimated.'
                : 'Mevcut varlıklarınızın yıllık getirisi ve aylık tasarruf birikim hızıyla katlanma simülasyonudur. Değerler matematiksel tahminlerdir.'}
            </span>
          </div>

        </div>

        {/* Wealth compound chart area */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-md tracking-tight">
              {text.projTitle}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
              {text.projSubtitle}
            </p>
          </div>

          <div className="h-[260px] w-full flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wealthTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="name" stroke={textFill} fontSize={9} tickLine={false} />
                <YAxis stroke={textFill} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  name="Net Değer" 
                  type="monotone" 
                  dataKey="netDeger" 
                  stroke="#10B981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorWealth)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 4. Active Savings Goals Milestones Grid */}
      <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">
            {text.goalsTitle}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
            {text.goalsSubtitle}
          </p>
        </div>

        {goals.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Target size={32} className="mx-auto text-slate-400 dark:text-slate-600 mb-2.5" />
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{text.noActiveGoals}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => {
              const current = Number(goal.current_amount);
              const target = Number(goal.target_amount);
              const remaining = Math.max(0, target - current);
              const progressPct = Math.round((current / target) * 100);

              let etaText = '';
              if (remaining <= 0) {
                etaText = text.completed;
              } else if (averageMetrics.savings <= 0) {
                etaText = isEn ? 'Savings rate too low' : 'Hız yetersiz';
              } else {
                const monthsLeft = Math.ceil(remaining / averageMetrics.savings);
                etaText = `${monthsLeft} ${text.monthsLeft}`;
              }

              return (
                <div 
                  key={goal.id}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-800/40 flex flex-col justify-between gap-3 group hover:border-slate-200 dark:hover:border-slate-700/60 transition-all duration-200"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 truncate">
                        <span 
                          className="w-3 h-3 rounded-full inline-block border shrink-0" 
                          style={{ backgroundColor: goal.color || '#10B981', borderColor: `${goal.color || '#10B981'}50` }} 
                        />
                        {goal.name}
                      </h4>
                      <span className="text-[10px] text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md font-black shrink-0">
                        {etaText}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 pt-0.5">
                      <span>{formatCurrency(current, currency)}</span>
                      <span>/ {formatCurrency(target, currency)}</span>
                    </div>
                  </div>

                  {/* Milestones linear bar */}
                  <div className="space-y-1">
                    <div className="h-1.8 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, progressPct)}%`, backgroundColor: goal.color || '#10B981' }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 pl-0.5">
                      <span>%{progressPct}</span>
                      {remaining > 0 && (
                        <span>
                          {isEn ? 'Goal date:' : 'Hedef:'} {goal.target_date}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
