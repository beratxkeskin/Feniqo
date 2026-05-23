import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrency, calculateBudgetProgress } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface BudgetProgressProps {
  spent: number;
  limit: number;
  showDetails?: boolean;
}

export const BudgetProgress: React.FC<BudgetProgressProps> = ({
  spent,
  limit,
  showDetails = true,
}) => {
  const { user } = useAuth();
  const currency = user?.currency || 'TRY';
  
  const percentage = calculateBudgetProgress(spent, limit);
  const remaining = limit - spent;

  // Determine colors based on thresholds
  let barColor = 'bg-brand-500';
  let badgeBg = 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400';

  if (percentage >= 100) {
    barColor = 'bg-red-500 animate-pulse';
    badgeBg = 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30';
  } else if (percentage >= 80) {
    barColor = 'bg-amber-500';
    badgeBg = 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
  }

  return (
    <div className="space-y-3">
      {/* Progress Stats Header */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-1.5 font-medium text-slate-700 dark:text-slate-300">
          <span>Harcama:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {formatCurrency(spent, currency)}
          </span>
          <span className="text-slate-400 dark:text-slate-500">/</span>
          <span className="text-slate-500 dark:text-slate-400">
            {formatCurrency(limit, currency)}
          </span>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeBg}`}>
          %{percentage}
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Status message and remaining amount */}
      {showDetails && (
        <div className="flex items-center justify-between text-xs font-medium pt-0.5">
          {percentage >= 100 ? (
            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>Bütçe aşıldı! ({formatCurrency(Math.abs(remaining), currency)} fazla)</span>
            </div>
          ) : percentage >= 80 ? (
            <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>Limit sınıra yakın! ({formatCurrency(remaining, currency)} kaldı)</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={14} className="flex-shrink-0" />
              <span>Bütçe güvende ({formatCurrency(remaining, currency)} kaldı)</span>
            </div>
          )}
          
          {percentage < 100 && (
            <span className="text-slate-400 dark:text-slate-500">
              Kalan: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{formatCurrency(remaining, currency)}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetProgress;
