import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', fullPage = false }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div
        className={`${sizeClasses[size]} border-slate-200 border-t-brand-600 rounded-full animate-spin`}
        role="status"
      >
        <span className="sr-only">Yükleniyor...</span>
      </div>
      {fullPage && (
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm animate-pulse">
          MoneyMate hazırlanıyor...
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 flex items-center justify-center z-50 transition-colors duration-300">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
