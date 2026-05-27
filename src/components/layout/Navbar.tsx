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
import { InstallationGuideModal } from '../common/InstallationGuideModal';

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
        
        {/* Hamburger & Brand/Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            aria-label="Menüyü Aç/Kapat"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex items-center space-x-2">
            <img src="/feniqo_logo.png" alt="Feniqo Logo" className="w-7 h-7 rounded-lg object-contain shadow-sm shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white tracking-tight hidden sm:block">Feniqo</span>
            <span className="text-[8px] font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-1 py-0.5 rounded-md">
              {isDemo ? 'DEMO' : 'PRO'}
            </span>
          </div>
        </div>

        {/* Page Title & Notification */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 pr-3 mr-1">
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
                <img src="/feniqo_logo.png" alt="Feniqo Logo" className="w-8 h-8 rounded-lg object-contain shadow-sm shrink-0" />
                <span className="font-bold text-lg dark:text-white">Feniqo</span>
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
      <InstallationGuideModal
        isOpen={showInstallGuide}
        deviceType={deviceType}
        isEn={isEn}
        onClose={() => setShowInstallGuide(false)}
      />
    </>
  );
};

export default Navbar;
