import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { DollarSign, Calendar, FileText, User } from 'lucide-react';

interface DebtFormProps {
  editingDebt?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const DebtForm: React.FC<DebtFormProps> = ({ editingDebt, onSuccess, onCancel }) => {
  const { addDebt, updateDebt } = useData();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'debt' | 'receivable'>('debt');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPaid, setIsPaid] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Hydrate fields if editing
  useEffect(() => {
    if (editingDebt) {
      setTitle(editingDebt.title);
      setAmount(editingDebt.amount.toString());
      setType(editingDebt.type);
      setDueDate(editingDebt.due_date);
      setIsPaid(editingDebt.is_paid);
      setDescription(editingDebt.description || '');
    }
  }, [editingDebt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Kişi veya kurum adı boş bırakılamaz.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Lütfen geçerli ve sıfırdan büyük bir tutar girin.');
      return;
    }

    if (!dueDate) {
      setErrorMsg('Vade tarihi seçilmelidir.');
      return;
    }

    setLoading(true);
    const payload = {
      title: title.trim(),
      amount: parsedAmount,
      type,
      due_date: dueDate,
      is_paid: isPaid,
      description: description.trim(),
    };

    let result;
    if (editingDebt) {
      result = await updateDebt(editingDebt.id, payload);
    } else {
      result = await addDebt(payload);
    }

    setLoading(false);
    if (result.success) {
      onSuccess();
    } else {
      setErrorMsg(result.error || 'İşlem gerçekleştirilemedi.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium animate-in fade-in slide-in-from-top-1 duration-200">
          {errorMsg}
        </div>
      )}

      {/* Title input */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
          Kişi / Kurum Adı
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <User size={16} />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn: Ahmet Yılmaz, Akbank"
            className="premium-input pl-10 text-sm"
            required
          />
        </div>
      </div>

      {/* Amount and Type row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Amount */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
            Tutar
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <DollarSign size={16} />
            </div>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="premium-input pl-10 text-sm"
              required
            />
          </div>
        </div>

        {/* Type select */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
            İşlem Tipi
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'debt' | 'receivable')}
            className="premium-input text-sm cursor-pointer"
          >
            <option value="debt">Borç (Ödeyeceğim)</option>
            <option value="receivable">Alacak (Alacağım)</option>
          </select>
        </div>
      </div>

      {/* Due date input */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
          Vade Tarihi
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Calendar size={16} />
          </div>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="premium-input pl-10 text-sm cursor-pointer"
            required
          />
        </div>
      </div>

      {/* Paid checkbox toggle */}
      <div className="flex items-center space-x-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40 rounded-2xl transition-all duration-200">
        <input
          type="checkbox"
          id="isPaid"
          checked={isPaid}
          onChange={(e) => setIsPaid(e.target.checked)}
          className="h-4.5 w-4.5 rounded-lg border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
        />
        <label htmlFor="isPaid" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
          Bu borç / alacak tamamen ödendi / tahsil edildi
        </label>
      </div>

      {/* Description textarea */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
          Not / Açıklama
        </label>
        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none text-slate-400 dark:text-slate-500">
            <FileText size={16} />
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ödeme detayları, taksit bilgisi vb. notlar..."
            rows={3}
            className="premium-input pl-10 pt-2.5 text-sm resize-none"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-5">
        <button
          type="button"
          onClick={onCancel}
          className="premium-btn-secondary py-2.5 px-5 text-xs font-semibold"
          disabled={loading}
        >
          Vazgeç
        </button>
        <button
          type="submit"
          className="premium-btn-primary py-2.5 px-5 text-xs font-semibold"
          disabled={loading}
        >
          {loading ? 'Kaydediliyor...' : editingDebt ? 'Değişiklikleri Kaydet' : 'Borç/Alacak Ekle'}
        </button>
      </div>
    </form>
  );
};

export default DebtForm;
