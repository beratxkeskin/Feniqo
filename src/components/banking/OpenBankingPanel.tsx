import React, { useState } from 'react';
import { 
  RefreshCw, 
  Trash2, 
  ShieldCheck, 
  ToggleLeft, 
  ToggleRight, 
  Building,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useOpenBanking, type BankTemplate } from '../../context/OpenBankingContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { OAuthConsentModal } from './OAuthConsentModal';

export const OpenBankingPanel: React.FC = () => {
  const { user } = useAuth();
  const { 
    connectedBanks, 
    bankTemplates, 
    isSyncingAll, 
    autoSyncEnabled, 
    syncBankNow, 
    syncAllBanks, 
    disconnectBank, 
    toggleAutoSync 
  } = useOpenBanking();

  const [selectedBank, setSelectedBank] = useState<BankTemplate | null>(null);
  const [marketFilter, setMarketFilter] = useState<'TR' | 'GLOBAL'>(() => {
    return user?.currency === 'TRY' ? 'TR' : 'GLOBAL';
  });

  const [activeSyncing, setActiveSyncing] = useState<Record<string, boolean>>({});

  const isEn = user?.lang === 'en';

  const availableTemplates = bankTemplates.filter(b => b.market === marketFilter);

  const handleSyncBank = async (bankId: string) => {
    setActiveSyncing(prev => ({ ...prev, [bankId]: true }));
    await syncBankNow(bankId);
    setActiveSyncing(prev => ({ ...prev, [bankId]: false }));
  };

  const handleDisconnect = async (bankId: string, name: string) => {
    const confirmMsg = isEn 
      ? `Are you sure you want to disconnect ${name}? This will remove all associated accounts from your Net Worth.`
      : `${name} bağlantısını kesmek istediğinizden emin misiniz? Bu işlem, ilişkili tüm hesapları Varlıklarım (Net Değer) listesinden kaldıracaktır.`;
    
    if (window.confirm(confirmMsg)) {
      await disconnectBank(bankId);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner Control Panel */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <div className="space-y-1.5 z-10">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="text-brand-500 w-5.5 h-5.5" />
            <span>{isEn ? 'Automatic Sync Engine' : 'Otomatik Senkronizasyon Motoru'}</span>
            <span className="text-[9px] uppercase tracking-widest bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full font-bold">
              {isEn ? 'AI-Powered' : 'Akıllı Sistem'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xl">
            {isEn 
              ? 'When enabled, MoneyMate runs simulated background cron jobs every 40 seconds to sync new transactions from connected banks, dynamically updates balances, and triggers screen toast alerts.'
              : 'Aktif edildiğinde MoneyMate, bağlı bankalarınızdan her 40 saniyede bir simüle edilmiş arka plan işlemleri çeker, cüzdan bakiyelerinizi anlık günceller ve ekran bildirimleri tetikler.'}
          </p>
        </div>

        <div className="flex items-center space-x-4 shrink-0 z-10">
          <div className="flex flex-col items-end leading-none select-none">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
              {autoSyncEnabled ? (isEn ? 'Auto-Sync Active' : 'Otomatik Eşitleme Açık') : (isEn ? 'Auto-Sync Inactive' : 'Otomatik Eşitleme Kapalı')}
            </span>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">
              {isEn ? 'DEMO SIMULATOR MODE' : 'DEMO SİMÜLATÖRÜ ETKİN'}
            </span>
          </div>

          <button 
            onClick={toggleAutoSync}
            className="text-brand-500 hover:text-brand-600 focus:outline-none transition-transform active:scale-95 cursor-pointer"
          >
            {autoSyncEnabled ? (
              <ToggleRight size={38} className="text-brand-600 dark:text-brand-400" />
            ) : (
              <ToggleLeft size={38} className="text-slate-300 dark:text-slate-700" />
            )}
          </button>
        </div>
      </div>

      {/* Connected Banks Listing */}
      {connectedBanks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2">
              <CheckCircle2 className="text-emerald-500" size={18} />
              <span>{isEn ? 'Connected Bank Accounts' : 'Senkronize Banka Hesapları'}</span>
              <span className="text-xs font-black bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-600 dark:text-emerald-400 font-mono">
                {connectedBanks.length}
              </span>
            </h3>
            
            <button
              onClick={syncAllBanks}
              disabled={isSyncingAll}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 hover:underline flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={12} className={isSyncingAll ? 'animate-spin' : ''} />
              <span>{isEn ? 'Sync All' : 'Tüm Hesapları Güncelle'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {connectedBanks.map((bank) => {
              const isSyncing = activeSyncing[bank.id] || bank.status === 'syncing';
              return (
                <div 
                  key={bank.id} 
                  className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow"
                >
                  {/* Subtle Bank Branding Side Line */}
                  <div className="absolute top-0 bottom-0 left-0 w-1.5" style={{ backgroundColor: bank.color }} />

                  {/* Bank Header */}
                  <div className="flex items-center justify-between pl-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xl p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800/40">
                        {bank.logo}
                      </span>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-150 leading-none">
                          {bank.bankName}
                        </h4>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5 inline-block leading-none">
                          OAuth 2.0 • PSD2 SECURE
                        </span>
                      </div>
                    </div>

                    {/* Glowing Sync Badge & Action buttons */}
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1.5 bg-emerald-500/5 border border-emerald-500/25 px-2 py-0.5 rounded-lg text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                        <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isSyncing ? 'animate-ping' : 'animate-pulse'}`} />
                        <span>{isSyncing ? (isEn ? 'Syncing' : 'Eşitleniyor') : (isEn ? 'Synced' : 'Eşitlendi')}</span>
                      </div>

                      <button
                        onClick={() => handleSyncBank(bank.id)}
                        disabled={isSyncing}
                        className="p-1.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-brand-500 dark:hover:text-brand-400 border border-slate-200/40 dark:border-slate-800/50 rounded-xl transition-all disabled:opacity-50 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                        title={isEn ? 'Sync Account Now' : 'Hesabı Şimdi Güncelle'}
                      >
                        <RefreshCw size={13} className={isSyncing ? 'animate-spin text-brand-500' : ''} />
                      </button>

                      <button
                        onClick={() => handleDisconnect(bank.id, bank.bankName)}
                        className="p-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded-xl border border-slate-200/40 dark:border-slate-800/50 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                        title={isEn ? 'Disconnect Bank' : 'Banka Bağlantısını Kes'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Bank Accounts Sub-list */}
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/60 pt-3.5 flex-1">
                    {bank.accounts.map((acc) => (
                      <div 
                        key={acc.id} 
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-150/40 dark:border-slate-850/40 leading-none group/acc"
                      >
                        <div className="space-y-1 min-w-0 pr-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate leading-tight">
                            {acc.name}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono tracking-wider">
                            {acc.number}
                          </span>
                        </div>
                        <strong className="text-sm font-extrabold text-slate-800 dark:text-white shrink-0 font-mono">
                          {formatCurrency(acc.balance, acc.currency)}
                        </strong>
                      </div>
                    ))}
                  </div>

                  {/* Connection Footer Status */}
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider pl-1 mt-1">
                    <span>LAST SYNC: {bank.lastSyncedAt}</span>
                    <span className="flex items-center gap-1">
                      <Lock size={9} />
                      <span>SSL 256-BIT ENCRYPTION</span>
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Banks for Linking */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2">
            <Building className="text-brand-500" size={18} />
            <span>{isEn ? 'Link New Bank Account' : 'Banka Hesabı Bağla'}</span>
            <span className="text-xs font-semibold text-slate-400">
              {isEn ? 'Select your financial institution' : 'Entegrasyon kurmak istediğiniz bankayı seçin'}
            </span>
          </h3>

          {/* Market filter tabs switcher */}
          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/40 dark:border-slate-800/60 flex items-center shadow-inner sm:self-center">
            <button
              onClick={() => setMarketFilter('TR')}
              className={`py-1.5 px-3 rounded-lg text-[10px] font-black tracking-wider transition-all duration-200 select-none cursor-pointer ${
                marketFilter === 'TR'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm scale-[1.02]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Türkiye (PSD2)
            </button>
            <button
              onClick={() => setMarketFilter('GLOBAL')}
              className={`py-1.5 px-3 rounded-lg text-[10px] font-black tracking-wider transition-all duration-200 select-none cursor-pointer ${
                marketFilter === 'GLOBAL'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm scale-[1.02]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Global (Plaid)
            </button>
          </div>
        </div>

        {availableTemplates.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/20 text-slate-400">
            <Building size={32} className="mx-auto opacity-40 mb-2" />
            <p className="text-xs font-medium">{isEn ? 'No banks found in this region.' : 'Bu bölgede eklenebilecek banka bulunamadı.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableTemplates.map((bank) => {
              const isConnected = connectedBanks.some(b => b.id === bank.id);
              return (
                <button
                  key={bank.id}
                  disabled={isConnected}
                  onClick={() => setSelectedBank(bank)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-32 relative overflow-hidden group transition-all select-none ${
                    isConnected 
                      ? 'bg-slate-50 dark:bg-slate-850 opacity-50 border-slate-250 dark:border-slate-800 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm cursor-pointer active:scale-98 hover:-translate-y-0.5'
                  }`}
                >
                  {/* Bank Brand Glow on hover */}
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-350 pointer-events-none" style={{ backgroundColor: bank.color }} />

                  {/* Logo Indicator */}
                  <div className="flex items-center justify-between w-full">
                    <span className="text-2xl p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl leading-none border border-slate-100 dark:border-slate-800/40">
                      {bank.logo}
                    </span>
                    
                    {!isConnected && (
                      <span className="text-[10px] font-black text-slate-400 group-hover:text-brand-500 transition-colors p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="leading-tight mt-auto z-10 w-full">
                    <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                      {bank.bankName}
                    </span>
                    <span className="text-[9px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest mt-1 block truncate">
                      {isConnected 
                        ? (isEn ? 'Already Synced' : 'Hesap Bağlı') 
                        : (isEn ? 'Secure Connect' : 'Güvenli Bağla')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* OAuth Consent Simulation Modal overlay */}
      {selectedBank && (
        <OAuthConsentModal 
          bank={selectedBank}
          onClose={() => setSelectedBank(null)}
          onSuccess={() => {
            setSelectedBank(null);
            // Dynamic sync can run automatically when a bank connects
          }}
        />
      )}

      {/* Privacy Guarantee Note */}
      <div className="p-4 bg-indigo-500/5 dark:bg-indigo-500/5 border border-indigo-200/30 dark:border-indigo-800/20 text-indigo-750 dark:text-indigo-400 rounded-2xl flex items-center justify-center gap-2 max-w-lg mx-auto text-[10px] font-black uppercase tracking-wider text-center">
        <Lock size={12} className="text-indigo-500" />
        <span>We do not store your credentials. OAuth flow complies with PCI-DSS & BKM PSD2 standards.</span>
      </div>

    </div>
  );
};
