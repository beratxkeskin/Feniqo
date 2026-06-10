import React, { useState } from 'react';
import type { Debt } from '../../db/types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { parseLoanMetadata, extractBaseDescription } from '../../utils/loanUtils';
import { 
  Calendar, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface DebtCardProps {
  debt: Debt;
  onEdit: (debt: Debt) => void;
  onDelete: (id: string) => void;
  onTogglePaidStatus: (id: string) => void;
  onStartPayment?: (debt: Debt) => void;
}

const translations = {
  tr: {
    debt: 'Borç',
    receivable: 'Alacak',
    paid: 'Ödendi',
    unpaid: 'Ödenmedi',
    markAsPaid: 'Ödendi Olarak İşaretle',
    markAsUnpaid: 'Ödenmedi Olarak İşaretle',
    overdue: 'Vadesi Geçti',
    daysLeft: 'gün kaldı',
    daysOverdue: 'gün gecikti',
    today: 'Vade Günü Bugün',
    edit: 'Düzenle',
    delete: 'Sil',
    note: 'Not',
    toPay: 'Ödeyeceğim Tutar',
    toReceive: 'Alacağım Tutar',
    payLoan: 'Kredi Ödemesi Yap',
  },
  en: {
    debt: 'Debt',
    receivable: 'Receivable',
    paid: 'Paid',
    unpaid: 'Unpaid',
    markAsPaid: 'Mark as Paid',
    markAsUnpaid: 'Mark as Unpaid',
    overdue: 'Overdue',
    daysLeft: 'days left',
    daysOverdue: 'days overdue',
    today: 'Due Today',
    edit: 'Edit',
    delete: 'Delete',
    note: 'Note',
    toPay: 'Amount to Pay',
    toReceive: 'Amount to Receive',
    payLoan: 'Pay Loan',
  }
};

export const DebtCard: React.FC<DebtCardProps> = ({ debt, onEdit, onDelete, onTogglePaidStatus, onStartPayment }) => {
  const { user } = useAuth();
  const { currentUserRole } = useData();
  const [isToggling, setIsToggling] = useState(false);

  const loanMeta = parseLoanMetadata(debt.description);
  const lang = user?.lang || 'tr';
  const t = translations[lang];
  const currency = user?.currency || 'TRY';

  const isPaid = debt.is_paid;
  const isDebt = debt.type === 'debt';

  // Calculate remaining days
  const getRemainingDays = () => {
    if (isPaid) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(debt.due_date);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return {
        text: `${absDays} ${t.daysOverdue}`,
        isOverdue: true
      };
    } else if (diffDays === 0) {
      return {
        text: t.today,
        isOverdue: true
      };
    } else {
      return {
        text: `${diffDays} ${t.daysLeft}`,
        isOverdue: false
      };
    }
  };

  const statusInfo = getRemainingDays();

  // Premium colors base
  let themeStyles = {
    cardBorder: 'border-slate-200/80 dark:border-slate-800',
    topBar: 'bg-slate-400 dark:bg-slate-700',
    iconBg: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400',
    tagStyles: 'bg-slate-50 dark:bg-slate-950/25 border-slate-100 dark:border-slate-900 text-slate-500 dark:text-slate-400',
    glow: '',
  };

  if (!isPaid) {
    if (isDebt) {
      // Unpaid Debt: Soft Red
      themeStyles = {
        cardBorder: 'border-rose-100/80 dark:border-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/60',
        topBar: 'bg-gradient-to-r from-rose-500 to-pink-500',
        iconBg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100/50 dark:border-rose-900/30 text-rose-600 dark:text-rose-400',
        tagStyles: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400',
        glow: 'hover:shadow-rose-500/5',
      };
    } else {
      // Unpaid Receivable: Soft Green
      themeStyles = {
        cardBorder: 'border-emerald-100/80 dark:border-emerald-950/40 hover:border-emerald-200 dark:hover:border-emerald-900/60',
        topBar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        tagStyles: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400',
        glow: 'hover:shadow-emerald-500/5',
      };
    }
  } else {
    // Paid Status: Soft Gray / Faded Green
    themeStyles = {
      cardBorder: 'border-slate-200 dark:border-slate-800/80 opacity-75 hover:opacity-100 transition-opacity',
      topBar: 'bg-slate-200 dark:bg-slate-800',
      iconBg: 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500',
      tagStyles: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-900/20 text-emerald-600 dark:text-emerald-400',
      glow: '',
    };
  }

  const handleToggle = () => {
    setIsToggling(true);
    onTogglePaidStatus(debt.id);
    setTimeout(() => setIsToggling(false), 300);
  };

  return (
    <div className={`relative overflow-hidden bg-white dark:bg-slate-900 border ${themeStyles.cardBorder} rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 ${themeStyles.glow}`}>
      
      {/* Decorative top bar */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${themeStyles.topBar}`} />

      {/* Header Info */}
      <div className="flex items-start justify-between mb-4 mt-1">
        <div className="flex items-center space-x-3.5 flex-1 min-w-0">
          <div className={`p-3 rounded-2xl border ${themeStyles.iconBg} shadow-sm transition-transform duration-300 hover:scale-105 flex-shrink-0 flex items-center justify-center`}>
            {isPaid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            ) : isDebt ? (
              <TrendingDown className="w-5 h-5" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight tracking-tight truncate flex items-center gap-1.5">
              {debt.title}
              {isPaid && (
                <span className="flex items-center justify-center p-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full" title={t.paid}>
                  <Sparkles className="w-3 h-3 animate-pulse" />
                </span>
              )}
            </h3>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 dark:text-slate-500 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(debt.due_date)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {currentUserRole !== 'viewer' && (
          <div className="flex items-center space-x-0.5 ml-2">
            <button 
              onClick={() => onEdit(debt)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title={t.edit}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onDelete(debt.id)}
              className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
              title={t.delete}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tutar ve Tip Etiketi */}
      <div className="space-y-4 mb-4">
        <div className="flex items-baseline justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              {isPaid ? (isDebt ? t.debt : t.receivable) : (isDebt ? t.toPay : t.toReceive)}
            </span>
            <span className={`text-2xl font-black tracking-tight mt-1 ${
              isPaid 
                ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-700' 
                : isDebt 
                  ? 'text-rose-600 dark:text-rose-400' 
                  : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {formatCurrency(debt.amount, currency)}
            </span>
          </div>

          {/* Badges / Tags */}
          <div className="flex flex-col items-end space-y-1">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
              isPaid 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                : isDebt
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            }`}>
              {isPaid ? t.paid : isDebt ? t.debt : t.receivable}
            </span>

            {/* Remaining time / Overdue warnings */}
            {statusInfo && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                statusInfo.isOverdue 
                  ? 'bg-rose-100/70 dark:bg-rose-950/40 border-rose-200/50 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 animate-pulse'
                  : 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/20 text-amber-600 dark:text-amber-400'
              }`}>
                {statusInfo.isOverdue ? (
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <Clock className="w-3 h-3 flex-shrink-0" />
                )}
                {statusInfo.text}
              </span>
            )}
          </div>
        </div>

        {/* Description / Note */}
        {extractBaseDescription(debt.description) && (
          <div className="p-3 bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800/40 rounded-2xl">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
              {t.note}
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {extractBaseDescription(debt.description)}
            </p>
          </div>
        )}

        {/* Loan progress bar & schedule info */}
        {loanMeta && (
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
              <span>{lang === 'en' ? 'Installment Progress' : 'Taksit İlerlemesi'}</span>
              <span className="text-slate-600 dark:text-slate-350 font-black">
                {loanMeta.installments.filter(i => i.isPaid).length} / {loanMeta.installments.length} {lang === 'en' ? 'Paid' : 'Ödendi'}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 rounded-full transition-all duration-500" 
                style={{ 
                  width: `${(loanMeta.installments.filter(i => i.isPaid).length / loanMeta.installments.length) * 100}%` 
                }}
              />
            </div>

            {/* Next Payment details */}
            {(() => {
              const nextInst = loanMeta.installments.find(i => !i.isPaid);
              if (!nextInst) return null;
              return (
                <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex flex-col">
                    <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{lang === 'en' ? 'Next Due' : 'Sıradaki Vade'}</span>
                    <strong className="text-slate-700 dark:text-slate-300 font-semibold mt-0.5">{formatDate(nextInst.dueDate)}</strong>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{lang === 'en' ? 'Installment Amount' : 'Taksit Tutarı'}</span>
                    <strong className="text-slate-800 dark:text-slate-250 font-extrabold mt-0.5 text-brand-600 dark:text-brand-400">
                      {formatCurrency(nextInst.total, currency)}
                    </strong>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Quick Paid Status Toggle Button */}
      {currentUserRole !== 'viewer' && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-3.5 flex gap-2">
          {!isPaid && isDebt && onStartPayment && (
            <button
              onClick={() => onStartPayment(debt)}
              className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer bg-brand-500 text-white hover:bg-brand-600 shadow-md shadow-brand-500/10 hover:shadow-lg hover:shadow-brand-500/20 active:scale-[0.97]"
            >
              <span>{t.payLoan}</span>
            </button>
          )}
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`${(!isPaid && isDebt && onStartPayment) ? 'flex-1' : 'w-full'} flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
              isPaid
                ? 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                : isDebt
                  ? 'bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white dark:hover:text-white border border-rose-100/50 dark:border-rose-900/20'
                  : 'bg-emerald-50 hover:bg-emerald-600 dark:bg-emerald-950/20 dark:hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white dark:hover:text-white border border-emerald-100/50 dark:border-emerald-900/20'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 transition-transform duration-300 ${isToggling ? 'scale-75' : 'scale-100'} ${isPaid ? 'text-emerald-500' : ''}`} />
            <span>{isPaid ? t.markAsUnpaid : t.markAsPaid}</span>
          </button>
        </div>
      )}

    </div>
  );
};

export default DebtCard;
