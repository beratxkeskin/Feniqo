import React, { useState } from 'react';
import type { Subscription } from '../../db/types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import * as Icons from 'lucide-react';

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
}

const translations = {
  tr: {
    active: 'Aktif',
    passive: 'Pasif',
    renewalDate: 'Yenileme Tarihi',
    payRenew: 'Öde ve Yenile',
    overdue: 'Gecikti',
    today: 'Bugün Yenileniyor',
    tomorrow: 'Yarın Yenileniyor',
    daysLeft: 'gün kaldı',
    daysOverdue: 'gün gecikti',
    edit: 'Düzenle',
    delete: 'Sil',
    monthlyFee: 'Aylık Ücret',
    renewing: 'Yenileniyor...',
  },
  en: {
    active: 'Active',
    passive: 'Inactive',
    renewalDate: 'Renewal Date',
    payRenew: 'Pay & Renew',
    overdue: 'Overdue',
    today: 'Due Today',
    tomorrow: 'Due Tomorrow',
    daysLeft: 'days left',
    daysOverdue: 'days overdue',
    edit: 'Edit',
    delete: 'Delete',
    monthlyFee: 'Monthly Fee',
    renewing: 'Renewing...',
  }
};

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription, onEdit, onDelete }) => {
  const { user } = useAuth();
  const { categories, toggleSubscriptionActiveStatus, renewSubscription } = useData();
  const [isToggling, setIsToggling] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);

  const lang = user?.lang || 'tr';
  const t = translations[lang];
  const currency = user?.currency || 'TRY';

  // Find linked category
  const category = categories.find(c => c.id === subscription.category_id);
  const IconComp = category?.icon ? (Icons[category.icon as keyof typeof Icons] as React.ComponentType<any>) : null;

  // Calculate remaining days
  const getRenewalStatus = () => {
    if (!subscription.is_active) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const renewalDate = new Date(subscription.renewal_date);
    renewalDate.setHours(0, 0, 0, 0);
    
    const diffTime = renewalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return {
        text: `${absDays} ${t.daysOverdue}`,
        isOverdue: true,
        isWarning: true
      };
    } else if (diffDays === 0) {
      return {
        text: t.today,
        isOverdue: false,
        isWarning: true
      };
    } else if (diffDays === 1) {
      return {
        text: t.tomorrow,
        isOverdue: false,
        isWarning: true
      };
    } else if (diffDays <= 5) {
      return {
        text: `${diffDays} ${t.daysLeft}`,
        isOverdue: false,
        isWarning: true
      };
    } else {
      return {
        text: `${diffDays} ${t.daysLeft}`,
        isOverdue: false,
        isWarning: false
      };
    }
  };

  const statusInfo = getRenewalStatus();

  // Premium design styling based on brand names
  const nameLower = subscription.name.toLowerCase();
  const isNetflix = nameLower.includes('netflix');
  const isSpotify = nameLower.includes('spotify');
  const isYoutube = nameLower.includes('youtube');

  let themeStyles = {
    cardBorder: 'border-slate-200/80 dark:border-slate-800 hover:border-brand-500/30',
    glow: 'hover:shadow-brand-500/5',
    hasCustomTopBar: false,
    topBarClass: 'bg-slate-300 dark:bg-slate-700',
    iconBg: 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400',
    accentColor: category?.color || '#6366F1'
  };

  if (subscription.is_active) {
    if (isNetflix) {
      themeStyles = {
        cardBorder: 'border-red-200/80 dark:border-red-950/40 hover:border-red-500 dark:hover:border-red-800',
        glow: 'hover:shadow-red-500/5 dark:hover:shadow-red-950/15',
        hasCustomTopBar: true,
        topBarClass: 'bg-gradient-to-r from-red-600 to-rose-700',
        iconBg: 'bg-red-50 dark:bg-red-950/20 border-red-100/50 dark:border-red-900/30 text-red-600 dark:text-red-400',
        accentColor: '#E50914'
      };
    } else if (isSpotify) {
      themeStyles = {
        cardBorder: 'border-emerald-200/80 dark:border-emerald-950/40 hover:border-emerald-500 dark:hover:border-emerald-800',
        glow: 'hover:shadow-emerald-500/5 dark:hover:shadow-emerald-950/15',
        hasCustomTopBar: true,
        topBarClass: 'bg-gradient-to-r from-emerald-500 to-green-600',
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        accentColor: '#1DB954'
      };
    } else if (isYoutube) {
      themeStyles = {
        cardBorder: 'border-red-200/80 dark:border-red-950/45 hover:border-red-600 dark:hover:border-red-800',
        glow: 'hover:shadow-red-600/5 dark:hover:shadow-red-950/15',
        hasCustomTopBar: true,
        topBarClass: 'bg-gradient-to-r from-red-500 to-red-700',
        iconBg: 'bg-red-50 dark:bg-red-950/20 border-red-100/50 dark:border-red-900/30 text-red-600 dark:text-red-400',
        accentColor: '#FF0000'
      };
    } else if (category?.color) {
      themeStyles = {
        cardBorder: 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
        glow: 'hover:shadow-brand-500/5',
        hasCustomTopBar: false,
        topBarClass: '',
        iconBg: 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400',
        accentColor: category.color
      };
    }
  } else {
    // Passive state
    themeStyles = {
      cardBorder: 'border-slate-200 dark:border-slate-800/80 opacity-70 hover:opacity-100 transition-opacity',
      glow: '',
      hasCustomTopBar: true,
      topBarClass: 'bg-slate-300 dark:bg-slate-700',
      iconBg: 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-850 text-slate-400 dark:text-slate-500',
      accentColor: '#6B7280'
    };
  }

  const handleActiveToggle = async () => {
    setIsToggling(true);
    await toggleSubscriptionActiveStatus(subscription.id);
    setTimeout(() => setIsToggling(false), 200);
  };

  const handleRenew = async () => {
    setIsRenewing(true);
    await renewSubscription(subscription.id);
    setTimeout(() => setIsRenewing(false), 300);
  };

  return (
    <div className={`relative overflow-hidden bg-white dark:bg-slate-900 border ${themeStyles.cardBorder} rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 ${themeStyles.glow}`}>
      
      {/* Decorative top bar */}
      {themeStyles.hasCustomTopBar ? (
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${themeStyles.topBarClass}`} />
      ) : (
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: themeStyles.accentColor }} />
      )}

      {/* Header Info */}
      <div className="flex items-start justify-between mb-4 mt-1">
        <div className="flex items-center space-x-3.5 flex-1 min-w-0">
          <div 
            className={`p-3 rounded-2xl border ${themeStyles.iconBg} shadow-sm transition-transform duration-300 hover:scale-105 flex-shrink-0`}
            style={!themeStyles.hasCustomTopBar && subscription.is_active ? { borderColor: `${themeStyles.accentColor}20`, color: themeStyles.accentColor, backgroundColor: `${themeStyles.accentColor}08` } : {}}
          >
            {IconComp ? <IconComp className="w-5 h-5" /> : <Icons.CreditCard className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight tracking-tight truncate flex items-center gap-1.5">
              {subscription.name}
            </h3>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 dark:text-slate-500 mt-1">
              <Icons.Calendar className="w-3.5 h-3.5" />
              <span className="font-medium">{t.renewalDate}: {formatDate(subscription.renewal_date)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-0.5 ml-2">
          <button 
            onClick={() => onEdit(subscription)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
            title={t.edit}
          >
            <Icons.Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(subscription.id)}
            className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
            title={t.delete}
          >
            <Icons.Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tutar ve Kategori Detayı */}
      <div className="space-y-4 mb-4">
        <div className="flex items-baseline justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              {t.monthlyFee}
            </span>
            <span className={`text-2xl font-black tracking-tight mt-1 ${
              subscription.is_active 
                ? 'text-slate-900 dark:text-white' 
                : 'text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-700'
            }`}>
              {formatCurrency(subscription.amount, currency)}
            </span>
          </div>

          {/* Badges / Status Tags */}
          <div className="flex flex-col items-end space-y-1">
            {/* Category Badge */}
            {category && (
              <span 
                className="px-2.5 py-0.5 rounded-full text-[9px] font-bold border transition-all"
                style={{
                  color: subscription.is_active ? themeStyles.accentColor : '#94A3B8',
                  borderColor: subscription.is_active ? `${themeStyles.accentColor}30` : '#E2E8F0',
                  backgroundColor: subscription.is_active ? `${themeStyles.accentColor}08` : '#F8FAFC'
                }}
              >
                {category.name}
              </span>
            )}

            {/* Remaining Time / Alert Badges */}
            {statusInfo && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                statusInfo.isWarning 
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 animate-pulse'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {statusInfo.isWarning ? (
                  <Icons.AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
                ) : (
                  <Icons.Clock className="w-3 h-3 flex-shrink-0" />
                )}
                <span className="font-semibold">{statusInfo.text}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Active/Passive and Renew Controls */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-3.5">
        
        {/* Active Toggle Switch */}
        <div className="col-span-1 flex items-center justify-start">
          <button
            onClick={handleActiveToggle}
            disabled={isToggling}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
              subscription.is_active
                ? 'bg-brand-500/10 border-brand-500/25 text-brand-600 dark:text-brand-400'
                : 'bg-slate-50 border-slate-200 dark:bg-slate-850 dark:border-slate-800 text-slate-400'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${subscription.is_active ? 'bg-brand-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{subscription.is_active ? t.active : t.passive}</span>
          </button>
        </div>

        {/* Pay & Renew satisfaction button */}
        <div className="col-span-2">
          <button
            onClick={handleRenew}
            disabled={isRenewing || !subscription.is_active}
            className={`w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
              !subscription.is_active
                ? 'bg-slate-50 border-slate-200 text-slate-300 dark:bg-slate-850 dark:border-slate-800 cursor-not-allowed'
                : isRenewing
                  ? 'bg-brand-50 border-brand-200 text-brand-400 dark:bg-slate-800 dark:border-slate-700'
                  : 'bg-brand-600 border-brand-600 text-white hover:bg-brand-700 hover:border-brand-700 shadow-sm hover:shadow shadow-brand-500/10'
            }`}
          >
            {isRenewing ? (
              <>
                <Icons.RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{t.renewing}</span>
              </>
            ) : (
              <>
                <Icons.Sparkles className="w-3.5 h-3.5" />
                <span>{t.payRenew}</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};

export default SubscriptionCard;
