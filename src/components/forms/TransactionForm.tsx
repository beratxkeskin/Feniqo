import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, FileText, CheckCircle2, Loader, ArrowUpDown, CreditCard, Globe, RefreshCw } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getCurrencySymbol } from '../../utils/formatters';
import type { Transaction } from '../../db/types';

interface TransactionFormProps {
  transactionToEdit?: Transaction | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const PAYMENT_METHODS = ['Nakit', 'Kredi Kartı', 'Banka Kartı', 'Havale/EFT', 'Diğer'];

export const TransactionForm: React.FC<TransactionFormProps> = ({
  transactionToEdit = null,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const { categories, addTransaction, updateTransaction } = useData();
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Nakit');
  
  // Foreign Currency States
  const [isForeignCurrency, setIsForeignCurrency] = useState(false);
  const [foreignAmount, setForeignAmount] = useState('');
  const [foreignCurrency, setForeignCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [rateError, setRateError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Filter categories based on transaction type (income vs expense)
  const filteredCategories = categories.filter(c => c.type === type);

  // Populate data if we are editing an existing transaction
  useEffect(() => {
    if (transactionToEdit) {
      setAmount(transactionToEdit.amount.toString());
      setType(transactionToEdit.type);
      setCategoryId(transactionToEdit.category_id);
      setDate(transactionToEdit.transaction_date);
      setDescription(transactionToEdit.description || '');
      setPaymentMethod(transactionToEdit.payment_method);
    } else {
      // Set a default category when changing types
      const firstCat = categories.find(c => c.type === type);
      if (firstCat) setCategoryId(firstCat.id);
    }
  }, [transactionToEdit]);

  // Adjust category automatically when changing transaction type
  useEffect(() => {
    if (!transactionToEdit || transactionToEdit.type !== type) {
      const firstCat = categories.find(c => c.type === type);
      setCategoryId(firstCat ? firstCat.id : '');
    } else if (transactionToEdit && transactionToEdit.type === type) {
      setCategoryId(transactionToEdit.category_id);
    }
  }, [type, categories]);

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
        
        const baseCur = user?.currency || 'TRY';
        const rate = data.rates[baseCur];
        
        if (rate && isMounted) {
          setExchangeRate(rate);
        } else if (isMounted) {
          setRateError(`${baseCur} kuru bulunamadı.`);
        }
      } catch (err) {
        if (isMounted) setRateError('Kur bilgisi alınamadı.');
      } finally {
        if (isMounted) setIsFetchingRate(false);
      }
    };

    fetchRate();
    return () => { isMounted = false; };
  }, [isForeignCurrency, foreignCurrency, user?.currency]);

  // Automatically calculate base amount
  useEffect(() => {
    if (isForeignCurrency && foreignAmount && exchangeRate) {
      const parsed = parseFloat(foreignAmount);
      if (!isNaN(parsed) && parsed > 0) {
        const calculated = (parsed * exchangeRate).toFixed(2);
        setAmount(calculated);
      } else {
        setAmount('');
      }
    }
  }, [foreignAmount, exchangeRate, isForeignCurrency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Lütfen sıfırdan büyük geçerli bir tutar girin.');
      return;
    }

    if (!categoryId) {
      setErrorMessage('Lütfen işlem için bir kategori seçin.');
      return;
    }

    if (!date) {
      setErrorMessage('Lütfen işlem tarihini belirtin.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalDescription = description.trim();
      if (isForeignCurrency && foreignAmount && exchangeRate) {
        const note = `(${foreignAmount} ${foreignCurrency} - Kur: ${exchangeRate.toFixed(2)})`;
        finalDescription = finalDescription ? `${finalDescription} ${note}` : note;
      }

      const txData = {
        amount: parsedAmount,
        type,
        category_id: categoryId,
        transaction_date: date,
        description: finalDescription,
        payment_method: paymentMethod,
      };

      let res;
      if (transactionToEdit) {
        res = await updateTransaction(transactionToEdit.id, txData);
      } else {
        res = await addTransaction(txData);
      }

      if (res.success) {
        onSuccess();
      } else {
        setErrorMessage(res.error || 'İşlem kaydedilemedi.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Beklenmeyen bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/50">
          {errorMessage}
        </div>
      )}

      {/* Transaction Type Select */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          İşlem Türü *
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-3 px-4 rounded-xl border font-semibold text-sm transition-all flex items-center justify-center space-x-2 ${
              type === 'expense'
                ? 'bg-red-50 dark:bg-red-950/20 border-red-500 text-red-600 dark:text-red-400 scale-[1.02]'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Gider (-)</span>
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-3 px-4 rounded-xl border font-semibold text-sm transition-all flex items-center justify-center space-x-2 ${
              type === 'income'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 scale-[1.02]'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Gelir (+)</span>
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-3">
        <div className="flex justify-between items-end pb-1">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tutar *
          </label>
          {!transactionToEdit && (
            <button
              type="button"
              onClick={() => setIsForeignCurrency(!isForeignCurrency)}
              className={`text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                isForeignCurrency 
                  ? 'text-brand-600 dark:text-brand-400' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Globe size={14} />
              <span>Dövizli İşlem</span>
            </button>
          )}
        </div>

        {isForeignCurrency && !transactionToEdit && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-inner">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Döviz Türü</label>
                <select
                  value={foreignCurrency}
                  onChange={(e) => setForeignCurrency(e.target.value)}
                  className="premium-input text-sm py-2 px-3 appearance-none bg-no-repeat cursor-pointer shadow-sm"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                >
                  <option value="USD">Amerikan Doları (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">İngiliz Sterlini (GBP)</option>
                </select>
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
                  className="premium-input text-sm py-2 px-3 shadow-sm font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs px-1">
              <div className="text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 font-medium">
                <RefreshCw size={12} className={isFetchingRate ? "animate-spin text-brand-500" : ""} />
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

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-lg">
            {getCurrencySymbol(user?.currency || 'TRY')}
          </div>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setIsForeignCurrency(false); // Disable auto-calc if user overrides base amount
            }}
            placeholder="0.00"
            className={`premium-input pl-10 text-lg font-semibold ${
              isForeignCurrency && foreignAmount && exchangeRate 
                ? 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-800 focus:ring-brand-500' 
                : ''
            }`}
            required
          />
        </div>
        
        {isForeignCurrency && exchangeRate && foreignAmount && (
          <p className="text-[10px] text-brand-600 dark:text-brand-400 font-medium pl-1 animate-in fade-in">
            * Yukarıdaki kur üzerinden {user?.currency || 'TRY'} karşılığı otomatik hesaplanmıştır.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Kategori *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <ArrowUpDown size={16} />
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="premium-input pl-10 appearance-none bg-no-repeat cursor-pointer"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
              required
            >
              <option value="" disabled>Kategori Seçin</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tarih *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Calendar size={16} />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="premium-input pl-10 cursor-pointer"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Method */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Ödeme Yöntemi
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <CreditCard size={16} />
            </div>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="premium-input pl-10 appearance-none bg-no-repeat cursor-pointer"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Açıklama (Opsiyonel)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <FileText size={16} />
            </div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="İşlem detayları..."
              className="premium-input pl-10"
              maxLength={100}
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-5 border-t border-slate-100 dark:border-slate-800/50">
        <button
          type="button"
          onClick={onCancel}
          className="premium-btn-secondary py-2.5 px-5 text-sm"
          disabled={isSubmitting}
        >
          Vazgeç
        </button>
        <button
          type="submit"
          className="premium-btn-primary py-2.5 px-5 text-sm flex items-center space-x-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          <span>{transactionToEdit ? 'Güncelle' : 'Kaydet'}</span>
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
