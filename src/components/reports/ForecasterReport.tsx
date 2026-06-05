import React, { useMemo } from 'react';
import { 
  Calendar, 
  CreditCard, 
  Sparkles, 
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { formatCurrency, formatMonthName } from '../../utils/formatters';
import type { Subscription, RecurringTransaction, Transaction } from '../../db/types';

interface ForecasterReportProps {
  subscriptions: Subscription[];
  recurringTransactions: RecurringTransaction[];
  transactions: Transaction[];
  currency: string;
  isEn: boolean;
}

export const ForecasterReport: React.FC<ForecasterReportProps> = ({
  subscriptions,
  recurringTransactions,
  transactions,
  currency,
  isEn
}) => {
  const isDark = document.documentElement.classList.contains('dark');
  const textFill = isDark ? '#9CA3AF' : '#4B5563';
  const gridStroke = isDark ? '#1E293B' : '#E2E8F0';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#E2E8F0';

  // 1. Calculate general stats
  const activeSubs = useMemo(() => subscriptions.filter(s => s.is_active), [subscriptions]);
  
  const totalSubMonthly = useMemo(() => {
    return activeSubs.reduce((sum, s) => sum + Number(s.amount), 0);
  }, [activeSubs]);

  const activeRecurringBills = useMemo(() => {
    return recurringTransactions.filter(r => r.is_active && r.type === 'expense');
  }, [recurringTransactions]);

  const totalRecurringMonthly = useMemo(() => {
    return activeRecurringBills.reduce((sum, r) => {
      const amt = Number(r.amount);
      if (r.frequency === 'monthly') return sum + amt;
      if (r.frequency === 'weekly') return sum + (amt * 4.33); // approx weeks in a month
      if (r.frequency === 'daily') return sum + (amt * 30);
      if (r.frequency === 'yearly') return sum + (amt / 12);
      return sum;
    }, 0);
  }, [activeRecurringBills]);

  // Average monthly income over the past 3 months to compare subscription density
  const avgMonthlyIncome = useMemo(() => {
    const incomeTxs = transactions.filter(t => t.type === 'income');
    if (incomeTxs.length === 0) return 0;

    const amountsByMonth: Record<string, number> = {};
    incomeTxs.forEach(t => {
      const mStr = t.transaction_date.substring(0, 7);
      amountsByMonth[mStr] = (amountsByMonth[mStr] || 0) + t.amount;
    });

    const months = Object.keys(amountsByMonth);
    if (months.length === 0) return 0;

    const totalIncome = Object.values(amountsByMonth).reduce((sum, a) => sum + a, 0);
    return totalIncome / Math.max(1, months.length);
  }, [transactions]);

  // Subscription & Recurring Bill density relative to average monthly income
  const densityRatio = useMemo(() => {
    if (avgMonthlyIncome <= 0) return 0;
    const totalOutflow = totalSubMonthly + totalRecurringMonthly;
    return Math.round((totalOutflow / avgMonthlyIncome) * 100);
  }, [totalSubMonthly, totalRecurringMonthly, avgMonthlyIncome]);

  // 2. Generate 12-month projections
  const monthlyProjectionData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const yearStr = targetDate.getFullYear();
      const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
      const key = `${yearStr}-${monthStr}`;

      let subCost = 0;
      let billCost = 0;

      // Subscriptions
      activeSubs.forEach(s => {
        // Subscriptions usually charge every month on their renewal_date day
        subCost += Number(s.amount);
      });

      // Recurring bills
      activeRecurringBills.forEach(r => {
        const amt = Number(r.amount);
        if (r.frequency === 'monthly') {
          billCost += amt;
        } else if (r.frequency === 'weekly') {
          billCost += amt * 4;
        } else if (r.frequency === 'daily') {
          billCost += amt * 30;
        } else if (r.frequency === 'yearly') {
          // charge on start_date's month
          const startMonth = r.start_date.substring(5, 7);
          if (startMonth === monthStr) {
            billCost += amt;
          }
        }
      });

      data.push({
        name: formatMonthName(key, isEn).split(' ')[0], // only month name
        abonelikler: Math.round(subCost),
        faturalar: Math.round(billCost),
        toplam: Math.round(subCost + billCost),
        key
      });
    }

    return data;
  }, [activeSubs, activeRecurringBills, isEn]);

  // Next upcoming renewal item
  const nextRenewalItem = useMemo(() => {
    if (activeSubs.length === 0) return null;
    const sorted = [...activeSubs].sort((a, b) => a.renewal_date.localeCompare(b.renewal_date));
    return sorted[0];
  }, [activeSubs]);

  // Bilingual text mapper
  const text = {
    totalSub: isEn ? 'Monthly Subscriptions' : 'Aylık Abonelikler',
    totalRecur: isEn ? 'Recurring Bills' : 'Düzenli Faturalar',
    density: isEn ? 'Commitment Density' : 'Taahhüt Yoğunluğu',
    nextRenewal: isEn ? 'Next Renewal Date' : 'Sıradaki Ödeme',
    densityDesc: isEn 
      ? 'Percentage of monthly average income committed to subscriptions and bills.' 
      : 'Aylık ortalama gelirinizin abonelik ve faturalara bağlanan yüzdesi.',
    projectionTitle: isEn ? '12-Month Committed Cash Outflow' : '12 Aylık Sabit Gider Projeksiyonu',
    projectionSubtitle: isEn ? 'Expected committed expenses over the next year' : 'Önümüzdeki bir yılda beklenen sabit ve abonelik ödemeleriniz',
    subsLegend: isEn ? 'Subscriptions' : 'Abonelikler',
    billsLegend: isEn ? 'Recurring Bills' : 'Düzenli Giderler',
    noActiveSubs: isEn ? 'No active subscriptions found.' : 'Aktif abonelik bulunmuyor.',
    noActiveBills: isEn ? 'No active recurring bills found.' : 'Aktif düzenli gider bulunmuyor.',
    upcomingTitle: isEn ? 'Upcoming Subscription Payments' : 'Yaklaşan Abonelik Ödemeleri',
    densityHealthy: isEn ? 'Healthy Commitment' : 'Güvenli Sabit Gider',
    densityWarning: isEn ? 'High Commitment' : 'Yüksek Sabit Gider',
    densityDanger: isEn ? 'Critical Fixed Costs' : 'Kritik Sabit Gider',
    coachAdvisor: isEn ? 'Feniqo Financial Coach' : 'Feniqo Finans Koçu',
    insightHealthy: isEn
      ? 'Outstanding! Your fixed costs are below 15% of your income. You maintain excellent financial agility and can easily adapt to shifts in income.'
      : 'Harika! Sabit giderleriniz gelirinizin %15\'inin altında. Finansal esnekliğiniz çok yüksek, gelir dalgalanmalarından etkilenme riskiniz oldukça düşük.',
    insightWarning: isEn
      ? 'Your fixed overhead is relatively high (15%-30%). Consider pruning duplicate entertainment plans or unused utilities to free up active cashflow.'
      : 'Sabit giderleriniz yüksek seviyede (%15-%30). Bütçenizi rahatlatmak için kullanmadığınız eğlence üyeliklerini veya benzer platform aboneliklerini iptal etmeyi düşünün.',
    insightDanger: isEn
      ? 'Alert! Over 30% of your income is locked into recurring bills. You are vulnerable to cashflow crunches. Review non-essential services immediately.'
      : 'Dikkat! Gelirinizin %30\'dan fazlası düzenli faturalara bağlanmış durumda. Nakit sıkışıklığı yaşamamak adına zorunlu olmayan servisleri acilen gözden geçirmelisiniz.'
  };

  const densityBadgeColor = densityRatio < 15 ? 'emerald' : densityRatio < 30 ? 'amber' : 'red';
  const densityBadgeText = densityRatio < 15 ? text.densityHealthy : densityRatio < 30 ? text.densityWarning : text.densityDanger;

  // Tooltip formatter for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="p-3 rounded-xl border shadow-xl text-xs space-y-1 font-semibold z-50 animate-in fade-in duration-100"
          style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
        >
          <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">
            {label}
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              {text.subsLegend}:
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {formatCurrency(payload[0]?.value || 0, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {text.billsLegend}:
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {formatCurrency(payload[1]?.value || 0, currency)}
            </span>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800/80 my-1 pt-1 flex items-center justify-between gap-4">
            <span className="text-slate-800 dark:text-slate-200">{isEn ? 'Total' : 'Toplam'}:</span>
            <span className="font-extrabold text-brand-600 dark:text-brand-400">
              {formatCurrency((payload[0]?.value || 0) + (payload[1]?.value || 0), currency)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Monthly Subscriptions */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-2xl">
            <CreditCard size={22} />
          </div>
          <div className="space-y-0.5 truncate">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{text.totalSub}</span>
            <strong className="text-lg font-extrabold text-slate-900 dark:text-white block">
              {formatCurrency(totalSubMonthly, currency)}
            </strong>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              {activeSubs.length} {isEn ? 'active plans' : 'aktif abonelik'}
            </span>
          </div>
        </div>

        {/* Recurring Bills */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Calendar size={22} />
          </div>
          <div className="space-y-0.5 truncate">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{text.totalRecur}</span>
            <strong className="text-lg font-extrabold text-slate-900 dark:text-white block">
              {formatCurrency(totalRecurringMonthly, currency)}
            </strong>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              {activeRecurringBills.length} {isEn ? 'scheduled bills' : 'düzenli fatura'}
            </span>
          </div>
        </div>

        {/* Next Renewal */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl">
            <Activity size={22} />
          </div>
          <div className="space-y-0.5 truncate flex-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{text.nextRenewal}</span>
            {nextRenewalItem ? (
              <>
                <strong className="text-sm font-extrabold text-slate-900 dark:text-white block truncate">
                  {nextRenewalItem.name}
                </strong>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                  {nextRenewalItem.renewal_date} ({formatCurrency(Number(nextRenewalItem.amount), currency)})
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-400 font-semibold block pt-1">
                {isEn ? 'No pending renewals' : 'Planlı ödeme yok'}
              </span>
            )}
          </div>
        </div>

        {/* Commitment Density Ratio */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          {/* Circular Progress Ring */}
          <div className="relative shrink-0 w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="4.5"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                className={`transition-all duration-500 ${
                  densityRatio < 15 
                    ? 'stroke-emerald-500' 
                    : densityRatio < 30 
                      ? 'stroke-amber-500' 
                      : 'stroke-red-500'
                }`}
                strokeWidth="4.5"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - Math.min(100, densityRatio) / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xs font-black text-slate-900 dark:text-white">%{densityRatio}</span>
          </div>
          <div className="space-y-0.5 truncate">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{text.density}</span>
            <strong className={`text-xs font-black px-1.5 py-0.5 rounded-md inline-block ${
              densityBadgeColor === 'emerald'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : densityBadgeColor === 'amber'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}>
              {densityBadgeText}
            </strong>
          </div>
        </div>
      </div>

      {/* 2. Coach Advise Banner */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 shadow-sm ${
        densityBadgeColor === 'emerald'
          ? 'bg-emerald-500/5 border-emerald-100 dark:border-emerald-950/20'
          : densityBadgeColor === 'amber'
            ? 'bg-amber-500/5 border-amber-100 dark:border-amber-950/20'
            : 'bg-red-500/5 border-red-100 dark:border-red-950/20'
      }`}>
        <div className="space-y-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${
              densityBadgeColor === 'emerald' ? 'text-emerald-500' : densityBadgeColor === 'amber' ? 'text-amber-500' : 'text-red-500'
            }`} />
            {text.coachAdvisor}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
            {densityRatio < 15 
              ? text.insightHealthy 
              : densityRatio < 30 
                ? text.insightWarning 
                : text.insightDanger
            }
          </p>
        </div>
      </div>

      {/* 3. Projection Chart & List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recharts Projections Chart */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/85 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all duration-200 space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-md tracking-tight">
              {text.projectionTitle}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
              {text.projectionSubtitle}
            </p>
          </div>
          <div className="h-[280px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyProjectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="name" stroke={textFill} fontSize={10} tickLine={false} />
                <YAxis stroke={textFill} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar name="Abonelik" dataKey="abonelikler" fill="#6366F1" stackId="a" radius={[0, 0, 0, 0]} maxBarSize={28} />
                <Bar name="Düzenli Fatura" dataKey="faturalar" fill="#F59E0B" stackId="a" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Plan details list */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-200/60 dark:border-slate-800/85 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="space-y-4 flex-1">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span>{text.upcomingTitle}</span>
              <span className="text-[10px] bg-brand-500/10 text-brand-600 dark:text-brand-400 font-extrabold px-2 py-0.5 rounded-lg">
                {activeSubs.length}
              </span>
            </h3>
            
            {activeSubs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400 dark:text-slate-600 py-12">
                {text.noActiveSubs}
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                {activeSubs.map((sub) => (
                  <div 
                    key={sub.id} 
                    className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-800/10 flex items-center justify-between group hover:border-slate-200 dark:hover:border-slate-700/65 transition-all duration-150"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {sub.name}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold block uppercase tracking-wider">
                        {sub.renewal_date}
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-800 dark:text-brand-400 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/65 shadow-sm shrink-0 transition-colors">
                      {formatCurrency(Number(sub.amount), currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
