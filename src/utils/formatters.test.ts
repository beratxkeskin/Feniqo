import { describe, it, expect } from 'vitest';
import { 
  getCurrencySymbol, 
  formatCurrency, 
  calculateSavingsRate, 
  calculateBudgetProgress,
  formatMonthName
} from './formatters';

describe('Formatters & Calculators', () => {

  describe('getCurrencySymbol', () => {
    it('returns correct symbol for TRY', () => {
      expect(getCurrencySymbol('TRY')).toBe('₺');
    });
    
    it('returns correct symbol for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    it('returns default symbol for unknown currency', () => {
      expect(getCurrencySymbol('UNKNOWN')).toBe('₺');
    });
  });

  describe('formatCurrency', () => {
    it('formats TRY amount correctly', () => {
      const formatted = formatCurrency(1250.50, 'TRY');
      // The exact output depends on Node's Intl implementation, but it should contain the symbol and number
      expect(formatted).toContain('1.250,50');
      expect(formatted).toContain('₺');
    });

    it('formats USD amount correctly', () => {
      const formatted = formatCurrency(1250.50, 'USD');
      expect(formatted).toContain('1,250.50');
      expect(formatted).toContain('$');
    });
  });

  describe('calculateSavingsRate', () => {
    it('calculates 0% when income is 0', () => {
      expect(calculateSavingsRate(0, 1000)).toBe(0);
    });

    it('calculates 0% when expense is greater than income', () => {
      expect(calculateSavingsRate(1000, 1500)).toBe(0);
    });

    it('calculates correct savings percentage', () => {
      expect(calculateSavingsRate(10000, 8000)).toBe(20);
      expect(calculateSavingsRate(5000, 2500)).toBe(50);
    });
  });

  describe('calculateBudgetProgress', () => {
    it('calculates 0% when limit is 0', () => {
      expect(calculateBudgetProgress(500, 0)).toBe(0);
    });

    it('calculates correct progress percentage', () => {
      expect(calculateBudgetProgress(500, 1000)).toBe(50);
      expect(calculateBudgetProgress(1000, 1000)).toBe(100);
      expect(calculateBudgetProgress(1500, 1000)).toBe(150); // over budget
    });
  });

  describe('formatMonthName', () => {
    it('formats YYYY-MM to Turkish month names', () => {
      expect(formatMonthName('2026-05')).toBe('Mayıs 2026');
    });

    it('formats YYYY-MM to English month names', () => {
      expect(formatMonthName('2026-05', true)).toBe('May 2026');
    });

    it('returns raw string if format is invalid', () => {
      expect(formatMonthName('invalid')).toBe('invalid');
    });
  });
});
