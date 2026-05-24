import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { GoalCard } from '../components/goals/GoalCard';
import { GoalForm } from '../components/forms/GoalForm';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency } from '../utils/formatters';
import { 
  Plus, 
  X, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  Wallet, 
  Sparkles 
} from 'lucide-react';

export const Goals: React.FC = () => {
  const { user } = useAuth();
  const { goals, deleteGoal, addFundsToGoal, currentUserRole } = useData();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);

  const currency = user?.currency || 'TRY';

  // 1. Calculate Summary Stats
  const stats = useMemo(() => {
    const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
    const totalCurrent = goals.reduce((sum, g) => sum + g.current_amount, 0);
    const completedCount = goals.filter(g => g.current_amount >= g.target_amount).length;
    const progressRate = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

    return {
      totalTarget,
      totalCurrent,
      completedCount,
      progressRate
    };
  }, [goals]);

  // 2. Add, Edit, Delete Handlers
  const handleAddNew = () => {
    setEditingGoal(null);
    setIsFormOpen(true);
  };

  const handleEdit = (goal: any) => {
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu tasarruf hedefini silmek istediğinizden emin misiniz?')) {
      await deleteGoal(id);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingGoal(null);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Target className="text-brand-500 w-7 h-7" strokeWidth={2.5} />
            Finansal Hedefler
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Gelecekteki planlarınız için tasarruf hedefleri koyun ve birikimlerinizi görsel olarak takip edin.
          </p>
        </div>

        {currentUserRole === 'admin' && (
          <div>
            <button
              onClick={handleAddNew}
              className="premium-btn-primary flex items-center space-x-2 py-2.5 px-4.5 text-xs font-semibold shadow-md whitespace-nowrap cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Yeni Hedef Ekle</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats Summary Cards */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Savings Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-2xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Toplam Birikim</span>
              <strong className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
                {formatCurrency(stats.totalCurrent, currency)}
              </strong>
            </div>
          </div>

          {/* Total Target Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Toplam Hedef</span>
              <strong className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
                {formatCurrency(stats.totalTarget, currency)}
              </strong>
            </div>
          </div>

          {/* Average Progress Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Ortalama İlerleme</span>
              <div className="flex items-center space-x-2 mt-0.5">
                <strong className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
                  %{stats.progressRate}
                </strong>
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden max-w-[80px]">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.progressRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Completed Goals Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Tamamlanan Hedefler</span>
              <strong className="text-lg font-black text-slate-800 dark:text-white tracking-tight flex items-baseline gap-1">
                {stats.completedCount} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">/ {goals.length} hedef</span>
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Savings Goals Grid */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {goals.map((goal) => (
            <GoalCard 
              key={goal.id} 
              goal={goal} 
              onEdit={handleEdit} 
              onDelete={handleDelete}
              onAddFunds={addFundsToGoal}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          iconName="Target"
          title="Tasarruf Hedefi Bulunmuyor"
          description="Henüz hiçbir tasarruf hedefi eklemediniz. Hayalinizdeki laptop, tatil veya acil durum fonu için ilk hedefinizi oluşturun!"
          actionText={currentUserRole === 'admin' ? "İlk Hedefini Oluştur" : undefined}
          onAction={currentUserRole === 'admin' ? handleAddNew : undefined}
        />
      )}

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-5">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-brand-500 animate-pulse" />
                {editingGoal ? 'Hedefi Düzenle' : 'Yeni Tasarruf Hedefi'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <GoalForm 
              editingGoal={editingGoal} 
              onSuccess={handleFormSuccess} 
              onCancel={() => setIsFormOpen(false)} 
            />

          </div>
        </div>
      )}

    </div>
  );
};

export default Goals;
