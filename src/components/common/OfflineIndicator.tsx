import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [showStatus, setShowStatus] = useState(false);
  const [justCameBack, setJustCameBack] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setJustCameBack(true);
      setShowStatus(true);
      
      // İnternet geri geldiğinde 4 saniye sonra bildirimi gizle
      const timer = setTimeout(() => {
        setShowStatus(false);
        setJustCameBack(false);
      }, 4000);
      
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setJustCameBack(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Eğer sayfa açıldığında çevrimdışıysa hemen göster
    if (!navigator.onLine) {
      setShowStatus(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border backdrop-blur-md transition-all duration-500 ease-out animate-bounce-subtle max-w-sm w-[90%] md:w-auto
      ${justCameBack 
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
        : 'bg-slate-900/80 dark:bg-slate-950/80 border-violet-500/30 text-slate-100'
      }"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 
          ${justCameBack 
            ? 'bg-emerald-500/20 text-emerald-400' 
            : 'bg-violet-500/20 text-violet-400 animate-pulse'
          }`}
        >
          {justCameBack ? (
            <Wifi className="w-5 h-5" />
          ) : (
            <WifiOff className="w-5 h-5" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold tracking-wide">
            {justCameBack ? 'Tekrar Çevrimiçisiniz' : 'Çevrimdışı Mod'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 leading-relaxed truncate-2-lines">
            {justCameBack 
              ? 'Verileriniz sunucuyla güvenle senkronize ediliyor.' 
              : 'İnternet kesildi. Yerel verilerinizle güvenle devam edebilirsiniz.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};
