import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ArrowUpDown, 
  PieChart, 
  FolderTree, 
  BarChart3, 
  Settings, 
  LogOut,
  Repeat,
  Target,
  Coins,
  CalendarClock,
  Users,
  Briefcase,
  Smartphone,
  X,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { WorkspaceSelector } from './WorkspaceSelector';
import { usePWA } from '../../utils/pwaStore';

interface SidebarProps {
  currentHash: string;
  onNavigate: (hash: string) => void;
  hasUnread: boolean;
  onOpenNotifications: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentHash, onNavigate, hasUnread, onOpenNotifications }) => {
  const { user, signOut, isDemo } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useData();
  const { isInstallable, isInstalled, install } = usePWA();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const isEn = user?.lang === 'en';

  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAppInstalled = isInstalled || (typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone));
  const showInstallButton = !isAppInstalled;

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowInstallGuide(true);
    }
  };

  const getDeviceType = () => {
    if (isIOS) return 'ios';
    const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) return 'android';
    return 'desktop';
  };

  const deviceType = getDeviceType();

  const menuItems = [
    { name: 'Dashboard', hash: '#/dashboard', icon: LayoutDashboard },
    { name: isEn ? 'Transactions' : 'İşlemler', hash: '#/transactions', icon: ArrowUpDown },
    { name: isEn ? 'Shared Budget' : 'Ortak Bütçe', hash: '#/workspace', icon: Users },
    { name: isEn ? 'Recurring' : 'Tekrarlayanlar', hash: '#/recurring', icon: Repeat },
    { name: isEn ? 'Subscriptions' : 'Abonelikler', hash: '#/subscriptions', icon: CalendarClock },
    { name: isEn ? 'Budgets' : 'Bütçeler', hash: '#/budgets', icon: PieChart },
    { name: isEn ? 'Goals' : 'Hedefler', hash: '#/goals', icon: Target },
    { name: isEn ? 'Debts & Receivables' : 'Borç & Alacak', hash: '#/debts', icon: Coins },
    { name: isEn ? 'Net Worth' : 'Varlıklarım', hash: '#/networth', icon: Briefcase },
    { name: isEn ? 'Categories' : 'Kategoriler', hash: '#/categories', icon: FolderTree },
    { name: isEn ? 'Reports' : 'Raporlar', hash: '#/reports', icon: BarChart3 },
    { name: isEn ? 'Settings' : 'Ayarlar', hash: '#/settings', icon: Settings },
  ];

  if (!user) return null;

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors duration-200 z-30">
      
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center space-x-3">
          <img src="/favicon.png" alt="MoneyMate Logo" className="w-10 h-10 rounded-xl object-contain shadow-sm shrink-0" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
              MoneyMate
            </h1>
            <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-md mt-1 inline-block">
              {isDemo ? 'DEMO MODU' : 'PRO SÜRÜM'}
            </span>
          </div>
        </div>
        
        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-all relative cursor-pointer group"
          title={isEn ? "Notifications" : "Bildirimler"}
        >
          <Bell size={20} className={hasUnread ? "animate-bell-shake text-amber-500" : "group-hover:scale-110 transition-transform"} />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          )}
        </button>
      </div>

      {/* Workspace Selector */}
      {workspaces.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60">
          <WorkspaceSelector
            workspaces={workspaces}
            activeWorkspace={activeWorkspace}
            setActiveWorkspace={setActiveWorkspace}
            isEn={isEn}
          />
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = currentHash === item.hash || (item.hash === '#/dashboard' && currentHash === '');
          const IconComponent = item.icon;
          
          return (
            <button
              key={item.hash}
              onClick={() => onNavigate(item.hash)}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <IconComponent size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Install App Button if installable or iOS */}
      {showInstallButton && (
        <div className="px-4 pb-4">
          <button
            onClick={handleInstallClick}
            className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-md shadow-brand-500/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer animate-pulse"
          >
            <div className="flex items-center space-x-2 min-w-0">
              <Smartphone size={16} className="shrink-0" />
              <span className="truncate">{isEn ? 'Install App' : 'Uygulamayı Yükle'}</span>
            </div>
            <span className="shrink-0 ml-1.5 text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
              {isEn ? 'FREE' : 'ÜCRETSİZ'}
            </span>
          </button>
        </div>
      )}

      {/* Footer Profile & Controls */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 space-y-4">
        {/* Theme and Mode status */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 dark:text-slate-500">Görünüm</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {document.documentElement.classList.contains('dark') ? 'Koyu Tema' : 'Açık Tema'}
            </span>
          </div>
          <ThemeToggle />
        </div>

        {/* User profile info & logout */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40">
          <div className="flex flex-col overflow-hidden max-w-[140px]">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {user.full_name || user.email.split('@')[0]}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate" title={user.email}>
              {user.email}
            </span>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            title="Çıkış Yap"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>

      {/* Unified Installation Guide Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setShowInstallGuide(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <X size={18} />
            </button>

            <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-3xl">📲</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                {deviceType === 'ios'
                  ? (isEn ? 'Install MoneyMate on iOS' : 'iOS Cihazınıza Yükleyin')
                  : deviceType === 'android'
                  ? (isEn ? 'Install MoneyMate on Android' : 'Android Cihazınıza Yükleyin')
                  : (isEn ? 'Install MoneyMate on PC' : 'Bilgisayarınıza Yükleyin')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {deviceType === 'ios'
                  ? (isEn ? 'Follow these simple steps in Safari to add to your Home Screen:' : 'MoneyMate\'i ana ekranınıza eklemek için Safari\'de aşağıdaki adımları takip edin:')
                  : deviceType === 'android'
                  ? (isEn ? 'Follow these simple steps in Chrome to add to your Home Screen:' : 'MoneyMate\'i ana ekranınıza eklemek için Chrome\'da aşağıdaki adımları takip edin:')
                  : (isEn ? 'Follow these simple steps in Chrome/Edge to install on your PC:' : 'MoneyMate\'i bilgisayarınıza uygulama olarak kurmak için aşağıdaki adımları takip edin:')}
              </p>
            </div>

            <div className="py-5 space-y-4 text-xs text-slate-600 dark:text-slate-300">
              {deviceType === 'ios' && (
                <>
                  {/* Step 1 */}
                  <div className="flex items-start space-x-3.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                      1
                    </span>
                    <p className="leading-relaxed">
                      {isEn ? (
                        <>Tap the <strong>Share</strong> button <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">📤</span> in the bottom toolbar of Safari.</>
                      ) : (
                        <>Safari tarayıcısının altındaki araç çubuğunda bulunan <strong>Paylaş</strong> <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">📤</span> butonuna dokunun.</>
                      )}
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start space-x-3.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                      2
                    </span>
                    <p className="leading-relaxed">
                      {isEn ? (
                        <>Scroll down the share menu and select <strong>Add to Home Screen</strong> <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">➕</span>.</>
                      ) : (
                        <>Açılan menüde aşağı kaydırın ve <strong>Ana Ekrana Ekle</strong> <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">➕</span> seçeneğini seçin.</>
                      )}
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start space-x-3.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                      3
                    </span>
                    <p className="leading-relaxed">
                      {isEn ? (
                        <>Tap <strong>Add</strong> in the top-right corner to complete the installation.</>
                      ) : (
                        <>Sağ üst köşedeki <strong>Ekle</strong> butonuna dokunarak kurulumu tamamlayın.</>
                      )}
                    </p>
                  </div>
                </>
              )}

              {deviceType === 'android' && (
                <>
                  {/* Step 1 */}
                  <div className="flex items-start space-x-3.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                      1
                    </span>
                    <p className="leading-relaxed">
                      {isEn ? (
                        <>Tap the <strong>Menu</strong> icon <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">⋮</span> in the top-right corner of Chrome.</>
                      ) : (
                        <>Chrome tarayıcısının sağ üst köşesindeki <strong>Menü (üç nokta)</strong> <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">⋮</span> simgesine dokunun.</>
                      )}
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start space-x-3.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                      2
                    </span>
                    <p className="leading-relaxed">
                      {isEn ? (
                        <>Select <strong>Add to Home Screen</strong> or <strong>Install App</strong>.</>
                      ) : (
                        <>Açılan menüden <strong>"Ana Ekrana Ekle"</strong> veya <strong>"Uygulamayı Yükle"</strong> seçeneğine dokunun.</>
                      )}
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start space-x-3.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                      3
                    </span>
                    <p className="leading-relaxed">
                      {isEn ? (
                        <>Confirm by tapping <strong>Install</strong> or <strong>Add</strong> in the pop-up.</>
                      ) : (
                        <>Çıkan onay penceresinde <strong>"Yükle"</strong> veya <strong>"Ekle"</strong> butonuna dokunarak kurulumu tamamlayın.</>
                      )}
                    </p>
                  </div>

                  <div className="p-3 bg-brand-500/5 dark:bg-brand-500/5 border border-brand-200/40 dark:border-brand-800/40 text-brand-600 dark:text-brand-400 rounded-xl leading-relaxed text-[10px] font-semibold mt-2.5">
                    {isEn ? (
                      <>💡 <strong>Note:</strong> Over local HTTP development connections, browsers block the automatic prompt. Deploying to a secure HTTPS server makes it direct. However, you can still install it manually via the menu!</>
                    ) : (
                      <>💡 <strong>Not:</strong> Yerel ağda HTTP bağlantısı kullanıldığında tarayıcı otomatik kurulumu engeller. Uygulama HTTPS yüklü bir sunucuya taşındığında bu buton doğrudan çalışacaktır. Ancak şu anda da tarayıcı menüsünden manuel olarak sorunsuzca kurabilirsiniz!</>
                    )}
                  </div>
                </>
              )}

              {deviceType === 'desktop' && (
                <>
                  {/* Step 1 */}
                  <div className="flex items-start space-x-3.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                      1
                    </span>
                    <p className="leading-relaxed">
                      {isEn ? (
                        <>Look at the right end of the browser's <strong>Address Bar</strong> (URL input area).</>
                      ) : (
                        <>Tarayıcınızın <strong>Adres Çubuğunun</strong> (URL yazdığınız yer) en sağ tarafına bakın.</>
                      )}
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start space-x-3.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                      2
                    </span>
                    <p className="leading-relaxed">
                      {isEn ? (
                        <>Click the <strong>Install</strong> icon <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">🖥️</span> or "Install MoneyMate" button.</>
                      ) : (
                        <>Orada beliren <strong>Uygulamayı Yükle / Install</strong> simgesine <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">🖥️</span> tıklayın.</>
                      )}
                    </p>
                  </div>

                  {/* Step-3 */}
                  <div className="flex items-start space-x-3.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                      3
                    </span>
                    <p className="leading-relaxed">
                      {isEn ? (
                        <>Confirm by clicking <strong>Install</strong> in the dialogue box.</>
                      ) : (
                        <>Çıkan kutucukta <strong>"Yükle"</strong> (Install) butonuna basarak bilgisayarınıza kurun.</>
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 text-center">
              <button
                onClick={() => setShowInstallGuide(false)}
                className="w-full premium-btn-primary py-2.5 text-xs font-semibold cursor-pointer"
              >
                {isEn ? 'Got it' : 'Anladım'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
