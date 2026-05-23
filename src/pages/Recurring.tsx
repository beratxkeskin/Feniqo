
import { Repeat, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { getCurrencySymbol } from '../utils/formatters';
import type { RecurringTransaction } from '../db/types';

export const Recurring = () => {
  const { user } = useAuth();
  const { recurringTransactions, categories, deleteRecurringTransaction, updateRecurringTransaction } = useData();

  const getCategory = (id: string) => categories.find(c => c.id === id);

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu tekrarlayan işlemi silmek istediğinize emin misiniz?')) {
      await deleteRecurringTransaction(id);
    }
  };

  const handleToggleActive = async (rt: RecurringTransaction) => {
    await updateRecurringTransaction(rt.id, { is_active: !rt.is_active });
  };

  const frequencyLabels: Record<string, string> = {
    daily: 'Günlük',
    weekly: 'Haftalık',
    monthly: 'Aylık',
    yearly: 'Yıllık'
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
            <Repeat className="text-brand-500" />
            <span>Tekrarlayan İşlemler</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Düzenli ödemelerinizi ve gelirlerinizi otomatikleştirin
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recurringTransactions.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
            <Repeat className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p>Henüz tekrarlayan işleminiz bulunmuyor.</p>
            <p className="text-sm mt-1">İşlem eklerken "Bu işlemi tekrarla" seçeneğini kullanabilirsiniz.</p>
          </div>
        ) : (
          recurringTransactions.map((rt) => {
            const category = getCategory(rt.category_id);
            return (
              <div key={rt.id} className={`p-5 rounded-2xl border shadow-sm transition-all ${rt.is_active ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-75'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: `${category?.color || '#cbd5e1'}20`, color: category?.color || '#64748b' }}
                    >
                      <Repeat size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white line-clamp-1">{category?.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{frequencyLabels[rt.frequency]}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleToggleActive(rt)} className="p-1.5 text-slate-400 hover:text-brand-500 transition-colors" title={rt.is_active ? 'Pasife Al' : 'Aktifleştir'}>
                      {rt.is_active ? <CheckCircle2 size={18} className="text-emerald-500" /> : <XCircle size={18} />}
                    </button>
                    <button onClick={() => handleDelete(rt.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1 mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-1">{rt.description || 'Açıklama yok'}</p>
                  <p className="text-xs text-slate-400 flex items-center space-x-1">
                    <span>Son İşlem:</span>
                    <span className="font-medium">{rt.last_processed_date || 'Henüz İşlenmedi'}</span>
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${rt.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'}`}>
                    {rt.type === 'income' ? 'Gelir' : 'Gider'}
                  </span>
                  <span className={`text-lg font-bold ${rt.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                    {rt.type === 'income' ? '+' : '-'}{getCurrencySymbol(user?.currency || 'TRY')}{rt.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Recurring;
