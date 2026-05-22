import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  TrendingUp, 
  LayoutDashboard, 
  ArrowUpDown, 
  PiggyBank, 
  FolderTree, 
  BarChart3, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';

interface NavbarProps {
  currentHash: string;
  onNavigate: (hash: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentHash, onNavigate }) => {
  const { user, signOut, isDemo } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', hash: '#/dashboard', icon: LayoutDashboard },
    { name: 'İşlemler', hash: '#/transactions', icon: ArrowUpDown },
    { name: 'Bütçeler', hash: '#/budgets', icon: PiggyBank },
    { name: 'Kategoriler', hash: '#/categories', icon: FolderTree },
    { name: 'Raporlar', hash: '#/reports', icon: BarChart3 },
    { name: 'Ayarlar', hash: '#/settings', icon: Settings },
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
          <div className="p-1.5 bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-lg">
            <TrendingUp size={20} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-slate-900 dark:text-white tracking-tight">MoneyMate</span>
          <span className="text-[8px] font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-1 py-0.2 rounded-md">
            {isDemo ? 'DEMO' : 'PRO'}
          </span>
        </div>

        {/* Page Title & Hamburger */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-3">
            {activeItem.name}
          </span>
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
                <div className="p-2 bg-brand-500/10 text-brand-600 rounded-lg">
                  <TrendingUp size={20} />
                </div>
                <span className="font-bold text-lg dark:text-white">MoneyMate</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

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
                  <span className="text-xs font-semibold truncate dark:text-slate-200">{user.email.split('@')[0]}</span>
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
    </>
  );
};

export default Navbar;
