import React, { useState } from 'react';
import type { Goal } from '../../db/types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate, getCurrencySymbol } from '../../utils/formatters';
import { calculateDaysLeft, calculateEstimatedArrivalDate } from '../../utils/goalUtils';
import { 
  Target, 
  Calendar, 
  Trash2, 
  Edit2, 
  Plus, 
  Minus, 
  Check, 
  X,
  Sparkles,
  Laptop,
  Palmtree,
  Shield,
  Gift,
  Car,
  Home,
  Heart,
  Plane,
  Camera,
  Coins
} from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onAddFunds: (id: string, amount: number) => Promise<{ success: boolean; error?: string }>;
}

const colorPresets: { [key: string]: { gradient: string; text: string; bg: string; border: string; glow: string } } = {
  '#3B82F6': { // Blue
    gradient: 'from-blue-500 to-indigo-600',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-100 dark:border-blue-900/30',
    glow: 'shadow-blue-500/20'
  },
  '#10B981': { // Emerald
    gradient: 'from-emerald-400 to-teal-600',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-100 dark:border-emerald-900/30',
    glow: 'shadow-emerald-500/20'
  },
  '#8B5CF6': { // Purple
    gradient: 'from-purple-500 to-indigo-500',
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-100 dark:border-purple-900/30',
    glow: 'shadow-purple-500/20'
  },
  '#F59E0B': { // Amber
    gradient: 'from-amber-400 to-orange-500',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-100 dark:border-amber-900/30',
    glow: 'shadow-amber-500/20'
  },
  '#EF4444': { // Red/Rose
    gradient: 'from-rose-400 to-pink-600',
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-100 dark:border-rose-900/30',
    glow: 'shadow-rose-500/20'
  },
  '#06B6D4': { // Cyan
    gradient: 'from-cyan-400 to-blue-500',
    text: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-100 dark:border-cyan-900/30',
    glow: 'shadow-cyan-500/20'
  }
};

const getIcon = (name: string | null | undefined) => {
  switch (name) {
    case 'Laptop': return <Laptop className="w-5 h-5" />;
    case 'Palmtree': return <Palmtree className="w-5 h-5" />;
    case 'Shield': return <Shield className="w-5 h-5" />;
    case 'Gift': return <Gift className="w-5 h-5" />;
    case 'Car': return <Car className="w-5 h-5" />;
    case 'Home': return <Home className="w-5 h-5" />;
    case 'Heart': return <Heart className="w-5 h-5" />;
    case 'Plane': return <Plane className="w-5 h-5" />;
    case 'Camera': return <Camera className="w-5 h-5" />;
    case 'Coins': return <Coins className="w-5 h-5" />;
    default: return <Target className="w-5 h-5" />;
  }
};


export const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete, onAddFunds }) => {
  const { user } = useAuth();
  const { currentUserRole } = useData();
  const isEn = user?.lang === 'en';
  const [showQuickAction, setShowQuickAction] = useState<'add' | 'remove' | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const preset = colorPresets[goal.color] || colorPresets['#3B82F6'];
  const currency = user?.currency || 'TRY';
  
  const progressPercent = Math.min(100, Math.max(0, Math.round((goal.current_amount / goal.target_amount) * 100)));
  const isCompleted = goal.current_amount >= goal.target_amount;
  const daysLeft = calculateDaysLeft(goal.target_date);
  const estDate = calculateEstimatedArrivalDate(goal);
  
  const handleAmountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const amt = parseFloat(amountInput);
    
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg(isEn ? 'Please enter a valid positive amount.' : 'Lütfen geçerli pozitif bir miktar girin.');
      return;
    }
    
    setIsSubmitting(true);
    const finalAmount = showQuickAction === 'add' ? amt : -amt;
    
    if (showQuickAction === 'remove' && goal.current_amount < amt) {
      setErrorMsg(isEn ? 'You cannot withdraw more than your current savings.' : 'Mevcut birikiminizden daha fazla para çıkaramazsınız.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await onAddFunds(goal.id, finalAmount);
      if (res.success) {
        setAmountInput('');
        setShowQuickAction(null);
      } else {
        setErrorMsg(res.error || (isEn ? 'An error occurred during the transaction.' : 'İşlem sırasında hata oluştu.'));
      }
    } catch {
      setErrorMsg(isEn ? 'An unexpected error occurred.' : 'Beklenmeyen bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full ${isCompleted ? 'ring-2 ring-emerald-500/20 dark:ring-emerald-400/20' : ''}`}>
      
      {/* Dynamic Colored Top Decorative Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${preset.gradient}`} />

      {/* Header Info */}
      <div className="flex items-start justify-between mb-5 mt-1">
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl ${preset.bg} ${preset.text} border ${preset.border} shadow-sm transition-transform duration-300 hover:scale-105`}>
            {getIcon(goal.icon)}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight tracking-tight flex items-center gap-1.5">
              {goal.name}
              {isCompleted && (
                <span className="flex items-center justify-center p-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full" title="Hedefe Ulaşıldı!">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                </span>
              )}
            </h3>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 dark:text-slate-500 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(goal.target_date)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {currentUserRole === 'admin' && (
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => onEdit(goal)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
              title={isEn ? 'Edit' : 'Düzenle'}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onDelete(goal.id)}
              className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
              title={isEn ? 'Delete' : 'Sil'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Amounts and Progress Stats */}
      <div className="space-y-4 mb-5">
        <div className="flex items-baseline justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              {isEn ? 'Current Savings' : 'Mevcut Birikim'}
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(goal.current_amount, currency)}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              {isEn ? 'Target Amount' : 'Hedef Tutar'}
            </span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
              {formatCurrency(goal.target_amount, currency)}
            </span>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isCompleted ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800'}`}>
              {isEn ? `${progressPercent}% completed` : `%${progressPercent} tamamlandı`}
            </span>
            <span className="text-[11px]">
              {isCompleted ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{isEn ? 'Completed! 🎉' : 'Tamamlandı! 🎉'}</span>
              ) : daysLeft > 0 ? (
                <span>{isEn ? 'Days Left:' : 'Kalan Gün:'} <strong className="text-slate-700 dark:text-slate-300 font-extrabold">{daysLeft}</strong></span>
              ) : (
                <span className="text-amber-500 font-semibold">{isEn ? 'Overdue' : 'Tarih Geçti'}</span>
              )}
            </span>
          </div>
          
          {/* Visual Bar */}
          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-200/30 dark:border-slate-800/30">
            <div 
              className={`h-full rounded-full bg-gradient-to-r ${preset.gradient} transition-all duration-700 ease-out shadow-sm ${preset.glow}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Estimated Reach Date Projection Card */}
          <div className="mt-4 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 flex items-center justify-between gap-3 backdrop-blur-sm transition-all duration-300">
            <div className="flex items-center space-x-2.5">
              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${preset.gradient} text-white shadow-sm shadow-brand-500/10`}>
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {isEn ? 'Estimated Completion' : 'Tahmini Ulaşma'}
                </span>
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">
                  {estDate === 'completed' && (isEn ? 'Already Completed!' : 'Zaten Ulaşıldı!')}
                  {estDate === 'no_savings' && (isEn ? 'Start saving to estimate' : 'Birikim yapmaya başlayın')}
                  {estDate === 'no_rate' && (isEn ? 'Calculating rate...' : 'Hesaplanıyor...')}
                  {estDate !== 'completed' && estDate !== 'no_savings' && estDate !== 'no_rate' && (
                    <span>
                      {formatDate(estDate)}
                    </span>
                  )}
                </span>
              </div>
            </div>
            
            {estDate !== 'completed' && estDate !== 'no_savings' && estDate !== 'no_rate' && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                calculateDaysLeft(estDate) <= daysLeft 
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/40 dark:border-emerald-900/30' 
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100/40 dark:border-amber-900/30'
              }`}>
                {calculateDaysLeft(estDate)} {isEn ? 'days' : 'gün'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Fund Actions */}
      {currentUserRole === 'admin' && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
          {!showQuickAction ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => { setShowQuickAction('add'); setErrorMsg(''); }}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 bg-slate-50 hover:bg-brand-500 dark:bg-slate-800/40 dark:hover:bg-brand-600 text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:shadow-sm transition-all duration-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isEn ? 'Add Funds' : 'Para Ekle'}</span>
              </button>
              <button
                onClick={() => { setShowQuickAction('remove'); setErrorMsg(''); }}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 bg-slate-50 hover:bg-red-500 dark:bg-slate-800/40 dark:hover:bg-red-600 text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:shadow-sm transition-all duration-200"
                disabled={goal.current_amount <= 0}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>{isEn ? 'Withdraw' : 'Para Çıkar'}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleAmountSubmit} className="animate-fade-in space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                <span>{showQuickAction === 'add' ? (isEn ? 'Add Funds to Goal' : 'Hedefe Para Ekle') : (isEn ? 'Withdraw Funds from Goal' : 'Hedef Birikiminden Para Çıkar')}</span>
                <button 
                  type="button" 
                  onClick={() => setShowQuickAction(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.01"
                    placeholder={isEn ? 'Enter amount...' : 'Miktar girin...'}
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-200 font-bold"
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {getCurrencySymbol(currency)}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md shadow-brand-500/10 flex items-center justify-center transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errorMsg && (
                <p className="text-[10px] font-semibold text-red-500 dark:text-red-400 animate-shake pl-1">
                  {errorMsg}
                </p>
              )}
            </form>
          )}
        </div>
      )}

    </div>
  );
};
