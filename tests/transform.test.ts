// © 2026 typeof (Scolup) | Licensed under AGPL 3.
import { describe, it, expect } from 'bun:test';
import { transform, decodeBase64, decodeBase64Content } from '../src/core/transform';

describe('Transform Module', () => {
  describe('decodeBase64', () => {
    it('decodes valid base64', () => {
      expect(decodeBase64(btoa('hello'))).toBe('hello');
    });
    it('handles UTF-8 characters', () => {
      const input = 'café résumé';
      const encoded = btoa(unescape(encodeURIComponent(input)));
      expect(decodeBase64(encoded)).toBe(input);
    });
  });

  describe('decodeBase64Content', () => {
    it('returns short strings as-is', () => {
      expect(decodeBase64Content('hi')).toBe('hi');
    });
    it('decodes valid base64 strings longer than 20 chars', () => {
      const long = 'a'.repeat(25);
      const encoded = btoa(long);
      expect(decodeBase64Content(encoded)).toBe(long);
    });
    it('returns invalid base64 as-is gracefully', () => {
      expect(decodeBase64Content('!!!not-base64!!!')).toBe('!!!not-base64!!!');
    });
  });

  describe('transform', () => {
    it('renames French keys to English', () => {
      const result = transform({ valeur: '15', noteSur: '20' });
      expect(result).toEqual({ value: '15', outOf: '20' });
    });

    it('coerces boolean fields from 0/1 strings', () => {
      const result = transform({
        interrogation: '1',
        enLettre: '0',
        isModifie: '0',
      });
      expect((result as any).isTest).toBe(true);
      expect((result as any).isLetter).toBe(false);
      expect((result as any).isModified).toBe(false);
    });

    it('converts date strings to Date objects', () => {
      const result = transform({ dateSaisie: '2023-10-15' } as any);
      expect((result as any).entryDate).toBeInstanceOf(Date);
    });

    it('converts datetime strings to Date objects', () => {
      const result = transform({ start_date: '2023-10-15 08:30' } as any);
      expect((result as any).startDate).toBeInstanceOf(Date);
    });

    it('keeps null for moyenne and valeur fields', () => {
      const result = transform({
        moyenne: null,
        valeur: null,
        val: null,
      } as any);
      expect((result as any).average).toBeNull();
      expect((result as any).value).toBeNull();
    });

    it('drops null values for other fields', () => {
      const result = transform({ foo: null, bar: 'hello' });
      expect(result).toEqual({ bar: 'hello' });
    });

    it('transforms nested objects recursively', () => {
      const result = transform({
        notes: [{ valeur: '15', noteSur: '20' }],
      } as any);
      expect((result as any).grades[0].value).toBe('15');
      expect((result as any).grades[0].outOf).toBe('20');
    });

    it('handles empty arrays', () => {
      expect(transform([])).toEqual([]);
    });

    it('handles empty objects', () => {
      expect(transform({})).toEqual({});
    });

    it('handles null/undefined input', () => {
      expect(transform(null)).toBeNull();
      expect(transform(undefined)).toBeUndefined();
    });

    it('returns primitives unchanged', () => {
      expect(transform('hello')).toBe('hello');
      expect(transform(42)).toBe(42);
      expect(transform(true)).toBe(true);
    });

    it('handles Date objects by returning them as-is', () => {
      const d = new Date('2023-01-01');
      expect(transform(d)).toBe(d);
    });

    it('renames Sexe to gender', () => {
      const result = transform({ sexe: 'M' } as any);
      expect((result as any).gender).toBe('M');
    });

    it('filters null values from arrays', () => {
      const result = transform([null, { valeur: '15', noteSur: '20' }, undefined] as any);
      expect((result as any[]).length).toBe(1);
      expect((result as any[])[0].value).toBe('15');
    });
  });
});
// © 2026 typeof (Scolup) | Licensed under AGPL 3.
