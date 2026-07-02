import { describe, it, expect } from 'vitest';
import { koreanZodiac, starSign } from './zodiac';

describe('age-calculator/zodiac', () => {
  describe('koreanZodiac', () => {
    it('returns stable lowercase zodiac key', () => {
      expect(koreanZodiac(2020)).toBe('rat');
      expect(koreanZodiac(2000)).toBe('dragon');
      expect(koreanZodiac(2008)).toBe('rat');
    });

    it('cycles through all 12 animals', () => {
      const expected = [
        'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
        'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig',
      ];

      // Starting from 1900 (rat year)
      expected.forEach((animal, index) => {
        expect(koreanZodiac(1900 + index)).toBe(animal);
      });
    });

    it('verifies common zodiac years', () => {
      expect(koreanZodiac(1996)).toBe('rat');
      expect(koreanZodiac(1997)).toBe('ox');
      expect(koreanZodiac(1998)).toBe('tiger');
      expect(koreanZodiac(1999)).toBe('rabbit');
      expect(koreanZodiac(2000)).toBe('dragon');
      expect(koreanZodiac(2001)).toBe('snake');
      expect(koreanZodiac(2002)).toBe('horse');
      expect(koreanZodiac(2003)).toBe('goat');
      expect(koreanZodiac(2004)).toBe('monkey');
      expect(koreanZodiac(2005)).toBe('rooster');
      expect(koreanZodiac(2006)).toBe('dog');
      expect(koreanZodiac(2007)).toBe('pig');
      expect(koreanZodiac(2008)).toBe('rat'); // cycle repeats
    });

    it('handles historical years', () => {
      expect(koreanZodiac(1776)).toBe('monkey'); // US independence year
    });
  });

  describe('starSign', () => {
    it('returns stable lowercase star sign key', () => {
      // March 15 = Pisces (Feb 19 - Mar 20)
      expect(starSign(3, 15)).toBe('pisces');
    });

    it('maps all 12 signs', () => {
      // Each sign, mid-range
      expect(starSign(1, 20)).toBe('aquarius'); // Jan 20 - Feb 18
      expect(starSign(2, 19)).toBe('pisces');   // Feb 19 - Mar 20
      expect(starSign(3, 21)).toBe('aries');    // Mar 21 - Apr 19
      expect(starSign(4, 20)).toBe('taurus');   // Apr 20 - May 20
      expect(starSign(5, 21)).toBe('gemini');   // May 21 - Jun 20
      expect(starSign(6, 21)).toBe('cancer');   // Jun 21 - Jul 22
      expect(starSign(7, 23)).toBe('leo');      // Jul 23 - Aug 22
      expect(starSign(8, 23)).toBe('virgo');    // Aug 23 - Sep 22
      expect(starSign(9, 23)).toBe('libra');    // Sep 23 - Oct 22
      expect(starSign(10, 23)).toBe('scorpio'); // Oct 23 - Nov 21
      expect(starSign(11, 22)).toBe('sagittarius'); // Nov 22 - Dec 21
      expect(starSign(12, 22)).toBe('capricorn');   // Dec 22 - Jan 19
    });

    it('handles sign boundaries correctly', () => {
      // Aries boundary (Mar 20 vs Mar 21)
      expect(starSign(3, 20)).toBe('pisces');
      expect(starSign(3, 21)).toBe('aries');

      // Taurus boundary
      expect(starSign(4, 19)).toBe('aries');
      expect(starSign(4, 20)).toBe('taurus');

      // Capricorn/Aquarius boundary
      expect(starSign(1, 19)).toBe('capricorn');
      expect(starSign(1, 20)).toBe('aquarius');

      // Pisces/Aries cusp (near spring equinox)
      expect(starSign(2, 18)).toBe('aquarius');
      expect(starSign(2, 19)).toBe('pisces');
    });

    it('handles December 22 Capricorn transition', () => {
      expect(starSign(12, 21)).toBe('sagittarius');
      expect(starSign(12, 22)).toBe('capricorn');
      expect(starSign(12, 31)).toBe('capricorn');
    });

    it('handles all days of a month', () => {
      // March has days 1-31; should transition Pisces->Aries at 21
      for (let day = 1; day <= 20; day++) {
        expect(starSign(3, day)).toBe('pisces');
      }
      for (let day = 21; day <= 31; day++) {
        expect(starSign(3, day)).toBe('aries');
      }
    });
  });
});
