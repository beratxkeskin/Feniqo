import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { DebtCard } from '../components/debts/DebtCard';
import { DebtForm } from '../components/forms/DebtForm';
import { LoanPaymentForm } from '../components/forms/LoanPaymentForm';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency } from '../utils/formatters';
import { 
  Plus, 
  X, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Percent
} from 'lucide-react';

const translations = {
  tr: {
    title: 'Borç & Alacak Takibi',
    subtitle: 'Alacaklarınızı ve borçlarınızı vade tarihleri ve ödeme durumlarıyla birlikte kolayca yönetin.',
    addNew: 'Yeni Borç/Alacak Ekle',
    all: 'Tümü',
    debts: 'Borçlar',
    receivables: 'Alacaklar',
    paid: 'Ödenenler',
    unpaid: 'Ödenmeyenler',
    totalReceivables: 'Toplam Alacak',
    totalDebts: 'Toplam Borç',
    netStatus: 'Net Durum',
    paymentRatio: 'Ödeme Oranı',
    paidCount: 'Ödenen / Tahsil Edilen',
    record: 'Kayıt',
    netReceivable: 'Net Alacaklı',
    netDebt: 'Net Borçlu',
    balanced: 'Dengede',
    emptyTitle: 'Kayıt Bulunmuyor',
    emptyDesc: 'Henüz hiçbir borç veya alacak kaydı eklemediniz. Borçlarınızı ve alacaklarınızı takip etmek için hemen başlayın!',
    emptyFilterTitle: 'Eşleşen Kayıt Bulunamadı',
    emptyFilterDesc: 'Seçtiğiniz filtreye uygun hiçbir borç veya alacak kaydı bulunmamaktadır. Başka bir filtreyi deneyebilirsiniz.',
    deleteConfirm: 'Bu borç/alacak kaydını silmek istediğinizden emin misiniz?',
    editTitle: 'Kaydı Düzenle',
    newTitle: 'Yeni Borç veya Alacak Ekle'
  },
  en: {
    title: 'Debt & Receivable Tracking',
    subtitle: 'Easily manage your debts and receivables with due dates and payment statuses.',
    addNew: 'Add New Debt/Receivable',
    all: 'All',
    debts: 'Debts',
    receivables: 'Receivables',
    paid: 'Paid',
    unpaid: 'Unpaid',
    totalReceivables: 'Total Receivables',
    totalDebts: 'Total Debts',
    netStatus: 'Net Balance',
    paymentRatio: 'Payment Ratio',
    paidCount: 'Paid / Collected',
    record: 'Records',
    netReceivable: 'Net Receivable',
    netDebt: 'Net Debt',
    balanced: 'Balanced',
    emptyTitle: 'No Records Found',
    emptyDesc: 'You haven\'t added any debts or receivables yet. Start tracking your outstanding balances now!',
    emptyFilterTitle: 'No Matching Records',
    emptyFilterDesc: 'No records match the selected filter. Try choosing another filter.',
    deleteConfirm: 'Are you sure you want to delete this debt/receivable record?',
    editTitle: 'Edit Record',
    newTitle: 'Add New Debt or Receivable'
  }
};

export const Debts: React.FC = () => {
  const { user } = useAuth();
  const { debts, deleteDebt, toggleDebtPaidStatus, currentUserRole } = useData();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'debt' | 'receivable' | 'paid' | 'unpaid'>('all');

  const lang = user?.lang || 'tr';
  const t = translations[lang];
  const currency = user?.currency || 'TRY';

  // 1. Calculate Summary Stats
  const stats = useMemo(() => {
    // Total Unpaid Receivables
    const totalReceivables = debts
      .filter(d => d.type === 'receivable' && !d.is_paid)
      .reduce((sum, d) => sum + d.amount, 0);

    // Total Unpaid Debts
    const totalDebts = debts
      .filter(d => d.type === 'debt' && !d.is_paid)
      .reduce((sum, d) => sum + d.amount, 0);

    // Net Balance (Receivables - Debts)
    const netBalance = totalReceivables - totalDebts;

    // Paid / Total ratio
    const paidCount = debts.filter(d => d.is_paid).length;
    const totalCount = debts.length;
    const paymentRatio = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

    return {
      totalReceivables,
      totalDebts,
      netBalance,
      paidCount,
      totalCount,
      paymentRatio
    };
  }, [debts]);

  // 2. Filter Debts
  const filteredDebts = useMemo(() => {
    return debts.filter(d => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'debt') return d.type === 'debt' && !d.is_paid;
      if (activeFilter === 'receivable') return d.type === 'receivable' && !d.is_paid;
      if (activeFilter === 'paid') return d.is_paid;
      if (activeFilter === 'unpaid') return !d.is_paid;
      return true;
    });
  }, [debts, activeFilter]);

  // 3. Action Handlers
  const handleAddNew = () => {
    setEditingDebt(null);
    setIsFormOpen(true);
  };

  const handleEdit = (debt: any) => {
    setEditingDebt(debt);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      await deleteDebt(id);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingDebt(null);
  };

  const handleStartPayment = (debt: any) => {
    setPayingDebt(debt);
    setIsPaymentFormOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Coins className="text-brand-500 w-7 h-7" strokeWidth={2.5} />
            {t.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t.subtitle}
          </p>
        </div>

        {currentUserRole !== 'viewer' && (
          <div>
            <button
              onClick={handleAddNew}
              className="premium-btn-primary flex items-center space-x-2 py-2.5 px-4.5 text-xs font-semibold shadow-md whitespace-nowrap cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>{t.addNew}</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats Summary Cards */}
      {debts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Receivables Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">{t.totalReceivables}</span>
              <strong className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
                {formatCurrency(stats.totalReceivables, currency)}
              </strong>
            </div>
          </div>

          {/* Total Debts Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">{t.totalDebts}</span>
              <strong className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
                {formatCurrency(stats.totalDebts, currency)}
              </strong>
            </div>
          </div>

          {/* Net Status Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center space-x-4">
            <div className={`p-3 rounded-2xl ${
              stats.netBalance > 0 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                : stats.netBalance < 0 
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
            }`}>
              {stats.netBalance > 0 ? (
                <TrendingUp className="w-6 h-6" />
              ) : (
                <TrendingDown className="w-6 h-6" />
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block flex items-center gap-1">
                {t.netStatus} 
                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${
                  stats.netBalance > 0 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                    : stats.netBalance < 0 
                      ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400' 
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-600'
                }`}>
                  {stats.netBalance > 0 ? t.netReceivable : stats.netBalance < 0 ? t.netDebt : t.balanced}
                </span>
              </span>
              <strong className={`text-lg font-black tracking-tight ${
                stats.netBalance > 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : stats.netBalance < 0 
                    ? 'text-rose-600 dark:text-rose-400' 
                    : 'text-slate-800 dark:text-white'
              }`}>
                {formatCurrency(Math.abs(stats.netBalance), currency)}
              </strong>
            </div>
          </div>

          {/* Payment Progress Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl">
              <Percent className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                {t.paymentRatio}
              </span>
              <div className="flex items-center space-x-2 mt-0.5">
                <strong className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
                  %{stats.paymentRatio}
                </strong>
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden max-w-[80px]">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.paymentRatio}%` }}
                  />
                </div>
              </div>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mt-0.5">
                {stats.paidCount} / {stats.totalCount} {t.record.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Content Section */}
      {debts.length > 0 ? (
        <div className="space-y-6">
          
          {/* Visual Tabs Selector */}
          <div className="flex items-center overflow-x-auto pb-1.5 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none gap-2">
            {[
              { id: 'all', label: t.all },
              { id: 'receivable', label: t.receivables },
              { id: 'debt', label: t.debts },
              { id: 'paid', label: t.paid },
              { id: 'unpaid', label: t.unpaid },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`py-2 px-4.5 rounded-2xl text-xs font-bold border transition-all whitespace-nowrap ${
                  activeFilter === tab.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          {filteredDebts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {filteredDebts.map((debt) => (
                <DebtCard 
                  key={debt.id} 
                  debt={debt} 
                  onEdit={handleEdit} 
                  onDelete={handleDelete}
                  onTogglePaidStatus={toggleDebtPaidStatus}
                  onStartPayment={handleStartPayment}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              iconName="Inbox"
              title={t.emptyFilterTitle}
              description={t.emptyFilterDesc}
            />
          )}

        </div>
      ) : (
        <EmptyState
          iconName="Coins"
          title={t.emptyTitle}
          description={t.emptyDesc}
          actionText={currentUserRole !== 'viewer' ? t.addNew : undefined}
          onAction={currentUserRole !== 'viewer' ? handleAddNew : undefined}
        />
      )}

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-5">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-brand-500 animate-pulse" />
                {editingDebt ? t.editTitle : t.newTitle}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <DebtForm 
              editingDebt={editingDebt} 
              onSuccess={handleFormSuccess} 
              onCancel={() => setIsFormOpen(false)} 
            />

          </div>
        </div>
      )}

      {/* LOAN PAYMENT MODAL */}
      {isPaymentFormOpen && payingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsPaymentFormOpen(false)} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-5">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-brand-500 animate-pulse" />
                {lang === 'en' ? 'Loan / Debt Payment' : 'Kredi Ödemesi / Borç Kapama'}
              </h3>
              <button 
                onClick={() => setIsPaymentFormOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <LoanPaymentForm 
              debt={payingDebt} 
              onSuccess={() => {
                setIsPaymentFormOpen(false);
                setPayingDebt(null);
              }} 
              onCancel={() => setIsPaymentFormOpen(false)} 
            />

          </div>
        </div>
      )}

    </div>
  );
};

export default Debts;
