import React, { useState, useRef, useMemo } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Loader2, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  ArrowUpDown,
  Calendar,
  FileText
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { parseCSV } from '../../utils/csvParser';
import { suggestCategory } from '../../utils/importCategorizer';
import { getCurrencySymbol } from '../../utils/formatters';
import { cleanDescription } from '../../utils/descriptionCleanser';

interface ImportWizardModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedTx {
  id: string;
  originalDate: string;
  originalAmount: string;
  normalizedDate: string;
  normalizedAmount: number;
  description: string;
  originalDescription: string;
  type: 'income' | 'expense';
  categoryId: string;
  selected: boolean;
  isDuplicate?: boolean;
}

export const ImportWizardModal: React.FC<ImportWizardModalProps> = ({ onClose, onSuccess }) => {
  const { categories, addTransaction, transactions } = useData();
  const { user } = useAuth();
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: string[][] }>({ headers: [], rows: [] });
  const [errorMsg, setErrorMsg] = useState('');
  
  // Mapping States
  const [dateColumn, setDateColumn] = useState('');
  const [descColumn, setDescColumn] = useState('');
  const [amountColumn, setAmountColumn] = useState('');
  const [amountTypeRule, setAmountTypeRule] = useState<'sign' | 'force_expense' | 'force_income'>('sign');
  
  // Review States
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTx[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  // Tab & Clipboard States (For Excel/HTML statement pasting)
  const [uploadTab, setUploadTab] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEn = user?.lang === 'en';

  // Drag and Drop State
  const [isDragActive, setIsDragActive] = useState(false);

  // -----------------------------------------------------------------
  // HELPERS: Normalization
  // -----------------------------------------------------------------
  const parseAndNormalizeDate = (dateStr: string): string | null => {
    const clean = dateStr.trim();
    if (!clean) return null;
    
    // 1. DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
    const dmyRegex = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/;
    const dmyMatch = clean.match(dmyRegex);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // 2. YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
    const ymdRegex = /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/;
    const ymdMatch = clean.match(ymdRegex);
    if (ymdMatch) {
      const [, year, month, day] = ymdMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // 3. Fallback
    try {
      const d = new Date(clean);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (_) {}
    
    return null;
  };

  const parseNormalizedAmount = (amountStr: string): number => {
    // Boşlukları ve para birimi sembollerini temizle
    let clean = amountStr.replace(/[^\d.,-]/g, '').trim();
    if (!clean) return 0;
    
    // 1. Hem nokta hem de virgül varsa (örn: 1.250,50 veya 1,250.50)
    if (clean.includes('.') && clean.includes(',')) {
      if (clean.indexOf(',') > clean.indexOf('.')) {
        // Türkçe: 1.250,50 -> 1250.50 (Noktayı sil, virgülü nokta yap)
        clean = clean.replace(/\./g, '').replace(/,/g, '.');
      } else {
        // İngilizce: 1,250.50 -> 1250.50 (Virgülü sil)
        clean = clean.replace(/,/g, '');
      }
    } 
    // 2. Sadece virgül varsa (örn: 1,000 veya 150,50 veya 69,9)
    else if (clean.includes(',')) {
      const parts = clean.split(',');
      if (parts[1] && parts[1].length === 3) {
        // Virgülün sağında tam olarak 3 basamak var -> Binlik ayıraçtır (örn: 1,000 -> 1000)
        clean = clean.replace(/,/g, '');
      } else {
        // Virgülün sağında 1 veya 2 basamak var -> Ondalık ayıraçtır (örn: 150,50 -> 150.50)
        clean = clean.replace(/,/g, '.');
      }
    }
    // 3. Sadece nokta varsa (örn: 1.215 veya 150.50)
    else if (clean.includes('.')) {
      const parts = clean.split('.');
      if (parts[1] && parts[1].length === 3 && parts[0].length >= 1 && parts[0].length <= 3) {
        // Noktanın sağında tam olarak 3 basamak var -> Binlik ayıraçtır (örn: 1.215 -> 1215)
        clean = clean.replace(/\./g, '');
      }
    }

    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
  };

  // -----------------------------------------------------------------
  // STEP 1: Handlers
  // -----------------------------------------------------------------
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    setErrorMsg('');
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'txt') {
      setErrorMsg(isEn ? 'Please upload only .csv or .txt files.' : 'Lütfen sadece .csv veya .txt uzantılı dosyalar yükleyin.');
      return;
    }

    setFile(selectedFile);
    
    const reader = new FileReader();
    
    const handleParsedText = (textData: string) => {
      const parsed = parseCSV(textData);
      
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setErrorMsg(isEn ? 'The file is empty or formatted incorrectly.' : 'Yüklenen dosya boş veya geçersiz formatta.');
        setFile(null);
        return;
      }
      
      setCsvData(parsed);
      autoMapColumns(parsed.headers);
      setStep(2);
    };

    reader.onload = (event) => {
      const text = event.target?.result as string;
      
      // Akıllı Kodlama Tespiti (Smart Encoding Detection):
      // Eğer UTF-8 olarak okunduğunda geçersiz karakter simgesi ( - \uFFFD) oluşmuşsa,
      // dosya büyük olasılıkla Türkçe ANSI (Windows-1254 / ISO-8859-9) formatındadır.
      if (text.includes('\uFFFD')) {
        const trReader = new FileReader();
        trReader.onload = (trEvent) => {
          const trText = trEvent.target?.result as string;
          handleParsedText(trText);
        };
        trReader.onerror = () => {
          setErrorMsg(isEn ? 'Failed to read the file.' : 'Dosya okunurken bir hata oluştu.');
          setFile(null);
        };
        trReader.readAsText(selectedFile, 'windows-1254');
      } else {
        handleParsedText(text);
      }
    };

    reader.onerror = () => {
      setErrorMsg(isEn ? 'Failed to read the file.' : 'Dosya okunurken bir hata oluştu.');
      setFile(null);
    };

    reader.readAsText(selectedFile, 'UTF-8');
  };

  const handlePasteSubmit = () => {
    setErrorMsg('');
    if (!pastedText.trim()) {
      setErrorMsg(isEn ? 'Please paste some statement data first.' : 'Lütfen önce panodan kopyaladığınız ekstre verisini yapıştırın.');
      return;
    }

    const parsed = parseCSV(pastedText);
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      setErrorMsg(isEn ? 'Could not parse data. Ensure it has rows and columns separated by Tab or Semicolon.' : 'Veriler ayrıştırılamadı. Sekme (tab), virgül veya noktalı virgül ile ayrılmış satırlar olduğundan emin olun.');
      return;
    }

    setFile(new File(['pasted-data'], 'Kopyalanan_Veri.txt', { type: 'text/plain' }));
    setCsvData(parsed);
    autoMapColumns(parsed.headers);
    setStep(2);
  };

  // -----------------------------------------------------------------
  // STEP 2: Auto Column Mapping Engine
  // -----------------------------------------------------------------
  const autoMapColumns = (headers: string[]) => {
    const dateKeywords = ['tarih', 'date', 'zaman', 'time', 'gün', 'gun'];
    const descKeywords = ['açıklama', 'aciklama', 'detay', 'description', 'detail', 'tanım', 'concept', 'alici', 'alıcı', 'gönderen'];
    const amountKeywords = ['tutar', 'miktar', 'tutar(tl)', 'bakiye', 'amount', 'value', 'price', 'fiyat', 'işlem tutarı'];

    let dateMatch = '';
    let descMatch = '';
    let amountMatch = '';

    headers.forEach(h => {
      const hLower = h.toLowerCase();
      
      if (!dateMatch && dateKeywords.some(kw => hLower.includes(kw))) dateMatch = h;
      if (!descMatch && descKeywords.some(kw => hLower.includes(kw))) descMatch = h;
      if (!amountMatch && amountKeywords.some(kw => hLower.includes(kw))) amountMatch = h;
    });

    // Fallbacks if no match
    setDateColumn(dateMatch || headers[0] || '');
    setDescColumn(descMatch || headers[1] || headers[0] || '');
    setAmountColumn(amountMatch || headers[2] || headers[0] || '');
  };

  const handleApplyMapping = () => {
    setErrorMsg('');
    if (!dateColumn || !descColumn || !amountColumn) {
      setErrorMsg(isEn ? 'Please map all required columns.' : 'Lütfen zorunlu tüm kolonları eşleştirin.');
      return;
    }

    const dateIdx = csvData.headers.indexOf(dateColumn);
    const descIdx = csvData.headers.indexOf(descColumn);
    const amountIdx = csvData.headers.indexOf(amountColumn);

    const transactionsToReview = csvData.rows
      .map((row, idx) => {
        const rawDate = row[dateIdx] || '';
        const rawDesc = row[descIdx] || '';
        const rawAmount = row[amountIdx] || '0';

        const normDate = parseAndNormalizeDate(rawDate);
        // Eğer satırda geçerli bir tarih yoksa (Banka logosu, Hesap No, Alt Toplam vb. satırları), bu satırı tamamen es geç.
        if (!normDate) return null;

        const normAmt = parseNormalizedAmount(rawAmount);

        // Determine Transaction Type
        let type: 'income' | 'expense' = 'expense';
        if (amountTypeRule === 'force_income') {
          type = 'income';
        } else if (amountTypeRule === 'force_expense') {
          type = 'expense';
        } else {
          // Sign-based: if amount is negative, or if description indicates expense
          type = normAmt < 0 ? 'expense' : 'income';
        }

        const positiveAmount = Math.abs(normAmt);

        // Sadeleştirilmiş temiz açıklama elde et
        const cleanDesc = cleanDescription(rawDesc);

        // Suggest category using the cleaned description
        const suggestedCat = suggestCategory(cleanDesc, type);

        // Akıllı Çift İşlem Algılama (Smart Deduplication):
        // Veritabanında aynı Tarih, Tutar, Tür ve benzer bir açıklama içeren bir işlem var mı kontrol et.
        const isDuplicate = transactions.some(existing => {
          const existingDescClean = (existing.description || '').replace(' (İçe Aktarılan)', '').trim().toLowerCase();
          const rawDescClean = cleanDesc.trim().toLowerCase();
          const originalDescClean = rawDesc.trim().toLowerCase();
          
          return (
            existing.transaction_date === normDate &&
            existing.amount === positiveAmount &&
            existing.type === type &&
            (existingDescClean.includes(rawDescClean) || 
             rawDescClean.includes(existingDescClean) ||
             existingDescClean.includes(originalDescClean) ||
             originalDescClean.includes(existingDescClean))
          );
        });

        return {
          id: `parsed-${idx}-${Date.now()}`,
          originalDate: rawDate,
          originalAmount: rawAmount,
          normalizedDate: normDate,
          normalizedAmount: positiveAmount,
          description: cleanDesc,
          originalDescription: rawDesc || (type === 'income' ? 'Gelen Havale' : 'Diğer Gider'),
          type,
          categoryId: suggestedCat,
          selected: !isDuplicate && positiveAmount > 0, // Çift kayıt ise varsayılan olarak seçimi kaldır
          isDuplicate
        };
      })
      .filter(tx => tx !== null) as ParsedTx[];

    setParsedTransactions(transactionsToReview);
    setStep(3);
  };

  // -----------------------------------------------------------------
  // STEP 3: Review & Inline Actions
  // -----------------------------------------------------------------
  const handleToggleSelectAll = (checked: boolean) => {
    setParsedTransactions(prev => prev.map(tx => ({ ...tx, selected: checked })));
  };

  const handleToggleSelectOne = (id: string) => {
    setParsedTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, selected: !tx.selected } : tx));
  };

  const handleUpdateCategory = (id: string, catId: string) => {
    setParsedTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, categoryId: catId } : tx));
  };

  const handleUpdateType = (id: string, type: 'income' | 'expense') => {
    setParsedTransactions(prev => {
      return prev.map(tx => {
        if (tx.id === id) {
          // Re-suggest category if type changes
          const suggested = suggestCategory(tx.description, type);
          return { ...tx, type, categoryId: suggested };
        }
        return tx;
      });
    });
  };

  const handleBulkImport = async () => {
    const selectedTxs = parsedTransactions.filter(tx => tx.selected);
    if (selectedTxs.length === 0) {
      setErrorMsg(isEn ? 'Please select at least one transaction to import.' : 'Lütfen içe aktarmak için en az bir işlem seçin.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    let imported = 0;

    try {
      for (const tx of selectedTxs) {
        const res = await addTransaction({
          amount: tx.normalizedAmount,
          type: tx.type,
          category_id: tx.categoryId,
          transaction_date: tx.normalizedDate,
          description: `${tx.description} (İçe Aktarılan)`,
          payment_method: tx.type === 'expense' ? 'Banka Kartı' : 'Havale/EFT',
          receipt_url: null
        });
        if (res.success) {
          imported++;
        }
      }

      setSuccessCount(imported);
      setStep(4);
    } catch (err: any) {
      setErrorMsg(err.message || (isEn ? 'Bulk import failed.' : 'Toplu kayıt sırasında hata oluştu.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // -----------------------------------------------------------------
  // MEMOS
  // -----------------------------------------------------------------
  const allSelected = useMemo(() => {
    return parsedTransactions.length > 0 && parsedTransactions.every(tx => tx.selected);
  }, [parsedTransactions]);

  const someSelected = useMemo(() => {
    return parsedTransactions.some(tx => tx.selected) && !allSelected;
  }, [parsedTransactions, allSelected]);

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      
      {/* Step Indicators */}
      <div className="flex items-center justify-between px-1 mb-6 border-b border-slate-100 dark:border-slate-800/50 pb-4 shrink-0">
        {[
          { label: isEn ? 'Upload' : 'Dosya Yükle', active: step >= 1 },
          { label: isEn ? 'Mapping' : 'Kolon Eşleme', active: step >= 2 },
          { label: isEn ? 'Review' : 'Önizleme & Onay', active: step >= 3 },
          { label: isEn ? 'Complete' : 'Tamamlandı', active: step >= 4 }
        ].map((s, idx) => (
          <React.Fragment key={idx}>
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center transition-all ${
                step === idx + 1
                  ? 'bg-brand-600 text-white scale-110 shadow-sm ring-4 ring-brand-500/10'
                  : s.active
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
              }`}>
                {s.active && step > idx + 1 ? <Check size={10} strokeWidth={3} /> : idx + 1}
              </span>
              <span className={`text-[10px] font-extrabold uppercase tracking-wider hidden sm:inline ${
                step === idx + 1
                  ? 'text-brand-600 dark:text-brand-400 font-black'
                  : s.active
                  ? 'text-slate-800 dark:text-slate-200'
                  : 'text-slate-400 dark:text-slate-500'
              }`}>
                {s.label}
              </span>
            </div>
            {idx < 3 && (
              <ChevronRight className={`w-4 h-4 ${step > idx + 1 ? 'text-emerald-500' : 'text-slate-200 dark:text-slate-800'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Errors */}
      {errorMsg && (
        <div className="p-3.5 mb-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-2xl border border-rose-100 dark:border-rose-900/40 flex items-start space-x-2 animate-shake shrink-0">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SCROLLABLE MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 select-none">
        
        {/* STEP 1: UPLOAD & PASTE AREA */}
        {step === 1 && (
          <div className="space-y-5 py-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            
            {/* Tab Selector */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl max-w-sm">
              <button
                type="button"
                onClick={() => setUploadTab('file')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  uploadTab === 'file'
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <span>📁 {isEn ? 'Upload CSV File' : 'Dosya Yükle (.csv)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadTab('paste')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  uploadTab === 'paste'
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <span>📋 {isEn ? 'Copy-Paste Excel' : 'Kopyala-Yapıştır (Excel)'}</span>
              </button>
            </div>

            {uploadTab === 'file' ? (
              <div className="space-y-4">
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-4 group ${
                    isDragActive 
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/10' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-brand-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept=".csv,.txt" 
                    className="hidden" 
                  />
                  <div className="p-4 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-2xl group-hover:scale-110 transition-transform">
                    <UploadCloud size={32} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                      {isEn ? 'Drag & drop bank statement file here' : 'Banka hesap ekstrenizi buraya sürükleyin'}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
                      {isEn ? 'Supports .csv and .txt formats' : 'Sadece .csv veya .txt formatlarını destekler'}
                    </p>
                  </div>
                  <button 
                    type="button" 
                    className="premium-btn-secondary text-xs py-2 px-4 shadow-sm"
                  >
                    {isEn ? 'Browse Files' : 'Dosya Seçin'}
                  </button>
                </div>

                {/* Bank doesn't support CSV Helper card */}
                <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/20 rounded-2xl flex items-start space-x-3">
                  <div className="p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 mt-0.5">
                    <HelpCircle size={15} />
                  </div>
                  <div className="text-left">
                    <h5 className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                      {isEn ? "Can't download as CSV from your bank?" : "Bankanızdan CSV olarak indiremiyor musunuz?"}
                    </h5>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-semibold mt-1 leading-relaxed">
                      {isEn ? (
                        <>
                          No worries! If your bank only exports as .xlsx (Excel) or HTML, click the{" "}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadTab('paste');
                            }}
                            className="underline cursor-pointer text-amber-600 dark:text-amber-400 font-black hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                          >
                            'Copy-Paste Excel'
                          </button>{" "}
                          tab above. You can open your Excel file, copy the rows, and paste them here directly!
                        </>
                      ) : (
                        <>
                          Sorun değil! Ziraat Bankası gibi kurumlar bazen sadece .xlsx (Excel) veya HTML formatında ekstre indirmenize izin verir. Yukarıdaki{" "}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadTab('paste');
                            }}
                            className="underline cursor-pointer text-amber-600 dark:text-amber-400 font-black hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                          >
                            'Kopyala-Yapıştır (Excel)'
                          </button>{" "}
                          sekmesine tıklayıp Excel veya web sayfasındaki satırları seçip kopyalayarak buraya doğrudan yapıştırabilirsiniz!
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
                    {isEn ? 'PASTE COPIED SPREADSHEET ROWS' : 'EXCEL/HTML TABLO SATIRLARINI YAPIŞTIRIN'}
                  </label>
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={
                      isEn 
                        ? "1. Open your .xlsx or HTML statement in Excel / Browser.\n2. Select all statement rows (Ctrl+A) and Copy (Ctrl+C).\n3. Paste (Ctrl+V) directly in this box!\n\nDate\tDescription\tAmount\n25.05.2026\tStarbucks\t-120.00\n24.05.2026\tNetflix\t-229.99"
                        : "1. İndirdiğiniz .xlsx Excel tablosunu veya HTML ekstresini açın.\n2. Tüm tabloyu veya sadece hareket satırlarını seçip kopyalayın (Ctrl+C).\n3. Buraya gelip doğrudan yapıştırın (Ctrl+V)!\n\nTarih\tAçıklama\tTutar\n25.05.2026\tStarbucks\t-120.00\n24.05.2026\tNetflix\t-229.99"
                    }
                    rows={8}
                    className="premium-input font-mono text-xs p-3.5 bg-white dark:bg-slate-900 shadow-inner select-text border border-slate-200 dark:border-slate-800 focus:ring-brand-500 resize-none h-[180px] rounded-2xl"
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePasteSubmit}
                  className="premium-btn-primary py-2.5 px-5 text-xs font-bold shadow-md shadow-brand-500/10 flex items-center space-x-1.5"
                >
                  <Check size={14} strokeWidth={2.5} />
                  <span>{isEn ? 'Parse Pasted Data' : 'Yapıştırılan Veriyi Ayrıştır'}</span>
                </button>
              </div>
            )}

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">💡 {isEn ? 'GDPR / KVKK Safety & Offline-First Privacy' : '🔒 %100 Çevrimdışı KVKK Güvencesi & Veri Gizliliği'}</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {isEn 
                  ? 'All statement parsing happens 100% inside your browser memory. Your sensitive files, IBANs, and account numbers are NEVER sent to a server. MoneyMate strictly ignores sensitive headers like IBAN or Name, extracting only the financial transaction columns you map.'
                  : 'Yüklediğiniz dosyalar veya yapıştırdığınız metinler hiçbir uzak sunucuya gönderilmez. Tüm ayrıştırma işlemi tarayıcınızın belleğinde %100 yerel (offline) olarak yapılır. Hesap Numarası, IBAN veya Ad/Soyad gibi kişisel verileriniz asla kaydedilmez; sistem sadece eşlediğiniz işlem tutarı, tarih ve açıklama alanlarını çekip geri kalan hassas verileri anında hafızadan siler.'
                }
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {step === 2 && (
          <div className="space-y-5 py-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center space-x-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30">
              <FileSpreadsheet className="w-5 h-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{file?.name}</p>
                <p className="text-[10px] opacity-80 font-semibold">{csvData.rows.length} {isEn ? 'rows found' : 'satır veri algılandı'}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200/60 dark:border-slate-800 space-y-4 shadow-inner">
              <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest pl-1 block">
                {isEn ? 'MAP COLUMNS' : 'KOLON EŞLEŞTİRME YAPILANDIRMASI'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Date Column */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 flex items-center space-x-1">
                    <Calendar size={10} />
                    <span>{isEn ? 'Date Column *' : 'Tarih Kolonu *'}</span>
                  </label>
                  <select
                    value={dateColumn}
                    onChange={(e) => setDateColumn(e.target.value)}
                    className="premium-input text-xs py-2 px-3 cursor-pointer bg-white dark:bg-slate-900 shadow-sm"
                  >
                    <option value="">-- {isEn ? 'Select' : 'Seçiniz'} --</option>
                    {csvData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Description Column */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 flex items-center space-x-1">
                    <FileText size={10} />
                    <span>{isEn ? 'Description *' : 'Açıklama *'}</span>
                  </label>
                  <select
                    value={descColumn}
                    onChange={(e) => setDescColumn(e.target.value)}
                    className="premium-input text-xs py-2 px-3 cursor-pointer bg-white dark:bg-slate-900 shadow-sm"
                  >
                    <option value="">-- {isEn ? 'Select' : 'Seçiniz'} --</option>
                    {csvData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Amount Column */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 flex items-center space-x-1">
                    <ArrowUpDown size={10} />
                    <span>{isEn ? 'Amount *' : 'Tutar *'}</span>
                  </label>
                  <select
                    value={amountColumn}
                    onChange={(e) => setAmountColumn(e.target.value)}
                    className="premium-input text-xs py-2 px-3 cursor-pointer bg-white dark:bg-slate-900 shadow-sm"
                  >
                    <option value="">-- {isEn ? 'Select' : 'Seçiniz'} --</option>
                    {csvData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Amount Type Options */}
            <div className="space-y-2.5">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
                {isEn ? 'TRANSACTION TYPE DETECTION RULE' : 'İŞLEM TÜRÜ BELİRLEME KURALI'}
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { 
                    id: 'sign', 
                    title: isEn ? 'By Numeric Sign' : 'Sayısal İşarete Göre',
                    desc: isEn ? 'Negative values are expenses (-), positive are income (+)' : 'Tutar eksi ise (-) Gider, artı ise (+) Gelir olarak ayrışır.'
                  },
                  { 
                    id: 'force_expense', 
                    title: isEn ? 'Force All Expenses' : 'Tümünü Gider Yap',
                    desc: isEn ? 'Map all records inside the file as Expenses' : 'Dosyadaki tüm işlemleri Gider olarak içeri aktarır.'
                  },
                  { 
                    id: 'force_income', 
                    title: isEn ? 'Force All Income' : 'Tümünü Gelir Yap',
                    desc: isEn ? 'Map all records inside the file as Income' : 'Dosyadaki tüm işlemleri Gelir olarak içeri aktarır.'
                  }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAmountTypeRule(opt.id as any)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      amountTypeRule === opt.id
                        ? 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-500 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/10'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <span className="text-xs font-bold block">{opt.title}</span>
                    <span className="text-[10px] opacity-75 font-medium leading-relaxed mt-1 block">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & REVIEW GRID */}
        {step === 3 && (
          <div className="space-y-4 py-2 animate-in fade-in duration-200 flex flex-col h-full min-h-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 pb-1">
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  {isEn ? 'STATEMENT PREVIEW & AUDIT' : 'EKSTRE ÖNİZLEME VE DÜZENLEME'}
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                  {parsedTransactions.filter(tx => tx.selected).length} / {parsedTransactions.length} {isEn ? 'transactions selected for import' : 'işlem içe aktarılmak üzere seçildi.'}
                </p>
              </div>
              
              <div className="flex items-center space-x-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl border border-brand-500/10 shrink-0">
                <Sparkles size={11} className="animate-pulse" />
                <span>{isEn ? 'AI Categorized' : 'AI Kategorilendirildi'}</span>
              </div>
            </div>

            {/* PREVIEW TABLE CONTAINER */}
            <div className="flex-1 min-h-[30vh] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 scrollbar-thin">
              <table className="w-full text-left border-collapse select-none">
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={el => {
                          if (el) el.indeterminate = someSelected;
                        }}
                        onChange={(e) => handleToggleSelectAll(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="p-3 w-28">{isEn ? 'Date' : 'Tarih'}</th>
                    <th className="p-3 min-w-[150px]">{isEn ? 'Description' : 'Açıklama'}</th>
                    <th className="p-3 w-24 text-center">{isEn ? 'Type' : 'Tür'}</th>
                    <th className="p-3 w-40">{isEn ? 'Category' : 'Kategori'}</th>
                    <th className="p-3 w-28 text-right">{isEn ? 'Amount' : 'Tutar'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {parsedTransactions.map((tx) => {
                    const matchedCat = categories.find(c => c.id === tx.categoryId);
                    const CatIcon = matchedCat ? (Icons as any)[matchedCat.icon || 'HelpCircle'] : HelpCircle;
                    
                    return (
                      <tr 
                        key={tx.id} 
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${
                          !tx.selected ? 'opacity-40 bg-slate-50/20 dark:bg-slate-800/5' : ''
                        }`}
                      >
                        {/* Selector checkbox */}
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={tx.selected}
                            onChange={() => handleToggleSelectOne(tx.id)}
                            className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>

                        {/* Date */}
                        <td className="p-3 font-medium text-slate-500 whitespace-nowrap">{tx.normalizedDate}</td>

                        {/* Description */}
                        <td className="p-3 font-semibold max-w-[280px]" title={tx.originalDescription}>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center flex-wrap gap-1.5">
                              <span className="truncate text-slate-800 dark:text-slate-200 font-bold">{tx.description}</span>
                              {tx.isDuplicate && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-black bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 shrink-0 leading-none animate-pulse">
                                  {isEn ? 'Duplicate?' : 'Zaten Kayıtlı ⚠️'}
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate block mt-0.5 max-w-[260px]">
                              {tx.originalDescription}
                            </span>
                          </div>
                        </td>

                        {/* Type Selector (Gider / Gelir) */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleUpdateType(tx.id, tx.type === 'expense' ? 'income' : 'expense')}
                            className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${
                              tx.type === 'expense'
                                ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30'
                                : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                            }`}
                          >
                            {tx.type === 'expense' ? (isEn ? 'Expense' : 'Gider') : (isEn ? 'Income' : 'Gelir')}
                          </button>
                        </td>

                        {/* Category Dropdown */}
                        <td className="p-3">
                          <div className="flex items-center space-x-1.5">
                            {matchedCat && (
                              <span 
                                className="w-4 h-4 rounded-md flex items-center justify-center text-[10px] text-white shrink-0" 
                                style={{ backgroundColor: matchedCat.color }}
                              >
                                <CatIcon className="w-2.5 h-2.5" />
                              </span>
                            )}
                            <select
                              value={tx.categoryId}
                              onChange={(e) => handleUpdateCategory(tx.id, e.target.value)}
                              className="bg-transparent border-0 font-semibold p-0 text-xs text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer max-w-[120px] focus:underline"
                            >
                              {categories
                                .filter(c => c.type === tx.type)
                                .map(c => <option key={c.id} value={c.id} className="dark:bg-slate-900">{c.name}</option>)
                              }
                            </select>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className={`p-3 text-right font-black whitespace-nowrap ${
                          tx.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {tx.type === 'expense' ? '-' : '+'}
                          {tx.normalizedAmount.toFixed(2)}
                          <span className="text-[10px] opacity-75 font-bold ml-0.5">
                            {getCurrencySymbol(user?.currency || 'TRY')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS SUMMARY */}
        {step === 4 && (
          <div className="py-10 text-center space-y-5 animate-in zoom-in-95 duration-300 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center text-3xl shadow-sm ring-8 ring-emerald-500/5 animate-bounce">
              ✓
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">
                {isEn ? 'Import Complete!' : 'İçe Aktarma Tamamlandı!'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2.5 max-w-sm mx-auto leading-relaxed">
                {isEn 
                  ? `Successfully imported ${successCount} transactions into your workspace database. Your charts and budgets are updated.`
                  : `Tebrikler! ${successCount} adet finansal işlem kaydı başarıyla çalışma alanınıza aktarıldı. Bütçe limitleriniz ve analizleriniz güncellendi.`
                }
              </p>
            </div>
          </div>
        )}

      </div>

      {/* MODAL ACTION BAR */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-4.5 mt-5 shrink-0">
        
        {/* Left Side: Back / Cancel Button */}
        {step > 1 && step < 4 ? (
          <button
            type="button"
            onClick={() => setStep(prev => (prev - 1) as any)}
            disabled={isSubmitting}
            className="premium-btn-secondary flex items-center space-x-1.5 py-2.5 px-4.5 text-xs font-semibold disabled:opacity-40"
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
            <span>{isEn ? 'Back' : 'Geri'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="premium-btn-secondary py-2.5 px-4.5 text-xs font-semibold"
          >
            {step === 4 ? (isEn ? 'Close' : 'Kapat') : (isEn ? 'Cancel' : 'Vazgeç')}
          </button>
        )}

        {/* Right Side: Next / Import Buttons */}
        {step < 3 && (
          <button
            type="button"
            onClick={step === 2 ? handleApplyMapping : () => {}}
            disabled={step === 1 && !file}
            className="premium-btn-primary flex items-center space-x-1.5 py-2.5 px-4.5 text-xs font-semibold shadow-md disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>{isEn ? 'Next' : 'Devam Et'}</span>
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        )}

        {step === 3 && (
          <button
            type="button"
            onClick={handleBulkImport}
            disabled={isSubmitting}
            className="premium-btn-primary bg-brand-600 hover:bg-brand-700 text-white flex items-center space-x-1.5 py-2.5 px-5 text-xs font-bold shadow-md shadow-brand-500/20 disabled:opacity-40"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{isEn ? 'Importing...' : 'Aktarılıyor...'}</span>
              </>
            ) : (
              <>
                <Check size={14} strokeWidth={2.5} />
                <span>{isEn ? 'Confirm & Import' : 'Onayla ve İçe Aktar'}</span>
              </>
            )}
          </button>
        )}

        {step === 4 && (
          <button
            type="button"
            onClick={onSuccess}
            className="premium-btn-primary py-2.5 px-6 text-xs font-bold shadow-md shadow-brand-500/10"
          >
            <span>{isEn ? 'Done' : 'Harika!'}</span>
          </button>
        )}

      </div>

    </div>
  );
};

export default ImportWizardModal;
