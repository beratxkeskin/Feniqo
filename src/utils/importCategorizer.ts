/**
 * MoneyMate Akıllı Kategorilendirme Yardımcı Sınıfı
 */

interface KeywordRule {
  categoryId: string;
  keywords: string[];
}

// Gider Kategorileri Eşleştirme Kuralları (Turkish & English common patterns)
const EXPENSE_RULES: KeywordRule[] = [
  {
    categoryId: 'cat-expense-yemek',
    keywords: ['starbucks', 'yemek', 'restaurant', 'cafe', 'kahve', 'restaurant', 'burger', 'pizza', 'döner', 'kebap', 'kahve', 'coffee', 'bakery', 'patisserie', 'getir yemek', 'trendyol yemek', 'sodexo', 'multinet', 'gıda', 'mutfak', 'kahvaltı']
  },
  {
    categoryId: 'cat-expense-market',
    keywords: ['migros', 'carrefour', 'bim', 'a101', 'şok', 'market', 'macrocenter', 'gros', 'manav', 'kasap', 'şarküteri', 'süpermarket', 'grocery', 'supermarket', 'getir', 'istegelsin', 'banabi']
  },
  {
    categoryId: 'cat-expense-ulasim',
    keywords: ['shell', 'petrol', 'opet', 'bp', 'türkiye petrolleri', 'yakıt', 'benzin', 'mazot', 'lpg', 'gas', 'fuel', 'metro', 'otobüs', 'ulasim', 'ulaşım', 'taxi', 'taksi', 'uber', 'biTaksi', 'bilet', 'thy', 'pegasus', 'otopark', 'hgs', 'egm', 'trafi']
  },
  {
    categoryId: 'cat-expense-kira',
    keywords: ['kira', 'rent', 'ev kirası', 'apartment rent', 'lease']
  },
  {
    categoryId: 'cat-expense-fatura',
    keywords: ['fatura', 'telekom', 'turkcell', 'vodafone', 'turk telekom', 'superonline', 'elektrik', 'enerji', 'doğalgaz', 'gaz', 'su', 'iski', 'igdas', 'asatk', 'invoice', 'bill', 'ödeme', 'tv', 'digiturk', 'd-smart', 'tivibu']
  },
  {
    categoryId: 'cat-expense-eglence',
    keywords: ['sinema', 'cinema', 'tiyatro', 'biletix', 'konser', 'müzik', 'pub', 'bar', 'club', 'oyun', 'steam', 'epic games', 'playstation', 'psn', 'xbox', 'nintendo', 'eğlence', 'tatil', 'otel', 'hotel', 'booking', 'eğlence', 'party']
  },
  {
    categoryId: 'cat-expense-egitim',
    keywords: ['okul', 'kolej', 'üniversite', 'burs', 'kurs', 'udemy', 'coursera', 'kitap', 'kırtasiye', 'kitapyurdu', 'bkm', 'eğitim', 'education', 'tuition', 'school', 'book']
  },
  {
    categoryId: 'cat-expense-saglik',
    keywords: ['eczane', 'ilaç', 'hastane', 'doktor', 'sağlık', 'optik', 'tıp', 'klinik', 'dis', 'diş', 'medikal', 'health', 'pharmacy', 'hospital', 'dentist']
  },
  {
    categoryId: 'cat-expense-abonelik',
    keywords: ['netflix', 'spotify', 'youtube premium', 'youtube mem', 'disney', 'amazon prime', 'prime video', 'apple.com/bill', 'icloud', 'hosting', 'domain', 'adobe', 'canva', 'zoom', 'abonelik', 'subscription', 'membership']
  },
  {
    categoryId: 'cat-expense-tasarruf',
    keywords: ['yatırım', 'yatirim', 'tasarruf', 'birikim', 'altın', 'altin', 'hisse', 'fon', 'tahvil', 'kripto', 'borsa', 'virman', 'halka arz', 'savings', 'investment']
  }
];

// Gelir Kategorileri Eşleştirme Kuralları
const INCOME_RULES: KeywordRule[] = [
  {
    categoryId: 'cat-income-maas',
    keywords: ['maaş', 'maas', 'salary', 'payroll', 'hakediş', 'şirket ödeme', 'direct deposit']
  },
  {
    categoryId: 'cat-income-freelance',
    keywords: ['freelance', 'hizmet bedeli', 'tasarım', 'kodlama', 'danışmanlık', 'proje', 'bionluk', 'upwork', 'fiverr']
  },
  {
    categoryId: 'cat-income-burs',
    keywords: ['burs', 'scholarship', 'kyk', 'vakıf bursu']
  },
  {
    categoryId: 'cat-income-yatirim',
    keywords: ['yatırım', 'kâr', 'fon', 'temettü', 'dividend', 'faiz', 'interest', 'hisse', 'kripto satış', 'crypto', 'btc', 'borsa']
  }
];

/**
 * İşlem açıklamasına göre akıllı kategori önerisi yapar.
 * 
 * @param description İşlem açıklaması
 * @param type İşlem türü ('income' | 'expense')
 * @returns Önerilen kategori ID'si
 */
export function suggestCategory(description: string, type: 'income' | 'expense'): string {
  const descLower = description.toLowerCase();
  const rules = type === 'expense' ? EXPENSE_RULES : INCOME_RULES;
  
  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      if (descLower.includes(keyword)) {
        return rule.categoryId;
      }
    }
  }

  // Eşleşme olmazsa varsayılan genel kategorileri döndür
  return type === 'expense' ? 'cat-expense-diger' : 'cat-income-diger';
}
