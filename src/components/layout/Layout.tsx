import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { OfflineIndicator } from '../common/OfflineIndicator';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useOpenBanking } from '../../context/OpenBankingContext';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  Sparkles, 
  CheckCheck, 
  CreditCard, 
  Coins 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentHash: string;
  onNavigate: (hash: string) => void;
}

interface NotificationItem {
  id: string;
  type: 'subscription' | 'debt' | 'budget_warning' | 'budget_critical' | 'bank_sync';
  title: string;
  message: string;
  date: string;
  isImportant: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentHash, onNavigate }) => {
  const { user } = useAuth();
  const { bankingToast } = useOpenBanking();
  const { 
    transactions, 
    categories, 
    budgets, 
    debts, 
    subscriptions 
  } = useData();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const stored = localStorage.getItem(`feniqo_read_notif_ids_${user.id}`) || localStorage.getItem(`moneymate_read_notif_ids_${user.id}`);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const isEn = user?.lang === 'en';

  // Load read notification IDs on mount or when user changes
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`feniqo_read_notif_ids_${user.id}`) || localStorage.getItem(`moneymate_read_notif_ids_${user.id}`);
      const parsed: string[] = stored ? JSON.parse(stored) : [];
      setReadIds(prev => JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed);
    } else {
      setReadIds([]);
    }
  }, [user?.id]);

  // Compute dynamic notifications in real time based on active records
  const notifications = useMemo(() => {
    if (!user) return [];
    
    const list: NotificationItem[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);

    // 1. Subscriptions due for renewal today or in the past
    subscriptions.forEach(sub => {
      if (sub.is_active && sub.renewal_date) {
        const renewalDate = new Date(sub.renewal_date);
        if (renewalDate <= today) {
          const diffTime = today.getTime() - renewalDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          const msg = isEn
            ? `Your active subscription "${sub.name}" was due for renewal on ${sub.renewal_date} (Amount: ${sub.amount} ${user.currency}).`
            : `"${sub.name}" adlı aktif aboneliğinizin yenileme tarihi geldi: ${sub.renewal_date} (Tutar: ${sub.amount} ${user.currency}).`;
          
          list.push({
            id: `sub-${sub.id}-${sub.renewal_date}`,
            type: 'subscription',
            title: isEn ? 'Subscription Renewal' : 'Abonelik Yenilemesi 💳',
            message: msg,
            date: sub.renewal_date,
            isImportant: diffDays >= 0
          });
        }
      }
    });

    // 2. Unpaid debts/receivables that are overdue
    debts.forEach(debt => {
      if (!debt.is_paid && debt.due_date) {
        const dueDate = new Date(debt.due_date);
        if (dueDate < today) {
          const isDebt = debt.type === 'debt';
          
          const titleText = isDebt 
            ? (isEn ? 'Overdue Debt Payment' : 'Vadesi Geçen Borç ⚠️')
            : (isEn ? 'Overdue Receivable' : 'Vadesi Geçen Alacak 💰');
          
          const msg = isDebt
            ? (isEn 
                ? `Your debt of ${debt.amount} ${user.currency} to "${debt.title}" is overdue (Due: ${debt.due_date}).`
                : `"${debt.title}" kişisine olan ${debt.amount} ${user.currency} tutarındaki borcunuzun ödeme tarihi geçmiş (${debt.due_date}).`)
            : (isEn
                ? `The receivable of ${debt.amount} ${user.currency} from "${debt.title}" is overdue (Due: ${debt.due_date}).`
                : `"${debt.title}" kişisinden alacaklı olduğunuz ${debt.amount} ${user.currency} tutarındaki alacağınızın vadesi geçmiş (${debt.due_date}).`);
          
          list.push({
            id: `debt-${debt.id}-${debt.due_date}`,
            type: 'debt',
            title: titleText,
            message: msg,
            date: debt.due_date,
            isImportant: true
          });
        }
      }
    });

    // 3. Budgets exceeding 80% capacity this month
    const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
    const currentMonthExpenses = transactions.filter(t => t.type === 'expense' && t.transaction_date.startsWith(currentMonthStr));
    
    const categorySpentMap: Record<string, number> = {};
    currentMonthExpenses.forEach(t => {
      categorySpentMap[t.category_id] = (categorySpentMap[t.category_id] || 0) + Number(t.amount);
    });

    budgets.forEach(b => {
      if (b.month === currentMonthStr) {
        const spent = categorySpentMap[b.category_id] || 0;
        const limit = b.limit_amount;
        if (limit > 0) {
          const ratio = spent / limit;
          if (ratio >= 0.8) {
            const catName = categories.find(c => c.id === b.category_id)?.name || (isEn ? 'Other' : 'Diğer');
            const percent = Math.round(ratio * 100);
            const isOver = ratio >= 1.0;

            const titleText = isOver
              ? (isEn ? 'Budget Limit Exceeded' : '🚨 Bütçe Sınırı Aşıldı!')
              : (isEn ? 'Budget Warning' : '⚠️ Bütçe Sınırına Yaklaşıldı');

            const msg = isOver
              ? (isEn
                  ? `You have exceeded your budget limit for "${catName}"! Spent: ${spent} / Limit: ${limit} (${percent}%).`
                  : `"${catName}" kategorisindeki bütçe limitinizi aştınız! Harcanan: ${spent} / Limit: ${limit} (%${percent}).`)
              : (isEn
                  ? `You have reached ${percent}% of your budget limit for "${catName}". Spent: ${spent} / Limit: ${limit}.`
                  : `"${catName}" bütçenizin %${percent} seviyesine ulaştınız. Harcanan: ${spent} / Limit: ${limit}.`);

            list.push({
              id: `budget-${b.id}-${currentMonthStr}-${isOver ? 'over' : 'warn'}`,
              type: isOver ? 'budget_critical' : 'budget_warning',
              title: titleText,
              message: msg,
              date: todayStr,
              isImportant: isOver
            });
          }
        }
      }
    });

    // 4. Bank Sync Notifications (simulated bank transactions logs)
    const storedBankNotifs = localStorage.getItem(`feniqo_bank_notifications_${user.id || 'demo'}`) || localStorage.getItem(`moneymate_bank_notifications_${user.id || 'demo'}`);
    if (storedBankNotifs) {
      try {
        const bankNotifs = JSON.parse(storedBankNotifs);
        if (Array.isArray(bankNotifs)) {
          bankNotifs.forEach((n: any) => {
            list.push({
              id: n.id,
              type: 'bank_sync',
              title: n.title,
              message: n.message,
              date: n.date,
              isImportant: n.isImportant || false
            });
          });
        }
      } catch (err) {
        console.error("Error parsing bank notifications", err);
      }
    }

    // Sort by type importance (Important/Critical first)
    return list.sort((a, b) => (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0));
  }, [transactions, categories, budgets, debts, subscriptions, isEn, user, bankingToast]);

  const unreadNotifications = useMemo(() => {
    return notifications.filter(n => !readIds.includes(n.id));
  }, [notifications, readIds]);

  const hasUnread = unreadNotifications.length > 0;

  const markAsRead = (id: string) => {
    if (user?.id && !readIds.includes(id)) {
      const next = [...readIds, id];
      setReadIds(next);
      localStorage.setItem(`feniqo_read_notif_ids_${user.id}`, JSON.stringify(next));
    }
  };

  const markAllAsRead = () => {
    if (user?.id) {
      const allIds = notifications.map(n => n.id);
      setReadIds(allIds);
      localStorage.setItem(`feniqo_read_notif_ids_${user.id}`, JSON.stringify(allIds));
    }
  };

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'subscription':
        return <CreditCard size={18} className="text-blue-500" />;
      case 'debt':
        return <Coins size={18} className="text-amber-500" />;
      case 'budget_warning':
        return <AlertTriangle size={18} className="text-yellow-500" />;
      case 'budget_critical':
        return <AlertTriangle size={18} className="text-red-500 animate-pulse" />;
      case 'bank_sync':
        return <span className="text-base shrink-0 select-none">🏦</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 flex flex-col">
      {/* Sidebar - Desktop Only */}
      <Sidebar 
        currentHash={currentHash} 
        onNavigate={onNavigate} 
        hasUnread={hasUnread}
        onOpenNotifications={() => setIsNotifOpen(true)}
      />
      
      {/* Navbar - Mobile Only */}
      <Navbar 
        currentHash={currentHash} 
        onNavigate={onNavigate} 
        hasUnread={hasUnread}
        onOpenNotifications={() => setIsNotifOpen(true)}
      />
      
      {/* Content wrapper */}
      <div className="lg:pl-72 min-h-screen flex flex-col flex-1">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            {children}
          </div>
        </main>
      </div>

      {/* Akıllı Bildirim ve Hatırlatma Çekmecesi (Notification Drawer) */}
      {isNotifOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          {/* Backdrop Click Close */}
          <div className="absolute inset-0 -z-10" onClick={() => setIsNotifOpen(false)} />

          {/* Drawer Container Panel */}
          <div className="w-full max-w-md h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-l border-slate-200/80 dark:border-slate-800/80 p-6 flex flex-col shadow-2xl animate-slide-in pwa-safe-bottom">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center space-x-2.5">
                <div className="relative">
                  <Bell size={20} className={hasUnread ? "text-brand-500 animate-bell-shake" : "text-slate-400"} />
                  {hasUnread && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center text-[7px] font-black text-white">
                      {unreadNotifications.length}
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                  {isEn ? 'Notification Hub' : 'Akıllı Bildirim Merkezi'}
                </h3>
              </div>

              <div className="flex items-center space-x-1">
                {hasUnread && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-brand-500 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider pl-2 pr-2.5"
                    title={isEn ? "Mark all as read" : "Tümünü Okundu İşaretle"}
                  >
                    <CheckCheck size={13} />
                    <span>{isEn ? "Mark All" : "Tümünü Oku"}</span>
                  </button>
                )}
                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-500 rounded-full shadow-inner animate-bounce">
                    <Sparkles size={32} />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white tracking-tight">
                      {isEn ? 'All Caught Up!' : 'Harika! Her Şey Yolunda'}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed max-w-[240px]">
                      {isEn
                        ? 'No overdue debts, exceeded budgets, or pending subscription renewals found.'
                        : 'Vadesi geçmiş borcunuz, aşım yapmış bütçeniz veya ödemesi gecikmiş aboneliğiniz bulunmuyor.'}
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map(item => {
                  const isUnread = !readIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => markAsRead(item.id)}
                      className={`p-4 rounded-2xl border transition-all duration-200 flex items-start space-x-3.5 relative overflow-hidden group select-none ${
                        isUnread
                          ? 'bg-brand-500/5 dark:bg-brand-500/5 border-brand-500/25 hover:border-brand-500/40 cursor-pointer shadow-sm'
                          : 'bg-white/40 dark:bg-slate-800/10 border-slate-100 dark:border-slate-800/40 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {/* Left Type Icon */}
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        isUnread 
                          ? 'bg-slate-100 dark:bg-slate-800 shadow-sm' 
                          : 'bg-slate-50 dark:bg-slate-800/20'
                      }`}>
                        {getNotifIcon(item.type)}
                      </div>

                      {/* Content */}
                      <div className="space-y-1 overflow-hidden leading-tight flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                            {item.title}
                          </h4>
                          {isUnread && (
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-450 font-medium leading-normal">
                          {item.message}
                        </p>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase pt-0.5 block font-mono">
                          📅 {item.date}
                        </span>
                      </div>

                      {/* Pulse side glow for unread critical */}
                      {isUnread && item.isImportant && (
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-red-500" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Çevrimdışı bağlantı göstergesi */}
      <OfflineIndicator />
    </div>
  );
};

export default Layout;

