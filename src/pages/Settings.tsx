import React, { useState, useMemo } from 'react';
import { Settings as SettingsIcon, Shield, Trash2, Moon, Sun, Monitor, DollarSign, Brain, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { formatCurrency } from '../utils/formatters';

export const Settings: React.FC = () => {
  const { user, updateProfile, isDemo } = useAuth();
  const { transactions, resetAllData } = useData();
  const currency = user?.currency || 'TRY';

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // AI Coach state
  const [showAiReport, setShowAiReport] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  if (!user) return null;

  // Change Currency
  const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await updateProfile({ currency: e.target.value as any });
    setSuccessMsg('Para birimi tercihi başarıyla güncellendi.');
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
    
    setSuccessMsg('Tema tercihi başarıyla güncellendi.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Data reset confirmed
  const handleResetData = async () => {
    await resetAllData();
    setIsResetModalOpen(false);
    setSuccessMsg('Tüm veriler başarıyla sıfırlandı ve demo mod şablonu yüklendi.');
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
        // Mock category group, we can just use category ID or mock
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
      return "Henüz hesaplanacak bir finansal işlem girmediniz. Lütfen analiz yapabilmem için öncelikle gelir ve gider işlemlerinizi ekleyin!";
    }

    let report = `### 📊 MoneyMate AI Finansal Sağlık Analizi\n\n`;
    report += `Toplam geliriniz **${formatCurrency(totalInc, currency)}**, harcamalarınız ise **${formatCurrency(totalExp, currency)}** seviyesinde.\n\n`;
    
    if (netSavings < 0) {
      report += `⚠️ **Kritik Durum:** Bu dönem giderleriniz, gelirlerinizden **${formatCurrency(Math.abs(netSavings), currency)}** daha fazla. Bütçeniz **açık veriyor**.\n\n`;
      report += `💡 **Tavsiye:** Esnek harcamalarınızı (Örn: Eğlence, Market) hemen gözden geçirin. Harcama yapmadan önce 'Bütçe Planı' oluşturmanız ve limitleri aşmamanız kritik önem taşıyor.\n`;
    } else {
      report += `📈 **Tasarruf Durumu:** Tasarruf oranınız **%${rate}** seviyesinde. Yani kazancınızın beşte birinden fazlasını başarıyla biriktiriyorsunuz. Harika bir iş çıkarıyorsunuz!\n\n`;
      if (rate >= 30) {
        report += `🌟 **Mükemmel Oran:** %30 ve üzeri tasarruf oranları finansal bağımsızlık için altın standarttır. Biriken bu tutarları acil durum fonu oluşturmak veya pasif gelir getirecek yatırım araçlarında (Fon, Hisse Senedi vb.) değerlendirmeyi düşünebilirsiniz.\n`;
      } else {
        report += `💡 **Gelişim Alanı:** Birikim oranınızı %20 seviyesine çıkarmak için sabit aboneliklerinizi (Netflix, Spotify, bulut depolama vb.) sadeleştirmeyi ve küçük günlük harcamaları azaltmayı (Kahve, dışarıdan yemek siparişi vb.) deneyebilirsiniz.\n`;
      }
    }

    if (topCatId) {
      // Mock lookup for category name
      const names: { [key: string]: string } = {
        'cat-expense-kira': 'Kira ve Konut',
        'cat-expense-market': 'Gıda ve Süpermarket',
        'cat-expense-eglence': 'Eğlence ve Kültür',
        'cat-expense-fatura': 'Faturalar',
      };
      const cName = names[topCatId] || 'Değişken Giderler';
      report += `\n🔍 **En Yüksek Harcama:** En büyük harcama kalemi **${cName}** olarak görünüyor. Bu kategori toplam bütçenizi en çok baskılayan kalem. Gelecek ay bu kategoride bütçe limiti belirleyerek harcamaları sınırlandırmak akıllıca olacaktır.`;
    }

    return report;
  }, [transactions, currency]);

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
          Sistem Ayarları
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Hesap tercihlerinizi, para birimini, temayı düzenleyin ve finans analizlerinizi yönetin.
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
              <span>Görünüm ve Tercihler</span>
            </h3>

            {/* Currency select */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                Varsayılan Para Birimi
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
                Uygulama Teması
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`py-3 px-4 rounded-xl border font-semibold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    user.theme === 'light'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-650'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-55 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Sun size={18} />
                  <span>Açık Tema</span>
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`py-3 px-4 rounded-xl border font-semibold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    user.theme === 'dark'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-650'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-55 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Moon size={18} />
                  <span>Karanlık Tema</span>
                </button>
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`py-3 px-4 rounded-xl border font-semibold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    user.theme === 'system'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-650'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-55 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Monitor size={18} />
                  <span>Sistem</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI COACH SECTION */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <Brain size={18} className="text-indigo-500" />
              <span>Yapay Zeka Destekli Finans Koçu</span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-405 leading-relaxed">
              Mevcut finansal işlemlerinizi, harcama alışkanlıklarınızı ve tasarruf oranınızı analiz ederek size özel finansal kararlar ve birikim tavsiyeleri sunar.
            </p>

            {/* Analysis triggers */}
            <div className="pt-1">
              <button
                onClick={triggerAiAnalysis}
                className="premium-btn-primary bg-indigo-650 hover:bg-indigo-700 focus:ring-indigo-500 flex items-center space-x-2 py-2 px-4 text-xs font-semibold shadow-md shadow-indigo-500/10"
                disabled={aiLoading}
              >
                {aiLoading ? <RefreshCw size={14} className="animate-spin" /> : <Brain size={14} />}
                <span>Finansal Analiz Oluştur</span>
              </button>
            </div>

            {/* Output markdown */}
            {aiLoading && (
              <div className="p-8 text-center text-xs font-semibold text-indigo-500 dark:text-indigo-400 space-y-2 animate-pulse bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-950/20">
                <RefreshCw size={24} className="animate-spin mx-auto text-indigo-500" />
                <p>İşlemleriniz toparlanıyor, bütçe analizleri yapılıyor...</p>
              </div>
            )}

            {showAiReport && (
              <div className="p-5 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-950/30 text-slate-850 dark:text-slate-200 text-xs leading-relaxed space-y-3.5 animate-in slide-in-from-top-2 duration-300">
                <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-350 space-y-2 whitespace-pre-line">
                  {aiAdviceText}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Safety & Reset */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile details */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <Shield size={18} className="text-emerald-500" />
              <span>Oturum Bilgileri</span>
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 font-semibold">Oturum Tipi:</span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                  isDemo 
                    ? 'bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400' 
                    : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {isDemo ? 'Demo LocalStorage' : 'Supabase Bulut'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 font-semibold">Kullanıcı Hesabı:</span>
                <span className="font-bold text-slate-800 dark:text-slate-250 truncate max-w-[140px]" title={user.email}>
                  {user.email}
                </span>
              </div>
            </div>
          </div>

          {/* Dangerous Zone */}
          <div className="rounded-2xl border border-red-200 dark:border-red-950 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-red-600 dark:text-red-400 text-base flex items-center space-x-2 pb-3 border-b border-red-100 dark:border-red-950/40">
              <Trash2 size={18} />
              <span>Tehlikeli Bölge</span>
            </h3>
            
            <p className="text-xs text-slate-450 dark:text-slate-500 leading-relaxed">
              Tüm bütçe limitlerinizi, harcama kayıtlarınızı ve oluşturduğunuz özel kategorileri sıfırlayabilirsiniz. Bu işlem geri alınamaz.
            </p>

            <div className="pt-1.5">
              <button
                onClick={() => setIsResetModalOpen(true)}
                className="premium-btn-danger w-full py-2.5 text-xs shadow-md shadow-red-500/10 flex items-center justify-center space-x-2"
              >
                <Trash2 size={14} />
                <span>Tüm Verileri Sıfırla</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* RESET CONFIRM MODAL */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Tüm Finansal Veriler Sıfırlansın mı?"
        message="MoneyMate üzerindeki tüm gelirleriniz, giderleriniz ve belirlediğiniz bütçe limitleriniz kalıcı olarak silinecektir. Uygulama ilk günkü varsayılan durumuna (seed verileriyle) geri dönecektir. Devam etmek istiyor musunuz?"
        confirmText="Verileri Kalıcı Olarak Sıfırla"
        onConfirm={handleResetData}
        onCancel={() => setIsResetModalOpen(false)}
        isDangerous={true}
      />

    </div>
  );
};

export default Settings;
