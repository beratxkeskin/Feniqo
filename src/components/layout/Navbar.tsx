import React, { useState } from 'react';
import { 
  Menu, 
  X, 
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
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { WorkspaceSelector } from './WorkspaceSelector';
import { usePWA } from '../../utils/pwaStore';

interface NavbarProps {
  currentHash: string;
  onNavigate: (hash: string) => void;
  hasUnread: boolean;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentHash, onNavigate, hasUnread, onOpenNotifications }) => {
  const { user, signOut, isDemo } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const { isInstallable, isInstalled, install } = usePWA();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const isEn = user?.lang === 'en';

  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAppInstalled = isInstalled || (typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone));
  const showInstallButton = !isAppInstalled;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setIsOpen(false);
      }
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

  // Find active item to display page title
  const activeItem = menuItems.find(item => item.hash === currentHash) || menuItems[0];

  const handleMobileNavigate = (hash: string) => {
    onNavigate(hash);
    setIsOpen(false);
  };

  return (
    <>
      <header className="lg:hidden w-full h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200">
        
        {/* Brand/Logo */}
        <div className="flex items-center space-x-2">
          <img src="/favicon.png" alt="MoneyMate Logo" className="w-8 h-8 rounded-lg object-contain shadow-sm shrink-0" />
          <span className="font-bold text-slate-900 dark:text-white tracking-tight">MoneyMate</span>
          <span className="text-[8px] font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-1 py-0.2 rounded-md">
            {isDemo ? 'DEMO' : 'PRO'}
          </span>
        </div>

        {/* Page Title & Hamburger */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-3 mr-1">
            {activeItem.name}
          </span>
          
          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all relative cursor-pointer"
            aria-label="Bildirimler"
          >
            <Bell size={22} className={hasUnread ? "animate-bell-shake text-amber-500" : "text-slate-500"} />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            aria-label="Menüyü Aç/Kapat"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          {/* Menu Panel */}
          <div className="w-4/5 max-w-sm h-full bg-white dark:bg-slate-900 p-6 flex flex-col border-r border-slate-200 dark:border-slate-800 animate-slide-in shadow-2xl transition-colors duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center space-x-2">
                <img src="/favicon.png" alt="MoneyMate Logo" className="w-8 h-8 rounded-lg object-contain shadow-sm shrink-0" />
                <span className="font-bold text-lg dark:text-white">MoneyMate</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Workspace Selector */}
            {workspaces.length > 0 && (
              <div className="py-3 border-b border-slate-100 dark:border-slate-800/60">
                <WorkspaceSelector
                  workspaces={workspaces}
                  activeWorkspace={activeWorkspace}
                  setActiveWorkspace={setActiveWorkspace}
                  isEn={isEn}
                />
              </div>
            )}

            {/* Navigation links */}
            <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = currentHash === item.hash || (item.hash === '#/dashboard' && currentHash === '');
                const IconComponent = item.icon;
                
                return (
                  <button
                    key={item.hash}
                    onClick={() => handleMobileNavigate(item.hash)}
                    className={`flex items-center space-x-3 w-full px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/15'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
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
              <div className="px-1 pb-4">
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-md shadow-brand-500/15 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer animate-pulse"
                >
                  <div className="flex items-center space-x-2.5">
                    <Smartphone size={16} />
                    <span>{isEn ? 'Install Mobile App' : 'Mobil Uygulamayı Yükle'}</span>
                  </div>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                    {isEn ? 'FREE' : 'ÜCRETSİZ'}
                  </span>
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Görünüm Modu</span>
                  <span className="text-xs font-semibold dark:text-slate-300">
                    {document.documentElement.classList.contains('dark') ? 'Karanlık Tema' : 'Aydınlık Tema'}
                  </span>
                </div>
                <ThemeToggle />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex flex-col overflow-hidden max-w-[150px]">
                  <span className="text-xs font-semibold truncate dark:text-slate-200">{user.full_name || user.email.split('@')[0]}</span>
                  <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
                </div>
                <button
                  onClick={() => { signOut(); setIsOpen(false); }}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>

          </div>

          {/* Click to close backdrop */}
          <div className="flex-1" onClick={() => setIsOpen(false)} />
        </div>
      )}

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

                  {/* Step 3 */}
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

export default Navbar;
