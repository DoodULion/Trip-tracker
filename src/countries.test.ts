import { describe, expect, it } from 'vitest';
import { COUNTRIES, DARK_PANEL, DEFAULT_BRAND, contrast, findCountry, flagEmoji, forDark, forLight, onColor, tripTheme } from './countries';

describe('flagEmoji', () => {
  it('builds a flag from the ISO code', () => {
    expect(flagEmoji('JP')).toBe('\u{1F1EF}\u{1F1F5}');
    expect(flagEmoji('us')).toBe('\u{1F1FA}\u{1F1F8}');
  });
  it('is empty for anything that is not two letters', () => {
    expect(flagEmoji(undefined)).toBe('');
    expect(flagEmoji('')).toBe('');
    expect(flagEmoji('JPN')).toBe('');
    expect(flagEmoji('1A')).toBe('');
  });
});

describe('country list', () => {
  it('has unique two-letter codes and valid colors', () => {
    const codes = COUNTRIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const c of COUNTRIES) {
      expect(c.code).toMatch(/^[A-Z]{2}$/);
      expect(c.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(c.name.length).toBeGreaterThan(1);
    }
  });
  it('is sorted by name', () => {
    const names = COUNTRIES.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
  it('finds a country by code', () => {
    expect(findCountry('JP')?.name).toBe('Japan');
    expect(findCountry('ZZ')).toBeUndefined();
    expect(findCountry(undefined)).toBeUndefined();
  });
});

describe('readable on every country color', () => {
  it('text on the light-mode color is at least 4.5:1', () => {
    for (const c of COUNTRIES) {
      const light = forLight(c.color);
      expect(contrast(light, onColor(light))).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('the dark-mode color stands out from the dark panel (3:1) and carries readable text', () => {
    for (const c of COUNTRIES) {
      const dark = forDark(c.color);
      expect(contrast(dark, DARK_PANEL)).toBeGreaterThanOrEqual(3);
      expect(contrast(dark, onColor(dark))).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('leaves colors that already read well alone', () => {
    expect(forLight('#BC002D')).toBe('#BC002D'); // Japan red takes white text
  });
});

describe('tripTheme', () => {
  it('gives CSS variables for a known country', () => {
    const t = tripTheme('JP') as Record<string, string>;
    expect(t['--brand']).toBe('#BC002D');
    expect(t['--on-brand']).toBe('#ffffff');
    expect(t['--brand-dark']).toMatch(/^#[0-9a-f]{6}$/i);
  });
  it('falls back to the default orange with no or an unknown country', () => {
    expect((tripTheme(undefined) as Record<string, string>)['--brand']).toBe(DEFAULT_BRAND);
    expect((tripTheme('ZZ') as Record<string, string>)['--brand']).toBe(DEFAULT_BRAND);
  });
});
