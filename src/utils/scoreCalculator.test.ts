import { describe, it, expect } from 'vitest';
import { calculateMoneyScore } from './scoreCalculator';
import type { Transaction, Budget, Debt, Goal, Category } from '../db/types';

describe('MoneyScore Finansal Sağlık Skoru Motoru Testleri', () => {
  const mockCategories: Category[] = [
    { id: 'cat-food', name: 'Gıda', type: 'expense', color: '#EF4444', is_default: true, user_id: 'user-1' },
    { id: 'cat-rent', name: 'Kira', type: 'expense', color: '#3B82F6', is_default: true, user_id: 'user-1' },
    { id: 'cat-salary', name: 'Maaş', type: 'income', color: '#10B981', is_default: true, user_id: 'user-1' }
  ];

  it('Başlangıç/Boş durumda makul dengeli bir skor üretmeli', () => {
    const res = calculateMoneyScore([], [], [], [], mockCategories, '2026-05');
    // Boş durumda:
    // Tasarruf: 15 Puan (işlem yok)
    // Bütçe: 15 Puan (bütçe yok)
    // Borç: 20 Puan (borç yok)
    // Hedef: 10 Puan (hedef yok)
    // Toplam = 60 Puan
    expect(res.totalScore).toBe(60);
    expect(res.level).toBe('healthy');
    expect(res.tips.length).toBeGreaterThan(0);
  });

  it('Yüksek performanslı finansal senaryoda 100 puan vermeli', () => {
    // Tasarruf Oranı: %25+ (Gelir: 10000, Gider: 5000 -> Tasarruf: %50 -> 30 Puan)
    const transactions: Transaction[] = [
      { id: 't1', user_id: 'user-1', amount: 10000, type: 'income', category_id: 'cat-salary', payment_method: 'Nakit', transaction_date: '2026-05-10' },
      { id: 't2', user_id: 'user-1', amount: 5000, type: 'expense', category_id: 'cat-rent', payment_method: 'Banka Kartı', transaction_date: '2026-05-12' }
    ];
    // Bütçe Sadakati: Aşım yok (Limit: 6000, Spent: 5000 -> 30 Puan)
    const budgets: Budget[] = [
      { id: 'b1', user_id: 'user-1', category_id: 'cat-rent', limit_amount: 6000, month: '2026-05' }
    ];
    // Borç: Borç yok veya hepsi ödenmiş (20 Puan)
    const debts: Debt[] = [
      { id: 'd1', user_id: 'user-1', title: 'Arkadaşa Borç', amount: 1000, type: 'debt', due_date: '2026-05-01', is_paid: true }
    ];
    // Hedefler: %100 tamamlanmış (Target: 5000, Current: 5000 -> 20 Puan)
    const goals: Goal[] = [
      { id: 'g1', user_id: 'user-1', name: 'Tatil Birikimi', target_amount: 5000, current_amount: 5000, target_date: '2026-12-31', color: '#333' }
    ];

    const res = calculateMoneyScore(transactions, budgets, debts, goals, mockCategories, '2026-05');
    expect(res.totalScore).toBe(100);
    expect(res.level).toBe('excellent');
  });

  it('Borç gecikmesi ve aşırı harcama durumunda skoru ciddi derecede düşürmeli', () => {
    // Gelir: 10000, Gider: 12000 -> Tasarruf: Negatif -> 0 Puan
    const transactions: Transaction[] = [
      { id: 't1', user_id: 'user-1', amount: 10000, type: 'income', category_id: 'cat-salary', payment_method: 'Nakit', transaction_date: '2026-05-10' },
      { id: 't2', user_id: 'user-1', amount: 12000, type: 'expense', category_id: 'cat-rent', payment_method: 'Banka Kartı', transaction_date: '2026-05-12' }
    ];
    // Bütçe: Limit: 5000, Harcama: 12000 -> Limit 2 kat aşıldığı için 0 Puan
    const budgets: Budget[] = [
      { id: 'b1', user_id: 'user-1', category_id: 'cat-rent', limit_amount: 5000, month: '2026-05' }
    ];
    // Borç: Ödeme tarihi geçmiş borç var -> 0 Puan
    // Gelecekte bir tarih yerine geçmiş bir tarihi hedef alalım
    const debts: Debt[] = [
      { id: 'd1', user_id: 'user-1', title: 'Banka Kredisi', amount: 2000, type: 'debt', due_date: '2020-01-01', is_paid: false }
    ];
    // Hedef: Hedef yok -> 10 Puan
    const goals: Goal[] = [];

    const res = calculateMoneyScore(transactions, budgets, debts, goals, mockCategories, '2026-05');
    // Toplam = Tasarruf(0) + Bütçe(0) + Borç(0) + Hedef(10) = 10 Puan
    expect(res.totalScore).toBe(10);
    expect(res.level).toBe('critical');
    // Gecikmiş borç uyarısını kontrol et
    const hasOverdueTip = res.tips.some(t => t.message.includes('geçmiş') && t.type === 'negative');
    expect(hasOverdueTip).toBe(true);
  });
});
