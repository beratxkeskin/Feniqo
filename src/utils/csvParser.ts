/**
 * MoneyMate Akıllı CSV Ayrıştırıcı Yardımcı Fonksiyonu
 */

/**
 * Tek bir satırı verilen ayraça göre güvenli bir şekilde böler.
 * Çift tırnak ("...") içindeki ayraçları görmezden gelir ve alanları temizler.
 */
export function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      // Çift tırnakları temizleyip alanı ekle
      result.push(currentField.trim().replace(/^"|"$/g, '').trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  result.push(currentField.trim().replace(/^"|"$/g, '').trim());
  return result;
}

/**
 * Yüklenen metinden ayraçı (virgül, noktalı virgül, tab) otomatik tespit eder.
 */
export function detectDelimiter(lines: string[]): string {
  const testLines = lines.slice(0, 5).filter(l => l.trim().length > 0);
  if (testLines.length === 0) return ',';

  const delimiters = [',', ';', '\t'];
  const counts = delimiters.map(d => {
    let count = 0;
    testLines.forEach(line => {
      count += (line.split(d).length - 1);
    });
    return { char: d, count };
  });

  // En çok eşleşen ayraçı seç
  counts.sort((a, b) => b.count - a.count);
  return counts[0].count > 0 ? counts[0].char : ',';
}

/**
 * Ham CSV metnini parse ederek başlıklar (headers) ve satırları (rows) döner.
 */
export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  // Satır sonu karakterlerine göre böl (hücre kaymalarını önlemek için baştaki/sondaki sekmeleri (tab) korur)
  const lines = text.split(/\r?\n/).map(l => l.replace(/[\r\n]+$/, '')).filter(l => l.trim().length > 0);
  
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const delimiter = detectDelimiter(lines);

  // Akıllı Başlık Bulucu (Smart Header Finder):
  // Bankaların başlık kısımlarındaki reklam, tarih aralığı veya "Hesap Hareketleri" gibi title satırlarını atlayıp
  // kolon başlıklarının (Tarih, Açıklama, Tutar vb.) olduğu asıl satırı bulur.
  const headerKeywords = [
    'tarih', 'date', 'zaman', 'time', 'gün', 'gun',
    'açıklama', 'aciklama', 'detay', 'description', 'detail', 'tanım', 'concept',
    'tutar', 'miktar', 'amount', 'bakiye', 'balance', 'işlem', 'islem', 'fiş', 'fis'
  ];

  let headerIndex = 0;
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const fields = parseCSVLine(lines[i], delimiter);
    let matchCount = 0;
    fields.forEach(field => {
      const cleanField = field.toLowerCase().trim();
      if (headerKeywords.some(kw => cleanField.includes(kw))) {
        matchCount++;
      }
    });
    // Eğer satırda en az 2 adet başlık anahtar kelimesi geçiyorsa bu satır başlık satırıdır!
    if (matchCount >= 2) {
      headerIndex = i;
      break;
    }
  }

  const headers = parseCSVLine(lines[headerIndex], delimiter);
  
  const rows: string[][] = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const parsedLine = parseCSVLine(lines[i], delimiter);
    // Boş olmayan satırları al
    if (parsedLine.length > 0 && parsedLine.some(field => field.length > 0)) {
      rows.push(parsedLine);
    }
  }

  return { headers, rows };
}
