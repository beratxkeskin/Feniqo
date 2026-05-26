import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import type { Transaction } from '../../db/types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onEdit }) => {
  const { categories, deleteTransaction, activeWorkspace, workspaceMembers, currentUserRole } = useData();
  const { user } = useAuth();
  const currency = user?.currency || 'TRY';

  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  const handleDeleteConfirm = async () => {
    if (txToDelete) {
      await deleteTransaction(txToDelete.id);
      setTxToDelete(null);
    }
  };

  const canEditOrDelete = (tx: Transaction) => {
    if (currentUserRole === 'viewer') return false;
    if (currentUserRole === 'contributor') {
      return tx.user_id === user?.id;
    }
    return true; // admin
  };

  return (
    <>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors duration-200">
        
        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Açıklama</th>
                <th className="px-6 py-4">Tarih</th>
                <th className="px-6 py-4">Ödeme Yöntemi</th>
                <th className="px-6 py-4 text-right">Tutar</th>
                <th className="px-6 py-4 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {transactions.map((tx) => {
                const category = categories.find(c => c.id === tx.category_id);
                const categoryColor = category ? category.color : '#6B7280';
                const categoryIconName = (category?.icon || 'HelpCircle') as keyof typeof Icons;
                const IconComponent = Icons[categoryIconName] as React.ComponentType<any>;
 
                const spender = workspaceMembers.find(m => m.id === tx.user_id);
                const spenderName = spender 
                  ? (spender.email === user?.email ? (user?.lang === 'en' ? 'You' : 'Siz') : spender.email.split('@')[0])
                  : (tx.user_id === 'demo-partner-456' ? 'Şifa' : (user?.lang === 'en' ? 'You' : 'Siz'));

                return (
                  <tr 
                    key={tx.id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300 text-sm transition-colors duration-150"
                  >
                    {/* Category Column */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: categoryColor }}
                        >
                          {IconComponent ? <IconComponent size={16} /> : <Icons.HelpCircle size={16} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {category ? category.name : 'Bilinmeyen Kategori'}
                          </span>
                          {activeWorkspace && (
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                              👤 {spenderName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Description Column */}
                    <td className="px-6 py-4.5 max-w-[200px]">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {tx.description || <span className="text-slate-400 dark:text-slate-500 italic">Detay yok</span>}
                          </span>
                          {tx.installment_number && tx.total_installments && (
                            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/50" title="Taksit Bilgisi">
                              {tx.installment_number}/{tx.total_installments} Taksit
                            </span>
                          )}
                          {tx.receipt_url && (
                            <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 shrink-0 p-1 bg-brand-50 dark:bg-brand-900/20 rounded-md" title="Makbuzu Görüntüle">
                               <Icons.Paperclip size={14} />
                            </a>
                          )}
                        </div>
                        {tx.tags && tx.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tx.tags.map(tag => (
                              <span 
                                key={tag} 
                                className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200/25 dark:border-slate-800/50"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Date Column */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {formatDate(tx.transaction_date)}
                    </td>

                    {/* Payment Column */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {tx.payment_method}
                      </span>
                    </td>

                    {/* Amount Column */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-right">
                      <span className={`font-bold text-base ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-center">
                      {canEditOrDelete(tx) ? (
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onEdit(tx)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg transition-colors"
                            title="İşlemi Düzenle"
                          >
                            <Icons.Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setTxToDelete(tx)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
                            title="İşlemi Sil"
                          >
                            <Icons.Trash2 size={15} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold italic flex items-center justify-center gap-1 select-none">
                          <Icons.Lock size={10} />
                          <span>{user?.lang === 'en' ? 'Locked' : 'Kilitli'}</span>
                        </span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
          {transactions.map((tx) => {
            const category = categories.find(c => c.id === tx.category_id);
            const categoryColor = category ? category.color : '#6B7280';
            const categoryIconName = (category?.icon || 'HelpCircle') as keyof typeof Icons;
            const IconComponent = Icons[categoryIconName] as React.ComponentType<any>;

            const spender = workspaceMembers.find(m => m.id === tx.user_id);
            const spenderName = spender 
              ? (spender.email === user?.email ? (user?.lang === 'en' ? 'You' : 'Siz') : spender.email.split('@')[0])
              : (tx.user_id === 'demo-partner-456' ? 'Şifa' : (user?.lang === 'en' ? 'You' : 'Siz'));

            return (
              <div 
                key={tx.id} 
                className="p-4 flex flex-col space-y-3 hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors"
              >
                {/* Header: Category Icon, Name, Date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: categoryColor }}
                    >
                      {IconComponent ? <IconComponent size={15} /> : <Icons.HelpCircle size={15} />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        {category ? category.name : 'Bilinmeyen Kategori'}
                        {activeWorkspace && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md">
                            {spenderName}
                          </span>
                        )}
                      </h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {formatDate(tx.transaction_date)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  {canEditOrDelete(tx) ? (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEdit(tx)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Icons.Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setTxToDelete(tx)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Icons.Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold italic flex items-center gap-0.5 select-none pr-1">
                      <Icons.Lock size={9} />
                      <span>{user?.lang === 'en' ? 'Locked' : 'Kilitli'}</span>
                    </span>
                  )}
                </div>

                {/* Body: Description, Payment Method, Amount */}
                <div className="flex items-end justify-between pl-11">
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold line-clamp-1">
                        {tx.description || <span className="text-slate-400 dark:text-slate-500 italic">Açıklama yok</span>}
                      </p>
                      {tx.installment_number && tx.total_installments && (
                        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/50">
                          {tx.installment_number}/{tx.total_installments} Taksit
                        </span>
                      )}
                      {tx.receipt_url && (
                        <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer" className="text-brand-500 bg-brand-50 dark:bg-brand-900/20 p-1 rounded-md shrink-0">
                          <Icons.Paperclip size={12} />
                        </a>
                      )}
                    </div>
                    {tx.tags && tx.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tx.tags.map(tag => (
                          <span 
                            key={tag} 
                            className="px-1.5 py-0.5 rounded-md text-[8px] font-extrabold bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200/25 dark:border-slate-800/50"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {tx.payment_method}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-base ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Delete Confirmation Modal for Single (Non-Installment) Transactions */}
      {txToDelete !== null && !txToDelete.installment_group_id && (
        <ConfirmModal
          isOpen={txToDelete !== null}
          title="İşlem Silinsin mi?"
          message="Seçilen finansal işlemi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          confirmText="İşlemi Sil"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setTxToDelete(null)}
          isDangerous={true}
        />
      )}

      {/* Delete Confirmation Modal for Installment Transactions */}
      {txToDelete !== null && txToDelete.installment_group_id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-amber-500">
              <Icons.AlertTriangle className="w-8 h-8 shrink-0" />
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Taksit Serisi Silinsin mi?
              </h3>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Bu işlem bir taksitli kredi kartı serisine aittir: <strong className="text-slate-800 dark:text-slate-200">{txToDelete.description}</strong>. Nasıl silmek istersiniz?
            </p>

            <div className="flex flex-col space-y-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  await deleteTransaction(txToDelete.id, 'one');
                  setTxToDelete(null);
                }}
                className="w-full text-left py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition-all flex flex-col space-y-0.5 hover:border-brand-500"
              >
                <span className="text-sm font-bold">1. Sadece Bu Taksiti Sil</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 font-medium">Sadece bu aya ait {formatCurrency(txToDelete.amount, currency)} tutarındaki taksit kaydı silinir.</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await deleteTransaction(txToDelete.id, 'future');
                  setTxToDelete(null);
                }}
                className="w-full text-left py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition-all flex flex-col space-y-0.5 hover:border-amber-500"
              >
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">2. Bu ve Gelecekteki Taksitleri Sil</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 font-medium">Bu işlemden itibaren sonraki aylara planlanan taksitler kaldırılır.</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await deleteTransaction(txToDelete.id, 'all');
                  setTxToDelete(null);
                }}
                className="w-full text-left py-3 px-4 rounded-xl border border-red-100 dark:border-red-950/20 bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-700 dark:text-slate-300 transition-all flex flex-col space-y-0.5 hover:border-red-500"
              >
                <span className="text-sm font-bold text-red-600 dark:text-red-400">3. Tüm Taksit Serisini Sil</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 font-medium">Geçmiş ve gelecek dahil bu seriye ait tüm taksitler tamamen temizlenir.</span>
              </button>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800/50">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="premium-btn-secondary py-2 px-4 text-xs font-bold"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionList;
