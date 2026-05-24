import type { Transaction } from '../db/types';

export interface ForecastResult {
  projectedExpense: number;
  historicalAverage: number;
  currentExpense: number;
  currentIncome: number;
  projectedBalance: number;
  isSafe: boolean;
  trendPercentage: number;
  message: string;
}

/**
 * Geçmiş 3 ayın verileri ve mevcut harcama hızı (run-rate) kullanılarak
 * ay sonu için akıllı harcama tahmini yapar.
 */
export function calculateSpendingForecast(
  transactions: Transaction[],
  activeMonthStr: string, // YYYY-MM formatında
  nowOverride?: Date
): ForecastResult {
  const [year, month] = activeMonthStr.split('-').map(Number);
  const now = nowOverride || new Date();
  
  // Eğer incelenen ay şu anki ay değilse (örneğin geçmiş bir aya bakılıyorsa),
  // tahmin yapmaya gerek yok, doğrudan mevcut değerleri dön.
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  
  const currentMonthTxs = transactions.filter(t => t.transaction_date.startsWith(activeMonthStr));
  const currentExpense = currentMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const currentIncome = currentMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

  // Geçmiş 3 ayın ortalama harcamasını bul
  const pastMonths = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(year, month - 1 - i, 1);
    // Yerel timezone kaymalarını önlemek için manuel YYYY-MM formatla
    const pastYear = d.getFullYear();
    const pastMonth = String(d.getMonth() + 1).padStart(2, '0');
    pastMonths.push(`${pastYear}-${pastMonth}`);
  }

  let totalPastExpenses = 0;
  let monthsWithData = 0;

  pastMonths.forEach(pm => {
    const expenses = transactions
      .filter(t => t.transaction_date.startsWith(pm) && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    if (expenses > 0) {
      totalPastExpenses += expenses;
      monthsWithData++;
    }
  });

  const historicalAverage = monthsWithData > 0 ? totalPastExpenses / monthsWithData : 0;

  let projectedExpense = currentExpense;

  if (isCurrentMonth) {
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Günlük harcama hızı
    const runRate = currentExpense / dayOfMonth;
    
    // Sadece hız bazlı (run-rate) tahmin
    const runRateProjection = runRate * daysInMonth;

    // Ağırlıklı Tahmin:
    // Eğer geçmiş veri varsa: %70 mevcut hız, %30 geçmiş alışkanlık
    // Geçmiş veri yoksa sadece mevcut hızı kullan.
    if (historicalAverage > 0) {
      projectedExpense = (runRateProjection * 0.7) + (historicalAverage * 0.3);
    } else {
      projectedExpense = runRateProjection;
    }
    
    // Kalan gün azaldıkça (ayın sonuna geldikçe) mevcut harcama oranının kesinliği artar.
    // Bu yüzden eğer formül mevcut harcamadan daha düşük bir sonuç verirse (matematiksel anomali),
    // projectedExpense'i en azından currentExpense'e eşitle.
    projectedExpense = Math.max(projectedExpense, currentExpense);
  }

  const projectedBalance = currentIncome - projectedExpense;
  const isSafe = projectedBalance >= 0;
  
  let trendPercentage = 0;
  if (historicalAverage > 0) {
    trendPercentage = ((projectedExpense - historicalAverage) / historicalAverage) * 100;
  }

  let message = '';
  if (isCurrentMonth) {
    if (isSafe) {
      message = trendPercentage > 10 
        ? 'Harcamalarınız geçmişe kıyasla artışta ancak bütçeniz ay sonu için güvende.' 
        : 'Harika gidiyorsunuz! Ay sonu tahmini bakiyeniz pozitif.';
    } else {
      message = 'Uyarı: Mevcut harcama hızınızla ay sonunda gelirinizin üzerine çıkabilirsiniz!';
    }
  } else {
    message = 'Geçmiş aylar için tahminleme yapılmamaktadır.';
  }

  return {
    projectedExpense: Math.round(projectedExpense),
    historicalAverage: Math.round(historicalAverage),
    currentExpense: Math.round(currentExpense),
    currentIncome: Math.round(currentIncome),
    projectedBalance: Math.round(projectedBalance),
    isSafe,
    trendPercentage: Math.round(trendPercentage),
    message
  };
}
