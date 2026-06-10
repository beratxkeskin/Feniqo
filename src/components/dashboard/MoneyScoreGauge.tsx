import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, HelpCircle, Trophy } from 'lucide-react';
import type { ScoreBreakdown } from '../../utils/scoreCalculator';

interface MoneyScoreGaugeProps {
  scoreData: ScoreBreakdown;
}

export const MoneyScoreGauge: React.FC<MoneyScoreGaugeProps> = ({ scoreData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { totalScore, level, label, tips, savingsScore, budgetScore, debtScore, goalScore } = scoreData;

  // SVG Gauge Math
  const r = 75;
  const cx = 100;
  const cy = 100;
  const circumference = 2 * Math.PI * r; // 471.24
  const arcLength = circumference * (270 / 360); // 353.43
  const gapLength = circumference * (90 / 360); // 117.81
  
  // Calculate offset based on score (0 to 100)
  const strokeDashoffset = arcLength - (totalScore / 100) * arcLength;

  // Level-specific configurations
  const levelConfig = {
    excellent: {
      gradientId: 'excellentGlow',
      fromColor: '#34D399', // Emerald 400
      toColor: '#059669',   // Emerald 600
      glowColor: 'rgba(52, 211, 153, 0.4)',
      textColor: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      glowClass: 'shadow-emerald-500/10 dark:shadow-emerald-500/5'
    },
    healthy: {
      gradientId: 'healthyGlow',
      fromColor: '#3B82F6', // Blue 500
      toColor: '#F59E0B',   // Amber 500
      glowColor: 'rgba(59, 130, 246, 0.4)',
      textColor: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      glowClass: 'shadow-blue-500/10 dark:shadow-blue-500/5'
    },
    critical: {
      gradientId: 'criticalGlow',
      fromColor: '#EF4444', // Red 500
      toColor: '#F97316',   // Orange 500
      glowColor: 'rgba(239, 68, 68, 0.4)',
      textColor: 'text-red-500 dark:text-red-400',
      bgColor: 'bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30',
      badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
      glowClass: 'shadow-red-500/10 dark:shadow-red-500/5'
    }
  };

  const currentConfig = levelConfig[level];

  return (
    <div className={`premium-card transition-all duration-300 ${currentConfig.glowClass}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/20">
            <Trophy size={16} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">
              MoneyScore™
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
              Finansal Sağlık Skoru
            </p>
          </div>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${currentConfig.badgeColor}`}>
          {label}
        </span>
      </div>

      {/* Circle Gauge Section */}
      <div className="relative flex flex-col items-center justify-center py-2 select-none">
        <svg width="180" height="150" viewBox="0 0 200 170" className="transform -translate-y-2">
          <defs>
            <linearGradient id="excellentGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="healthyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            <linearGradient id="criticalGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800/60"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${gapLength}`}
            transform="rotate(135 100 100)"
          />

          {/* Active Progress Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={`url(#${currentConfig.gradientId})`}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${gapLength}`}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(135 100 100)"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${currentConfig.fromColor})`
            }}
          />
        </svg>

        {/* Center Text absolute placement */}
        <div className="absolute top-[32%] flex flex-col items-center">
          <span className="text-4.5xl font-black text-slate-800 dark:text-white tracking-tight animate-pulse duration-2000">
            {totalScore}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            / 100 Puan
          </span>
        </div>
      </div>

      {/* Sub-Scores mini bar breakdown */}
      <div className="grid grid-cols-2 gap-4 mt-2 mb-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-800/30 p-3 rounded-2xl">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>Tasarruf</span>
            <span className="text-slate-700 dark:text-slate-300 font-extrabold">{savingsScore}/30</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(savingsScore / 30) * 100}%` }}></div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>Bütçe Uyum</span>
            <span className="text-slate-700 dark:text-slate-300 font-extrabold">{budgetScore}/30</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(budgetScore / 30) * 100}%` }}></div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>Borç Yönetimi</span>
            <span className="text-slate-700 dark:text-slate-300 font-extrabold">{debtScore}/20</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${(debtScore / 20) * 100}%` }}></div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>Hedefler</span>
            <span className="text-slate-700 dark:text-slate-300 font-extrabold">{goalScore}/20</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-pink-500 transition-all duration-1000" style={{ width: `${(goalScore / 20) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Accordion Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all active:scale-98"
      >
        <span>{isOpen ? 'Önerileri Gizle' : 'Öneriler ve Skor Analizi'}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Tips Dropdown */}
      {isOpen && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <h4 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Nasıl Skor Artırılır?
          </h4>
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {tips.map((tip, idx) => {
              const iconMap = {
                positive: <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />,
                negative: <AlertTriangle size={15} className="text-red-500 shrink-0" />,
                neutral: <HelpCircle size={15} className="text-blue-500 shrink-0" />
              };

              return (
                <div key={idx} className="flex items-start space-x-2.5 p-2 rounded-xl bg-slate-50/55 dark:bg-slate-800/20 border border-slate-100/50 dark:border-slate-800/20 text-xs font-medium text-slate-600 dark:text-slate-300">
                  {iconMap[tip.type]}
                  <div className="flex-1 space-y-0.5">
                    <p>{tip.message}</p>
                    {tip.pointsEffect && (
                      <span className={`text-[10px] font-extrabold ${tip.type === 'positive' ? 'text-emerald-500' : tip.type === 'negative' ? 'text-red-500' : 'text-blue-500'}`}>
                        {tip.pointsEffect}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
