import { describe, it, expect } from 'vitest';
import { addMonthsToDate } from '../context/DataContext';

describe('addMonthsToDate', () => {
  it('adds months correctly for normal dates', () => {
    expect(addMonthsToDate('2026-05-26', 1)).toBe('2026-06-26');
    expect(addMonthsToDate('2026-05-26', 3)).toBe('2026-08-26');
    expect(addMonthsToDate('2026-05-26', 12)).toBe('2027-05-26');
  });

  it('keeps day at max of target month when adding month overflows (e.g. Jan 31 -> Feb 28)', () => {
    expect(addMonthsToDate('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsToDate('2026-01-31', 2)).toBe('2026-03-31');
    expect(addMonthsToDate('2024-01-31', 1)).toBe('2024-02-29'); // Leap year
  });

  it('handles negative month additions or 0 additions', () => {
    expect(addMonthsToDate('2026-05-26', 0)).toBe('2026-05-26');
  });
});
