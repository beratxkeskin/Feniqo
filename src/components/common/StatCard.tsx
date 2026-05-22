import React from 'react';
import * as Icons from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  iconName: keyof typeof Icons;
  variant?: 'success' | 'danger' | 'info' | 'primary';
  subtext?: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  iconName,
  variant = 'primary',
  subtext,
  trend,
}) => {
  const IconComponent = Icons[iconName] as React.ComponentType<any>;

  const variants = {
    primary: {
      bg: 'bg-brand-50 dark:bg-brand-950/20',
      icon: 'text-brand-600 dark:text-brand-400',
      border: 'border-slate-200 dark:border-slate-800',
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-950/30',
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      icon: 'text-red-600 dark:text-red-400',
      border: 'border-red-100 dark:border-red-950/30',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      icon: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-950/30',
    },
  };

  const selectedVariant = variants[variant];

  return (
    <div className={`rounded-2xl border ${selectedVariant.border} bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between`}>
      
      {/* Icon and Title */}
      <div className="flex items-center justify-between pb-3">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${selectedVariant.bg} ${selectedVariant.icon} flex items-center justify-center shadow-inner`}>
          {IconComponent && <IconComponent size={20} />}
        </div>
      </div>

      {/* Main value */}
      <div className="space-y-1 pt-1">
        <h3 className="text-2xl font-bold text-slate-950 dark:text-slate-50 tracking-tight leading-none">
          {value}
        </h3>
        
        {/* Trend Indicator and Subtext */}
        <div className="flex items-center space-x-2 pt-1">
          {trend && (
            <span className={`flex items-center text-xs font-bold ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend.isPositive ? '+' : '-'}{trend.value}
            </span>
          )}
          {subtext && (
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate">
              {subtext}
            </span>
          )}
        </div>
      </div>

    </div>
  );
};

export default StatCard;
