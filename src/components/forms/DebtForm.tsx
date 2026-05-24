import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Calendar, FileText, User, TrendingUp, TrendingDown, Globe, RefreshCw } from 'lucide-react';
import { getCurrencySymbol } from '../../utils/formatters';
import { CustomSelect } from '../common/CustomSelect';

interface DebtFormProps {
  editingDebt?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const DebtForm: React.FC<DebtFormProps> = ({ editingDebt, onSuccess, onCancel }) => {
  const { addDebt, updateDebt } = useData();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'debt' | 'receivable'>('debt');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPaid, setIsPaid] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Foreign Currency States
  const [isForeignCurrency, setIsForeignCurrency] = useState(false);
  const [foreignAmount, setForeignAmount] = useState('');
  const [foreignCurrency, setForeignCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [rateError, setRateError] = useState('');

  const isEn = user?.lang === 'en';

  // Fetch exchange rate when foreign currency changes
  useEffect(() => {
    if (!isForeignCurrency) return;
    
    let isMounted = true;
    const fetchRate = async () => {
      setIsFetchingRate(true);
      setRateError('');
      try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${foreignCurrency}`);
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        const rate = data.rates[user?.currency || 'TRY'];
        if (isMounted) {
          setExchangeRate(rate);
        }
      } catch (err) {
        if (isMounted) {
          setRateError(isEn ? 'Could not fetch rate' : 'Kur alınamadı');
        }
      } finally {
        if (isMounted) {
          setIsFetchingRate(false);
        }
      }
    };
    fetchRate();
    return () => { isMounted = false; };
  }, [foreignCurrency, isForeignCurrency]);

  // Auto-calculate base amount
  useEffect(() => {
    if (isForeignCurrency && foreignAmount && exchangeRate) {
      const calcAmount = (parseFloat(foreignAmount) * exchangeRate).toFixed(2);
      setAmount(calcAmount);
    }
  }, [foreignAmount, exchangeRate, isForeignCurrency]);

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
    let finalDescription = description.trim();
    if (isForeignCurrency && foreignAmount && exchangeRate) {
      const originalText = `[Orijinal: ${foreignAmount} ${foreignCurrency} (Kur: ${exchangeRate.toFixed(2)})]`;
      finalDescription = finalDescription ? `${finalDescription} ${originalText}` : originalText;
    }

    const payload = {
      title: title.trim(),
      amount: parsedAmount,
      type,
      due_date: dueDate,
      is_paid: isPaid,
      description: finalDescription,
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

  const typeOptions = [
    { value: 'debt', label: 'Borç (Ödeyeceğim)', icon: <TrendingDown className="w-3.5 h-3.5 text-red-500" /> },
    { value: 'receivable', label: 'Alacak (Alacağım)', icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> },
  ];

  const currencyOptions = [
    { value: 'USD', label: 'Amerikan Doları (USD)', meta: 'USD' },
    { value: 'EUR', label: 'Euro (EUR)', meta: 'EUR' },
    { value: 'GBP', label: 'İngiliz Sterlini (GBP)', meta: 'GBP' },
  ];

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
          <div className="flex items-center justify-between pl-1">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tutar
            </label>
            {!editingDebt && (
              <button
                type="button"
                onClick={() => {
                  setIsForeignCurrency(!isForeignCurrency);
                  if (!isForeignCurrency) {
                    setForeignAmount('');
                    setExchangeRate(null);
                  } else {
                    setAmount('');
                  }
                }}
                className={`text-[10px] font-bold flex items-center space-x-1 transition-colors ${
                  isForeignCurrency 
                    ? 'text-brand-500 hover:text-brand-600' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Globe size={12} />
                <span>Dövizli</span>
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 font-bold text-sm">
              {getCurrencySymbol(user?.currency || 'TRY')}
            </div>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setIsForeignCurrency(false); // disable dynamic foreign rate if manual override happens
              }}
              placeholder="0.00"
              className={`premium-input pl-10 text-sm ${
                isForeignCurrency && foreignAmount && exchangeRate
                  ? 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-800'
                  : ''
              }`}
              required
            />
          </div>
        </div>

        {/* Type select */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
            İşlem Tipi
          </label>
          <CustomSelect
            options={typeOptions}
            value={type}
            onChange={(val) => setType(val as 'debt' | 'receivable')}
          />
        </div>
      </div>

      {/* Foreign currency box (conditional) */}
      {isForeignCurrency && !editingDebt && (
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-inner">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Döviz Türü</label>
              <CustomSelect
                options={currencyOptions}
                value={foreignCurrency}
                onChange={setForeignCurrency}
                className="text-xs shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Döviz Tutarı</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={foreignAmount}
                onChange={(e) => setForeignAmount(e.target.value)}
                placeholder="0.00"
                className="premium-input text-xs py-2 px-3 shadow-sm font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] px-1">
            <div className="text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 font-medium">
              <RefreshCw size={10} className={isFetchingRate ? "animate-spin text-brand-500" : ""} />
              <span>Güncel Kur:</span>
              {isFetchingRate ? (
                <span className="text-brand-500 font-semibold animate-pulse">Hesaplanıyor...</span>
              ) : rateError ? (
                <span className="text-red-500 font-semibold">{rateError}</span>
              ) : exchangeRate ? (
                <strong className="text-slate-700 dark:text-slate-200">
                  1 {foreignCurrency} = {exchangeRate.toFixed(4)} {user?.currency || 'TRY'}
                </strong>
              ) : null}
            </div>
          </div>
        </div>
      )}

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
