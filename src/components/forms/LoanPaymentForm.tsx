import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Calendar, FileText, CreditCard, Percent, Coins, Info } from 'lucide-react';
import { getCurrencySymbol, formatCurrency } from '../../utils/formatters';
import { CustomSelect } from '../common/CustomSelect';
import type { Debt } from '../../db/types';
import { parseLoanMetadata, serializeLoanMetadata, extractBaseDescription } from '../../utils/loanUtils';

interface LoanPaymentFormProps {
  debt: Debt;
  onSuccess: () => void;
  onCancel: () => void;
}

export const LoanPaymentForm: React.FC<LoanPaymentFormProps> = ({ debt, onSuccess, onCancel }) => {
  const { addTransaction, updateDebt, categories } = useData();
  const { user } = useAuth();

  const [paymentType, setPaymentType] = useState<'partial' | 'full'>('full');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestAmount, setInterestAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Havale/EFT');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currency = user?.currency || 'TRY';
  const isEn = user?.lang === 'en';

  const loanMeta = parseLoanMetadata(debt.description);

  // For full/partial payment type, prefill principal, interest, and taxes
  useEffect(() => {
    if (paymentType === 'full') {
      if (loanMeta) {
        const remainingInsts = loanMeta.installments.filter(i => !i.isPaid);
        const pSum = remainingInsts.reduce((sum, i) => sum + i.principal, 0);
        const iSum = remainingInsts.reduce((sum, i) => sum + i.interest, 0);
        const tSum = remainingInsts.reduce((sum, i) => sum + i.tax, 0);
        setPrincipalAmount(pSum.toFixed(2));
        setInterestAmount(iSum.toFixed(2));
        setTaxAmount(tSum.toFixed(2));
      } else {
        setPrincipalAmount(debt.amount.toString());
        setInterestAmount('');
        setTaxAmount('');
      }
    } else {
      // partial/installment payment
      if (loanMeta) {
        const nextInst = loanMeta.installments.find(i => !i.isPaid);
        if (nextInst) {
          setPrincipalAmount(nextInst.principal.toString());
          setInterestAmount(nextInst.interest.toString());
          setTaxAmount(nextInst.tax.toString());
          setPaymentDate(nextInst.dueDate);
        }
      } else {
        setPrincipalAmount('');
        setInterestAmount('');
        setTaxAmount('');
      }
    }
  }, [paymentType, debt.id]);

  // Handle auto-updating the description when values change
  useEffect(() => {
    const p = parseFloat(principalAmount) || 0;
    const i = parseFloat(interestAmount) || 0;
    const t = parseFloat(taxAmount) || 0;
    const total = p + i + t;

    if (total > 0) {
      if (loanMeta && paymentType === 'partial') {
        const nextInst = loanMeta.installments.find(inst => !inst.isPaid);
        if (nextInst) {
          setDescription(
            isEn
              ? `Installment ${nextInst.number}/${loanMeta.term} - ${debt.title}`
              : `${nextInst.number}. Taksit Ödemesi (${loanMeta.term} Ay) - ${debt.title}`
          );
          return;
        }
      }

      const parts = [];
      if (p > 0) parts.push(isEn ? `Principal: ${p}` : `Ana Para: ${p}`);
      if (i > 0) parts.push(isEn ? `Interest: ${i}` : `Faiz: ${i}`);
      if (t > 0) parts.push(isEn ? `Tax/Fees: ${t}` : `Vergi/Harç: ${t}`);
      
      const details = parts.join(', ');
      setDescription(
        isEn 
          ? `${debt.title} Payment (${details})` 
          : `${debt.title} Ödemesi (${details})`
      );
    } else {
      setDescription('');
    }
  }, [principalAmount, interestAmount, taxAmount, debt.title, isEn, paymentType]);

  const pVal = parseFloat(principalAmount) || 0;
  const iVal = parseFloat(interestAmount) || 0;
  const tVal = parseFloat(taxAmount) || 0;
  const totalPayment = pVal + iVal + tVal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (pVal <= 0) {
      setErrorMsg(isEn ? 'Principal payment amount must be greater than zero.' : 'Ana para ödeme tutarı sıfırdan büyük olmalıdır.');
      return;
    }

    if (paymentType === 'partial' && pVal >= debt.amount) {
      setErrorMsg(
        isEn 
          ? 'For partial payment, principal must be less than the remaining debt. Use "Full Closure" instead.' 
          : 'Kısmi ödemede ana para borç tutarından küçük olmalıdır. Borcun tamamını ödemek için "Borç Kapama" seçeneğini kullanın.'
      );
      return;
    }

    setLoading(true);

    try {
      // 1. Find best matching categories
      const loanCat = categories.find(c => c.type === 'expense' && (c.id === 'cat-expense-kredi' || c.name.toLowerCase().includes('kredi'))) || 
                      categories.find(c => c.type === 'expense' && c.id === 'cat-expense-diger') || 
                      categories.find(c => c.type === 'expense');

      const principalCat = loanMeta ? loanCat : 
                           (categories.find(c => c.type === 'expense' && (c.name.toLowerCase().includes('borç') || c.name.toLowerCase().includes('ödeme') || c.id === 'cat-expense-tasarruf')) || 
                            categories.find(c => c.type === 'expense' && c.id === 'cat-expense-diger') || 
                            categories.find(c => c.type === 'expense'));

      const interestCat = loanMeta ? loanCat :
                          (categories.find(c => c.type === 'expense' && (c.name.toLowerCase().includes('faiz') || c.name.toLowerCase().includes('finans') || c.id === 'cat-expense-diger')) || 
                           categories.find(c => c.type === 'expense'));

      const taxCat = loanMeta ? loanCat :
                     (categories.find(c => c.type === 'expense' && (c.name.toLowerCase().includes('vergi') || c.name.toLowerCase().includes('harç') || c.id === 'cat-expense-diger')) || 
                      categories.find(c => c.type === 'expense'));

      // 2. Create transactions
      // Transaction A: Principal
      if (pVal > 0 && principalCat) {
        const pDesc = isEn 
          ? `[Principal] ${debt.title} Payment` 
          : `[Ana Para] ${debt.title} Ödemesi`;
        const res = await addTransaction({
          amount: pVal,
          type: 'expense',
          category_id: principalCat.id,
          description: description || pDesc,
          payment_method: paymentMethod,
          transaction_date: paymentDate,
        });
        if (!res.success) throw new Error(res.error || 'Principal transaction failed');
      }

      // Transaction B: Interest
      if (iVal > 0 && interestCat) {
        const iDesc = isEn 
          ? `[Interest] ${debt.title} Payment` 
          : `[Faiz] ${debt.title} Ödemesi`;
        const res = await addTransaction({
          amount: iVal,
          type: 'expense',
          category_id: interestCat.id,
          description: iDesc,
          payment_method: paymentMethod,
          transaction_date: paymentDate,
        });
        if (!res.success) throw new Error(res.error || 'Interest transaction failed');
      }

      // Transaction C: Taxes
      if (tVal > 0 && taxCat) {
        const tDesc = isEn 
          ? `[Tax/Fees] ${debt.title} Payment` 
          : `[Vergi/Masraf] ${debt.title} Ödemesi`;
        const res = await addTransaction({
          amount: tVal,
          type: 'expense',
          category_id: taxCat.id,
          description: tDesc,
          payment_method: paymentMethod,
          transaction_date: paymentDate,
        });
        if (!res.success) throw new Error(res.error || 'Tax transaction failed');
      }

      // 3. Update the Debt record
      if (loanMeta) {
        if (paymentType === 'full') {
          // Mark all installments paid
          loanMeta.installments.forEach(inst => inst.isPaid = true);
          const updatedDesc = serializeLoanMetadata(extractBaseDescription(debt.description), loanMeta);
          const res = await updateDebt(debt.id, { 
            is_paid: true, 
            amount: 0, 
            description: updatedDesc 
          });
          if (!res.success) throw new Error(res.error || 'Debt update failed');
        } else {
          // Find next unpaid installment
          const nextInstIndex = loanMeta.installments.findIndex(i => !i.isPaid);
          if (nextInstIndex !== -1) {
            loanMeta.installments[nextInstIndex].isPaid = true;
          }
          
          const remainingInsts = loanMeta.installments.filter(i => !i.isPaid);
          const newAmount = remainingInsts.reduce((sum, i) => sum + i.principal, 0);
          const isFullyPaid = remainingInsts.length === 0;
          
          const updatedDesc = serializeLoanMetadata(extractBaseDescription(debt.description), loanMeta);
          const res = await updateDebt(debt.id, { 
            amount: newAmount, 
            is_paid: isFullyPaid, 
            description: updatedDesc 
          });
          if (!res.success) throw new Error(res.error || 'Debt update failed');
        }
      } else {
        if (paymentType === 'full' || pVal >= debt.amount) {
          // Full closure
          const res = await updateDebt(debt.id, { is_paid: true });
          if (!res.success) throw new Error(res.error || 'Debt update failed');
        } else {
          // Partial payment: reduce amount
          const newAmount = Math.max(0, debt.amount - pVal);
          const res = await updateDebt(debt.id, { 
            amount: newAmount,
            is_paid: newAmount === 0 
          });
          if (!res.success) throw new Error(res.error || 'Debt update failed');
        }
      }

      setLoading(false);
      onSuccess();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || (isEn ? 'Payment failed.' : 'Ödeme gerçekleştirilemedi.'));
    }
  };

  const paymentTypeOptions = [
    { value: 'full', label: isEn ? 'Full Debt Closure' : 'Borç Kapama (Tümünü Kapat)' },
    { value: 'partial', label: isEn ? 'Partial / Installment Payment' : 'Taksit / Kısmi Ödeme' },
  ];

  const paymentMethodOptions = [
    { value: 'Havale/EFT', label: 'Havale/EFT' },
    { value: 'Kredi Kartı', label: 'Kredi Kartı' },
    { value: 'Banka Kartı', label: 'Banka Kartı' },
    { value: 'Nakit', label: 'Nakit' },
    { value: 'Diğer', label: 'Diğer' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium animate-in fade-in slide-in-from-top-1 duration-200">
          {errorMsg}
        </div>
      )}

      {/* Info Banner */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-normal">
          <span>{isEn ? 'Paying off:' : 'Ödenen Borç:'} </span>
          <strong className="text-slate-800 dark:text-white">{debt.title}</strong>
          <span className="block mt-0.5">{isEn ? 'Current Outstanding Balance:' : 'Güncel Borç Bakiyesi:'} <strong>{formatCurrency(debt.amount, currency)}</strong></span>
        </div>
      </div>

      {/* Payment Type Selection */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
          {isEn ? 'Payment Operation' : 'Ödeme Türü'}
        </label>
        <CustomSelect
          options={paymentTypeOptions}
          value={paymentType}
          onChange={(val) => setPaymentType(val as 'partial' | 'full')}
        />
      </div>

      {/* Breakdown input fields */}
      <div className="bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800 rounded-3xl p-4.5 space-y-4">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60 pb-2 flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-brand-500" />
          {isEn ? 'Payment Breakdown' : 'Ödeme Kalemleri'}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Principal (Ana Para) */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
              {isEn ? 'Principal (To Debt)' : 'Ana Para (Borçtan Düşecek)'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 font-bold text-xs">
                {getCurrencySymbol(currency)}
              </div>
              <input
                type="number"
                step="any"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                placeholder="0.00"
                className="premium-input pl-8 py-2 text-xs shadow-sm"
                disabled={paymentType === 'full'}
                required
              />
            </div>
          </div>

          {/* Interest (Faiz) */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-0.5">
              <Percent className="w-2.5 h-2.5 text-brand-500" />
              {isEn ? 'Interest Expense' : 'Faiz Gideri'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 font-bold text-xs">
                {getCurrencySymbol(currency)}
              </div>
              <input
                type="number"
                step="any"
                value={interestAmount}
                onChange={(e) => setInterestAmount(e.target.value)}
                placeholder="0.00"
                className="premium-input pl-8 py-2 text-xs shadow-sm"
              />
            </div>
          </div>

          {/* Taxes & Fees (Vergi & Masraf) */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
              {isEn ? 'Taxes & Fees' : 'Vergi & Masraf'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 font-bold text-xs">
                {getCurrencySymbol(currency)}
              </div>
              <input
                type="number"
                step="any"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                placeholder="0.00"
                className="premium-input pl-8 py-2 text-xs shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Calculated Total Banner */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-1">
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {isEn ? 'Calculated Total Cash Outflow:' : 'Hesaplanan Toplam Ödeme (Kasa Çıkışı):'}
          </span>
          <strong className="text-sm font-black text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-xl">
            {formatCurrency(totalPayment, currency)}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Payment Date */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
            {isEn ? 'Payment Date' : 'Ödeme Tarihi'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Calendar size={15} />
            </div>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="premium-input pl-9 py-2 text-xs cursor-pointer"
              required
            />
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
            {isEn ? 'Payment Method' : 'Ödeme Yöntemi'}
          </label>
          <CustomSelect
            options={paymentMethodOptions}
            value={paymentMethod}
            onChange={setPaymentMethod}
            className="text-xs"
          />
        </div>
      </div>

      {/* Description input */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
          {isEn ? 'Description / Details' : 'İşlem Açıklaması'}
        </label>
        <div className="relative">
          <div className="absolute top-2.5 left-3 pointer-events-none text-slate-400 dark:text-slate-500">
            <FileText size={15} />
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isEn ? 'e.g. Loan Payment' : 'Örn: Kredi ödemesi'}
            className="premium-input pl-9 py-2 text-xs"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-5">
        <button
          type="button"
          onClick={onCancel}
          className="premium-btn-secondary py-2 px-4 text-xs font-semibold"
          disabled={loading}
        >
          {isEn ? 'Cancel' : 'Vazgeç'}
        </button>
        <button
          type="submit"
          className="premium-btn-primary py-2 px-5 text-xs font-semibold flex items-center space-x-1.5"
          disabled={loading || totalPayment <= 0}
        >
          <CreditCard size={13} />
          <span>{loading ? (isEn ? 'Processing...' : 'Ödeme Alınıyor...') : (isEn ? 'Record Payment' : 'Ödemeyi Kaydet')}</span>
        </button>
      </div>
    </form>
  );
};

export default LoanPaymentForm;
