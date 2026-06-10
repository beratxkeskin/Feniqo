import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  type: 'bar-compare' | 'pie-category' | 'area-spending' | 'line-balance' | 'composed-savings' | 'radar-budget' | 'pie-payment' | 'area-forecast';
  data: any[];
  height?: number;
}

// Curated colors for categories (Donut Chart)
const DONUT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#EC4899',
  '#8B5CF6', '#6366F1', '#14B8A6', '#EC4899', '#6B7280',
  '#06B6D4', '#84CC16', '#F43F5E', '#10B981'
];

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  type,
  data,
  height = 300,
}) => {
  const { user } = useAuth();
  const currency = user?.currency || 'TRY';
  const isEn = user?.lang === 'en';
  const isDark = document.documentElement.classList.contains('dark');
  
  const textFill = isDark ? '#9CA3AF' : '#4B5563';
  const gridStroke = isDark ? '#1E293B' : '#E2E8F0';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#E2E8F0';

  // Premium legend formatter to ensure perfect readability in both light & dark themes
  const renderLegendText = (value: string) => {
    return <span className="text-slate-600 dark:text-slate-300 font-extrabold ml-1.5">{value}</span>;
  };

  // Dynamic local state to allow switching views on the fly
  const [localChartType, setLocalChartType] = useState<string>(type);

  useEffect(() => {
    setLocalChartType(type);
  }, [type]);

  // Custom tooltips for premium SaaS dashboard feel
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="p-3.5 rounded-xl border shadow-xl text-xs space-y-1 font-medium z-50 animate-in fade-in zoom-in-95 duration-100"
          style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
        >
          <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">
            {label}
          </p>
          {payload.map((entry: any, index: number) => {
            // Avoid drawing undefined tooltips
            if (entry.value === undefined || entry.value === null) return null;
            return (
              <div key={index} className="flex items-center space-x-3.5 justify-between">
                <span className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: entry.color || entry.stroke }} />
                  <span>{entry.name}:</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-50">
                  {formatCurrency(entry.value, currency)}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Render correct chart based on localChartType state
  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-xs font-semibold text-slate-400 dark:text-slate-600 py-12">
          {isEn ? 'No analytics data available.' : 'Görüntülenecek veri bulunmuyor.'}
        </div>
      );
    }

    switch (localChartType) {
      case 'bar-compare':
        // Comparing Gelir vs Gider
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" stroke={textFill} fontSize={10} tickLine={false} />
              <YAxis stroke={textFill} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.02)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} formatter={renderLegendText} />
              <Bar name={isEn ? 'Income' : 'Gelir'} dataKey="gelir" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar name={isEn ? 'Expense' : 'Gider'} dataKey="gider" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'composed-savings':
        // Composed chart: Income/Expense side-by-side bars + Net Savings curved spline line
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncomeComposed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.85}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.45}/>
                </linearGradient>
                <linearGradient id="colorExpenseComposed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.85}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.45}/>
                </linearGradient>
                <linearGradient id="colorSavingsLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" stroke={textFill} fontSize={10} tickLine={false} />
              <YAxis stroke={textFill} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.02)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} formatter={renderLegendText} />
              <Bar name={isEn ? 'Income' : 'Gelir'} dataKey="gelir" fill="url(#colorIncomeComposed)" radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar name={isEn ? 'Expense' : 'Gider'} dataKey="gider" fill="url(#colorExpenseComposed)" radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Line 
                name={isEn ? 'Net Savings' : 'Net Tasarruf'} 
                type="monotone" 
                dataKey="tasarruf" 
                stroke="url(#colorSavingsLine)" 
                strokeWidth={3} 
                dot={{ r: 3, strokeWidth: 1.5, fill: tooltipBg }} 
                activeDot={{ r: 5, strokeWidth: 2, fill: '#3B82F6' }} 
              />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'pie-category':
      case 'pie-payment':
        // Category/Payment Breakdown Donut Chart
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || DONUT_COLORS[index % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                iconType="circle" 
                iconSize={6} 
                layout="horizontal"
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 9, paddingTop: 5, maxHeight: 80, overflowY: 'auto' }}
                formatter={renderLegendText}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'radar-budget':
        // Radar / Spiderweb chart: budget limits vs actual spent per category, or single value radar if no budget keys exist
        const hasBudgetKeys = data.length > 0 && ('limit' in data[0] || 'spent' in data[0]);
        return (
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart cx="50%" cy="47%" outerRadius="70%" data={data}>
              <PolarGrid stroke={gridStroke} />
              <PolarAngleAxis dataKey="name" tick={{ fill: textFill, fontSize: 9, fontWeight: '600' }} />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: textFill, fontSize: 8 }} />
              {hasBudgetKeys ? (
                <>
                  <Radar
                    name={isEn ? 'Budget Limit' : 'Bütçe Limiti'}
                    dataKey="limit"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.15}
                  />
                  <Radar
                    name={isEn ? 'Actual Spent' : 'Gerçekleşen Harcama'}
                    dataKey="spent"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.3}
                  />
                </>
              ) : (
                <Radar
                  name={isEn ? 'Amount' : 'Tutar'}
                  dataKey="value"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 5 }} formatter={renderLegendText} />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'list':
        // Glassmorphic List / Horizontal Progress representation
        const isBudgetList = data.length > 0 && ('limit' in data[0] || 'spent' in data[0]);
        return (
          <div className="w-full space-y-3.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar pt-2">
            {data.map((item, index) => {
              if (isBudgetList) {
                const spent = item.spent || 0;
                const limit = item.limit || 0;
                const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                const isExceeded = limit > 0 && spent > limit;
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full inline-block bg-slate-400" />
                        <span>{item.name}</span>
                      </span>
                      <span className={`font-bold ${isExceeded ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                        {formatCurrency(spent, currency)} / {formatCurrency(limit, currency)} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isExceeded ? 'bg-red-500' : 'bg-brand-500'}`} 
                        style={{ width: `${Math.min(100, percent)}%` }} 
                      />
                    </div>
                  </div>
                );
              }

              const total = data.reduce((sum, i) => sum + (i.value || 0), 0);
              const val = item.value || 0;
              const percent = total > 0 ? Math.round((val / total) * 100) : 0;
              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color || DONUT_COLORS[index % DONUT_COLORS.length] }} />
                      <span>{item.name}</span>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-bold">
                      {formatCurrency(val, currency)} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        backgroundColor: item.color || DONUT_COLORS[index % DONUT_COLORS.length],
                        width: `${percent}%` 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'area-spending':
        // Daily expense trend area chart
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" stroke={textFill} fontSize={9} tickLine={false} />
              <YAxis stroke={textFill} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area 
                name={isEn ? 'Expense' : 'Gider'} 
                type="monotone" 
                dataKey="value" 
                stroke="#EF4444" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#colorExpense)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'line-balance':
        // Balance history trend area chart over last 6 months
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" stroke={textFill} fontSize={10} tickLine={false} />
              <YAxis stroke={textFill} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area 
                name={isEn ? 'Balance' : 'Bakiye'} 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#colorBalance)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'area-forecast':
        // Month-End Cumulative Expense Forecast with a prediction line spline
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActualSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorForecastSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" stroke={textFill} fontSize={9} tickLine={false} />
              <YAxis stroke={textFill} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 10 }} formatter={renderLegendText} />
              <Area 
                name={isEn ? 'Actual Spent' : 'Gerçekleşen Harcama'} 
                type="monotone" 
                dataKey="spent" 
                stroke="#EF4444" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#colorActualSpent)" 
                connectNulls={false}
              />
              <Area 
                name={isEn ? 'Predictive Forecast Projection' : 'Prediktif Harcama Öngörüsü'} 
                type="monotone" 
                dataKey="forecast" 
                stroke="#F59E0B" 
                strokeDasharray="4 4"
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorForecastSpent)" 
                connectNulls={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  // Render micro header customizer controls
  const renderControls = () => {
    // 1. Comparison & Composed charts
    if (type === 'bar-compare' || type === 'composed-savings') {
      return (
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/40">
          <button
            onClick={() => setLocalChartType('composed-savings')}
            className={`p-1 rounded-md transition-all ${localChartType === 'composed-savings' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            title={isEn ? 'Composed Spline' : 'Kombine Eğri'}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10" />
              <path d="M12 20V4" />
              <path d="M6 20v-6" />
              <path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
            </svg>
          </button>
          <button
            onClick={() => setLocalChartType('bar-compare')}
            className={`p-1 rounded-md transition-all ${localChartType === 'bar-compare' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            title={isEn ? 'Side-by-side Bar' : 'Sütun Grafiği'}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
          </button>
        </div>
      );
    }

    // 2. Distribution (Category / Payment) & Radar charts
    if (type === 'pie-category' || type === 'pie-payment' || type === 'radar-budget') {
      return (
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/40">
          <button
            onClick={() => setLocalChartType(type === 'radar-budget' ? 'pie-category' : type)}
            className={`p-1 rounded-md transition-all ${(localChartType === 'pie-category' || localChartType === 'pie-payment') ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            title={isEn ? 'Donut Chart' : 'Halka Grafik'}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </button>
          <button
            onClick={() => setLocalChartType('radar-budget')}
            className={`p-1 rounded-md transition-all ${localChartType === 'radar-budget' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            title={isEn ? 'Radar Budget' : 'Örümcek Ağı'}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 22h20L12 2z" />
              <path d="M12 8l-6 10h12L12 8z" />
            </svg>
          </button>
          <button
            onClick={() => setLocalChartType('list')}
            className={`p-1 rounded-md transition-all ${localChartType === 'list' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            title={isEn ? 'Progress List' : 'İlerleme Listesi'}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      );
    }

    // 3. Trends (Daily / Balance / Forecast)
    if (type === 'area-spending' || type === 'line-balance' || type === 'area-forecast') {
      return (
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/40">
          <button
            onClick={() => setLocalChartType('area-spending')}
            className={`p-1 rounded-md transition-all ${(localChartType === 'area-spending' || localChartType === 'line-balance') ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            title={isEn ? 'Area Spline' : 'Alan Grafiği'}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
            </svg>
          </button>
          <button
            onClick={() => setLocalChartType('area-forecast')}
            className={`p-1 rounded-md transition-all ${localChartType === 'area-forecast' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            title={isEn ? 'Predictive Forecast' : 'Prediktif Öngörü Tahmini'}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.3-6.3l-.7.7M6.7 17.3l-.7.7m12.6 0l-.7-.7M6.7 6.7l-.7-.7" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </button>
          <button
            onClick={() => setLocalChartType('bar-compare')}
            className={`p-1 rounded-md transition-all ${localChartType === 'bar-compare' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            title={isEn ? 'Bar Trend' : 'Sütun Grafiği'}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="premium-card space-y-4">
      
      {/* Title & Customizer Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Render Sleek Micro-controls */}
        {renderControls()}
      </div>

      {/* Chart Output container */}
      <div className="pt-1 flex items-center justify-center">
        {renderChart()}
      </div>

    </div>
  );
};

export default ChartCard;
