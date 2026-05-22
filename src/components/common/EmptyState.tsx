import React from 'react';
import * as Icons from 'lucide-react';

interface EmptyStateProps {
  iconName?: keyof typeof Icons;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName = 'Inbox',
  title,
  description,
  actionText,
  onAction,
}) => {
  // Dynamically resolve lucide icon
  const IconComponent = Icons[iconName] as React.ComponentType<any>;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl glass-panel py-12 transition-all">
      <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl mb-4 animate-bounce">
        {IconComponent ? <IconComponent size={40} strokeWidth={1.5} /> : <Icons.Inbox size={40} strokeWidth={1.5} />}
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="premium-btn-primary flex items-center justify-center space-x-2 text-sm px-5 py-2.5"
        >
          <Icons.Plus size={16} strokeWidth={2.5} />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
