import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import type { Goal } from '../../db/types';
import { 
  Laptop,
  Palmtree,
  Shield,
  Gift,
  Car,
  Home,
  Heart,
  Plane,
  Camera,
  Coins,
  Target,
  Loader,
  Save,
  Plus
} from 'lucide-react';

interface GoalFormProps {
  editingGoal?: Goal | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const PRESET_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

const AVAILABLE_ICONS = [
  { name: 'Target', component: Target },
  { name: 'Laptop', component: Laptop },
  { name: 'Palmtree', component: Palmtree },
  { name: 'Shield', component: Shield },
  { name: 'Gift', component: Gift },
  { name: 'Car', component: Car },
  { name: 'Home', component: Home },
  { name: 'Heart', component: Heart },
  { name: 'Plane', component: Plane },
  { name: 'Camera', component: Camera },
  { name: 'Coins', component: Coins },
];

export const GoalForm: React.FC<GoalFormProps> = ({ editingGoal, onSuccess, onCancel }) => {
  const { addGoal, updateGoal } = useData();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState('Target');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (editingGoal) {
      setName(editingGoal.name);
      setTargetAmount(editingGoal.target_amount.toString());
      setCurrentAmount(editingGoal.current_amount.toString());
      setTargetDate(editingGoal.target_date);
      setColor(editingGoal.color);
      setIcon(editingGoal.icon || 'Target');
    } else {
      // Set default target date to 6 months from now
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 6);
      setTargetDate(defaultDate.toISOString().split('T')[0]);
    }
  }, [editingGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Lütfen bir hedef adı girin.');
      return;
    }

    const tAmt = parseFloat(targetAmount);
    if (isNaN(tAmt) || tAmt <= 0) {
      setErrorMessage('Lütfen geçerli bir hedef tutar girin.');
      return;
    }

    const cAmt = parseFloat(currentAmount);
    if (isNaN(cAmt) || cAmt < 0) {
      setErrorMessage('Mevcut birikim 0\'dan az olamaz.');
      return;
    }

    if (!targetDate) {
      setErrorMessage('Lütfen bir hedef tarih seçin.');
      return;
    }

    setIsSubmitting(true);

    const goalPayload = {
      name: name.trim(),
      target_amount: tAmt,
      current_amount: cAmt,
      target_date: targetDate,
      color,
      icon,
    };

    try {
      let res;
      if (editingGoal) {
        res = await updateGoal(editingGoal.id, goalPayload);
      } else {
        res = await addGoal(goalPayload);
      }

      if (res.success) {
        onSuccess();
      } else {
        setErrorMessage(res.error || 'İşlem gerçekleştirilemedi.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-100 dark:border-red-900/40 animate-shake">
          {errorMessage}
        </div>
      )}

      {/* Goal Name */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Hedef Adı *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn: Yeni Laptop, Tatil Bütçesi, Ev Peşinatı"
          className="premium-input text-sm font-medium"
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Amounts Group */}
      <div className="grid grid-cols-2 gap-4">
        {/* Target Amount */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Hedef Tutar *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="Örn: 40000"
              className="premium-input text-sm font-bold pr-8"
              required
              disabled={isSubmitting}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              TL
            </span>
          </div>
        </div>

        {/* Current Saving */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Başlangıç Birikimi
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              placeholder="Örn: 0"
              className="premium-input text-sm font-bold pr-8"
              disabled={isSubmitting}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              TL
            </span>
          </div>
        </div>
      </div>

      {/* Target Date */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Hedef Ulaşım Tarihi *
        </label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="premium-input text-sm font-medium"
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Color Preset Selector */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Renk Teması
        </label>
        <div className="flex flex-wrap gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/50">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setColor(preset)}
              style={{ backgroundColor: preset }}
              className={`w-8 h-8 rounded-full transition-all active:scale-95 ${
                color === preset
                  ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-offset-slate-900 dark:ring-white scale-110 shadow-md'
                  : 'hover:scale-105'
              }`}
              disabled={isSubmitting}
            />
          ))}
        </div>
      </div>

      {/* Icon Selector */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          İkon
        </label>
        <div className="grid grid-cols-6 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/50 max-h-[140px] overflow-y-auto">
          {AVAILABLE_ICONS.map((item) => {
            const IconComp = item.component;
            const isSelected = icon === item.name;
            
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => setIcon(item.name)}
                className={`p-2.5 flex items-center justify-center rounded-xl border transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'border-slate-100 dark:border-slate-800/30 hover:bg-slate-100/50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
                title={item.name}
                disabled={isSubmitting}
              >
                <IconComp size={18} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-end space-x-3 pt-5 border-t border-slate-100 dark:border-slate-800/60">
        <button
          type="button"
          onClick={onCancel}
          className="premium-btn-secondary py-2.5 px-4 text-xs font-semibold"
          disabled={isSubmitting}
        >
          İptal
        </button>
        <button
          type="submit"
          className="premium-btn-primary py-2.5 px-4 text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-brand-500/10"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader size={14} className="animate-spin" />
          ) : editingGoal ? (
            <Save size={14} />
          ) : (
            <Plus size={14} />
          )}
          <span>{editingGoal ? 'Hedefi Güncelle' : 'Hedef Ekle'}</span>
        </button>
      </div>
    </form>
  );
};

export default GoalForm;
