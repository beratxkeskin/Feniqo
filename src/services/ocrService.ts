import Tesseract from 'tesseract.js';

export interface OCRResult {
  amount: number | null;
  date: string | null;
  text: string;
}

/**
 * Fiş/Makbuz görselinden OCR (Optik Karakter Tanıma) ile Tutar ve Tarih çıkarır.
 * 
 * @param imageFile Kullanıcının yüklediği görsel dosyası (File veya Blob)
 * @returns Çıkarılan miktar, tarih ve ham metni içeren bir obje döner.
 */
export const extractDataFromReceipt = async (imageFile: File | Blob): Promise<OCRResult> => {
  try {
    // Türkçe ve İngilizce dil paketleriyle OCR işlemini başlatıyoruz.
    // İlk çalıştırmada worker dosyaları (~20-30MB) indirilir.
    const result = await Tesseract.recognize(
      imageFile,
      'tur+eng',
      {
        logger: (m) => console.log('OCR Durumu:', m)
      }
    );

    const text = result.data.text;
    console.log("OCR Tamamlandı, okunan metin:\n", text);

    return {
      amount: extractAmount(text),
      date: extractDate(text),
      text: text
    };
  } catch (error) {
    console.error("OCR İşlemi başarısız oldu:", error);
    return { amount: null, date: null, text: '' };
  }
};

/**
 * Metin içerisinden en olası TOPLAM TUTAR bilgisini çıkarır.
 */
export const extractAmount = (text: string): number | null => {
  // Olası anahtar kelimelerden sonra gelen sayısal değerleri yakalar.
  // [^\d]* ile TOPLAM kelimesi ile miktar arasındaki (rakam olmayan) tüm karakterleri (boşluk, *, %, :, vb.) tolere eder.
  const amountRegex = /(?:TOPLAM|TOP\.|TUTAR|TOTAL|AMOUNT|KDV DAHIL)[^\d]*(\d{1,5}[.,]\d{2})/i;
  let match = text.match(amountRegex);

  // Eğer anahtar kelime bulunamazsa alternatif olarak metindeki tüm xx.xx formatındaki fiyatları bulup en büyüğünü alabiliriz
  if (!match) {
    const allPricesRegex = /\b(\d{1,5}[.,]\d{2})\b/g;
    const allMatches = [...text.matchAll(allPricesRegex)];
    if (allMatches.length > 0) {
      // Tüm fiyatları ondalık sayıya çevir ve en büyüğünü bul (genelde toplam en büyük değerdir)
      const prices = allMatches.map(m => parseFloat(m[1].replace(',', '.'))).filter(p => !isNaN(p));
      if (prices.length > 0) {
        return Math.max(...prices);
      }
    }
    return null;
  }

  if (match && match[1]) {
    const amountStr = match[1].replace(',', '.');
    const parsed = parseFloat(amountStr);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

/**
 * Metin içerisinden DD.MM.YYYY, DD/MM/YYYY vb. formatlarda tarihi çıkarır.
 */
export const extractDate = (text: string): string | null => {
  // Regex: 01-31 . 01-12 . 2000-2099
  const dateRegex = /(0[1-9]|[12][0-9]|3[01])[./-](0[1-9]|1[012])[./-](20\d\d)/;
  const match = text.match(dateRegex);

  if (match) {
    // Formun date input'u genelde YYYY-MM-DD ister, ona çevirip döndürelim
    const day = match[1];
    const month = match[2];
    const year = match[3];
    return `${year}-${month}-${day}`;
  }

  return null;
};
