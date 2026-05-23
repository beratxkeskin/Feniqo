import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { OfflineIndicator } from '../common/OfflineIndicator';

interface LayoutProps {
  children: React.ReactNode;
  currentHash: string;
  onNavigate: (hash: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentHash, onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 flex flex-col">
      {/* Sidebar - Desktop Only */}
      <Sidebar currentHash={currentHash} onNavigate={onNavigate} />
      
      {/* Navbar - Mobile Only */}
      <Navbar currentHash={currentHash} onNavigate={onNavigate} />
      
      {/* Content wrapper */}
      <div className="lg:pl-64 min-h-screen flex flex-col flex-1">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            {children}
          </div>
        </main>
      </div>

      {/* Çevrimdışı bağlantı göstergesi */}
      <OfflineIndicator />
    </div>
  );
};

export default Layout;

