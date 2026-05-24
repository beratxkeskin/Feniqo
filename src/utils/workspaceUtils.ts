/**
 * MoneyMate Ortak Bütçe Matematiksel Hesaplama Fonksiyonları
 */

interface MemberBalance {
  userId: string;
  spent: number;
  balance: number; // positive = alacaklı, negative = borçlu
}

interface SplitResult {
  totalSpent: number;
  sharePerPerson: number;
  balances: MemberBalance[];
}

/**
 * Üyelerin harcamalarına göre eşit bölüşüm detaylarını hesaplar.
 * @param memberExpenses Üye ID'sine karşılık gelen toplam harcama miktarları nesnesi.
 * @param memberIds Bütçedeki tüm aktif üyelerin ID listesi.
 */
export const calculateEqualSplit = (
  memberExpenses: Record<string, number>,
  memberIds: string[]
): SplitResult => {
  const activeIds = memberIds.length > 0 ? memberIds : ['user-1'];
  
  // 1. Toplam Gider
  const totalSpent = Object.values(memberExpenses).reduce((sum, amt) => sum + amt, 0);
  
  // 2. Kişi başı düşen pay
  const sharePerPerson = totalSpent / activeIds.length;
  
  // 3. Her üyenin dengesini hesapla (harcama - pay)
  const balances = activeIds.map(id => {
    const spent = memberExpenses[id] || 0;
    return {
      userId: id,
      spent,
      balance: spent - sharePerPerson
    };
  });

  return {
    totalSpent,
    sharePerPerson,
    balances
  };
};

interface SettlementResult {
  owesAmount: number;
  debtorId: string;
  creditorId: string;
}

/**
 * 2 kullanıcılı (çift/eş) bütçelerinde kimin kime ne kadar borçlu olduğunu bulur.
 */
export const calculateNetDebt2User = (
  myId: string,
  partnerId: string,
  mySpent: number,
  partnerSpent: number
): SettlementResult => {
  if (mySpent > partnerSpent) {
    // Partner bana borçlu
    return {
      owesAmount: (mySpent - partnerSpent) / 2,
      debtorId: partnerId,
      creditorId: myId
    };
  } else if (partnerSpent > mySpent) {
    // Ben partnerime borçluyum
    return {
      owesAmount: (partnerSpent - mySpent) / 2,
      debtorId: myId,
      creditorId: partnerId
    };
  }

  // Eşit harcama durumu
  return {
    owesAmount: 0,
    debtorId: '',
    creditorId: ''
  };
};
