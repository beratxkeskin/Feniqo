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
  /** 0–100 arası doluluk yüzdesi (ince çubuk olarak alt kısımda gösterilir) */
  progress?: number;
  /** Progress çubuğunun altında görünecek açıklama etiketi */
  progressLabel?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  iconName,
  variant = 'primary',
  subtext,
  trend,
  progress,
  progressLabel,
}) => {
  const IconComponent = Icons[iconName] as React.ComponentType<any>;

  const variants = {
    primary: {
      bg: 'bg-brand-50 dark:bg-brand-900/20',
      icon: 'text-brand-600 dark:text-brand-400',
      border: 'border-slate-200 dark:border-slate-800',
      glow: 'from-brand-500/5 to-transparent dark:from-brand-500/[0.03]',
      progressBar: 'bg-brand-500',
      progressTrack: 'bg-brand-100 dark:bg-brand-900/30',
      accentRing: 'ring-brand-500/10',
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-950/30',
      glow: 'from-emerald-500/5 to-transparent dark:from-emerald-500/[0.03]',
      progressBar: 'bg-emerald-500',
      progressTrack: 'bg-emerald-100 dark:bg-emerald-900/30',
      accentRing: 'ring-emerald-500/10',
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      icon: 'text-red-600 dark:text-red-400',
      border: 'border-red-100 dark:border-red-950/30',
      glow: 'from-red-500/5 to-transparent dark:from-red-500/[0.03]',
      progressBar: 'bg-red-500',
      progressTrack: 'bg-red-100 dark:bg-red-900/30',
      accentRing: 'ring-red-500/10',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      icon: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-950/30',
      glow: 'from-blue-500/5 to-transparent dark:from-blue-500/[0.03]',
      progressBar: 'bg-blue-500',
      progressTrack: 'bg-blue-100 dark:bg-blue-900/30',
      accentRing: 'ring-blue-500/10',
    },
  };

  const v = variants[variant];
  const clampedProgress = progress != null ? Math.max(0, Math.min(100, progress)) : null;

  return (
    <div className={`premium-card group relative border ${v.border} hover:scale-[1.015] transition-all duration-300 flex flex-col justify-between overflow-hidden`}>
      
      {/* Subtle radial glow background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${v.glow} pointer-events-none`} />

      <div className="relative p-5 pb-3 flex flex-col flex-1">
        {/* Header: Icon + Title */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {title}
          </span>
          <div className={`p-2 rounded-xl ${v.bg} ${v.icon} flex items-center justify-center ring-1 ${v.accentRing} group-hover:scale-110 transition-transform duration-300`}>
            {IconComponent && <IconComponent size={18} strokeWidth={2.2} />}
          </div>
        </div>

        {/* Main Value */}
        <h3 className="text-[1.65rem] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1">
          {value}
        </h3>
        
        {/* Trend + Subtext row */}
        <div className="flex items-center space-x-2 mt-1">
          {trend && (
            <span className={`inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
              trend.isPositive 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
                : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
            }`}>
              {trend.isPositive ? (
                <Icons.TrendingUp size={12} className="mr-0.5" />
              ) : (
                <Icons.TrendingDown size={12} className="mr-0.5" />
              )}
              {trend.isPositive ? '+' : ''}{trend.value}
            </span>
          )}
          {subtext && (
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate">
              {subtext}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar section at bottom */}
      {clampedProgress != null && (
        <div className="relative px-5 pb-4 pt-2">
          <div className={`w-full h-1.5 rounded-full ${v.progressTrack} overflow-hidden`}>
            <div 
              className={`h-full rounded-full ${v.progressBar} transition-all duration-1000 ease-out`}
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
          {progressLabel && (
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
                {progressLabel}
              </span>
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                %{Math.round(clampedProgress)}
              </span>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default StatCard;
