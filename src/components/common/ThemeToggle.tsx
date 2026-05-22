import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ThemeToggle: React.FC = () => {
  const { updateProfile } = useAuth();
  
  // Read current applied theme from HTML class to be safe, or fallback to user settings
  const isDark = document.documentElement.classList.contains('dark');

  const toggleTheme = async () => {
    const nextTheme = isDark ? 'light' : 'dark';
    await updateProfile({ theme: nextTheme });
    
    // Apply changes instantly
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('moneymate_applied_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('moneymate_applied_theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all active:scale-95 shadow-sm"
      aria-label="Temayı Değiştir"
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        {/* Sun Icon */}
        <span className={`absolute transform transition-all duration-300 ${isDark ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`}>
          <Sun size={20} className="text-amber-500" />
        </span>
        {/* Moon Icon */}
        <span className={`absolute transform transition-all duration-300 ${isDark ? '-rotate-90 scale-0' : 'rotate-0 scale-100'}`}>
          <Moon size={20} className="text-slate-600" />
        </span>
      </div>
    </button>
  );
};

export default ThemeToggle;
