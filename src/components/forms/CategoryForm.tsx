import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useData } from '../../context/DataContext';

interface CategoryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const PRESET_COLORS = [
  '#10B981', '#34D399', '#059669', // Greens
  '#3B82F6', '#60A5FA', '#1D4ED8', // Blues
  '#EF4444', '#F87171', '#B91C1C', // Reds
  '#F59E0B', '#FBBF24', '#D97706', // Yellow/Ambers
  '#EC4899', '#F472B6', '#BE185D', // Pinks
  '#8B5CF6', '#A78BFA', '#6D28D9', // Purples
  '#6366F1', '#818CF8', '#4F46E5', // Indigos
  '#6B7280', '#9CA3AF', '#4B5563', // Grays
];

const AVAILABLE_ICONS: (keyof typeof Icons)[] = [
  'ShoppingCart', 'Car', 'Home', 'FileText', 'Music', 
  'BookOpen', 'HeartPulse', 'CreditCard', 'Briefcase', 
  'Laptop', 'GraduationCap', 'TrendingUp', 'DollarSign', 
  'HelpCircle', 'Utensils', 'Coffee', 'Plane', 'Gift', 
  'Gamepad2', 'Scissors', 'Shield', 'Sparkles'
];

export const CategoryForm: React.FC<CategoryFormProps> = ({ onSuccess, onCancel }) => {
  const { addCategory } = useData();
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState<string>('HelpCircle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Kategori adı alanı zorunludur.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await addCategory({
        name: name.trim(),
        type,
        color,
        icon,
      });

      if (res.success) {
        setName('');
        onSuccess();
      } else {
        setErrorMessage(res.error || 'Kategori eklenirken hata oluştu.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Bir şeyler ters gitti.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/50">
          {errorMessage}
        </div>
      )}

      {/* Category Name */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Kategori Adı *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn: Restoran, Prim, Spor"
          className="premium-input"
          required
        />
      </div>

      {/* Category Type */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Tür
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
              type === 'expense'
                ? 'bg-red-50 dark:bg-red-950/20 border-red-500 text-red-600 dark:text-red-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            Gider Kategorisi
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
              type === 'income'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            Gelir Kategorisi
          </button>
        </div>
      </div>

      {/* Preset Colors */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Renk Seçimi
        </label>
        <div className="flex flex-wrap gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/30">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setColor(preset)}
              style={{ backgroundColor: preset }}
              className={`w-7 h-7 rounded-full transition-transform active:scale-90 ${
                color === preset
                  ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-offset-slate-900 dark:ring-white scale-110'
                  : 'hover:scale-105'
              }`}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-7 h-7 rounded-full cursor-pointer border-none outline-none overflow-hidden"
            title="Özel Renk Seç"
          />
        </div>
      </div>

      {/* Icon Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          İkon Seçimi
        </label>
        <div className="grid grid-cols-6 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/30 max-h-[160px] overflow-y-auto">
          {AVAILABLE_ICONS.map((iconName) => {
            const IconComp = Icons[iconName] as React.ComponentType<any>;
            const isSelected = icon === iconName;
            
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => setIcon(iconName)}
                className={`p-2 flex items-center justify-center rounded-lg border transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'border-slate-100 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
                title={String(iconName)}
              >
                {IconComp && <IconComp size={18} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
        <button
          type="button"
          onClick={onCancel}
          className="premium-btn-secondary py-2 px-4 text-sm"
          disabled={isSubmitting}
        >
          İptal
        </button>
        <button
          type="submit"
          className="premium-btn-primary py-2 px-4 text-sm flex items-center space-x-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Icons.Loader size={16} className="animate-spin" />
          ) : (
            <Icons.Plus size={16} />
          )}
          <span>Kategori Ekle</span>
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;
