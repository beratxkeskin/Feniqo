import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useData } from '../context/DataContext';
import type { Category } from '../db/types';
import { CategoryForm } from '../components/forms/CategoryForm';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const Categories: React.FC = () => {
  const { categories, deleteCategory } = useData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  
  const [errorNotice, setErrorNotice] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // 1. Split categories into System Defaults vs User Customs
  const defaultCategories = categories.filter(c => c.is_default || c.user_id === null);
  const customCategories = categories.filter(c => !c.is_default && c.user_id !== null);

  const handleDeleteConfirm = async () => {
    if (!catToDelete) return;
    
    setErrorNotice('');
    setSuccessNotice('');

    const res = await deleteCategory(catToDelete.id);
    
    if (res.success) {
      setSuccessNotice('Kategori başarıyla silindi.');
      setTimeout(() => setSuccessNotice(''), 3000);
    } else {
      setErrorNotice(res.error || 'Kategori silinemedi.');
      setTimeout(() => setErrorNotice(''), 5000);
    }
    setCatToDelete(null);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSuccessNotice('Yeni kategori başarıyla oluşturuldu.');
    setTimeout(() => setSuccessNotice(''), 3000);
  };

  const renderCategoryGrid = (list: Category[], isSystem: boolean) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {list.map((cat) => {
          const IconComp = Icons[cat.icon as keyof typeof Icons] as React.ComponentType<any>;
          
          return (
            <div 
              key={cat.id} 
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center justify-between group hover:shadow-md transition-all"
            >
              <div className="flex items-center space-x-3.5">
                {/* Icon Box */}
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: cat.color }}
                >
                  {IconComp ? <IconComp size={18} /> : <Icons.HelpCircle size={18} />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                    {cat.name}
                  </h4>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block uppercase tracking-wider ${
                    cat.type === 'income' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                  }`}>
                    {cat.type === 'income' ? 'Gelir' : 'Gider'}
                  </span>
                </div>
              </div>

              {/* Action buttons (Only for user-created custom categories) */}
              {!isSystem ? (
                <button
                  onClick={() => setCatToDelete(cat)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                  title="Kategoriyi Sil"
                >
                  <Icons.Trash2 size={15} />
                </button>
              ) : (
                <span className="text-[10px] text-slate-300 dark:text-slate-700 p-2" title="Sistem kategorileri silinemez.">
                  <Icons.Lock size={12} />
                </span>
              )}

            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Kategori Yönetimi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Gelir ve gider işlemleriniz için varsayılan kategorileri inceleyin veya yenilerini tanımlayın.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="premium-btn-primary flex items-center space-x-2 py-2 px-4.5 text-xs font-semibold shadow-md whitespace-nowrap"
        >
          <Icons.Plus size={14} strokeWidth={2.5} />
          <span>Özel Kategori Ekle</span>
        </button>
      </div>

      {/* Notices */}
      {errorNotice && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          {errorNotice}
        </div>
      )}
      {successNotice && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          {successNotice}
        </div>
      )}

      {/* CUSTOM USER CATEGORIES SECTION */}
      <div className="space-y-3.5">
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2">
          <span>Özel Kategorileriniz</span>
          <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 dark:bg-brand-500/20 px-2 py-0.5 rounded-full">
            {customCategories.length}
          </span>
        </h3>
        {customCategories.length > 0 ? (
          renderCategoryGrid(customCategories, false)
        ) : (
          <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold py-8 bg-slate-50/50 dark:bg-slate-900/20">
            Kendi özel kategorinizi oluşturarak harcamalarınızı daha detaylı sınıflandırabilirsiniz.
          </div>
        )}
      </div>

      {/* SYSTEM DEFAULT CATEGORIES SECTION */}
      <div className="space-y-3.5 pt-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2">
          <span>Varsayılan Sistem Kategorileri</span>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {defaultCategories.length}
          </span>
        </h3>
        {renderCategoryGrid(defaultCategories, true)}
      </div>

      {/* ADD CATEGORY MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Özel Kategori Ekle</h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <Icons.X size={18} />
              </button>
            </div>
            <CategoryForm onSuccess={handleFormSuccess} onCancel={() => setIsFormOpen(false)} />
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={catToDelete !== null}
        title="Kategori Silinsin mi?"
        message={`"${catToDelete?.name}" kategorisini kalıcı olarak silmek istediğinizden emin misiniz? Sistem bu kategoriyle ilişkili bir işlem olup olmadığını doğrulayacaktır.`}
        confirmText="Kategoriyi Sil"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCatToDelete(null)}
        isDangerous={true}
      />

    </div>
  );
};

export default Categories;
