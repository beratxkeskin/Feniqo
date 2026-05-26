import type { Transaction, Budget, Debt, Goal, Category } from '../db/types';

export interface ScoreTip {
  type: 'positive' | 'negative' | 'neutral';
  message: string;
  pointsEffect?: string;
}

export interface ScoreBreakdown {
  savingsScore: number;      // 0-30
  budgetScore: number;       // 0-30
  debtScore: number;         // 0-20
  goalScore: number;         // 0-20
  totalScore: number;        // 0-100
  level: 'critical' | 'healthy' | 'excellent';
  label: string;
  tips: ScoreTip[];
}

/**
 * MoneyScore Finansal Sağlık Skoru Hesaplayıcı Motoru
 * 
 * @param transactions Kullanıcının tüm işlemleri
 * @param budgets Kullanıcının bütçeleri
 * @param debts Kullanıcının borçları
 * @param goals Kullanıcının hedefleri
 * @param categories Kullanıcının kategorileri
 * @param activeMonth Değerlendirilecek ay 'YYYY-MM' (örn: '2026-05')
 */
export function calculateMoneyScore(
  transactions: Transaction[],
  budgets: Budget[],
  debts: Debt[],
  goals: Goal[],
  _categories: Category[],
  activeMonth: string
): ScoreBreakdown {
  const tips: ScoreTip[] = [];
  const todayStr = new Date().toISOString().substring(0, 10); // 'YYYY-MM-DD'

  // -----------------------------------------------------------------
  // 1. TASARRUF ORANI SKORU (Ağırlık: %30, Puan: 0-30)
  // -----------------------------------------------------------------
  const currentMonthTxs = transactions.filter(t => t.transaction_date.startsWith(activeMonth));
  const totalIncome = currentMonthTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = currentMonthTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  let savingsScore = 15; // Nötr başlangıç puanı (hiç veri yoksa)
  
  if (totalIncome > 0) {
    const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
    if (savingsRate >= 25) {
      savingsScore = 30;
      tips.push({
        type: 'positive',
        message: `Harika! Aylık tasarruf oranınız %${Math.round(savingsRate)} ile ideal hedefin (%25) üzerinde.`,
        pointsEffect: '+30 Puan'
      });
    } else if (savingsRate >= 10) {
      savingsScore = Math.round((savingsRate / 25) * 30);
      tips.push({
        type: 'neutral',
        message: `Tasarruf oranınız %${Math.round(savingsRate)}. Aylık birikiminizi %25'e çıkartarak skorunuzu artırabilirsiniz.`,
        pointsEffect: `+${savingsScore} Puan`
      });
    } else if (savingsRate >= 0) {
      savingsScore = Math.round((savingsRate / 25) * 30);
      tips.push({
        type: 'negative',
        message: `Tasarruf oranınız %${Math.round(savingsRate)} ile düşük bir seviyede. Birikim yapmaya özen göstermelisiniz.`,
        pointsEffect: `+${savingsScore} Puan`
      });
    } else {
      savingsScore = 0;
      tips.push({
        type: 'negative',
        message: `Aylık harcamalarınız gelirinizin üzerinde (%${Math.round(Math.abs(savingsRate))} açık)! Acilen giderlerinizi azaltmalısınız.`,
        pointsEffect: '0 Puan'
      });
    }
  } else if (totalExpense > 0) {
    // Gelir sıfır ama harcama var
    savingsScore = 0;
    tips.push({
      type: 'negative',
      message: 'Bu ay hiç gelir girişi yapmadınız ancak harcamalarınız var. Finansal dengeniz tehlikede!',
      pointsEffect: '0 Puan'
    });
  } else {
    // Hiç işlem yoksa
    tips.push({
      type: 'neutral',
      message: 'Bu ay henüz gelir veya gider girişi yapılmadı. İşlem ekleyerek analizi başlatabilirsiniz.',
      pointsEffect: '+15 Puan'
    });
  }

  // -----------------------------------------------------------------
  // 2. BÜTÇE SADAKATİ SKORU (Ağırlık: %30, Puan: 0-30)
  // -----------------------------------------------------------------
  const activeBudgets = budgets.filter(b => b.month === activeMonth);
  let budgetScore = 15; // Bütçe tanımlanmadıysa bütçe teşvik puanı

  if (activeBudgets.length > 0) {
    let totalLimit = 0;
    let weightedFactorSum = 0;
    let exceededCount = 0;
    let criticalCount = 0;

    activeBudgets.forEach(b => {
      if (b.limit_amount <= 0) return;
      
      const spent = currentMonthTxs
        .filter(t => t.type === 'expense' && t.category_id === b.category_id)
        .reduce((sum, t) => sum + t.amount, 0);

      totalLimit += b.limit_amount;
      
      // Bütçe aşım performans katsayısı: limitin 2 katını aşarsa 0 olur, aşmadıysa 1.0
      let factor = 1.0;
      if (spent > b.limit_amount) {
        exceededCount++;
        factor = Math.max(0, 1 - (spent - b.limit_amount) / b.limit_amount);
      } else if (spent >= b.limit_amount * 0.8) {
        criticalCount++;
      }

      weightedFactorSum += factor * b.limit_amount;
    });

    if (totalLimit > 0) {
      const avgFactor = weightedFactorSum / totalLimit;
      budgetScore = Math.round(avgFactor * 30);
    } else {
      budgetScore = 30; // Limitlerin hepsi 0 ise varsayılan tam puan
    }

    if (exceededCount > 0) {
      tips.push({
        type: 'negative',
        message: `Bu ay belirlenen bütçe limitlerinizden ${exceededCount} tanesini aştınız. Harcama disiplini skorunuzu etkiledi.`,
        pointsEffect: `-${30 - budgetScore} Puan`
      });
    } else if (criticalCount > 0) {
      tips.push({
        type: 'neutral',
        message: `${criticalCount} adet bütçe limitinizin sınırındasınız (%80+). Kalan günlerde harcamalarınızı frenlemelisiniz.`,
        pointsEffect: '+30 Puan'
      });
    } else {
      tips.push({
        type: 'positive',
        message: 'Kusursuz! Belirlediğiniz tüm kategori bütçe limitlerine tam olarak sadık kaldınız.',
        pointsEffect: '+30 Puan'
      });
    }
  } else {
    tips.push({
      type: 'neutral',
      message: 'Kategori bazlı bütçe limitleri belirleyerek harcamalarınızı daha kolay kontrol altında tutabilirsiniz.',
      pointsEffect: '+15 Puan'
    });
  }

  // -----------------------------------------------------------------
  // 3. BORÇ SAĞLIĞI SKORU (Ağırlık: %20, Puan: 0-20)
  // -----------------------------------------------------------------
  const activeDebts = debts.filter(d => d.type === 'debt');
  let debtScore = 20; // Borç yoksa finansal yük sıfır, tam puan

  if (activeDebts.length > 0) {
    let totalScoreWeight = 0;
    let overdueCount = 0;
    let upcomingCount = 0;

    activeDebts.forEach(d => {
      if (d.is_paid) {
        totalScoreWeight += 1.0;
      } else {
        // Vadesi geçmiş borç
        if (d.due_date < todayStr) {
          overdueCount++;
          totalScoreWeight += 0.0;
        } else {
          upcomingCount++;
          totalScoreWeight += 0.75; // Ödenmemiş ama henüz vadesi var
        }
      }
    });

    debtScore = Math.round((totalScoreWeight / activeDebts.length) * 20);

    if (overdueCount > 0) {
      tips.push({
        type: 'negative',
        message: `Ödeme tarihi geçmiş ${overdueCount} adet borcunuz bulunuyor! Borçlarınızı geciktirmek finansal skorunuzu ciddi derecede düşürür.`,
        pointsEffect: `-${20 - debtScore} Puan`
      });
    } else if (upcomingCount > 0) {
      tips.push({
        type: 'neutral',
        message: `Yaklaşan ${upcomingCount} adet borcunuz var. Gecikme cezası ve skor düşüşü yaşamamak için vadesinde ödemeyi unutmayın.`,
        pointsEffect: `+${debtScore} Puan`
      });
    } else {
      tips.push({
        type: 'positive',
        message: 'Harika! Tüm kayıtlı borçlarınızı tamamen sıfırladınız, yükünüz kalmadı.',
        pointsEffect: '+20 Puan'
      });
    }
  } else {
    tips.push({
      type: 'positive',
      message: 'Aktif borcunuz bulunmuyor. Borçsuz finansal yaşam skorunuza olumlu yansıyor.',
      pointsEffect: '+20 Puan'
    });
  }

  // -----------------------------------------------------------------
  // 4. HEDEF BAĞLILIĞI SKORU (Ağırlık: %20, Puan: 0-20)
  // -----------------------------------------------------------------
  let goalScore = 10; // Hedef yoksa başlangıç puanı

  if (goals.length > 0) {
    let totalProgress = 0;
    goals.forEach(g => {
      const progress = g.target_amount > 0 ? Math.min(1.0, g.current_amount / g.target_amount) : 1.0;
      totalProgress += progress;
    });

    const avgProgress = totalProgress / goals.length;
    // Hedef koymak 10 puan, ilerleme ise kalan 10 puanı belirler
    goalScore = 10 + Math.round(avgProgress * 10);

    if (avgProgress >= 0.75) {
      tips.push({
        type: 'positive',
        message: 'Birikim hedeflerinize ulaşmaya çok yaklaştınız! İstikrarlı birikiminiz için tebrikler.',
        pointsEffect: `+${goalScore} Puan`
      });
    } else if (avgProgress >= 0.25) {
      tips.push({
        type: 'neutral',
        message: 'Tasarruf hedefleriniz istikrarlı şekilde büyüyor. Fon eklemeye devam edin.',
        pointsEffect: `+${goalScore} Puan`
      });
    } else {
      tips.push({
        type: 'neutral',
        message: 'Hedeflerinize daha sık fon aktararak hayallerinize giden yolda birikimlerinizi hızlandırabilirsiniz.',
        pointsEffect: `+${goalScore} Puan`
      });
    }
  } else {
    tips.push({
      type: 'neutral',
      message: 'Kendinize yeni birikim hedefleri koyarak tasarruf alışkanlığı edinebilir ve skorunuzu artırabilirsiniz.',
      pointsEffect: '+10 Puan'
    });
  }

  // -----------------------------------------------------------------
  // 5. TOPLAM SKOR VE SEVİYE SINIFLANDIRMASI
  // -----------------------------------------------------------------
  const totalScore = Math.min(100, Math.max(0, savingsScore + budgetScore + debtScore + goalScore));
  
  let level: 'critical' | 'healthy' | 'excellent';
  let label: string;

  if (totalScore >= 80) {
    level = 'excellent';
    label = 'Mükemmel / Finansal Deha 🌟';
  } else if (totalScore < 50) {
    level = 'critical';
    label = 'Kritik Durum ⚠️';
  } else {
    level = 'healthy';
    label = 'Geliştirilebilir / Dengeli 👍';
  }

  return {
    savingsScore,
    budgetScore,
    debtScore,
    goalScore,
    totalScore,
    level,
    label,
    tips
  };
}
