import React, { useState, useMemo } from 'react';
import { Settings as SettingsIcon, Shield, Trash2, Moon, Sun, DollarSign, Lightbulb, RefreshCw, Briefcase, X, Zap, Clock, Database, Download, Upload, CheckCircle2, AlertTriangle, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { formatCurrency } from '../utils/formatters';
import { CustomSelect } from '../components/common/CustomSelect';
import { usePWA } from '../utils/pwaStore';
import { OpenBankingPanel } from '../components/banking/OpenBankingPanel';

const translations = {
  tr: {
    title: 'Sistem Ayarları',
    subtitle: 'Hesap tercihlerinizi, para birimini, temayı düzenleyin ve finans analizlerinizi yönetin.',
    currencyUpdated: 'Para birimi tercihi başarıyla güncellendi.',
    themeUpdated: 'Tema tercihi başarıyla güncellendi.',
    langUpdated: 'Dil tercihi başarıyla güncellendi.',
    colorThemeLabel: 'Renk Vurgusu (Tema)',
    colorThemeUpdated: 'Renk teması tercihi başarıyla güncellendi.',
    resetSuccess: 'Tüm veriler başarıyla sıfırlandı ve demo mod şablonu yüklendi.',
    generalPrefs: 'Görünüm ve Tercihler',
    defaultCurrency: 'Varsayılan Para Birimi',
    appTheme: 'Uygulama Teması',
    lightTheme: 'Açık Tema',
    darkTheme: 'Karanlık Tema',
    systemTheme: 'Sistem',
    appLanguage: 'Uygulama Dili / Language',
    turkish: 'Türkçe (TR)',
    english: 'English (EN)',
    aiCoachTitle: 'Feniqo Akıllı Finans Analisti',
    aiCoachDesc: 'Mevcut finansal işlemlerinizi, harcama alışkanlıklarınızı ve tasarruf oranınızı analiz ederek size özel finansal kararlar ve birikim tavsiyeleri sunar.',
    generateAnalysis: 'Öngörü ve Analiz Raporu Oluştur',
    gatheringData: 'Verileriniz işleniyor, finansal öngörüler hesaplanıyor...',
    sessionInfo: 'Oturum Bilgileri',
    sessionType: 'Oturum Tipi:',
    userAccount: 'Kullanıcı Hesabı:',
    demoMode: 'Demo LocalStorage',
    cloudMode: 'Supabase Bulut',
    dangerZone: 'Tehlikeli Bölge',
    dangerZoneDesc: 'Tüm bütçe limitlerinizi, harcama kayıtlarınızı ve oluşturduğunuz özel kategorileri sıfırlayabilirsiniz. Bu işlem geri alınamaz.',
    resetAllData: 'Tüm Verileri Sıfırla',
    confirmModalTitle: 'Tüm Finansal Veriler Sıfırlansın mı?',
    confirmModalMessage: 'MoneyMate üzerindeki tüm gelirleriniz, giderleriniz ve belirlediğiniz bütçe limitleriniz kalıcı olarak silinecektir. Uygulama ilk günkü varsayılan durumuna (seed verileriyle) geri dönecektir. Devam etmek istiyor musunuz?',
    confirmModalConfirm: 'Verileri Kalıcı Olarak Sıfırla',
    confirmModalCancel: 'Vazgeç',
    aiNoTransactions: 'Henüz hesaplanacak bir finansal işlem girmediniz. Lütfen analiz yapabilmem için öncelikle gelir ve gider işlemlerinizi ekleyin!',
    aiReportTitle: 'Feniqo Akıllı Öngörü & Finans Analizi',
    aiReportSummary: 'Toplam geliriniz {totalInc}, harcamalarınız ise {totalExp} seviyesinde.',
    aiCriticalWarning: 'Bu dönem giderleriniz, gelirlerinizden {netSavings} daha fazla. Bütçeniz açık veriyor.',
    aiCriticalAdvice: 'Esnek harcamalarınızı (Örn: Eğlence, Market) hemen gözden geçirin. Harcama yapmadan önce \'Bütçe Planı\' oluşturmanız ve limitleri aşmamanız kritik önem taşıyor.',
    aiSavingsStatus: 'Tasarruf oranınız %{rate} seviyesinde. Yani kazancınızın beşte birinden fazlasını başarıyla biriktiriyorsunuz. Harika bir iş çıkarıyorsunuz!',
    aiExcellentRate: '%30 ve üzeri tasarruf oranları finansal bağımsızlık için altın standarttır. Biriken bu tutarları acil durum fonu oluşturmak veya pasif gelir getirecek yatırım araçlarında (Fon, Hisse Senedi vb.) değerlendirmeyi düşünebilirsiniz.',
    aiImprovementRate: 'Birikim oranınızı %{target}% seviyesine çıkarmak için sabit aboneliklerinizi (Netflix, Spotify, bulut depolama vb.) sadeleştirmeyi ve küçük günlük harcamaları azaltmayı (Kahve, dışarıdan yemek siparişi vb.) deneyebilirsiniz.',
    aiHighestExpenseFixed: 'En büyük harcama kalemi {cName} olarak görünüyor. Bu kategori sabit/zorunlu bir gider olduğu için doğrudan sınırlandırılması zordur. Bütçe dengesini sağlamak için diğer esnek harcama kategorilerinde (Örn: Eğlence, Yemek, Market) tasarruf yapmaya odaklanmak daha akıllıca olacaktır.',
    aiHighestExpenseDiscretionary: 'En büyük harcama kalemi {cName} olarak görünüyor. Bu kategori toplam bütçenizi en çok baskılayan kalem. Gelecek ay bu kategoride bütçe limiti belirleyerek esnek harcamaları sınırlandırmak akıllıca olacaktır.',
    categories: {
      'cat-expense-kira': 'Kira ve Konut',
      'cat-expense-market': 'Gıda ve Süpermarket',
      'cat-expense-eglence': 'Eğlence ve Kültür',
      'cat-expense-fatura': 'Faturalar',
      'default': 'Değişken Giderler'
    } as Record<string, string>,
    ratesRefreshLabel: 'Döviz Kuru Güncelleme Sıklığı',
    ratesRefreshDesc: 'Döviz kurlarının ne sıklıkla güncelleneceğini belirleyin. Günlük önizlek, sayfa geçişlerini hızlandırır ve mobil veri tüketimini azaltır.',
    realtime: 'Gerçek Zamanlı',
    realtimeDesc: 'Her sayfa açılışında en taze kur çekilir.',
    daily: 'Günlük Önizlek',
    dailyDesc: 'Kurlar 24 saat önbelleğe alınır. (Önerilen)',
    manual: 'Manuel',
    manualDesc: 'Yalnızca yenile butonuna basıldığında kur çekilir.',
    ratesRefreshSuccess: 'Döviz kuru güncelleme tercihi başarıyla güncellendi.',
    budgetAlertPrefsTitle: 'Bütçe Eşik Ayarları & Bildirimleri',
    budgetAlertPrefsDesc: 'Kategorik bütçelerinizin doluluk oranına göre uyarılmak istediğiniz akıllı eşikleri belirleyin. Bu eşiklere yaklaşıldığında görsel alarm ve AI Coach tavsiyeleri devreye girer.',
    warningThresholdLabel: 'Bütçe Uyarı Eşiği (Warning)',
    criticalThresholdLabel: 'Kritik Aşım Eşiği (Critical)',
    blockThresholdLabel: 'Limit Bloke/Aşım Eşiği (Overdraft)',
    thresholdValueText: '%{val} Doluluk',
    budgetThresholdsUpdated: 'Bütçe uyarı eşikleri başarıyla güncellendi.',
    dataPortabilityTitle: 'Veri Taşınabilirliği & Yedekleme',
    dataPortabilityDesc: 'Finansal özgürlüğün temeli veri sahipliğidir. MoneyMate verilerinizi Excel uyumlu CSV formatında dışarı aktarabilir veya JSON formatında tam yedek alıp geri yükleyebilirsiniz.',
    exportCsvTitle: 'Excel / CSV Tabloları',
    exportCsvDesc: 'Verilerinizi kategorize edilmiş temiz tablolar halinde tek tıkla Excel veya Sheets için indirin.',
    exportTxs: 'İşlemler (CSV)',
    exportBudgets: 'Bütçe Limitleri (CSV)',
    exportGoals: 'Birikim Hedefleri (CSV)',
    exportDebts: 'Borç & Alacaklar (CSV)',
    exportAssets: 'Varlıklar (CSV)',
    recordsText: '{count} kayıt',
    backupTitle: 'JSON Tam Sistem Yedeği (Backup)',
    backupDesc: 'Tüm bütçe, işlem, varlık ve ayarlarınızı içeren tek bir yedekleme dosyası (.json) indirir. Bu dosya ile verilerinizi başka cihazlara anında taşıyabilirsiniz.',
    downloadBackupBtn: 'Tam Sistem Yedeğini İndir (.json)',
    restoreTitle: 'Yedekten Geri Yükle (Restore)',
    restoreDesc: 'Daha önce aldığınız bir MoneyMate yedek dosyasını (.json) yükleyerek verilerinizi anında geri getirin.',
    restoreDropzone: 'Dosyayı buraya sürükleyin veya seçmek için tıklayın',
    restoreSelectFile: 'Yedekleme Dosyası Seç (.json)',
    restoreSuccess: 'Verileriniz başarıyla geri yüklendi! Sistem güncellendi.',
    restoreError: 'Geri yükleme başarısız: ',
    importReportTitle: 'Yedek Dosyası Analiz Raporu',
    importReportWarning: 'DİKKAT: Geri yükleme işlemi onaylandığında, mevcut tüm verileriniz silinecek ve yedek dosyasındaki veriler yazılacaktır. Bu işlem geri alınamaz.',
    importConfirmBtn: 'Analizi Onayla ve Geri Yükle',
    importCancelBtn: 'İptal Et',
    importStats: 'Dosya İçeriği:',
    importSummaryText: 'Yedekleme dosyası başarıyla doğrulandı. İçerik özeti aşağıdadır:'
  },
  en: {
    title: 'System Settings',
    subtitle: 'Manage your account preferences, default currency, visual theme, and financial analysis.',
    currencyUpdated: 'Currency preference updated successfully.',
    themeUpdated: 'Theme preference updated successfully.',
    langUpdated: 'Language preference updated successfully.',
    colorThemeLabel: 'Color Accent Theme',
    colorThemeUpdated: 'Color theme preference updated successfully.',
    resetSuccess: 'All data has been reset successfully and the demo template has been loaded.',
    generalPrefs: 'Appearance & Preferences',
    defaultCurrency: 'Default Currency',
    appTheme: 'Application Theme',
    lightTheme: 'Light Theme',
    darkTheme: 'Dark Theme',
    systemTheme: 'System',
    appLanguage: 'Application Language / Dil',
    turkish: 'Türkçe (TR)',
    english: 'English (EN)',
    aiCoachTitle: 'Feniqo Smart Finance Analyst',
    aiCoachDesc: 'Analyzes your current financial transactions, spending patterns, and savings rate to provide personalized financial insights and savings advice.',
    generateAnalysis: 'Generate Financial Insight Report',
    gatheringData: 'Processing transactions, calculating financial projections...',
    sessionInfo: 'Session Info',
    sessionType: 'Session Type:',
    userAccount: 'User Account:',
    demoMode: 'Demo LocalStorage',
    cloudMode: 'Supabase Cloud',
    dangerZone: 'Danger Zone',
    dangerZoneDesc: 'You can reset all your budget limits, transaction records, and custom categories. This action cannot be undone.',
    resetAllData: 'Reset All Data',
    confirmModalTitle: 'Reset All Financial Data?',
    confirmModalMessage: 'All your income, expenses, and budget limits on MoneyMate will be permanently deleted. The application will return to its initial default state (with seed data). Do you want to proceed?',
    confirmModalConfirm: 'Permanently Reset Data',
    confirmModalCancel: 'Cancel',
    aiNoTransactions: 'You haven\'t entered any financial transactions yet. Please add your income and expense transactions first so I can analyze your data!',
    aiReportTitle: 'Feniqo Smart Insight & Financial Analysis',
    aiReportSummary: 'Your total income is {totalInc}, and your expenses are at {totalExp}.',
    aiCriticalWarning: 'Your expenses for this period exceed your income by {netSavings}. Your budget is running a deficit.',
    aiCriticalAdvice: 'Review your flexible expenses (e.g. Entertainment, Supermarket) immediately. Creating a \'Budget Plan\' before spending and staying within limits is critical.',
    aiSavingsStatus: 'Your savings rate is at {rate}%. In other words, you are successfully saving more than one-fifth of your earnings. Great job!',
    aiExcellentRate: 'Savings rates of 30% and above are the gold standard for financial independence. You might consider using these accumulated savings to build an emergency fund or invest in passive income generators (Funds, Stocks, etc.).',
    aiImprovementRate: 'To increase your savings rate to the {target}% level, you could simplify your fixed subscriptions (Netflix, Spotify, cloud storage, etc.) and reduce minor daily expenses (coffee, food delivery, etc.).',
    aiHighestExpenseFixed: 'Your largest expense category appears to be {cName}. Since this is a fixed or essential cost, it is difficult to reduce directly. It would be wiser to focus on saving in other discretionary categories (e.g. Entertainment, Food, Shopping) to balance your overall budget.',
    aiHighestExpenseDiscretionary: 'Your largest expense category appears to be {cName}. This category is putting the most pressure on your overall budget. Setting a budget limit for this category next month will be a smart way to limit flexible expenses.',
    categories: {
      'cat-expense-kira': 'Rent & Housing',
      'cat-expense-market': 'Food & Supermarket',
      'cat-expense-eglence': 'Entertainment & Culture',
      'cat-expense-fatura': 'Bills',
      'default': 'Variable Expenses'
    } as Record<string, string>,
    ratesRefreshLabel: 'Exchange Rates Refresh Interval',
    ratesRefreshDesc: 'Define how frequently currency exchange rates are refreshed. Daily caching speeds up page navigation and reduces data usage.',
    realtime: 'Real-time',
    realtimeDesc: 'Fetches the freshest rate on every page load.',
    daily: 'Daily Cache',
    dailyDesc: 'Rates cached for 24 hours. (Recommended)',
    manual: 'Manual',
    manualDesc: 'Rates only fetch when you click the refresh button.',
    ratesRefreshSuccess: 'Exchange rates refresh preference updated successfully.',
    budgetAlertPrefsTitle: 'Budget Alert Thresholds & Notifications',
    budgetAlertPrefsDesc: 'Define smart thresholds to be warned as categorical budgets fill up. Visual alerts and AI Coach advice activate when approaching these targets.',
    warningThresholdLabel: 'Budget Warning Threshold',
    criticalThresholdLabel: 'Critical Budget Threshold',
    blockThresholdLabel: 'Overdraft Threshold',
    thresholdValueText: '%{val} Capacity',
    budgetThresholdsUpdated: 'Budget warning thresholds updated successfully.',
    dataPortabilityTitle: 'Data Portability & Backup',
    dataPortabilityDesc: 'Financial freedom is built on data ownership. Export your MoneyMate data as Excel-compatible CSV tables, or download/restore a full system backup in JSON format.',
    exportCsvTitle: 'Excel / CSV Tables',
    exportCsvDesc: 'Download your financial data as clean, categorized tables optimized for Excel or Google Sheets.',
    exportTxs: 'Transactions (CSV)',
    exportBudgets: 'Budgets (CSV)',
    exportGoals: 'Savings Goals (CSV)',
    exportDebts: 'Debts & Receivables (CSV)',
    exportAssets: 'Assets (CSV)',
    recordsText: '{count} records',
    backupTitle: 'Full System JSON Backup',
    backupDesc: 'Downloads a single backup file (.json) containing all your transactions, budgets, goals, assets, and settings. Use this file to migrate data to another device.',
    downloadBackupBtn: 'Download Full Backup (.json)',
    restoreTitle: 'Restore from Backup',
    restoreDesc: 'Upload a previously exported MoneyMate backup file (.json) to instantly restore your data.',
    restoreDropzone: 'Drag and drop file here or click to select',
    restoreSelectFile: 'Select Backup File (.json)',
    restoreSuccess: 'Data restored successfully! System updated.',
    restoreError: 'Restore failed: ',
    importReportTitle: 'Backup Pre-Import Report',
    importReportWarning: 'WARNING: Confirming this restore will permanently overwrite and replace your current financial data. This action cannot be undone.',
    importConfirmBtn: 'Confirm & Restore Backup',
    importCancelBtn: 'Cancel',
    importStats: 'File Content:',
    importSummaryText: 'Backup file verified successfully. Summary of items found:'
  }
};

export const Settings: React.FC = () => {
  const { user, updateProfile, isDemo } = useAuth();
  const {
    transactions,
    categories,
    budgets,
    recurringTransactions,
    goals,
    debts,
    subscriptions,
    assets,
    resetAllData,
    importBackupData
  } = useData();
  const currency = user?.currency || 'TRY';
  const lang = user?.lang || 'tr';
  const t = translations[lang];

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [fullName, setFullName] = useState(user?.full_name || '');

  React.useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name);
    }
  }, [user?.full_name]);

  const handleFullNameBlur = async () => {
    const trimmed = fullName.trim();
    if (trimmed && trimmed !== user?.full_name) {
      const res = await updateProfile({ full_name: trimmed });
      if (res.success) {
        setSuccessMsg(lang === 'tr' ? 'Profil ismi başarıyla güncellendi.' : 'Profile name updated successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    }
  };

  // PWA Install Hook Entegrasyonu
  const { isInstallable, isInstalled: isAppInstalled, install: handleInstallApp } = usePWA();
  const [showIosGuide, setShowIosGuide] = useState(false);

  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  // AI Coach state
  const [showAiReport, setShowAiReport] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [ratesRefresh, setRatesRefresh] = useState(() => {
    return localStorage.getItem('moneymate_rates_refresh') || 'daily';
  });

  const handleRatesRefreshChange = (val: 'realtime' | 'daily' | 'manual') => {
    setRatesRefresh(val);
    localStorage.setItem('moneymate_rates_refresh', val);
    setSuccessMsg(lang === 'tr' ? translations.tr.ratesRefreshSuccess : translations.en.ratesRefreshSuccess);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const [savingsTarget, setSavingsTarget] = useState(() => {
    const stored = localStorage.getItem('moneymate_savings_target');
    return stored ? parseInt(stored) : 20;
  });

  const handleSavingsTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSavingsTarget(value);
    localStorage.setItem('moneymate_savings_target', String(value));
    setSuccessMsg(lang === 'tr' ? 'Tasarruf hedefi başarıyla güncellendi.' : 'Savings target updated successfully.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const [warningThreshold, setWarningThreshold] = useState(() => {
    const stored = localStorage.getItem('moneymate_budget_warning_threshold');
    return stored ? parseInt(stored) : 50;
  });

  const [criticalThreshold, setCriticalThreshold] = useState(() => {
    const stored = localStorage.getItem('moneymate_budget_critical_threshold');
    return stored ? parseInt(stored) : 80;
  });

  const [blockThreshold, setBlockThreshold] = useState(() => {
    const stored = localStorage.getItem('moneymate_budget_block_threshold');
    return stored ? parseInt(stored) : 100;
  });

  const handleWarningThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setWarningThreshold(value);
    localStorage.setItem('moneymate_budget_warning_threshold', String(value));
    setSuccessMsg(lang === 'tr' ? translations.tr.budgetThresholdsUpdated : translations.en.budgetThresholdsUpdated);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCriticalThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setCriticalThreshold(value);
    localStorage.setItem('moneymate_budget_critical_threshold', String(value));
    setSuccessMsg(lang === 'tr' ? translations.tr.budgetThresholdsUpdated : translations.en.budgetThresholdsUpdated);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleBlockThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setBlockThreshold(value);
    localStorage.setItem('moneymate_budget_block_threshold', String(value));
    setSuccessMsg(lang === 'tr' ? translations.tr.budgetThresholdsUpdated : translations.en.budgetThresholdsUpdated);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const [portfolioCurrency, setPortfolioCurrency] = useState(() => {
    return localStorage.getItem('moneymate_portfolio_currency') || user?.currency || 'TRY';
  });

  const handlePortfolioCurrencyChange = (val: string) => {
    setPortfolioCurrency(val);
    localStorage.setItem('moneymate_portfolio_currency', val);
    setSuccessMsg(lang === 'tr' ? 'Portföy değerleme para birimi güncellendi.' : 'Portfolio valuation currency updated.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // --- DATA PORTABILITY & BACKUP HANDLERS ---
  const [importingFile, setImportingFile] = useState<any>(null);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [importError, setImportError] = useState('');
  const [portabilityLoading, setPortabilityLoading] = useState(false);

  const convertToCSV = (arr: any[], headers: string[], mapper: (item: any) => any[]) => {
    const csvRows = [];
    csvRows.push('\uFEFF' + headers.join(',')); // Add UTF-8 BOM
    for (const item of arr) {
      const values = mapper(item);
      const escaped = values.map(val => {
        if (val === undefined || val === null) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvRows.push(escaped.join(','));
    }
    return csvRows.join('\n');
  };

  const downloadCSVFile = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTransactions = () => {
    const headers = lang === 'tr'
      ? ["Tarih", "Tür", "Kategori", "Açıklama", "Tutar", "Ödeme Yöntemi"]
      : ["Date", "Type", "Category", "Description", "Amount", "Payment Method"];
    const csv = convertToCSV(transactions, headers, (t) => [
      t.transaction_date,
      t.type === 'income' ? (lang === 'tr' ? 'Gelir' : 'Income') : (lang === 'tr' ? 'Gider' : 'Expense'),
      categories.find(c => c.id === t.category_id)?.name || (lang === 'tr' ? 'Diğer' : 'Other'),
      t.description || '',
      t.amount,
      t.payment_method || ''
    ]);
    downloadCSVFile(csv, `moneymate_transactions_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportBudgets = () => {
    const headers = lang === 'tr'
      ? ["Ay", "Kategori", "Bütçe Limiti"]
      : ["Month", "Category", "Budget Limit"];
    const csv = convertToCSV(budgets, headers, (b) => [
      b.month,
      categories.find(c => c.id === b.category_id)?.name || (lang === 'tr' ? 'Diğer' : 'Other'),
      b.limit_amount
    ]);
    downloadCSVFile(csv, `moneymate_budgets_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportGoals = () => {
    const headers = lang === 'tr'
      ? ["Hedef Adı", "Hedef Tutar", "Mevcut Birikim", "Hedef Tarih"]
      : ["Goal Name", "Target Amount", "Current Amount", "Target Date"];
    const csv = convertToCSV(goals, headers, (g) => [
      g.name,
      g.target_amount,
      g.current_amount,
      g.target_date || ''
    ]);
    downloadCSVFile(csv, `moneymate_goals_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportDebts = () => {
    const headers = lang === 'tr'
      ? ["Kişi/Kurum", "Tür", "Tutar", "Vade Tarihi", "Ödeme Durumu", "Açıklama"]
      : ["Contact", "Type", "Amount", "Due Date", "Status", "Description"];
    const csv = convertToCSV(debts, headers, (d) => [
      d.title,
      d.type === 'debt' ? (lang === 'tr' ? 'Borç' : 'Debt') : (lang === 'tr' ? 'Alacak' : 'Receivable'),
      d.amount,
      d.due_date || '',
      d.is_paid ? (lang === 'tr' ? 'Ödendi' : 'Paid') : (lang === 'tr' ? 'Ödenmedi' : 'Unpaid'),
      d.description || ''
    ]);
    downloadCSVFile(csv, `moneymate_debts_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportAssets = () => {
    const headers = lang === 'tr'
      ? ["Varlık Adı", "Tür", "Güncel Değer", "Miktar", "Alış Fiyatı"]
      : ["Asset Name", "Type", "Current Value", "Quantity", "Purchase Price"];
    const csv = convertToCSV(assets, headers, (a) => [
      a.name,
      a.type,
      a.value,
      a.quantity || 1,
      a.purchase_price || a.value
    ]);
    downloadCSVFile(csv, `moneymate_assets_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportJSON = () => {
    const backupObject = {
      app: 'MoneyMate',
      version: '1.0',
      exported_at: new Date().toISOString(),
      data: {
        transactions,
        categories,
        budgets,
        recurringTransactions,
        goals,
        debts,
        subscriptions,
        assets
      }
    };
    const blob = new Blob([JSON.stringify(backupObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `moneymate_backup_${dateStr}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const readAndValidateBackupFile = (file: File) => {
    setImportError('');
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
          setImportError(lang === 'tr' ? 'Geçersiz yedekleme dosyası yapısı.' : 'Invalid backup file structure.');
          return;
        }

        const d = parsed.data;
        const summary = {
          transactions: Array.isArray(d.transactions) ? d.transactions.length : 0,
          categories: Array.isArray(d.categories) ? d.categories.length : 0,
          budgets: Array.isArray(d.budgets) ? d.budgets.length : 0,
          recurringTransactions: Array.isArray(d.recurringTransactions) ? d.recurringTransactions.length : 0,
          goals: Array.isArray(d.goals) ? d.goals.length : 0,
          debts: Array.isArray(d.debts) ? d.debts.length : 0,
          subscriptions: Array.isArray(d.subscriptions) ? d.subscriptions.length : 0,
          assets: Array.isArray(d.assets) ? d.assets.length : 0
        };

        setImportSummary(summary);
        setImportingFile(parsed);
      } catch (err) {
        setImportError(lang === 'tr' ? 'Dosya okunurken hata oluştu. Lütfen geçerli bir JSON dosyası yükleyin.' : 'Error reading file. Please upload a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readAndValidateBackupFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    readAndValidateBackupFile(file);
  };

  const handleConfirmImport = async () => {
    if (!importingFile) return;

    setPortabilityLoading(true);
    const res = await importBackupData(importingFile);
    setPortabilityLoading(false);

    if (res.success) {
      setSuccessMsg(t.restoreSuccess);
      setImportingFile(null);
      setImportSummary(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setImportError(`${t.restoreError}${res.error}`);
    }
  };

  const [colorTheme, setColorTheme] = useState(() => {
    return localStorage.getItem('moneymate_color_theme') || 'emerald';
  });

  const activeThemeId = useMemo(() => {
    const appliedTheme = localStorage.getItem('moneymate_applied_theme') || 'dark';
    const colorThemeName = localStorage.getItem('moneymate_color_theme') || 'emerald';

    if (colorThemeName === 'emerald') {
      return appliedTheme === 'light' ? 'light' : 'dark';
    }
    return colorThemeName; // 'sunset', 'rose', 'feniqo'
  }, [colorTheme, user?.theme]);

  const handleThemeSelect = async (themeId: 'light' | 'dark' | 'sunset' | 'rose' | 'feniqo') => {
    const isDarkMode = themeId !== 'light';
    const colorThemeName = (themeId === 'light' || themeId === 'dark') ? 'emerald' : themeId;

    // 1. Save to local storage
    localStorage.setItem('moneymate_applied_theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('moneymate_color_theme', colorThemeName);

    // 2. Save profile theme to DB
    await updateProfile({ theme: isDarkMode ? 'dark' : 'light' });

    // 3. Update DOM classes instantly
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    document.documentElement.classList.remove('theme-emerald', 'theme-sunset', 'theme-rose', 'theme-feniqo');
    document.documentElement.classList.add(`theme-${colorThemeName}`);

    // 4. Update component state
    setColorTheme(colorThemeName);

    setSuccessMsg(translations[lang].themeUpdated);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  if (!user) return null;

  // Change Currency
  const handleCurrencyChange = async (val: string) => {
    await updateProfile({ currency: val as any });
    setSuccessMsg(t.currencyUpdated);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Change Language
  const handleLangChange = async (langName: 'tr' | 'en') => {
    await updateProfile({ lang: langName });
    setSuccessMsg(translations[langName].langUpdated);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Data reset confirmed
  const handleResetData = async () => {
    await resetAllData();
    setIsResetModalOpen(false);
    setSuccessMsg(t.resetSuccess);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ---------------------------------------------------------------
  // AI COACH RULE-BASED ENGINE (MOCK AI REPORT)
  // ---------------------------------------------------------------
  // Sabit / Zorunlu gider kategorilerini kontrol eden yardımcı fonksiyon
  const isFixedExpenseCategory = (id: string, name: string): boolean => {
    const fixedIds = ['cat-expense-kira', 'cat-expense-fatura', 'cat-expense-egitim', 'cat-expense-saglik', 'cat-expense-tasarruf'];
    if (fixedIds.includes(id)) return true;
    
    const lowerName = name.toLowerCase();
    const fixedKeywords = [
      'kira', 'rent', 'housing', 'konut',
      'fatura', 'bill', 'utilities', 'aidat', 'dues',
      'vergi', 'tax',
      'eğitim', 'education', 'okul', 'school',
      'sağlık', 'health', 'medikal', 'medical',
      'sigorta', 'insurance',
      'kredi', 'loan', 'taksit', 'installment',
      'borç', 'debt'
    ];
    return fixedKeywords.some(keyword => lowerName.includes(keyword));
  };

  // AI COACH RULE-BASED ENGINE (MOCK AI REPORT DATA)
  // ---------------------------------------------------------------
  const aiAnalysis = useMemo(() => {
    if (transactions.length === 0) {
      return { isEmpty: true, message: t.aiNoTransactions };
    }

    // 1. Basic calculations for advice
    const totalInc = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExp = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netSavings = totalInc - totalExp;
    const rate = totalInc > 0 ? Math.round((netSavings / totalInc) * 100) : 0;

    // Group expenses by category
    const expenseByCat: { [name: string]: number } = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expenseByCat[t.category_id] = (expenseByCat[t.category_id] || 0) + t.amount;
      });

    let topCatId = '';
    let topCatAmount = 0;
    Object.entries(expenseByCat).forEach(([id, amt]) => {
      if (amt > topCatAmount) {
        topCatAmount = amt;
        topCatId = id;
      }
    });

    const hasDeficit = netSavings < 0;
    const cName = topCatId ? (t.categories[topCatId] || categories.find(c => c.id === topCatId)?.name || t.categories['default']) : '';
    const isFixedExpense = topCatId ? isFixedExpenseCategory(topCatId, cName) : false;

    // Determine advice strings
    let statusTitle = '';
    let statusText = '';
    let statusAdvice = '';
    let statusType: 'deficit' | 'savings_excellent' | 'savings_improvement' = 'savings_improvement';

    if (hasDeficit) {
      statusType = 'deficit';
      statusTitle = lang === 'tr' ? 'Kritik Durum' : 'Critical Status';
      statusText = t.aiCriticalWarning.replace('{netSavings}', formatCurrency(Math.abs(netSavings), currency));
      statusAdvice = t.aiCriticalAdvice;
    } else {
      statusText = t.aiSavingsStatus.replace('{rate}', String(rate));
      if (rate >= savingsTarget + 10) {
        statusType = 'savings_excellent';
        statusTitle = lang === 'tr' ? 'Mükemmel Oran' : 'Excellent Rate';
        statusAdvice = t.aiExcellentRate;
      } else {
        statusType = 'savings_improvement';
        statusTitle = lang === 'tr' ? 'Gelişim Alanı' : 'Area for Improvement';
        statusAdvice = t.aiImprovementRate
          .replace('{target}', String(savingsTarget));
      }
    }

    let highestExpenseText = '';
    if (topCatId) {
      if (isFixedExpense) {
        highestExpenseText = t.aiHighestExpenseFixed.replace('{cName}', cName);
      } else {
        highestExpenseText = t.aiHighestExpenseDiscretionary.replace('{cName}', cName);
      }
    }

    return {
      isEmpty: false,
      totalInc,
      totalExp,
      netSavings,
      rate,
      statusType,
      statusTitle,
      statusText,
      statusAdvice,
      topCatId,
      topCatName: cName,
      isFixedExpense,
      highestExpenseText
    };
  }, [transactions, currency, t, lang, savingsTarget, categories]);

  const triggerAiAnalysis = () => {
    setAiLoading(true);
    setShowAiReport(false);
    setTimeout(() => {
      setAiLoading(false);
      setShowAiReport(true);
    }, 1200);
  };

  const currencyOptions = [
    { value: 'TRY', label: lang === 'tr' ? 'Türk Lirası (TRY)' : 'Turkish Lira (TRY)', meta: '₺' },
    { value: 'USD', label: lang === 'tr' ? 'Amerikan Doları (USD)' : 'US Dollar (USD)', meta: '$' },
    { value: 'EUR', label: lang === 'tr' ? 'Euro (EUR)' : 'Euro (EUR)', meta: '€' },
  ];

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {t.subtitle}
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          {successMsg}
        </div>
      )}

      {/* SETTINGS CARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column: Prefs form */}
        <div className="lg:col-span-2 space-y-6">

          {/* General Preferences */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <SettingsIcon size={18} className="text-brand-500" />
              <span>{t.generalPrefs}</span>
            </h3>

            {/* Ad Soyad girdisi */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                {lang === 'tr' ? 'Ad Soyad / Kullanıcı Adı' : 'Full Name / Display Name'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon size={16} />
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={handleFullNameBlur}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 pl-10 text-sm transition-all font-semibold"
                  placeholder={lang === 'tr' ? 'Adınızı girin' : 'Enter your name'}
                />
              </div>
            </div>

            {/* Currency select */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                {t.defaultCurrency}
              </label>
              <CustomSelect
                options={currencyOptions}
                value={currency}
                onChange={handleCurrencyChange}
                icon={<DollarSign size={16} />}
              />
            </div>

            {/* Portfolio Valuation Currency select */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                {lang === 'tr' ? 'Portföy Değerleme Para Birimi' : 'Portfolio Valuation Currency'}
              </label>
              <CustomSelect
                options={currencyOptions}
                value={portfolioCurrency}
                onChange={handlePortfolioCurrencyChange}
                icon={<Briefcase size={16} />}
              />
            </div>

            {/* Unified Immersive Theme Selector */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                  {t.appTheme}
                </label>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-1 leading-relaxed mt-0.5">
                  {lang === 'tr'
                    ? 'Uygulamanın genel atmosferini, arka plan auralarını ve kart renklerini bütünsel olarak değiştiren tam sarmalayıcı premium temalar.'
                    : 'Fully immersive premium themes that holistically morph backgrounds, atmospheric glows, and card textures.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 1. Mistik Zümrüt (Açık) */}
                <button
                  onClick={() => handleThemeSelect('light')}
                  className={`py-3 px-2.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center space-y-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center ${activeThemeId === 'light'
                      ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-sm shadow-teal-500/10'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <Sun size={12} className="text-amber-500 shrink-0" />
                    <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#0d9488] to-[#2dd4bf] shadow-inner shrink-0" />
                  </div>
                  <span className="text-[10px] tracking-tight whitespace-nowrap block w-full truncate">
                    {lang === 'tr' ? 'Klasik Açık' : 'Classic Light'}
                  </span>
                </button>

                {/* 2. Mistik Zümrüt (Koyu) */}
                <button
                  onClick={() => handleThemeSelect('dark')}
                  className={`py-3 px-2.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center space-y-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center ${activeThemeId === 'dark'
                      ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-sm shadow-teal-500/10'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <Moon size={12} className="text-slate-400 shrink-0" />
                    <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#0d9488] to-[#2dd4bf] shadow-inner shrink-0" />
                  </div>
                  <span className="text-[10px] tracking-tight whitespace-nowrap block w-full truncate">
                    {lang === 'tr' ? 'Klasik Koyu' : 'Classic Dark'}
                  </span>
                </button>

                {/* 3. Gün Batımı Altını */}
                <button
                  onClick={() => handleThemeSelect('sunset')}
                  className={`py-3 px-2.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center space-y-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center ${activeThemeId === 'sunset'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/10'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] shrink-0">🌅</span>
                    <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#BA7517] to-[#D4537E] shadow-inner shrink-0" />
                  </div>
                  <span className="text-[10px] tracking-tight whitespace-nowrap block w-full truncate">
                    {lang === 'tr' ? 'Gün Batımı Altını' : 'Sunset Gold'}
                  </span>
                </button>

                {/* 4. Cesur Gül */}
                <button
                  onClick={() => handleThemeSelect('rose')}
                  className={`py-3 px-2.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center space-y-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center ${activeThemeId === 'rose'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-sm shadow-rose-500/10'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] shrink-0">🌹</span>
                    <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#993556] to-[#D56082] shadow-inner shrink-0" />
                  </div>
                  <span className="text-[10px] tracking-tight whitespace-nowrap block w-full truncate">
                    {lang === 'tr' ? 'Cesur Gül' : 'Bold Rose'}
                  </span>
                </button>

                {/* 5. Feniqo Yeşili (Official Brand Theme) */}
                <button
                  onClick={() => handleThemeSelect('feniqo')}
                  className={`py-3 px-2.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center space-y-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center ${
                    activeThemeId === 'feniqo'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/10'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] shrink-0">🟢</span>
                    <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#10b981] to-[#34d399] shadow-inner shrink-0" />
                  </div>
                  <span className="text-[10px] tracking-tight whitespace-nowrap block w-full truncate font-extrabold text-emerald-600 dark:text-emerald-400">
                    {lang === 'tr' ? 'Feniqo Yeşili' : 'Feniqo Green'}
                  </span>
                </button>
              </div>
            </div>

            {/* Language selector buttons */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                {t.appLanguage}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleLangChange('tr')}
                  className={`py-3 px-4 rounded-xl border font-semibold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all ${lang === 'tr'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                >
                  <span className="text-base" role="img" aria-label="Turkey">🇹🇷</span>
                  <span>{t.turkish}</span>
                </button>
                <button
                  onClick={() => handleLangChange('en')}
                  className={`py-3 px-4 rounded-xl border font-semibold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all ${lang === 'en'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                >
                  <span className="text-base" role="img" aria-label="United States">🇺🇸</span>
                  <span>{t.english}</span>
                </button>
              </div>
            </div>

            {/* Exchange Rates Refresh Control */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 animate-in fade-in duration-300">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                  {t.ratesRefreshLabel}
                </label>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-1 leading-relaxed mt-0.5 font-medium">
                  {t.ratesRefreshDesc}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Real-time */}
                <button
                  onClick={() => handleRatesRefreshChange('realtime')}
                  className={`py-3.5 px-3 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center space-y-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center relative group overflow-hidden ${ratesRefresh === 'realtime'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 shadow-md shadow-brand-500/5'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                >
                  <div className="flex items-center space-x-1.5 z-10">
                    <Zap size={14} className={ratesRefresh === 'realtime' ? 'text-amber-500 animate-pulse' : 'text-slate-400 group-hover:text-amber-500 transition-colors'} />
                    <span>{t.realtime}</span>
                  </div>
                  <span className="text-[9px] font-medium leading-normal text-slate-400 dark:text-slate-500 px-1 z-10">
                    {t.realtimeDesc}
                  </span>
                </button>

                {/* 2. Daily Cache */}
                <button
                  onClick={() => handleRatesRefreshChange('daily')}
                  className={`py-3.5 px-3 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center space-y-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center relative group overflow-hidden ${ratesRefresh === 'daily'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 shadow-md shadow-brand-500/5'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                >
                  <div className="flex items-center space-x-1.5 z-10">
                    <Clock size={14} className={ratesRefresh === 'daily' ? 'text-indigo-500 animate-pulse' : 'text-slate-400 group-hover:text-indigo-500 transition-colors'} />
                    <span>{t.daily}</span>
                  </div>
                  <span className="text-[9px] font-medium leading-normal text-slate-400 dark:text-slate-500 px-1 z-10">
                    {t.dailyDesc}
                  </span>
                </button>

                {/* 3. Manual */}
                <button
                  onClick={() => handleRatesRefreshChange('manual')}
                  className={`py-3.5 px-3 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center space-y-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center relative group overflow-hidden ${ratesRefresh === 'manual'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 shadow-md shadow-brand-500/5'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                >
                  <div className="flex items-center space-x-1.5 z-10">
                    <RefreshCw size={14} className={ratesRefresh === 'manual' ? 'text-emerald-500 animate-pulse' : 'text-slate-400 group-hover:text-emerald-500 transition-colors'} />
                    <span>{t.manual}</span>
                  </div>
                  <span className="text-[9px] font-medium leading-normal text-slate-400 dark:text-slate-500 px-1 z-10">
                    {t.manualDesc}
                  </span>
                </button>
              </div>
            </div>

            {/* Savings Target Slider */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex justify-between items-center pl-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {lang === 'tr' ? 'Aylık Tasarruf Oranı Hedefi' : 'Monthly Savings Rate Target'}
                </label>
                <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400 bg-brand-500/10 dark:bg-brand-500/5 px-2.5 py-1 rounded-xl">
                  %{savingsTarget}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="5"
                  max="90"
                  step="5"
                  value={savingsTarget}
                  onChange={handleSavingsTargetChange}
                  className="w-full accent-brand-600 dark:accent-brand-400 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 w-12 text-right shrink-0 uppercase tracking-wider">
                  {lang === 'tr' ? 'Hedef' : 'Target'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-1 leading-relaxed font-medium">
                {lang === 'tr'
                  ? 'Aylık gelirinizden biriktirmek istediğiniz asgari hedef oranı belirler. Raporlar sayfasındaki finansal analizler ve performans göstergeleri bu hedefe göre dinamik olarak güncellenir.'
                  : 'Defines the minimum target savings rate from your monthly income. Financial digests and performance metrics in the Reports page are dynamically updated based on this target.'}
              </p>
            </div>

            {/* Budget Alert Thresholds */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 animate-in fade-in duration-300">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                  {t.budgetAlertPrefsTitle}
                </label>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-1 leading-relaxed mt-0.5 font-medium">
                  {t.budgetAlertPrefsDesc}
                </p>
              </div>

              <div className="space-y-3.5">
                {/* 1. Warning Threshold */}
                <div className="space-y-1.5 pl-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span>{t.warningThresholdLabel}</span>
                    </span>
                    <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-lg">
                      {t.thresholdValueText.replace('{val}', String(warningThreshold))}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="30"
                      max="70"
                      step="5"
                      value={warningThreshold}
                      onChange={handleWarningThresholdChange}
                      className="w-full accent-yellow-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* 2. Critical Threshold */}
                <div className="space-y-1.5 pl-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span>{t.criticalThresholdLabel}</span>
                    </span>
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                      {t.thresholdValueText.replace('{val}', String(criticalThreshold))}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="75"
                      max="95"
                      step="5"
                      value={criticalThreshold}
                      onChange={handleCriticalThresholdChange}
                      className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* 3. Block/Overdraft Threshold */}
                <div className="space-y-1.5 pl-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span>{t.blockThresholdLabel}</span>
                    </span>
                    <span className="text-[10px] font-black text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-lg">
                      {t.thresholdValueText.replace('{val}', String(blockThreshold))}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="95"
                      max="120"
                      step="5"
                      value={blockThreshold}
                      onChange={handleBlockThresholdChange}
                      className="w-full accent-red-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* OPEN BANKING & AUTOMATED ACCOUNT SYNC */}
          <OpenBankingPanel />

          {/* AI COACH SECTION */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <Lightbulb size={18} className="text-brand-500" />
              <span>{t.aiCoachTitle}</span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.aiCoachDesc}
            </p>

            {/* Analysis triggers */}
            <div className="pt-1">
              <button
                onClick={triggerAiAnalysis}
                className="premium-btn-primary bg-brand-600 hover:bg-brand-700 focus:ring-brand-500 flex items-center space-x-2 py-2 px-4 text-xs font-semibold shadow-md shadow-brand-500/10"
                disabled={aiLoading}
              >
                {aiLoading ? <RefreshCw size={14} className="animate-spin" /> : <Lightbulb size={14} />}
                <span>{t.generateAnalysis}</span>
              </button>
            </div>

            {/* Output markdown */}
            {aiLoading && (
              <div className="p-8 text-center text-xs font-semibold text-brand-500 dark:text-brand-400 space-y-2 animate-pulse bg-brand-500/5 rounded-2xl border border-brand-100 dark:border-brand-950/20">
                <RefreshCw size={24} className="animate-spin mx-auto text-brand-500" />
                <p>{t.gatheringData}</p>
              </div>
            )}

            {showAiReport && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                {aiAnalysis.isEmpty ? (
                  <div className="p-5 bg-brand-500/5 rounded-2xl border border-brand-100 dark:border-brand-950/30 text-slate-700 dark:text-slate-300 text-xs text-center font-medium">
                    {aiAnalysis.message}
                  </div>
                ) : (
                  <div className="bg-brand-500/5 rounded-2xl border border-brand-100 dark:border-brand-950/30 p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-center space-x-2.5 pb-3 border-b border-brand-100 dark:border-brand-950/20">
                      <div className="w-8 h-8 rounded-lg bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
                        <Lightbulb size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                          {t.aiReportTitle}
                        </h4>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                          {lang === 'tr' ? 'Finansal Analiz Sonuçları' : 'Financial Analysis Results'}
                        </p>
                      </div>
                    </div>

                    {/* Summary metrics grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex flex-col justify-between">
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                          {lang === 'tr' ? 'Toplam Gelir' : 'Total Income'}
                        </span>
                        <strong className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                          {formatCurrency(aiAnalysis.totalInc || 0, currency)}
                        </strong>
                      </div>
                      <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl flex flex-col justify-between">
                        <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">
                          {lang === 'tr' ? 'Toplam Harcama' : 'Total Expense'}
                        </span>
                        <strong className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                          {formatCurrency(aiAnalysis.totalExp || 0, currency)}
                        </strong>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold pl-0.5">
                      {t.aiReportSummary
                        .replace('{totalInc}', formatCurrency(aiAnalysis.totalInc || 0, currency))
                        .replace('{totalExp}', formatCurrency(aiAnalysis.totalExp || 0, currency))
                      }
                    </p>

                    {/* Savings/Deficit Status Card */}
                    <div className={`p-4 rounded-xl border ${
                      aiAnalysis.statusType === 'deficit'
                        ? 'bg-rose-500/5 border-rose-500/25 text-rose-700 dark:text-rose-400'
                        : aiAnalysis.statusType === 'savings_excellent'
                        ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
                        : 'bg-amber-500/5 border-amber-500/25 text-amber-700 dark:text-amber-400'
                    }`}>
                      <div className="flex items-start space-x-2.5">
                        {aiAnalysis.statusType === 'deficit' ? (
                          <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                        ) : aiAnalysis.statusType === 'savings_excellent' ? (
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <Zap size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1">
                          <span className="text-xs font-black uppercase tracking-wider block">
                            {aiAnalysis.statusTitle}
                          </span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                            {aiAnalysis.statusText}
                          </p>
                        </div>
                      </div>
                      <div className={`mt-3 pt-3 border-t flex items-start space-x-2 ${
                        aiAnalysis.statusType === 'deficit'
                          ? 'border-rose-500/10'
                          : aiAnalysis.statusType === 'savings_excellent'
                          ? 'border-emerald-500/10'
                          : 'border-amber-500/10'
                      }`}>
                        <Zap size={12} className="text-brand-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                          {aiAnalysis.statusAdvice}
                        </p>
                      </div>
                    </div>

                    {/* Highest Expense Category Card */}
                    {aiAnalysis.topCatId && (
                      <div className="p-4 bg-brand-500/5 border border-brand-500/10 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-brand-600 dark:text-brand-400 flex items-center space-x-1.5 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                            <span>{lang === 'tr' ? 'En Yüksek Harcama' : 'Highest Expense'}</span>
                          </span>
                          {aiAnalysis.isFixedExpense ? (
                            <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 bg-slate-500/15 dark:bg-slate-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider border border-slate-200/20">
                              {lang === 'tr' ? 'Sabit / Zorunlu' : 'Fixed / Essential'}
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/15 dark:bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-500/10">
                              {lang === 'tr' ? 'Değişken / Esnek' : 'Variable / Flexible'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold pl-0.5">
                          {aiAnalysis.highestExpenseText}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DATA PORTABILITY & BACKUP SECTION */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <Database size={18} className="text-brand-500" />
              <span>{t.dataPortabilityTitle}</span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t.dataPortabilityDesc}
            </p>

            {/* 1. CSV Excel Export Area */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pl-0.5">
                📊 {t.exportCsvTitle}
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-0.5 leading-relaxed font-medium">
                {t.exportCsvDesc}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Gelir/Gider (CSV) */}
                <button
                  onClick={handleExportTransactions}
                  className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 rounded-xl text-left flex items-center justify-between transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className="text-lg">💸</span>
                    <div className="leading-tight overflow-hidden text-ellipsis">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate">
                        {t.exportTxs}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                        {t.recordsText.replace('{count}', String(transactions.length))}
                      </span>
                    </div>
                  </div>
                  <Download size={14} className="text-slate-400 group-hover:text-brand-500 group-hover:scale-110 transition-all shrink-0" />
                </button>

                {/* Bütçeler (CSV) */}
                <button
                  onClick={handleExportBudgets}
                  className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 rounded-xl text-left flex items-center justify-between transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className="text-lg">🎯</span>
                    <div className="leading-tight overflow-hidden text-ellipsis">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate">
                        {t.exportBudgets}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                        {t.recordsText.replace('{count}', String(budgets.length))}
                      </span>
                    </div>
                  </div>
                  <Download size={14} className="text-slate-400 group-hover:text-brand-500 group-hover:scale-110 transition-all shrink-0" />
                </button>

                {/* Birikim Hedefleri (CSV) */}
                <button
                  onClick={handleExportGoals}
                  className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 rounded-xl text-left flex items-center justify-between transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className="text-lg">📈</span>
                    <div className="leading-tight overflow-hidden text-ellipsis">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate">
                        {t.exportGoals}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                        {t.recordsText.replace('{count}', String(goals.length))}
                      </span>
                    </div>
                  </div>
                  <Download size={14} className="text-slate-400 group-hover:text-brand-500 group-hover:scale-110 transition-all shrink-0" />
                </button>

                {/* Borç/Alacak (CSV) */}
                <button
                  onClick={handleExportDebts}
                  className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 rounded-xl text-left flex items-center justify-between transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className="text-lg">🤝</span>
                    <div className="leading-tight overflow-hidden text-ellipsis">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate">
                        {t.exportDebts}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                        {t.recordsText.replace('{count}', String(debts.length))}
                      </span>
                    </div>
                  </div>
                  <Download size={14} className="text-slate-400 group-hover:text-brand-500 group-hover:scale-110 transition-all shrink-0" />
                </button>

                {/* Varlıklar (CSV) */}
                <button
                  onClick={handleExportAssets}
                  className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 rounded-xl text-left flex items-center justify-between transition-all duration-200 group cursor-pointer sm:col-span-2"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className="text-lg">💼</span>
                    <div className="leading-tight overflow-hidden text-ellipsis">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate">
                        {t.exportAssets}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                        {t.recordsText.replace('{count}', String(assets.length))}
                      </span>
                    </div>
                  </div>
                  <Download size={14} className="text-slate-400 group-hover:text-brand-500 group-hover:scale-110 transition-all shrink-0" />
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-5 space-y-4">
              {/* 2. Full JSON Backup */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pl-0.5">
                  💾 {t.backupTitle}
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-0.5 leading-relaxed font-medium">
                  {isDemo
                    ? t.backupDesc
                    : (lang === 'tr'
                      ? 'Tüm verilerinizin bulut dışı fiziki bir kopyasını (.json) indirir. Bulut dışında bağımsız bir arşiv olarak saklamak veya başka bir hesaba aktarmak için kullanabilirsiniz.'
                      : 'Downloads an offline physical copy (.json) of all your data. Perfect for keeping an independent archive outside the cloud or migrating accounts.')}
                </p>
                <button
                  onClick={handleExportJSON}
                  className="premium-btn-primary w-full py-2.5 px-4 shadow-md shadow-brand-500/10 flex items-center justify-center space-x-2 text-xs font-bold tracking-wide cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-150"
                >
                  <Download size={14} />
                  <span>{t.downloadBackupBtn}</span>
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-5 space-y-4">
              {/* 3. JSON Restore Dropzone */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pl-0.5">
                  📤 {t.restoreTitle}
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-0.5 leading-relaxed font-medium">
                  {t.restoreDesc}
                </p>

                {importError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs rounded-xl font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                    ⚠️ {importError}
                  </div>
                )}

                {/* Pre-Import Report View */}
                {importingFile && importSummary ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl space-y-3.5 animate-in scale-in duration-200">
                    <div className="flex items-center space-x-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <h5 className="text-xs font-bold text-slate-800 dark:text-white">
                        {t.importReportTitle}
                      </h5>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {t.importSummaryText}
                    </p>

                    {/* Stats List */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between border-b border-slate-50 dark:border-slate-800/30 pb-1">
                        <span className="text-slate-400 font-semibold">💸 {lang === 'tr' ? 'Harcamalar' : 'Transactions'}</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-200">{importSummary.transactions}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 dark:border-slate-800/30 pb-1">
                        <span className="text-slate-400 font-semibold">🎯 {lang === 'tr' ? 'Bütçeler' : 'Budgets'}</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-200">{importSummary.budgets}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 dark:border-slate-800/30 pb-1">
                        <span className="text-slate-400 font-semibold">📈 {lang === 'tr' ? 'Hedefler' : 'Goals'}</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-200">{importSummary.goals}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 dark:border-slate-800/30 pb-1">
                        <span className="text-slate-400 font-semibold">🤝 {lang === 'tr' ? 'Borçlar' : 'Debts'}</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-200">{importSummary.debts}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 dark:border-slate-800/30 pb-1">
                        <span className="text-slate-400 font-semibold">💼 {lang === 'tr' ? 'Varlıklar' : 'Assets'}</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-200">{importSummary.assets}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 dark:border-slate-800/30 pb-1">
                        <span className="text-slate-400 font-semibold">🏷️ {lang === 'tr' ? 'Kategoriler' : 'Categories'}</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-200">{importSummary.categories}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start space-x-2 text-[9px] text-amber-700 dark:text-amber-400 leading-normal font-semibold">
                      <AlertTriangle size={14} className="shrink-0 text-amber-500" />
                      <p>{t.importReportWarning}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleConfirmImport}
                        disabled={portabilityLoading}
                        className="premium-btn-primary flex-1 py-2 shadow-md shadow-brand-500/10 flex items-center justify-center space-x-1.5 text-[10px] font-bold cursor-pointer"
                      >
                        {portabilityLoading ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
                        <span>{t.importConfirmBtn}</span>
                      </button>
                      <button
                        onClick={() => {
                          setImportingFile(null);
                          setImportSummary(null);
                        }}
                        className="premium-btn-secondary px-3 py-2 text-[10px] font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                      >
                        {t.importCancelBtn}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Uploader Dropzone
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500/50 dark:hover:border-brand-500/50 rounded-2xl p-6 text-center transition-all bg-slate-50/50 dark:bg-slate-900/40 cursor-pointer relative group flex flex-col items-center justify-center space-y-2.5"
                  >
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 group-hover:text-brand-500 group-hover:scale-105 transition-all duration-200">
                      <Upload size={22} />
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {t.restoreDropzone}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                        {t.restoreSelectFile}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Safety & Reset */}
        <div className="lg:col-span-1 space-y-6">

          {/* PWA / Mobil Kurulum Kartı */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-lg">📱</span>
              <span>{lang === 'tr' ? 'Mobil Kurulum' : 'Mobile Installation'}</span>
            </h3>

            {isAppInstalled ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-start gap-2.5">
                  <span className="text-base mt-0.5">✓</span>
                  <div className="text-xs leading-relaxed font-semibold">
                    {lang === 'tr'
                      ? 'MoneyMate şu anda cihazınızda kurulu ve yerel bir mobil uygulama olarak çalışıyor!'
                      : 'MoneyMate is currently installed and running as a native app!'}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed pl-1 font-medium">
                  {lang === 'tr'
                    ? 'Uygulamayı internet bağlantınız olmasa bile ana ekranınızdan anında açıp gelir/giderlerinizi takip etmeye devam edebilirsiniz.'
                    : 'You can launch the app instantly from your home screen even without an internet connection and track your finances.'}
                </p>
              </div>
            ) : isInstallable ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {lang === 'tr'
                    ? 'MoneyMate\'i telefonunuza veya bilgisayarınıza yerel bir uygulama gibi kurarak çok daha hızlı ve çevrimdışı (offline-first) kullanabilirsiniz.'
                    : 'Install MoneyMate as a native app on your phone or PC for a faster, offline-first experience.'}
                </p>
                <button
                  onClick={handleInstallApp}
                  className="premium-btn-primary w-full py-2.5 text-xs shadow-md shadow-brand-500/10 flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>📲</span>
                  <span>{lang === 'tr' ? 'Uygulamayı Yükle (PWA)' : 'Install App (PWA)'}</span>
                </button>
              </div>
            ) : isIOS ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {lang === 'tr'
                    ? 'MoneyMate\'i iPhone veya iPad cihazınıza yerel bir uygulama gibi yüklemek için Safari kurulum rehberimizi inceleyin.'
                    : 'View our Safari installation guide to install MoneyMate as a native app on your iPhone or iPad.'}
                </p>
                <button
                  onClick={() => setShowIosGuide(true)}
                  className="premium-btn-primary w-full py-2.5 text-xs bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/10 flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>📲</span>
                  <span>{lang === 'tr' ? 'iOS Kurulum Rehberi' : 'iOS Installation Guide'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {lang === 'tr'
                    ? 'Uygulamayı telefonunuza yüklemek için tarayıcınızın seçenekler menüsünden "Uygulamayı Yükle" veya "Ana Ekrana Ekle" seçeneğine tıklayabilirsiniz.'
                    : 'To install the app on your phone, you can click "Install App" or "Add to Home Screen" in your browser settings menu.'}
                </p>
                <div className="p-3.5 bg-violet-500/5 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-950/30 text-violet-600 dark:text-violet-400 rounded-xl flex items-start gap-2 text-[10px] leading-relaxed font-medium">
                  <span>💡</span>
                  <div>
                    {lang === 'tr'
                      ? 'Android cihazlarda Chrome, iOS cihazlarda ise Safari (Paylaş -> Ana Ekrana Ekle) üzerinden kurulum yapılması önerilir.'
                      : 'Chrome is recommended for Android, and Safari (Share -> Add to Home Screen) is recommended for iOS.'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile details */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <Shield size={18} className="text-emerald-500" />
              <span>{t.sessionInfo}</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 font-semibold">{t.sessionType}</span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${isDemo
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                    : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                  }`}>
                  {isDemo ? t.demoMode : t.cloudMode}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 font-semibold">{t.userAccount}</span>
                <span className="font-bold text-slate-800 dark:text-slate-300 truncate max-w-[140px]" title={user.email}>
                  {user.email}
                </span>
              </div>
            </div>
          </div>

          {/* Dangerous Zone */}
          <div className="rounded-2xl border border-red-200 dark:border-red-950 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-red-600 dark:text-red-400 text-base flex items-center space-x-2 pb-3 border-b border-red-100 dark:border-red-950/40">
              <Trash2 size={18} />
              <span>{t.dangerZone}</span>
            </h3>

            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              {t.dangerZoneDesc}
            </p>

            <div className="pt-1.5">
              <button
                onClick={() => setIsResetModalOpen(true)}
                className="premium-btn-danger w-full py-2.5 text-xs shadow-md shadow-red-500/10 flex items-center justify-center space-x-2"
              >
                <Trash2 size={14} />
                <span>{t.resetAllData}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* RESET CONFIRM MODAL */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title={t.confirmModalTitle}
        message={t.confirmModalMessage}
        confirmText={t.confirmModalConfirm}
        cancelText={t.confirmModalCancel}
        onConfirm={handleResetData}
        onCancel={() => setIsResetModalOpen(false)}
        isDangerous={true}
      />

      {/* iOS Safari Installation Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <X size={18} />
            </button>

            <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-3xl">📲</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                {lang === 'tr' ? 'iOS Cihazınıza Yükleyin' : 'Install MoneyMate on iOS'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'tr'
                  ? 'MoneyMate\'i ana ekranınıza eklemek için Safari\'de aşağıdaki adımları takip edin:'
                  : 'Follow these simple steps in Safari to add to your Home Screen:'}
              </p>
            </div>

            <div className="py-5 space-y-4 text-xs text-slate-600 dark:text-slate-300">
              {/* Step 1 */}
              <div className="flex items-start space-x-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                  1
                </span>
                <p className="leading-relaxed">
                  {lang === 'tr' ? (
                    <>Safari tarayıcısının altındaki araç çubuğunda bulunan <strong>Paylaş</strong> <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">📤</span> butonuna dokunun.</>
                  ) : (
                    <>Tap the <strong>Share</strong> button <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">📤</span> in the bottom toolbar of Safari.</>
                  )}
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                  2
                </span>
                <p className="leading-relaxed">
                  {lang === 'tr' ? (
                    <>Açılan menüde aşağı kaydırın ve <strong>Ana Ekrana Ekle</strong> <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">➕</span> seçeneğini seçin.</>
                  ) : (
                    <>Scroll down the share menu and select <strong>Add to Home Screen</strong> <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">➕</span>.</>
                  )}
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                  3
                </span>
                <p className="leading-relaxed">
                  {lang === 'tr' ? (
                    <>Sağ üst köşedeki <strong>Ekle</strong> butonuna dokunarak kurulumu tamamlayın.</>
                  ) : (
                    <>Tap <strong>Add</strong> in the top-right corner to complete the installation.</>
                  )}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 text-center">
              <button
                onClick={() => setShowIosGuide(false)}
                className="w-full premium-btn-primary py-2.5 text-xs font-semibold cursor-pointer"
              >
                {lang === 'tr' ? 'Anladım' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
