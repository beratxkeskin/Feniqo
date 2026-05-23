import React, { useState, useMemo } from 'react';
import { Settings as SettingsIcon, Shield, Trash2, Moon, Sun, Monitor, DollarSign, Brain, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { formatCurrency } from '../utils/formatters';

const translations = {
  tr: {
    title: 'Sistem Ayarları',
    subtitle: 'Hesap tercihlerinizi, para birimini, temayı düzenleyin ve finans analizlerinizi yönetin.',
    currencyUpdated: 'Para birimi tercihi başarıyla güncellendi.',
    themeUpdated: 'Tema tercihi başarıyla güncellendi.',
    langUpdated: 'Dil tercihi başarıyla güncellendi.',
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
    aiCoachTitle: 'Yapay Zeka Destekli Finans Koçu',
    aiCoachDesc: 'Mevcut finansal işlemlerinizi, harcama alışkanlıklarınızı ve tasarruf oranınızı analiz ederek size özel finansal kararlar ve birikim tavsiyeleri sunar.',
    generateAnalysis: 'Finansal Analiz Oluştur',
    gatheringData: 'İşlemleriniz toparlanıyor, bütçe analizleri yapılıyor...',
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
    aiReportTitle: '### 📊 MoneyMate AI Finansal Sağlık Analizi\n\n',
    aiReportSummary: 'Toplam geliriniz **{totalInc}**, harcamalarınız ise **{totalExp}** seviyesinde.\n\n',
    aiCriticalWarning: '⚠️ **Kritik Durum:** Bu dönem giderleriniz, gelirlerinizden **{netSavings}** daha fazla. Bütçeniz **açık veriyor**.\n\n',
    aiCriticalAdvice: '💡 **Tavsiye:** Esnek harcamalarınızı (Örn: Eğlence, Market) hemen gözden geçirin. Harcama yapmadan önce \'Bütçe Planı\' oluşturmanız ve limitleri aşmamanız kritik önem taşıyor.\n',
    aiSavingsStatus: '📈 **Tasarruf Durumu:** Tasarruf oranınız **%{rate}** seviyesinde. Yani kazancınızın beşte birinden fazlasını başarıyla biriktiriyorsunuz. Harika bir iş çıkarıyorsunuz!\n\n',
    aiExcellentRate: '🌟 **Mükemmel Oran:** %30 ve üzeri tasarruf oranları finansal bağımsızlık için altın standarttır. Biriken bu tutarları acil durum fonu oluşturmak veya pasif gelir getirecek yatırım araçlarında (Fon, Hisse Senedi vb.) değerlendirmeyi düşünebilirsiniz.\n',
    aiImprovementRate: '💡 **Gelişim Alanı:** Birikim oranınızı %20 seviyesine çıkarmak için sabit aboneliklerinizi (Netflix, Spotify, bulut depolama vb.) sadeleştirmeyi ve küçük günlük harcamaları azaltmayı (Kahve, dışarıdan yemek siparişi vb.) deneyebilirsiniz.\n',
    aiHighestExpense: '\n🔍 **En Yüksek Harcama:** En büyük harcama kalemi **{cName}** olarak görünüyor. Bu kategori toplam bütçenizi en çok baskılayan kalem. Gelecek ay bu kategoride bütçe limiti belirleyerek harcamaları sınırlandırmak akıllıca olacaktır.',
    categories: {
      'cat-expense-kira': 'Kira ve Konut',
      'cat-expense-market': 'Gıda ve Süpermarket',
      'cat-expense-eglence': 'Eğlence ve Kültür',
      'cat-expense-fatura': 'Faturalar',
      'default': 'Değişken Giderler'
    } as Record<string, string>
  },
  en: {
    title: 'System Settings',
    subtitle: 'Manage your account preferences, default currency, visual theme, and financial analysis.',
    currencyUpdated: 'Currency preference updated successfully.',
    themeUpdated: 'Theme preference updated successfully.',
    langUpdated: 'Language preference updated successfully.',
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
    aiCoachTitle: 'AI-Powered Finance Coach',
    aiCoachDesc: 'Analyzes your current financial transactions, spending patterns, and savings rate to provide personalized financial insights and savings advice.',
    generateAnalysis: 'Generate Financial Analysis',
    gatheringData: 'Gathering your transactions, running budget analysis...',
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
    aiReportTitle: '### 📊 MoneyMate AI Financial Health Analysis\n\n',
    aiReportSummary: 'Your total income is **{totalInc}**, and your expenses are at **{totalExp}**.\n\n',
    aiCriticalWarning: '⚠️ **Critical Situation:** Your expenses for this period exceed your income by **{netSavings}**. Your budget is **running a deficit**.\n\n',
    aiCriticalAdvice: '💡 **Advice:** Review your flexible expenses (e.g. Entertainment, Supermarket) immediately. Creating a \'Budget Plan\' before spending and staying within limits is critical.\n',
    aiSavingsStatus: '📈 **Savings Status:** Your savings rate is at **{rate}%**. In other words, you are successfully saving more than one-fifth of your earnings. Great job!\n\n',
    aiExcellentRate: '🌟 **Excellent Rate:** Savings rates of 30% and above are the gold standard for financial independence. You might consider using these accumulated savings to build an emergency fund or invest in passive income generators (Funds, Stocks, etc.).\n',
    aiImprovementRate: '💡 **Area for Improvement:** To increase your savings rate to the 20% level, you could simplify your fixed subscriptions (Netflix, Spotify, cloud storage, etc.) and reduce minor daily expenses (coffee, food delivery, etc.).\n',
    aiHighestExpense: '\n🔍 **Highest Expense:** Your largest expense category appears to be **{cName}**. This category is putting the most pressure on your overall budget. Setting a budget limit for this category next month will be a smart way to limit expenses.',
    categories: {
      'cat-expense-kira': 'Rent & Housing',
      'cat-expense-market': 'Food & Supermarket',
      'cat-expense-eglence': 'Entertainment & Culture',
      'cat-expense-fatura': 'Bills',
      'default': 'Variable Expenses'
    } as Record<string, string>
  }
};

export const Settings: React.FC = () => {
  const { user, updateProfile, isDemo } = useAuth();
  const { transactions, resetAllData } = useData();
  const currency = user?.currency || 'TRY';
  const lang = user?.lang || 'tr';
  const t = translations[lang];

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  React.useEffect(() => {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install choice: ${outcome}`);
    setDeferredPrompt(null);
  };
  
  // AI Coach state
  const [showAiReport, setShowAiReport] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

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

  if (!user) return null;

  // Change Currency
  const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await updateProfile({ currency: e.target.value as any });
    setSuccessMsg(t.currencyUpdated);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Change Theme
  const handleThemeChange = async (themeName: 'light' | 'dark' | 'system') => {
    await updateProfile({ theme: themeName });
    
    // Apply class to html element
    if (themeName === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('moneymate_applied_theme', 'dark');
    } else if (themeName === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('moneymate_applied_theme', 'light');
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.removeItem('moneymate_applied_theme');
    }
    
    setSuccessMsg(t.themeUpdated);
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
  const aiAdviceText = useMemo(() => {
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

    // Custom text output
    if (transactions.length === 0) {
      return t.aiNoTransactions;
    }

    let report = t.aiReportTitle;
    report += t.aiReportSummary
      .replace('{totalInc}', formatCurrency(totalInc, currency))
      .replace('{totalExp}', formatCurrency(totalExp, currency));
    
    if (netSavings < 0) {
      report += t.aiCriticalWarning.replace('{netSavings}', formatCurrency(Math.abs(netSavings), currency));
      report += t.aiCriticalAdvice;
    } else {
      report += t.aiSavingsStatus.replace('{rate}', String(rate));
      if (rate >= savingsTarget + 10) {
        report += t.aiExcellentRate;
      } else {
        report += t.aiImprovementRate
          .replace('20%', `${savingsTarget}%`)
          .replace('%20', `%${savingsTarget}`);
      }
    }

    if (topCatId) {
      const cName = t.categories[topCatId] || t.categories['default'];
      report += t.aiHighestExpense.replace('{cName}', cName);
    }

    return report;
  }, [transactions, currency, t, savingsTarget]);

  const triggerAiAnalysis = () => {
    setAiLoading(true);
    setShowAiReport(false);
    setTimeout(() => {
      setAiLoading(false);
      setShowAiReport(true);
    }, 1200);
  };

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

            {/* Currency select */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                {t.defaultCurrency}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <DollarSign size={16} />
                </div>
                <select
                  value={currency}
                  onChange={handleCurrencyChange}
                  className="premium-input pl-10 appearance-none bg-no-repeat cursor-pointer text-sm"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
                >
                  <option value="TRY">Türk Lirası (TRY - ₺)</option>
                  <option value="USD">Amerikan Doları (USD - $)</option>
                  <option value="EUR">Euro (EUR - €)</option>
                </select>
              </div>
            </div>

            {/* Theme selector buttons */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                {t.appTheme}
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`py-3 px-4 rounded-xl border font-semibold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    user.theme === 'light'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Sun size={18} />
                  <span>{t.lightTheme}</span>
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`py-3 px-4 rounded-xl border font-semibold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    user.theme === 'dark'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Moon size={18} />
                  <span>{t.darkTheme}</span>
                </button>
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`py-3 px-4 rounded-xl border font-semibold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    user.theme === 'system'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Monitor size={18} />
                  <span>{t.systemTheme}</span>
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
                  className={`py-3 px-4 rounded-xl border font-semibold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    lang === 'tr'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span className="text-base" role="img" aria-label="Turkey">🇹🇷</span>
                  <span>{t.turkish}</span>
                </button>
                <button
                  onClick={() => handleLangChange('en')}
                  className={`py-3 px-4 rounded-xl border font-semibold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    lang === 'en'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span className="text-base" role="img" aria-label="United States">🇺🇸</span>
                  <span>{t.english}</span>
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

          </div>

          {/* AI COACH SECTION */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <Brain size={18} className="text-indigo-500" />
              <span>{t.aiCoachTitle}</span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.aiCoachDesc}
            </p>

            {/* Analysis triggers */}
            <div className="pt-1">
              <button
                onClick={triggerAiAnalysis}
                className="premium-btn-primary bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 flex items-center space-x-2 py-2 px-4 text-xs font-semibold shadow-md shadow-indigo-500/10"
                disabled={aiLoading}
              >
                {aiLoading ? <RefreshCw size={14} className="animate-spin" /> : <Brain size={14} />}
                <span>{t.generateAnalysis}</span>
              </button>
            </div>

            {/* Output markdown */}
            {aiLoading && (
              <div className="p-8 text-center text-xs font-semibold text-indigo-500 dark:text-indigo-400 space-y-2 animate-pulse bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-950/20">
                <RefreshCw size={24} className="animate-spin mx-auto text-indigo-500" />
                <p>{t.gatheringData}</p>
              </div>
            )}

            {showAiReport && (
              <div className="p-5 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-950/30 text-slate-800 dark:text-slate-200 text-xs leading-relaxed space-y-3.5 animate-in slide-in-from-top-2 duration-300">
                <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 space-y-2 whitespace-pre-line">
                  {aiAdviceText}
                </div>
              </div>
            )}
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
                      ? 'MoneyMate şu anda telefonunuzda kurulu ve yerel bir mobil uygulama olarak çalışıyor!' 
                      : 'MoneyMate is currently installed and running as a native mobile app!'}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed pl-1 font-medium">
                  {lang === 'tr'
                    ? 'Uygulamayı internet bağlantınız olmasa bile ana ekranınızdan anında açıp gelir/giderlerinizi takip etmeye devam edebilirsiniz.'
                    : 'You can launch the app instantly from your home screen even without an internet connection and track your finances.'}
                </p>
              </div>
            ) : deferredPrompt ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {lang === 'tr'
                    ? 'MoneyMate\'i telefonunuza yerel bir uygulama gibi kurarak çok daha hızlı ve çevrimdışı (offline-first) kullanabilirsiniz.'
                    : 'Install MoneyMate as a native app on your phone for a faster, offline-first experience.'}
                </p>
                <button
                  onClick={handleInstallApp}
                  className="premium-btn-primary w-full py-2.5 text-xs shadow-md shadow-brand-500/10 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>📲</span>
                  <span>{lang === 'tr' ? 'Telefonuma Kur (PWA)' : 'Install on my Phone'}</span>
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
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                  isDemo 
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

    </div>
  );
};

export default Settings;
