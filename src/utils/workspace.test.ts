import { describe, it, expect } from 'vitest';
import { calculateEqualSplit, calculateNetDebt2User } from './workspaceUtils';

describe('Ortak Bütçe Matematiksel Bölüşüm Testleri', () => {
  
  describe('calculateEqualSplit', () => {
    
    it('Farklı harcama yapan iki eşin bütçe payını doğru hesaplamalı', () => {
      const memberExpenses = {
        'user-1': 3000,
        'user-2': 1000
      };
      const memberIds = ['user-1', 'user-2'];

      const result = calculateEqualSplit(memberExpenses, memberIds);

      // Toplam harcama = 4000, Kişi başı = 2000
      expect(result.totalSpent).toBe(4000);
      expect(result.sharePerPerson).toBe(2000);

      // user-1: 3000 - 2000 = +1000 alacaklı
      const balance1 = result.balances.find(b => b.userId === 'user-1');
      expect(balance1?.balance).toBe(1000);

      // user-2: 1000 - 2000 = -1000 borçlu
      const balance2 = result.balances.find(b => b.userId === 'user-2');
      expect(balance2?.balance).toBe(-1000);
    });

    it('İki eş de eşit harcadığında borç ve alacak dengesi 0 çıkmalı', () => {
      const memberExpenses = {
        'user-1': 1500,
        'user-2': 1500
      };
      const memberIds = ['user-1', 'user-2'];

      const result = calculateEqualSplit(memberExpenses, memberIds);

      expect(result.totalSpent).toBe(3000);
      expect(result.sharePerPerson).toBe(1500);

      result.balances.forEach(b => {
        expect(b.balance).toBe(0);
      });
    });

    it('Hiç harcama yapılmadığında pay 0 çıkmalı', () => {
      const memberExpenses = {
        'user-1': 0,
        'user-2': 0
      };
      const memberIds = ['user-1', 'user-2'];

      const result = calculateEqualSplit(memberExpenses, memberIds);

      expect(result.totalSpent).toBe(0);
      expect(result.sharePerPerson).toBe(0);
      expect(result.balances[0].balance).toBe(0);
    });

  });

  describe('calculateNetDebt2User', () => {

    it('Ben eşimizden daha fazla harcama yaptığımızda eşimizin borcunu doğru hesaplamalı', () => {
      const myId = 'ahmet-123';
      const partnerId = 'elif-456';
      
      // Ben 2000₺ harcadım, eşim 500₺ harcadı. Eşim bana 750₺ vermeli.
      const result = calculateNetDebt2User(myId, partnerId, 2000, 500);

      expect(result.owesAmount).toBe(750);
      expect(result.debtorId).toBe(partnerId); // Borçlu Eşim
      expect(result.creditorId).toBe(myId);     // Alacaklı Ben
    });

    it('Eşimiz bizden daha fazla harcama yaptığında bizim borcumuzu doğru hesaplamalı', () => {
      const myId = 'ahmet-123';
      const partnerId = 'elif-456';
      
      // Ben 1000₺ harcadım, eşim 3000₺ harcadı. Ben eşime 1000₺ borçluyum.
      const result = calculateNetDebt2User(myId, partnerId, 1000, 3000);

      expect(result.owesAmount).toBe(1000);
      expect(result.debtorId).toBe(myId);        // Borçlu Ben
      expect(result.creditorId).toBe(partnerId); // Alacaklı Eşim
    });

    it('Tamamen eşit harcandığında borç kapatma tutarı 0 çıkmalı', () => {
      const myId = 'ahmet-123';
      const partnerId = 'elif-456';
      
      const result = calculateNetDebt2User(myId, partnerId, 1200, 1200);

      expect(result.owesAmount).toBe(0);
      expect(result.debtorId).toBe('');
      expect(result.creditorId).toBe('');
    });

  });

});
