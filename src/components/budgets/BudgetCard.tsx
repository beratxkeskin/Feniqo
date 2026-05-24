import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import type { Budget } from '../../db/types';
import { useData } from '../../context/DataContext';
import { BudgetProgress } from './BudgetProgress';
import { ConfirmModal } from '../common/ConfirmModal';

interface BudgetCardProps {
  budget: Budget;
  spent: number;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget, spent }) => {
  const { categories, deleteBudget, currentUserRole } = useData();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Resolve category details
  const category = categories.find(c => c.id === budget.category_id);
  const categoryName = category ? category.name : 'Bilinmeyen Kategori';
  const categoryColor = category ? category.color : '#6B7280';
  const iconName = (category?.icon || 'HelpCircle') as keyof typeof Icons;
  const IconComponent = Icons[iconName] as React.ComponentType<any>;

  const handleDelete = async () => {
    await deleteBudget(budget.id);
    setIsDeleteModalOpen(false);
  };

  const percentage = budget.limit_amount > 0 ? Math.round((spent / budget.limit_amount) * 100) : 0;
  const warningThreshold = parseInt(localStorage.getItem('moneymate_budget_warning_threshold') || '50');
  const criticalThreshold = parseInt(localStorage.getItem('moneymate_budget_critical_threshold') || '80');
  const blockThreshold = parseInt(localStorage.getItem('moneymate_budget_block_threshold') || '100');

  let borderStyleClass = 'border-slate-200 dark:border-slate-800 shadow-sm';
  if (percentage >= blockThreshold) {
    borderStyleClass = 'border-red-500 dark:border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.12)] dark:shadow-[0_0_20px_rgba(239,68,68,0.2)] ring-2 ring-red-500/15 animate-pulse border-t-2';
  } else if (percentage >= criticalThreshold) {
    borderStyleClass = 'border-amber-500 dark:border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.08)] dark:shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/10 border-t-2';
  } else if (percentage >= warningThreshold) {
    borderStyleClass = 'border-yellow-400 dark:border-yellow-400/50 shadow-sm border-t-2';
  }

  return (
    <>
      <div className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group ${borderStyleClass}`}>
        
        {/* Top colored accent line */}
        <div 
          className="absolute top-0 left-0 w-full h-1.5" 
          style={{ backgroundColor: categoryColor }}
        />

        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Category Icon */}
            <div 
              className="p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center"
              style={{ backgroundColor: categoryColor }}
            >
              {IconComponent ? <IconComponent size={20} strokeWidth={2} /> : <Icons.HelpCircle size={20} />}
            </div>
            <div>
              <h4 className="font-semibold text-slate-950 dark:text-slate-50 text-base leading-snug">
                {categoryName}
              </h4>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wider uppercase">
                {budget.month} Limit
              </span>
            </div>
          </div>

          {/* Delete Action Button */}
          {currentUserRole === 'admin' && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title="Bütçeyi Sil"
            >
              <Icons.Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Card Body - Progress Section */}
        <div className="pt-2">
          <BudgetProgress spent={spent} limit={budget.limit_amount} showDetails={true} />
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Bütçe Silinsin mi?"
        message={`"${categoryName}" kategorisine ait aylık bütçe limitini silmek istediğinize emin misiniz? Harcama verileriniz silinmeyecektir.`}
        confirmText="Bütçeyi Sil"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDangerous={true}
      />
    </>
  );
};

export default BudgetCard;
