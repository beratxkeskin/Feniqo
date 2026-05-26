/**
 * MoneyMate Akıllı Açıklama Sadeleştirici ve Temizleyici (Smart Description Cleanser)
 * Bankaların karmaşık, uzun ve kodlu ekstre açıklamalarından net marka/isim bilgilerini ayıklar.
 */

export function cleanDescription(rawDesc: string): string {
  if (!rawDesc) return 'Diğer İşlem';
  
  let desc = rawDesc.trim();
  const descUpper = desc.toUpperCase();

  // 1. SANAL POS / POS ALIŞVERİŞ TEMİZLEME
  if (descUpper.includes('SANAL POS') || descUpper.includes('İşYERİ:') || descUpper.includes('PREPAID')) {
    // İşyeri ismini bulmaya yönelik regex
    const merchantRegex = /(?:İŞYERİ|ISYERI):\s*([A-Z0-9_./*\-\s]+?)(?:\s+MUTABAKAT|\s+KART|\s+NO:|\.|$)/i;
    const match = desc.match(merchantRegex);
    if (match && match[1]) {
      let merchant = match[1].trim();

      // Alt marka düzeltmeleri
      if (merchant.includes('NETFLIX')) return 'Netflix';
      if (merchant.includes('YOUTUBE') || merchant.includes('YOUTUBEPREMI')) return 'YouTube Premium';
      if (merchant.includes('SPOTIFY')) return 'Spotify';
      if (merchant.includes('AMZNPRIME') || merchant.includes('AMAZONPRIME')) return descUpper.includes('İADE') ? 'Amazon Prime İade' : 'Amazon Prime';
      if (merchant.includes('HEPSIBURADA') || merchant.includes('HEPSIPAY')) return 'Hepsiburada';
      if (merchant.includes('TRENDYOL')) return 'Trendyol';
      if (merchant.includes('ISTANBULKART')) return 'İstanbulkart Yüklemesi';
      if (merchant.includes('GETİR') || merchant.includes('GETIR')) return 'Getir Siparişi';
      
      return merchant;
    }
  }

  // 2. PARA TRANSFERLERİ (FAST / HAVALE / EFT)
  if (descUpper.includes('GÖND:') || descUpper.includes('GÖNDEREN:') || descUpper.includes('FAST') || descUpper.includes('HAVALE')) {
    // Gönderen/Alıcı ismini ayıklama regex'i
    // Örn: "Gönd: YÜCEL KESKİN Gön - Yücel Keskin..." -> "Yücel Keskin"
    const senderRegex = /(?:Gönd|Gond|Gönderen|Alici|Alıcı):\s*([A-ZÇĞİÖŞÜa-zçğıöşü\s]+?)(?:\s+Gön|\s+\d|\s+FAST|\s+işlemi|\s+Havale|$)/i;
    const match = desc.match(senderRegex);
    if (match && match[1]) {
      const name = capitalizeWords(match[1].trim());
      return descUpper.includes('FAST') ? `${name} (FAST)` : `${name} (Havale)`;
    }

    // İsme göre alternatif yakalama
    // Örn: "YAREN YILMAZ nisan-mayıs ayı..." -> "Yaren Yılmaz"
    const words = desc.split(/\s+/);
    if (words.length >= 2) {
      const nameCandidate = `${words[0]} ${words[1]}`;
      if (/^[A-ZÇĞİÖŞÜa-zçğıöşü\s]+$/i.test(nameCandidate) && !['SANAL', 'HESAP', 'BAKİYE', 'TUTAR', 'BORÇ', 'ALACAK'].includes(words[0].toUpperCase())) {
        const name = capitalizeWords(nameCandidate);
        return descUpper.includes('HAVALE') ? `${name} (Havale)` : name;
      }
    }
  }

  // 3. FATURA ÖDEMELERİ
  if (descUpper.includes('VODAFONE')) return 'Vodafone Fatura Ödemesi';
  if (descUpper.includes('TURKCELL')) return 'Turkcell Fatura Ödemesi';
  if (descUpper.includes('TELEKOM')) return 'Türk Telekom Fatura Ödemesi';
  if (descUpper.includes('CK BOĞAZİÇİ') || descUpper.includes('ELEKTRİK')) return 'CK Boğaziçi Elektrik Faturası';
  if (descUpper.includes('İGDAŞ') || descUpper.includes('DOGALGAZ') || descUpper.includes('DOĞALGAZ')) return 'Doğalgaz Faturası';
  if (descUpper.includes('İSKİ') || descUpper.includes(' SU ')) return 'Su Faturası';

  // 4. HALKA ARZ / VİRMAN / YATIRIM
  if (descUpper.includes('HALKA ARZ') || descUpper.includes('ZİRAAT YATIRIM') || descUpper.includes('ZIRAAT YATIRIM')) {
    const symbolRegex = /\b([A-Z]{4,5})\b/; // Halka arz hisse kodunu yakala (örn: EKDMR)
    const match = desc.match(symbolRegex);
    if (match && match[1]) {
      return `Ziraat Yatırım (${match[1]} Halka Arz)`;
    }
    return descUpper.includes('VİRMAN') || descUpper.includes('VIRMAN') ? 'Ziraat Yatırım Hesabına Virman' : 'Ziraat Yatırım Transferi';
  }

  // Varsayılan: Eğer hiçbir kurala uymuyorsa, açıklamayı biraz kısaltıp temizle
  return shortenDescription(desc);
}

/**
 * Kelimelerin baş harflerini büyütür, diğerlerini küçültür (Türkçe karakter uyumlu).
 */
function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s)[a-zçğıöşü]/g, (letter) => {
      // Türkçe karakter büyütme düzeltmesi
      if (letter.trim() === 'i') return ' İ';
      if (letter.trim() === 'ı') return ' I';
      return letter.toUpperCase();
    })
    .trim();
}

/**
 * Çok uzun açıklamaları belirli bir uzunlukta keser ve sonuna üç nokta ekler.
 */
function shortenDescription(str: string, maxLength: 45 = 45): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength).trim() + '...';
}
