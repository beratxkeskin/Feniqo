import { describe, it, expect } from 'vitest';
import { calculateSpendingForecast } from './predictiveAnalytics';
import type { Transaction } from '../db/types';

describe('Predictive Analytics Engine Tests', () => {
  const baseTxs: Transaction[] = [
    // Geçmiş Ay 1 (2026-04): 3000 harcama
    { id: '1', user_id: 'u1', type: 'expense', amount: 3000, transaction_date: '2026-04-10', category_id: 'c1', payment_method: 'credit_card', created_at: '' },
    // Geçmiş Ay 2 (2026-03): 2000 harcama
    { id: '2', user_id: 'u1', type: 'expense', amount: 2000, transaction_date: '2026-03-15', category_id: 'c1', payment_method: 'cash', created_at: '' },
    // Geçmiş Ay 3 (2026-02): 4000 harcama
    { id: '3', user_id: 'u1', type: 'expense', amount: 4000, transaction_date: '2026-02-20', category_id: 'c1', payment_method: 'credit_card', created_at: '' },
  ];

  it('calculates historical average correctly (3000)', () => {
    // Current date is 2026-05-15
    const mockNow = new Date(2026, 4, 15); // May 15, 2026
    const res = calculateSpendingForecast(baseTxs, '2026-05', mockNow);
    expect(res.historicalAverage).toBe(3000); // (3000+2000+4000)/3
  });

  it('blends run-rate and historical average correctly for active month', () => {
    // Current date is 2026-05-10
    const mockNow = new Date(2026, 4, 10); 
    const txs: Transaction[] = [
      ...baseTxs,
      // Bu ay 10 günde 2000 harcama yapılmış
      { id: '4', user_id: 'u1', type: 'expense', amount: 2000, transaction_date: '2026-05-05', category_id: 'c1', payment_method: 'cash', created_at: '' },
      { id: '5', user_id: 'u1', type: 'income', amount: 10000, transaction_date: '2026-05-01', category_id: 'c2', payment_method: 'bank_transfer', created_at: '' }
    ];

    const res = calculateSpendingForecast(txs, '2026-05', mockNow);
    
    // Run-rate = 2000 / 10 = 200 per day.
    // May has 31 days. Run-rate projection = 200 * 31 = 6200.
    // Historical avg = 3000.
    // Formula = (6200 * 0.7) + (3000 * 0.3) = 4340 + 900 = 5240.
    expect(res.projectedExpense).toBe(5240);
    expect(res.isSafe).toBe(true); // 10000 - 5240 > 0
    expect(res.trendPercentage).toBe(Math.round(((5240 - 3000) / 3000) * 100)); // 75%
  });

  it('handles past months without forecasting', () => {
    const mockNow = new Date(2026, 4, 15); // Current is May
    // Asking for March
    const res = calculateSpendingForecast(baseTxs, '2026-03', mockNow);
    
    expect(res.projectedExpense).toBe(2000); // Same as current expense for that month
    expect(res.message).toBe('Geçmiş aylar için tahminleme yapılmamaktadır.');
  });

  it('handles safe vs unsafe states', () => {
    const mockNow = new Date(2026, 4, 25); // May 25
    const txs: Transaction[] = [
      ...baseTxs,
      // 25 günde 9000 harcama
      { id: '4', user_id: 'u1', type: 'expense', amount: 9000, transaction_date: '2026-05-05', category_id: 'c1', payment_method: 'cash', created_at: '' },
      // Gelir 10000
      { id: '5', user_id: 'u1', type: 'income', amount: 10000, transaction_date: '2026-05-01', category_id: 'c2', payment_method: 'bank_transfer', created_at: '' }
    ];

    const res = calculateSpendingForecast(txs, '2026-05', mockNow);
    expect(res.projectedExpense).toBe(9000);
    expect(res.isSafe).toBe(true);
    // Run rate: 9000 / 25 = 360/day -> * 31 = 11160
    // Historical avg = 3000
    // Projected = (11160 * 0.7) + (3000 * 0.3) = 7812 + 900 = 8712
    // Wait, 8712 < 9000. Math.max(projected, currentExpense) ensures it returns 9000.
    // 9000 is still safe (10000 - 9000 = 1000). But if projected goes > 10000 it's unsafe.

    const unsafeTxs: Transaction[] = [
      ...baseTxs,
      // 25 günde 12000 harcama
      { id: '4', user_id: 'u1', type: 'expense', amount: 12000, transaction_date: '2026-05-05', category_id: 'c1', payment_method: 'credit_card', created_at: '' },
      // Gelir 10000
      { id: '5', user_id: 'u1', type: 'income', amount: 10000, transaction_date: '2026-05-01', category_id: 'c2', payment_method: 'bank_transfer', created_at: '' }
    ];
    const unsafeRes = calculateSpendingForecast(unsafeTxs, '2026-05', mockNow);
    expect(unsafeRes.isSafe).toBe(false);
  });
});
