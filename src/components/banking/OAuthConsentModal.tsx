import React, { useState } from 'react';
import { Shield, Check, AlertCircle, X, Lock, RefreshCw } from 'lucide-react';
import { useOpenBanking, type BankTemplate } from '../../context/OpenBankingContext';
import { useAuth } from '../../context/AuthContext';

interface OAuthConsentModalProps {
  bank: BankTemplate;
  onClose: () => void;
  onSuccess: () => void;
}

export const OAuthConsentModal: React.FC<OAuthConsentModalProps> = ({ bank, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { connectBank } = useOpenBanking();

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [consentGiven, setConsentGiven] = useState({
    balances: true,
    history: true,
    categorize: true
  });

  const isEn = user?.lang === 'en';

  const steps = isEn ? [
    'Redirecting to secure bank authorization server...',
    'Authenticating client credentials and handshakes...',
    'Establishing secure OAuth 2.0 tunnel...',
    'Exchanging authorization code for secure access token...',
    'Encrypting credentials at rest using pgcrypto...',
    'Synchronizing bank accounts with Net Worth...'
  ] : [
    'Güvenli banka yetkilendirme sunucusuna yönlendiriliyor...',
    'MoneyMate istemci kimliği doğrulanıyor...',
    'Güvenli OAuth 2.0 bağlantı tüneli açılıyor...',
    'Yetki kodu Supabase Edge Functions ile Access Token ile takas ediliyor...',
    'Access Token pgcrypto şifrelemesi ile veritabanına kaydediliyor...',
    'Banka hesapları Varlıklarım (Net Değer) ile senkronize ediliyor...'
  ];

  const handleConnect = async () => {
    if (!consentGiven.balances || !consentGiven.history) {
      setErrorMsg(
        isEn
          ? 'You must authorize balance and transaction access to connect.'
          : 'Hesabı bağlayabilmek için bakiye ve işlem geçmişi erişim izinlerini onaylamalısınız.'
      );
      return;
    }

    setErrorMsg('');
    setLoading(true);
    setLoadingStep(0);

    // Simulate stepping through secure token handshakes
    const interval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 320);

    const result = await connectBank(bank.id);

    clearInterval(interval);

    if (result.success) {
      setLoading(false);
      onSuccess();
    } else {
      setLoading(false);
      setErrorMsg(result.error || (isEn ? 'Connection failed.' : 'Bağlantı kurulamadı.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Decorative Top Accent with Bank Color */}
        <div className="h-2 w-full" style={{ backgroundColor: bank.color }} />

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-sm leading-none shrink-0" style={{ border: `1px solid ${bank.color}30` }}>
              {bank.logo}
            </span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-none">
                {bank.bankName} {isEn ? 'Consent Access' : 'Yetkilendirme İzni'}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-1.5 leading-none">
                {isEn ? 'Open Banking OAuth 2.0 Integration' : 'Açık Bankacılık OAuth 2.0 Entegrasyonu'}
              </p>
            </div>
          </div>
          {!loading && (
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Loading Overlay */}
        {loading ? (
          <div className="p-8 py-14 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-200">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center">
                <span className="text-3xl leading-none animate-pulse">{bank.logo}</span>
              </div>
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-brand-500 animate-spin" />
            </div>

            <div className="space-y-2.5 max-w-xs mx-auto">
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center justify-center gap-2">
                <Lock size={14} className="text-brand-500 animate-pulse" />
                {isEn ? 'Establishing Secure Tunnel...' : 'Güvenli Bağlantı Kuruluyor...'}
              </h4>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">
                PSD2 / BKM STANDARDS ACTIVE
              </p>
            </div>

            {/* Handshake Stepper Logs */}
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 p-4 rounded-2xl w-full max-w-sm text-left leading-relaxed">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/50 dark:border-slate-850/40 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Handshake Log</span>
                <span className="text-brand-500 animate-pulse">SUPABASE_SECURE_TUNNEL</span>
              </div>
              <div className="space-y-1.5">
                {steps.slice(0, loadingStep + 1).map((step, idx) => {
                  const isCurrent = idx === loadingStep;
                  return (
                    <div key={idx} className="flex items-start space-x-2 text-[10px] leading-tight font-medium">
                      {isCurrent ? (
                        <RefreshCw size={10} className="text-brand-500 animate-spin mt-0.5 shrink-0" />
                      ) : (
                        <Check size={10} className="text-emerald-500 mt-0.5 shrink-0" />
                      )}
                      <span className={isCurrent ? 'text-slate-800 dark:text-slate-200 font-bold' : 'text-slate-400 dark:text-slate-500'}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            
            {/* Disclaimer Banner */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl flex items-start space-x-3">
              <Shield size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {isEn ? 'End-to-End Secure Consent' : 'Uçtan Uca Güvenli İzin Protokolü'}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {isEn
                    ? 'MoneyMate uses bank-approved Open Banking protocols. We never see, store, or ask for your password or credentials. Authentication is handled directly by your bank\'s secure OAuth login page.'
                    : 'MoneyMate, resmi Açık Bankacılık altyapılarını kullanır. Banka şifrenizi asla göremez, kaydedemez veya talep edemez. Giriş işlemi doğrudan bankanızın kendi resmi OAuth giriş ekranı üzerinden güvenle gerçekleşir.'}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs rounded-2xl flex items-center space-x-2.5">
                <AlertCircle size={16} className="shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* Checkbox Permission Items */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                {isEn ? 'Requested Permissions' : 'Talep Edilen Erişim İzinleri'}
              </h4>

              {/* Balances Perm */}
              <label className="flex items-start space-x-3.5 p-3.5 rounded-2xl border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer select-none transition-colors">
                <input
                  type="checkbox"
                  checked={consentGiven.balances}
                  onChange={(e) => setConsentGiven({ ...consentGiven, balances: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-500 border-slate-300 dark:border-slate-700 bg-transparent mt-0.5 cursor-pointer accent-brand-500"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    {isEn ? 'Read Account Balances' : 'Hesap Bakiyelerini Görüntüleme'}
                    <span className="text-[8px] bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-red-500 leading-none">
                      {isEn ? 'Required' : 'Zorunlu'}
                    </span>
                  </span>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
                    {isEn
                      ? 'Allows MoneyMate to fetch and update balances of checking, savings, and credit cards to update your Net Worth portfolio.'
                      : 'Bağlı hesaplarınızın anlık bakiye verilerini çekerek Varlıklarım (Net Değer) portföyünüzü otomatik güncellemeye yarar.'}
                  </p>
                </div>
              </label>

              {/* Transactions History Perm */}
              <label className="flex items-start space-x-3.5 p-3.5 rounded-2xl border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer select-none transition-colors">
                <input
                  type="checkbox"
                  checked={consentGiven.history}
                  onChange={(e) => setConsentGiven({ ...consentGiven, history: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-500 border-slate-300 dark:border-slate-700 bg-transparent mt-0.5 cursor-pointer accent-brand-500"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    {isEn ? 'Read Transactions History' : 'Hesap İşlemlerini Okuma'}
                    <span className="text-[8px] bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-red-500 leading-none">
                      {isEn ? 'Required' : 'Zorunlu'}
                    </span>
                  </span>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
                    {isEn
                      ? 'Allows MoneyMate to read your expense/income transactions log to import them automatically without manual input.'
                      : 'Harcama ve gelir işlemlerinizi otomatik çekerek elle işlem girme yükünü tamamen ortadan kaldırmayı sağlar.'}
                  </p>
                </div>
              </label>

              {/* Categorization Perm */}
              <label className="flex items-start space-x-3.5 p-3.5 rounded-2xl border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer select-none transition-colors">
                <input
                  type="checkbox"
                  checked={consentGiven.categorize}
                  onChange={(e) => setConsentGiven({ ...consentGiven, categorize: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-500 border-slate-300 dark:border-slate-700 bg-transparent mt-0.5 cursor-pointer accent-brand-500"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    {isEn ? 'Automated Smart Categorization' : 'Yapay Zeka & Akıllı Kategorilendirme'}
                    <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 leading-none">
                      {isEn ? 'Optional' : 'İsteğe Bağlı'}
                    </span>
                  </span>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
                    {isEn
                      ? 'Uses rule-based regex models to analyze transaction descriptions and assign categories (e.g. Migros -> Groceries).'
                      : 'İşlem açıklamalarını taranarak (Örn: Migros) otomatik olarak doğru kategorilere (Yemek, Market vb.) atanmasını tetikler.'}
                  </p>
                </div>
              </label>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center gap-3.5 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-xs select-none">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition-all active:scale-[0.98] cursor-pointer"
              >
                {isEn ? 'Cancel' : 'İptal Et'}
              </button>
              
              <button
                onClick={handleConnect}
                className="flex-1 py-3 rounded-2xl text-white font-bold transition-all shadow-md active:scale-[0.98] hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
                style={{
                  backgroundColor: bank.color,
                  boxShadow: `0 4px 14px ${bank.color}25`
                }}
              >
                <Lock size={13} />
                <span>{isEn ? 'Secure Connect' : 'Güvenli Bağlantı Kur'}</span>
              </button>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};
