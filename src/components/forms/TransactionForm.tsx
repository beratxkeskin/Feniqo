import React, { useState, useEffect, useRef } from 'react';
import { Calendar, FileText, CheckCircle2, Loader, ArrowUpDown, CreditCard, Globe, RefreshCw, Repeat, Camera, Image as ImageIcon, X, Users, User, Wallet } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getCurrencySymbol } from '../../utils/formatters';
import type { Transaction } from '../../db/types';
import { extractDataFromReceipt } from '../../services/ocrService';
import { supabase } from '../../db/supabaseClient';
import { CustomSelect } from '../common/CustomSelect';

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
  const { categories, addTransaction, updateTransaction, addRecurringTransaction, activeWorkspace, workspaceMembers } = useData();
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Nakit');
  const [spenderId, setSpenderId] = useState(user?.id || '');
  
  // Foreign Currency States
  const [isForeignCurrency, setIsForeignCurrency] = useState(false);
  const [foreignAmount, setForeignAmount] = useState('');
  const [foreignCurrency, setForeignCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [rateError, setRateError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Recurring States
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [endDate, setEndDate] = useState('');

  // Receipt & OCR States
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string>(''); // For existing or uploaded receipts
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEn = user?.lang === 'en';

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
      setReceiptUrl(transactionToEdit.receipt_url || '');
      setSpenderId(transactionToEdit.user_id || user?.id || '');
    } else {
      // Set a default category when changing types
      const firstCat = categories.find(c => c.type === type);
      if (firstCat) setCategoryId(firstCat.id);
      setSpenderId(user?.id || '');
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
      let finalReceiptUrl = receiptUrl;

      // Eğer yeni bir dosya seçilmişse
      if (receiptFile) {
        if (supabase && user) {
          // Supabase Storage Upload
          const fileExt = receiptFile.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(fileName, receiptFile);

          if (uploadError) {
            throw new Error('Makbuz yüklenirken hata oluştu: ' + uploadError.message);
          }

          const { data: publicUrlData } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName);

          finalReceiptUrl = publicUrlData.publicUrl;
        } else {
          // DEMO MODE UPLOAD (Base64)
          finalReceiptUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(receiptFile);
          });
        }
      }

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
        receipt_url: finalReceiptUrl || null,
        user_id: activeWorkspace ? spenderId : (user?.id || ''),
      };

      let res;
      if (transactionToEdit) {
        res = await updateTransaction(transactionToEdit.id, txData);
      } else {
        if (isRecurring) {
          res = await addRecurringTransaction({
            amount: parsedAmount,
            type,
            category_id: categoryId,
            description: finalDescription,
            payment_method: paymentMethod,
            frequency,
            start_date: date,
            end_date: endDate || null,
            is_active: true,
            workspace_id: activeWorkspace?.id || null,
          } as any);
        } else {
          res = await addTransaction(txData);
        }
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrorMessage("Dosya boyutu 5MB'dan küçük olmalıdır.");
        return;
      }
      setReceiptFile(file);
      setIsScanning(true);
      setScanMessage('Fiş analiz ediliyor (OCR)... Bu işlem birkaç saniye sürebilir.');
      
      const result = await extractDataFromReceipt(file);
      
      setIsScanning(false);
      
      let msg = '';
      if (result.amount) {
        setAmount(result.amount.toString());
        msg += `Tutar (${result.amount}) `;
      }
      if (result.date) {
        setDate(result.date);
        msg += `ve Tarih (${result.date}) `;
      }
      
      if (msg) {
        setScanMessage(`🎉 Başarılı: Fişten ${msg}okundu ve forma eklendi!`);
        setTimeout(() => setScanMessage(''), 8000);
      } else {
        setScanMessage('⚠️ Fişten tutar veya tarih otomatik okunamadı, manuel kontrol ediniz.');
        setTimeout(() => setScanMessage(''), 5000);
      }
    }
  };

  // Prepare formatted options for CustomSelect elements
  const categoryOptions = filteredCategories.map((cat) => {
    const IconComponent = (Icons as any)[cat.icon || 'HelpCircle'];
    return {
      value: cat.id,
      label: cat.name,
      color: cat.color,
      icon: IconComponent ? <IconComponent className="w-3.5 h-3.5" /> : null,
    };
  });

  const foreignCurrencyOptions = [
    { value: 'USD', label: isEn ? 'US Dollar (USD)' : 'Amerikan Doları (USD)', meta: 'USD' },
    { value: 'EUR', label: isEn ? 'Euro (EUR)' : 'Euro (EUR)', meta: 'EUR' },
    { value: 'GBP', label: isEn ? 'British Pound (GBP)' : 'İngiliz Sterlini (GBP)', meta: 'GBP' },
  ];

  const paymentMethodOptions = PAYMENT_METHODS.map(method => {
    const icon = method.toLowerCase().includes('kart') 
      ? <CreditCard className="w-3.5 h-3.5" /> 
      : method.toLowerCase().includes('nakit')
      ? <Wallet className="w-3.5 h-3.5" />
      : <FileText className="w-3.5 h-3.5" />;
    return {
      value: method,
      label: method,
      icon,
    };
  });

  const spenderOptions = workspaceMembers.map(m => ({
    value: m.id,
    label: m.email === user?.email ? (isEn ? 'You' : 'Siz') : m.email.split('@')[0],
    meta: m.email,
    icon: <User className="w-3.5 h-3.5" />
  }));

  const frequencyOptions = [
    { value: 'daily', label: isEn ? 'Every Day' : 'Her Gün' },
    { value: 'weekly', label: isEn ? 'Every Week' : 'Her Hafta' },
    { value: 'monthly', label: isEn ? 'Every Month' : 'Her Ay' },
    { value: 'yearly', label: isEn ? 'Every Year' : 'Her Yıl' },
  ];

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
                <CustomSelect
                  options={foreignCurrencyOptions}
                  value={foreignCurrency}
                  onChange={setForeignCurrency}
                  className="text-sm shadow-sm"
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
          <CustomSelect
            options={categoryOptions}
            value={categoryId}
            onChange={setCategoryId}
            placeholder="Kategori Seçin"
            icon={<ArrowUpDown size={16} />}
            required
          />
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
          <CustomSelect
            options={paymentMethodOptions}
            value={paymentMethod}
            onChange={setPaymentMethod}
            icon={<CreditCard size={16} />}
          />
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {isEn ? 'Description (Optional)' : 'Açıklama (Opsiyonel)'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <FileText size={16} />
            </div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isEn ? 'Transaction details...' : 'İşlem detayları...'}
              className="premium-input pl-10"
              maxLength={100}
            />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold pl-1">
            💡 {isEn ? 'Add hashtag labels like #work, #grocery directly in your description' : 'Etiket eklemek için açıklamaya #iş, #market gibi etiketler yazabilirsiniz'}
          </p>
        </div>
      </div>

      {/* Spender Selection (Workspace only) */}
      {activeWorkspace && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Ödeyen / Spender *
          </label>
          <CustomSelect
            options={spenderOptions}
            value={spenderId}
            onChange={setSpenderId}
            icon={<Users size={16} />}
            required
          />
        </div>
      )}

      {/* Receipt/OCR Upload Area */}
      <div className="space-y-2 pt-2">
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          FİŞ / MAKBUZ Ekle (İsteğe Bağlı)
        </label>
        
        <div className="flex flex-col space-y-3">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {!receiptFile && !receiptUrl ? (
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all flex flex-col items-center justify-center space-y-1.5"
              >
                <Camera size={20} className="mb-1" />
                <span className="text-xs font-semibold">Fotoğraf Çek / Seç</span>
              </button>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                  {receiptFile ? (
                    <img src={URL.createObjectURL(receiptFile)} alt="Receipt" className="w-full h-full object-cover" />
                  ) : receiptUrl ? (
                    <img src={receiptUrl} alt="Receipt" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={20} className="text-slate-400" />
                  )}
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {receiptFile ? receiptFile.name : 'Mevcut Makbuz'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {receiptFile ? `${(receiptFile.size / 1024 / 1024).toFixed(2)} MB` : 'Yüklü Dosya'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setReceiptFile(null); setReceiptUrl(''); }}
                className="p-2 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* OCR Scanning Status Message */}
          {isScanning && (
            <div className="flex items-center space-x-2 text-xs font-medium text-brand-600 dark:text-brand-400 animate-pulse bg-brand-50 dark:bg-brand-900/20 p-2 rounded-lg">
              <Loader size={14} className="animate-spin" />
              <span>{scanMessage}</span>
            </div>
          )}
          {!isScanning && scanMessage && (
            <div className={`flex items-center space-x-2 text-xs font-medium p-2 rounded-lg ${scanMessage.includes('Başarılı') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'}`}>
              <span>{scanMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recurring Option (Only for new transactions) */}
      {!transactionToEdit && (
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/50">
          <label className="flex items-center space-x-2 cursor-pointer group">
            <div className={`w-10 h-5 rounded-full transition-colors relative flex items-center ${isRecurring ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute transition-transform ${isRecurring ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)} 
            />
            <div className="flex items-center space-x-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              <Repeat size={16} />
              <span>Bu işlemi düzenli olarak tekrarla</span>
            </div>
          </label>

          {isRecurring && (
            <div className="p-4 bg-brand-50 dark:bg-brand-900/10 rounded-xl border border-brand-100 dark:border-brand-800/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Tekrar Sıklığı</label>
                  <CustomSelect
                    options={frequencyOptions}
                    value={frequency}
                    onChange={(val) => setFrequency(val as any)}
                    className="text-sm shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Bitiş Tarihi (Opsiyonel)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={date}
                    className="premium-input text-sm py-2 px-3 shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
