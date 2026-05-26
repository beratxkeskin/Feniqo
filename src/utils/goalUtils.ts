import type { Goal } from '../db/types';

export const calculateDaysLeft = (targetDateStr: string): number => {
  const [year, month, day] = targetDateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  const today = new Date();
  targetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateEstimatedArrivalDate = (goal: Goal): string => {
  const current = Number(goal.current_amount);
  const target = Number(goal.target_amount);
  if (current >= target) return 'completed';
  if (current <= 0) return 'no_savings';

  const createdDate = new Date(goal.created_at || Date.now());
  const today = new Date();
  createdDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - createdDate.getTime();
  // Weekly-moving-average smoothing (min 7 days) to prevent extreme spikes on initial deposits
  const daysSinceCreation = Math.max(7, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  const avgSavedPerDay = current / daysSinceCreation;
  if (avgSavedPerDay <= 0) return 'no_rate';

  const remaining = target - current;
  const daysNeeded = Math.ceil(remaining / avgSavedPerDay);
  
  const estimatedDate = new Date();
  estimatedDate.setDate(today.getDate() + daysNeeded);
  
  const year = estimatedDate.getFullYear();
  const month = String(estimatedDate.getMonth() + 1).padStart(2, '0');
  const day = String(estimatedDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

