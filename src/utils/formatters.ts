/**
 * MoneyMate Finansal Yardımcı Fonksiyonları (Formatters & Calculators)
 */

/**
 * Para birimini seçilen sembole göre formatlar.
 * @param amount Miktar
 * @param currency Para birimi kodu ('TRY', 'USD', 'EUR')
 */
export const getCurrencySymbol = (currency: string = 'TRY'): string => {
  const currencyMap: { [key: string]: string } = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
  };
  return currencyMap[currency] || '₺';
};

export const formatCurrency = (amount: number, currency: string = 'TRY'): string => {
  const currencyMap: { [key: string]: { locale: string; symbol: string; style: string } } = {
    TRY: { locale: 'tr-TR', symbol: '₺', style: 'TRY' },
    USD: { locale: 'en-US', symbol: '$', style: 'USD' },
    EUR: { locale: 'de-DE', symbol: '€', style: 'EUR' },
  };

  const config = currencyMap[currency] || currencyMap.TRY;

  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.style,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if system fails
    return `${config.symbol}${amount.toLocaleString(config.locale, { minimumFractionDigits: 2 })}`;
  }
};

/**
 * Tarihi Türkçe formatta okunabilir şekilde biçimlendirir.
 * Örnek Giriş: "2026-05-22"
 * Örnek Çıkış: "22 Mayıs 2026"
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    // Adjust timezone offsets so it displays correct day
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    
    return adjustedDate.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
};

/**
 * Tarihi kısa formatta biçimlendirir (Örn: "22 May")
 */
export const formatShortDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    
    return adjustedDate.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
    });
  } catch (e) {
    return dateStr;
  }
};

/**
 * Tasarruf oranını hesaplar.
 * Formül: ((Gelir - Gider) / Gelir) * 100
 */
export const calculateSavingsRate = (income: number, expense: number): number => {
  if (income <= 0) return 0;
  const savings = income - expense;
  if (savings <= 0) return 0;
  return Math.round((savings / income) * 100);
};

/**
 * Bütçe kullanım yüzdesini hesaplar.
 */
export const calculateBudgetProgress = (spent: number, limit: number): number => {
  if (limit <= 0) return 0;
  return Math.round((spent / limit) * 100);
};

/**
 * YYYY-MM formatındaki ay stringini Türkçe veya İngilizce ay adına çevirir.
 * Örn: "2026-05" -> "Mayıs 2026" veya "May 2026"
 */
export const formatMonthName = (monthStr: string, isEn: boolean = false): string => {
  if (!monthStr || monthStr.length < 7 || !monthStr.includes('-')) return monthStr;
  try {
    const [year, month] = monthStr.split('-');
    if (!year || !month || isNaN(parseInt(year)) || isNaN(parseInt(month))) return monthStr;
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    if (isNaN(date.getTime())) return monthStr;
    return date.toLocaleDateString(isEn ? 'en-US' : 'tr-TR', { month: 'long', year: 'numeric' });
  } catch (e) {
    return monthStr;
  }
};
