import React from 'react';
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
  CartesianGrid
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  type: 'bar-compare' | 'pie-category' | 'area-spending' | 'line-balance';
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
  const isDark = document.documentElement.classList.contains('dark');
  
  const textFill = isDark ? '#9CA3AF' : '#4B5563';
  const gridStroke = isDark ? '#1E293B' : '#E2E8F0';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#E2E8F0';

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
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-3.5 justify-between">
              <span className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-50">
                {formatCurrency(entry.value, currency)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render correct chart based on type prop
  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-xs font-semibold text-slate-400 dark:text-slate-600">
          Görüntülenecek veri bulunmuyor.
        </div>
      );
    }

    switch (type) {
      case 'bar-compare':
        // Comparing Gelir vs Gider
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" stroke={textFill} fontSize={10} tickLine={false} />
              <YAxis stroke={textFill} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.02)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Bar name="Gelir" dataKey="gelir" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar name="Gider" dataKey="gider" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie-category':
        // Category Expense Distribution Donut Chart
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
              />
            </PieChart>
          </ResponsiveContainer>
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
                name="Gider" 
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
                name="Bakiye" 
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

      default:
        return null;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4 hover:shadow-md transition-all duration-200">
      
      {/* Title Header */}
      <div>
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Chart Output container */}
      <div className="pt-1 flex items-center justify-center">
        {renderChart()}
      </div>

    </div>
  );
};

export default ChartCard;
