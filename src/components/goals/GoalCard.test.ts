import { describe, it, expect } from 'vitest';
import { calculateDaysLeft, calculateEstimatedArrivalDate } from './GoalCard';
import type { Goal } from '../../db/types';

describe('GoalCard Calculations', () => {
  describe('calculateDaysLeft', () => {
    it('should return positive number of days for future dates', () => {
      const today = new Date();
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + 10);
      const targetStr = targetDate.toISOString().split('T')[0];

      expect(calculateDaysLeft(targetStr)).toBe(10);
    });

    it('should return 0 or negative for today or past dates', () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      expect(calculateDaysLeft(todayStr)).toBe(0);

      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 5);
      const pastStr = pastDate.toISOString().split('T')[0];

      expect(calculateDaysLeft(pastStr)).toBe(-5);
    });
  });

  describe('calculateEstimatedArrivalDate', () => {
    const baseGoal: Goal = {
      id: 'test-goal',
      user_id: 'test-user',
      name: 'Vacation Fund',
      target_amount: 10000,
      current_amount: 0,
      target_date: '2026-12-31',
      color: '#3B82F6',
      icon: 'Palmtree',
      created_at: new Date().toISOString()
    };

    it('should return completed if current amount equals or exceeds target', () => {
      const goal = { ...baseGoal, current_amount: 10000 };
      expect(calculateEstimatedArrivalDate(goal)).toBe('completed');

      const goalExceeded = { ...baseGoal, current_amount: 12000 };
      expect(calculateEstimatedArrivalDate(goalExceeded)).toBe('completed');
    });

    it('should return no_savings if current amount is 0 or negative', () => {
      const goal = { ...baseGoal, current_amount: 0 };
      expect(calculateEstimatedArrivalDate(goal)).toBe('no_savings');

      const goalNegative = { ...baseGoal, current_amount: -500 };
      expect(calculateEstimatedArrivalDate(goalNegative)).toBe('no_savings');
    });

    it('should calculate projection using minimum 7 days smoothing for new goals', () => {
      // Goal created today, target 10,000 TL, current 1,000 TL.
      // With 7 days minimum smoothing:
      // avgSavedPerDay = 1000 / 7 = 142.857
      // remaining = 9000
      // daysNeeded = Math.ceil(9000 / 142.857) = 63 days
      const today = new Date();
      const goal = {
        ...baseGoal,
        target_amount: 10000,
        current_amount: 1000,
        created_at: today.toISOString()
      };

      const estDateStr = calculateEstimatedArrivalDate(goal);
      expect(estDateStr).not.toBe('completed');
      expect(estDateStr).not.toBe('no_savings');
      expect(estDateStr).not.toBe('no_rate');

      // Check that it's projected exactly 63 days from now
      const estDate = new Date(estDateStr);
      today.setHours(0, 0, 0, 0);
      estDate.setHours(0, 0, 0, 0);
      const diffTime = estDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(63);
    });

    it('should calculate projection with accurate historical rate if goal is older', () => {
      // Goal created 20 days ago, target 5,000 TL, current 2,000 TL.
      // avgSavedPerDay = 2000 / 20 = 100
      // remaining = 3000
      // daysNeeded = 30 days
      const today = new Date();
      const createdDate = new Date();
      createdDate.setDate(today.getDate() - 20);

      const goal = {
        ...baseGoal,
        target_amount: 5000,
        current_amount: 2000,
        created_at: createdDate.toISOString()
      };

      const estDateStr = calculateEstimatedArrivalDate(goal);
      const estDate = new Date(estDateStr);
      today.setHours(0, 0, 0, 0);
      estDate.setHours(0, 0, 0, 0);
      const diffTime = estDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(30);
    });
  });
});
