import React from 'react';
import { 
  LayoutDashboard, 
  ArrowUpDown, 
  PiggyBank, 
  FolderTree, 
  BarChart3, 
  Settings, 
  LogOut,
  Repeat,
  Target,
  Coins,
  CalendarClock,
  Users,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { WorkspaceSelector } from './WorkspaceSelector';

interface SidebarProps {
  currentHash: string;
  onNavigate: (hash: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentHash, onNavigate }) => {
  const { user, signOut, isDemo } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useData();

  const isEn = user?.lang === 'en';

  const menuItems = [
    { name: 'Dashboard', hash: '#/dashboard', icon: LayoutDashboard },
    { name: isEn ? 'Transactions' : 'İşlemler', hash: '#/transactions', icon: ArrowUpDown },
    { name: isEn ? 'Shared Budget' : 'Ortak Bütçe', hash: '#/workspace', icon: Users },
    { name: isEn ? 'Recurring' : 'Tekrarlayanlar', hash: '#/recurring', icon: Repeat },
    { name: isEn ? 'Subscriptions' : 'Abonelikler', hash: '#/subscriptions', icon: CalendarClock },
    { name: isEn ? 'Budgets' : 'Bütçeler', hash: '#/budgets', icon: PiggyBank },
    { name: isEn ? 'Goals' : 'Hedefler', hash: '#/goals', icon: Target },
    { name: isEn ? 'Debts & Receivables' : 'Borç & Alacak', hash: '#/debts', icon: Coins },
    { name: isEn ? 'Net Worth' : 'Varlıklarım', hash: '#/networth', icon: Briefcase },
    { name: isEn ? 'Categories' : 'Kategoriler', hash: '#/categories', icon: FolderTree },
    { name: isEn ? 'Reports' : 'Raporlar', hash: '#/reports', icon: BarChart3 },
    { name: isEn ? 'Settings' : 'Ayarlar', hash: '#/settings', icon: Settings },
  ];

  if (!user) return null;

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors duration-200 z-30">
      
      {/* Brand Header */}
      <div className="flex items-center space-x-3 px-6 py-6 border-b border-slate-100 dark:border-slate-800/60">
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
              {user.email.split('@')[0]}
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
  );
};

export default Sidebar;
