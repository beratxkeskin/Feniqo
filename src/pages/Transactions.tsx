import React, { useState, useMemo } from 'react';
import { Plus, Download, X, FileSpreadsheet } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { Transaction } from '../db/types';
import { TransactionList } from '../components/transactions/TransactionList';
import { TransactionFilters } from '../components/transactions/TransactionFilters';
import type { FilterState } from '../components/transactions/TransactionFilters';
import { TransactionForm } from '../components/forms/TransactionForm';
import { EmptyState } from '../components/common/EmptyState';
import { ImportWizardModal } from '../components/transactions/ImportWizardModal';

const INITIAL_FILTERS: FilterState = {
  search: '',
  type: 'all',
  categoryId: '',
  paymentMethod: '',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
  selectedTag: '',
};

export const Transactions: React.FC = () => {
  const { transactions, categories, currentUserRole } = useData();
  
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [prevFilters, setPrevFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ---------------------------------------------------------------
  // ADVANCED FILTER ENGINE
  // ---------------------------------------------------------------
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Full-Text Search in description, category name, and tags
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().replace('#', '').trim();
        const desc = (tx.description || '').toLowerCase();
        
        // Match category name
        const cat = categories.find(c => c.id === tx.category_id);
        const catName = cat ? cat.name.toLowerCase() : '';
        
        // Match tags
        const hasTagMatch = (tx.tags || []).some(t => t.toLowerCase().includes(query));
        
        if (!desc.includes(query) && !catName.includes(query) && !hasTagMatch) {
          return false;
        }
      }

      // 2. Type Filter (income / expense / all)
      if (filters.type !== 'all' && tx.type !== filters.type) {
        return false;
      }

      // 3. Category Filter
      if (filters.categoryId && tx.category_id !== filters.categoryId) {
        return false;
      }

      // 4. Payment Method
      if (filters.paymentMethod && tx.payment_method !== filters.paymentMethod) {
        return false;
      }

      // 5. Date Range
      if (filters.startDate && tx.transaction_date < filters.startDate) {
        return false;
      }
      if (filters.endDate && tx.transaction_date > filters.endDate) {
        return false;
      }

      // 6. Minimum Amount
      if (filters.minAmount) {
        const min = parseFloat(filters.minAmount);
        if (!isNaN(min) && tx.amount < min) return false;
      }

      // 7. Maximum Amount
      if (filters.maxAmount) {
        const max = parseFloat(filters.maxAmount);
        if (!isNaN(max) && tx.amount > max) return false;
      }

      // 8. Selected Tag Filter
      if (filters.selectedTag && !(tx.tags || []).includes(filters.selectedTag)) {
        return false;
      }

      return true;
    });
  }, [transactions, categories, filters]);

  // Reset page when filters change (Adjusting state during render is a React-approved pattern)
  if (filters !== prevFilters) {
    setPrevFilters(filters);
    setCurrentPage(1);
  }

  // ---------------------------------------------------------------
  // CLIENT PAGINATION
  // ---------------------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleEditClick = (tx: Transaction) => {
    setEditingTx(tx);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingTx(null);
  };

  // ---------------------------------------------------------------
  // CSV EXPORT ENGINE (PORTFOLIO READY WITH UTF-8 BOM)
  // ---------------------------------------------------------------
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = ['Tarih', 'Islem Turu', 'Kategori', 'Aciklama', 'Odeme Yontemi', 'Tutar'];
    const rows = filteredTransactions.map((tx) => {
      const cat = categories.find(c => c.id === tx.category_id);
      return [
        tx.transaction_date,
        tx.type === 'income' ? 'Gelir' : 'Gider',
        cat ? cat.name : 'Diğer',
        tx.description || '',
        tx.payment_method,
        tx.amount.toFixed(2),
      ];
    });

    // \uFEFF creates standard Excel UTF-8 BOM so Turkish characters display correctly!
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MoneyMate_Rapor_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            İşlem Geçmişi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Tüm gelir ve gider kayıtlarınızı görüntüleyin, filtreleyin ve dışa aktarın.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="premium-btn-secondary flex items-center space-x-2 py-2 px-4 text-xs font-semibold disabled:opacity-40"
            title="Mevcut filtrelenmiş listeyi CSV dosyası olarak indirir."
          >
            <Download size={14} />
            <span>CSV Dışa Aktar</span>
          </button>

          {currentUserRole !== 'viewer' && (
            <button
              onClick={() => setIsImportOpen(true)}
              className="premium-btn-secondary flex items-center space-x-2 py-2 px-4 text-xs font-semibold"
              title="Banka ekstre dosyasından işlemleri toplu olarak içe aktarır."
            >
              <FileSpreadsheet size={14} />
              <span>İçeri Aktar</span>
            </button>
          )}
          
          {currentUserRole !== 'viewer' && (
            <button
              onClick={() => { setEditingTx(null); setIsFormOpen(true); }}
              className="premium-btn-primary flex items-center space-x-2 py-2 px-4.5 text-xs font-semibold shadow-md"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Yeni İşlem Ekle</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER PANEL */}
      <TransactionFilters
        filters={filters}
        setFilters={setFilters}
        onClear={handleClearFilters}
      />

      {/* LIST TABLE SECTION */}
      <div className="space-y-4">
        
        {/* Results summary bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span>
            Toplam {filteredTransactions.length} işlem bulundu.
          </span>
          {filteredTransactions.length > itemsPerPage && (
            <span>
              Sayfa {currentPage} / {totalPages}
            </span>
          )}
        </div>

        {paginatedTransactions.length > 0 ? (
          <div className="space-y-5">
            <TransactionList
              transactions={paginatedTransactions}
              onEdit={handleEditClick}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 pt-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  Önceki
                </button>
                {[...Array(totalPages)].map((_, index) => {
                  const pNum = index + 1;
                  const isCurrent = currentPage === pNum;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-brand-600 text-white shadow-md'
                          : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  Sonraki
                </button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            iconName="Search"
            title="Sonuç Bulunamadı"
            description="Seçtiğiniz filtreleme kriterlerine uygun herhangi bir finansal işlem kaydı bulunamadı. Filtreleri temizlemeyi deneyebilirsiniz."
            actionText="Filtreleri Sıfırla"
            onAction={handleClearFilters}
          />
        )}
      </div>

      {/* ADD/EDIT MODAL OVERLAY */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingTx ? 'İşlemi Düzenle' : 'Yeni Gelir / Gider İşlemi Ekle'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <TransactionForm
              transactionToEdit={editingTx}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </div>
      )}

      {/* IMPORT MODAL OVERLAY */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsImportOpen(false)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-5 shrink-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileSpreadsheet className="w-5 h-5 text-brand-500" />
                <span>Banka Ekstresi İçe Aktar (CSV)</span>
              </h3>
              <button 
                onClick={() => setIsImportOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <ImportWizardModal
              onClose={() => setIsImportOpen(false)}
              onSuccess={() => {
                setIsImportOpen(false);
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default Transactions;
