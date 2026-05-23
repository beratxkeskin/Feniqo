import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { SubscriptionCard } from '../components/subscriptions/SubscriptionCard';
import { SubscriptionForm } from '../components/forms/SubscriptionForm';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency } from '../utils/formatters';
import { 
  Plus, 
  X, 
  CalendarClock, 
  CreditCard,
  Flame,
  AlertCircle,
  Gem,
  Sparkles
} from 'lucide-react';

const translations = {
  tr: {
    title: 'Abonelik Takibi',
    subtitle: 'Netflix, Spotify, İnternet gibi düzenli ve tekrarlı ödemelerinizi tek bir yerden kolayca takip edin.',
    addNew: 'Yeni Abonelik Ekle',
    all: 'Tümü',
    active: 'Aktifler',
    passive: 'Pasifler',
    upcomingFilter: 'Yaklaşan Ödemeler',
    totalMonthlyCost: 'Aylık Toplam Gider',
    activeCount: 'Aktif Abonelik',
    upcomingCount: 'Yaklaşan Ödeme',
    mostExpensive: 'En Pahalı Abonelik',
    none: 'Bulunmuyor',
    emptyTitle: 'Kayıt Bulunmuyor',
    emptyDesc: 'Henüz hiçbir abonelik kaydı eklemediniz. Aboneliklerinizi ve düzenli fatura ödemelerinizi takip etmek için hemen başlayın!',
    emptyFilterTitle: 'Eşleşen Abonelik Bulunamadı',
    emptyFilterDesc: 'Seçtiğiniz filtreye uygun hiçbir abonelik kaydı bulunmamaktadır. Başka bir filtreyi deneyebilirsiniz.',
    deleteConfirm: 'Bu abonelik kaydını kalıcı olarak silmek istediğinizden emin misiniz?',
    editTitle: 'Aboneliği Düzenle',
    newTitle: 'Yeni Abonelik Ekle'
  },
  en: {
    title: 'Subscription Tracking',
    subtitle: 'Easily track your recurring subscriptions and regular bill payments like Netflix, Spotify, Internet in one place.',
    addNew: 'Add New Subscription',
    all: 'All',
    active: 'Active',
    passive: 'Inactive',
    upcomingFilter: 'Upcoming Payments',
    totalMonthlyCost: 'Total Monthly Expense',
    activeCount: 'Active Subscriptions',
    upcomingCount: 'Upcoming Payments',
    mostExpensive: 'Most Expensive',
    none: 'None',
    emptyTitle: 'No Subscriptions Found',
    emptyDesc: 'You haven\'t added any subscriptions yet. Start tracking your subscriptions and bills now!',
    emptyFilterTitle: 'No Matching Subscriptions',
    emptyFilterDesc: 'No subscription records match the selected filter. Try choosing another filter.',
    deleteConfirm: 'Are you sure you want to delete this subscription record permanently?',
    editTitle: 'Edit Subscription',
    newTitle: 'Add New Subscription'
  }
};

export const Subscriptions: React.FC = () => {
  const { user } = useAuth();
  const { subscriptions, deleteSubscription } = useData();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'passive' | 'upcoming'>('all');

  const lang = user?.lang || 'tr';
  const t = translations[lang];
  const currency = user?.currency || 'TRY';

  // 1. Calculate Summary Stats
  const stats = useMemo(() => {
    // Total cost of all active subscriptions
    const totalMonthlyCost = subscriptions
      .filter(s => s.is_active)
      .reduce((sum, s) => sum + s.amount, 0);

    // Count active subs
    const activeCount = subscriptions.filter(s => s.is_active).length;

    // Count upcoming (renewal date in <= 5 days or overdue)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingCount = subscriptions.filter(s => {
      if (!s.is_active) return false;
      const renewalDate = new Date(s.renewal_date);
      renewalDate.setHours(0, 0, 0, 0);
      const diffTime = renewalDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 5;
    }).length;

    // Find the most expensive active subscription
    const activeSubs = subscriptions.filter(s => s.is_active);
    let mostExpensive: any = null;
    if (activeSubs.length > 0) {
      mostExpensive = activeSubs.reduce((max, current) => {
        return current.amount > max.amount ? current : max;
      }, activeSubs[0]);
    }

    return {
      totalMonthlyCost,
      activeCount,
      upcomingCount,
      mostExpensive
    };
  }, [subscriptions]);

  // 2. Filter Subscriptions
  const filteredSubscriptions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return subscriptions.filter(s => {
      if (activeFilter === 'active') return s.is_active;
      if (activeFilter === 'passive') return !s.is_active;
      if (activeFilter === 'upcoming') {
        if (!s.is_active) return false;
        const renewalDate = new Date(s.renewal_date);
        renewalDate.setHours(0, 0, 0, 0);
        const diffTime = renewalDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 5;
      }
      return true;
    });
  }, [subscriptions, activeFilter]);

  // 3. Actions
  const handleAddNew = () => {
    setEditingSubscription(null);
    setIsFormOpen(true);
  };

  const handleEdit = (sub: any) => {
    setEditingSubscription(sub);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      await deleteSubscription(id);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingSubscription(null);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarClock className="text-brand-500 w-7 h-7" strokeWidth={2.5} />
            {t.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t.subtitle}
          </p>
        </div>

        <div>
          <button
            onClick={handleAddNew}
            className="premium-btn-primary flex items-center space-x-2 py-2.5 px-4.5 text-xs font-semibold shadow-md whitespace-nowrap"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>{t.addNew}</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      {subscriptions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Total Monthly Expense Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-2xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">{t.totalMonthlyCost}</span>
              <strong className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
                {formatCurrency(stats.totalMonthlyCost, currency)}
              </strong>
            </div>
          </div>

          {/* Active Subscriptions Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">{t.activeCount}</span>
              <strong className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
                {stats.activeCount}
              </strong>
            </div>
          </div>

          {/* Upcoming Payments Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center space-x-4">
            <div className={`p-3 rounded-2xl ${
              stats.upcomingCount > 0 
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse' 
                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
            }`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">{t.upcomingCount}</span>
              <strong className={`text-lg font-black tracking-tight ${stats.upcomingCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
                {stats.upcomingCount}
              </strong>
            </div>
          </div>

          {/* Most Expensive Sub Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl">
              <Gem className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block truncate">{t.mostExpensive}</span>
              <strong className="text-sm font-black text-slate-800 dark:text-white tracking-tight truncate block" title={stats.mostExpensive?.name || t.none}>
                {stats.mostExpensive ? `${stats.mostExpensive.name} (${formatCurrency(stats.mostExpensive.amount, currency)})` : t.none}
              </strong>
            </div>
          </div>

        </div>
      )}

      {/* Filter Tabs & Content Section */}
      {subscriptions.length > 0 ? (
        <div className="space-y-6">
          
          {/* Visual Tabs Selector */}
          <div className="flex items-center overflow-x-auto pb-1.5 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none gap-2">
            {[
              { id: 'all', label: t.all },
              { id: 'active', label: t.active },
              { id: 'passive', label: t.passive },
              { id: 'upcoming', label: t.upcomingFilter },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`py-2 px-4.5 rounded-2xl text-xs font-bold border transition-all whitespace-nowrap ${
                  activeFilter === tab.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          {filteredSubscriptions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {filteredSubscriptions.map((sub) => (
                <SubscriptionCard 
                  key={sub.id} 
                  subscription={sub} 
                  onEdit={handleEdit} 
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              iconName="Inbox"
              title={t.emptyFilterTitle}
              description={t.emptyFilterDesc}
            />
          )}

        </div>
      ) : (
        <EmptyState
          iconName="CalendarClock"
          title={t.emptyTitle}
          description={t.emptyDesc}
          actionText={t.addNew}
          onAction={handleAddNew}
        />
      )}

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-5">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-brand-500 animate-pulse" />
                {editingSubscription ? t.editTitle : t.newTitle}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <SubscriptionForm 
              editingSubscription={editingSubscription} 
              onSuccess={handleFormSuccess} 
              onCancel={() => setIsFormOpen(false)} 
            />

          </div>
        </div>
      )}

    </div>
  );
};

export default Subscriptions;
