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
  const { categories, deleteTransaction } = useData();
  const { user } = useAuth();
  const currency = user?.currency || 'TRY';

  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  const handleDeleteConfirm = async () => {
    if (txToDelete) {
      await deleteTransaction(txToDelete.id);
      setTxToDelete(null);
    }
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
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {category ? category.name : 'Bilinmeyen Kategori'}
                        </span>
                      </div>
                    </td>

                    {/* Description Column */}
                    <td className="px-6 py-4.5 max-w-[200px] truncate">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {tx.description || <span className="text-slate-400 dark:text-slate-500 italic">Detay yok</span>}
                      </span>
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
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {category ? category.name : 'Bilinmeyen Kategori'}
                      </h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {formatDate(tx.transaction_date)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
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
                </div>

                {/* Body: Description, Payment Method, Amount */}
                <div className="flex items-end justify-between pl-11">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-1">
                      {tx.description || <span className="text-slate-400 dark:text-slate-500 italic">Açıklama yok</span>}
                    </p>
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={txToDelete !== null}
        title="İşlem Silinsin mi?"
        message="Seçilen finansal işlemi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="İşlemi Sil"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTxToDelete(null)}
        isDangerous={true}
      />
    </>
  );
};

export default TransactionList;
