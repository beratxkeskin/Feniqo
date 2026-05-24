import { describe, it, expect } from 'vitest';
import { extractAmount, extractDate } from './ocrService';

describe('OCR Service Utils', () => {

  describe('extractAmount', () => {
    it('extracts amount from standard TOPLAM format', () => {
      const text = "MARKET\nTOPLAM: 125,50\nKDV DAHİL";
      expect(extractAmount(text)).toBe(125.5);
    });

    it('extracts amount with noise characters', () => {
      const text = "TOPLAM %18 *61.90\nTEŞEKKÜRLER";
      expect(extractAmount(text)).toBe(61.9);
    });

    it('extracts amount with English TOTAL keyword', () => {
      const text = "Store\nTOTAL 1050.00\nTHANK YOU";
      expect(extractAmount(text)).toBe(1050);
    });

    it('falls back to the largest number if no keywords found', () => {
      const text = "MARKET\nDomates 15.50\nEkmek 10.00\n65.90\nTeşekkürler";
      expect(extractAmount(text)).toBe(65.9);
    });

    it('returns null if no amounts are found', () => {
      const text = "SADECE METIN VAR, SAYI YOK";
      expect(extractAmount(text)).toBeNull();
    });
  });

  describe('extractDate', () => {
    it('extracts date in DD.MM.YYYY format', () => {
      const text = "TARIH: 22.05.2026 SAAT: 14:30";
      expect(extractDate(text)).toBe('2026-05-22');
    });

    it('extracts date in DD/MM/YYYY format', () => {
      const text = "Date: 15/12/2025";
      expect(extractDate(text)).toBe('2025-12-15');
    });

    it('extracts date in DD-MM-YYYY format', () => {
      const text = "Islem 01-01-2024 tarihinde yapildi";
      expect(extractDate(text)).toBe('2024-01-01');
    });

    it('returns null if no valid date format is found', () => {
      const text = "TARIH: 22 Mayis Cuma"; // Text format not supported by simple regex yet
      expect(extractDate(text)).toBeNull();
    });
  });

});
