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
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { WorkspaceSelector } from './WorkspaceSelector';
import { usePWA } from '../../utils/pwaStore';
import { InstallationGuideModal } from '../common/InstallationGuideModal';

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
      <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-2rem)] fixed left-4 top-4 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/40 dark:border-slate-800/45 rounded-3xl transition-all duration-300 z-30 shadow-[0_8px_32px_0_rgba(0,0,0,0.02)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.15)]">
      
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center space-x-3">
          <img src="/feniqo_logo.png" alt="Feniqo Logo" className="w-10 h-10 rounded-xl object-contain shadow-sm shrink-0" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
              Feniqo
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
              className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                isActive
                  ? 'premium-active-menu'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-white'
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
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/40 dark:bg-slate-800/20 border border-slate-200/30 dark:border-slate-800/20">
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
      <InstallationGuideModal
        isOpen={showInstallGuide}
        deviceType={deviceType}
        isEn={isEn}
        onClose={() => setShowInstallGuide(false)}
      />
    </>
  );
};

export default Sidebar;
