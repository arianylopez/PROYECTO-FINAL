import { describe, it, expect } from 'vitest';
import { validateLuhn, detectCardBrand, isCardExpired } from './cardUtils';

describe('cardUtils', () => {
  describe('validateLuhn', () => {
    it('validates correct card numbers', () => {
      expect(validateLuhn('4242424242424242')).toBe(true);
      expect(validateLuhn('4111111111111111')).toBe(true);
    });

    it('invalidates incorrect card numbers', () => {
      expect(validateLuhn('4242424242424243')).toBe(false);
      expect(validateLuhn('123')).toBe(false);
    });
  });

  describe('detectCardBrand', () => {
    it('detects Visa', () => {
      expect(detectCardBrand('411111')).toBe('Visa');
    });

    it('detects MasterCard', () => {
      expect(detectCardBrand('510000')).toBe('MasterCard');
      expect(detectCardBrand('222100')).toBe('MasterCard');
    });

    it('detects Amex', () => {
      expect(detectCardBrand('340000')).toBe('Amex');
      expect(detectCardBrand('370000')).toBe('Amex');
    });

    it('detects Discover', () => {
      expect(detectCardBrand('601100')).toBe('Discover');
      expect(detectCardBrand('650000')).toBe('Discover');
    });

    it('returns Unknown for other prefixes', () => {
      expect(detectCardBrand('999999')).toBe('Unknown');
    });
  });

  describe('isCardExpired', () => {
    it('returns false for future dates', () => {
      expect(isCardExpired('12', '30')).toBe(false);
    });

    it('returns true for past dates', () => {
      expect(isCardExpired('01', '20')).toBe(true);
    });
    
    it('returns false if month or year is missing', () => {
      expect(isCardExpired('', '30')).toBe(false);
      expect(isCardExpired('12', '')).toBe(false);
    });
  });
});
