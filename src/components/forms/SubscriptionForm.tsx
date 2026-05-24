import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, Calendar } from 'lucide-react';
import * as Icons from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';

interface SubscriptionFormProps {
  editingSubscription?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const translations = {
  tr: {
    nameLabel: 'Abonelik Adı',
    namePlaceholder: 'Örn: Netflix, Spotify, İnternet Faturası',
    amountLabel: 'Aylık Ücret',
    dateLabel: 'Yenileme Tarihi',
    categoryLabel: 'Kategori',
    statusLabel: 'Bu abonelik aktif (Ödemeler devam ediyor)',
    cancel: 'Vazgeç',
    save: 'Değişiklikleri Kaydet',
    add: 'Abonelik Ekle',
    saving: 'Kaydediliyor...',
    errName: 'Abonelik adı boş bırakılamaz.',
    errAmount: 'Lütfen geçerli ve sıfırdan büyük bir ücret girin.',
    errDate: 'Yenileme tarihi seçilmelidir.'
  },
  en: {
    nameLabel: 'Subscription Name',
    namePlaceholder: 'e.g. Netflix, Spotify, Internet Bill',
    amountLabel: 'Monthly Fee',
    dateLabel: 'Next Renewal Date',
    categoryLabel: 'Category',
    statusLabel: 'This subscription is active (Renewals are ongoing)',
    cancel: 'Cancel',
    save: 'Save Changes',
    add: 'Add Subscription',
    saving: 'Saving...',
    errName: 'Subscription name cannot be empty.',
    errAmount: 'Please enter a valid amount greater than zero.',
    errDate: 'Renewal date is required.'
  }
};

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ editingSubscription, onSuccess, onCancel }) => {
  const { addSubscription, updateSubscription, categories } = useData();
  const { user } = useAuth();
  
  const lang = user?.lang || 'tr';
  const t = translations[lang];

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [renewalDate, setRenewalDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter categories to only list Expense categories
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Hydrate fields if editing or set default values
  useEffect(() => {
    if (editingSubscription) {
      setName(editingSubscription.name);
      setAmount(editingSubscription.amount.toString());
      setRenewalDate(editingSubscription.renewal_date);
      setCategoryId(editingSubscription.category_id);
      setIsActive(editingSubscription.is_active);
    } else {
      // Find default subscription category or fallback
      const defaultSubCat = expenseCategories.find(c => c.id === 'cat-expense-abonelik') || expenseCategories[0];
      if (defaultSubCat) {
        setCategoryId(defaultSubCat.id);
      }
    }
  }, [editingSubscription, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg(t.errName);
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg(t.errAmount);
      return;
    }

    if (!renewalDate) {
      setErrorMsg(t.errDate);
      return;
    }

    setLoading(true);
    const payload = {
      name: name.trim(),
      amount: parsedAmount,
      renewal_date: renewalDate,
      category_id: categoryId,
      is_active: isActive,
    };

    let result;
    if (editingSubscription) {
      result = await updateSubscription(editingSubscription.id, payload);
    } else {
      result = await addSubscription(payload);
    }

    setLoading(false);
    if (result.success) {
      onSuccess();
    } else {
      setErrorMsg(result.error || 'İşlem gerçekleştirilemedi.');
    }
  };

  const categoryOptions = expenseCategories.map((cat) => {
    const IconComponent = (Icons as any)[cat.icon || 'HelpCircle'];
    return {
      value: cat.id,
      label: cat.name,
      color: cat.color,
      icon: IconComponent ? <IconComponent className="w-3.5 h-3.5" /> : null,
    };
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium animate-in fade-in slide-in-from-top-1 duration-200">
          {errorMsg}
        </div>
      )}

      {/* Subscription Name input */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
          {t.nameLabel}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <CreditCard size={16} />
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            className="premium-input pl-10 text-sm"
            required
          />
        </div>
      </div>

      {/* Amount and Category row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Amount */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
            {t.amountLabel}
          </label>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="premium-input text-sm"
            required
          />
        </div>

        {/* Category select */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
            {t.categoryLabel}
          </label>
          <CustomSelect
            options={categoryOptions}
            value={categoryId}
            onChange={setCategoryId}
            placeholder={t.categoryLabel}
            required
          />
        </div>
      </div>

      {/* Renewal date input */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
          {t.dateLabel}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Calendar size={16} />
          </div>
          <input
            type="date"
            value={renewalDate}
            onChange={(e) => setRenewalDate(e.target.value)}
            className="premium-input pl-10 text-sm cursor-pointer"
            required
          />
        </div>
      </div>

      {/* Active checkbox toggle */}
      <div className="flex items-center space-x-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40 rounded-2xl transition-all duration-200">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4.5 w-4.5 rounded-lg border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
        />
        <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
          {t.statusLabel}
        </label>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-5">
        <button
          type="button"
          onClick={onCancel}
          className="premium-btn-secondary py-2.5 px-5 text-xs font-semibold"
          disabled={loading}
        >
          {t.cancel}
        </button>
        <button
          type="submit"
          className="premium-btn-primary py-2.5 px-5 text-xs font-semibold"
          disabled={loading}
        >
          {loading ? t.saving : editingSubscription ? t.save : t.add}
        </button>
      </div>
    </form>
  );
};

export default SubscriptionForm;
