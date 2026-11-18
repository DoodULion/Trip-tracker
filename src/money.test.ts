import { describe, expect, it } from 'vitest';
import { clampDate, parseCents, parseYen, todayLocal } from './money';

describe('parseYen', () => {
  it('parses integers', () => {
    expect(parseYen('1600')).toBe(1600);
    expect(parseYen('1,600')).toBe(1600);
    expect(parseYen(' ¥800 ')).toBe(800);
  });
  it('rejects blank and non-integers', () => {
    expect(parseYen('')).toBeUndefined();
    expect(parseYen('12.5')).toBeUndefined();
    expect(parseYen('abc')).toBeUndefined();
  });
});

describe('parseCents', () => {
  it('parses dollars without float math', () => {
    expect(parseCents('10')).toBe(1000);
    expect(parseCents('10.5')).toBe(1050);
    expect(parseCents('10.05')).toBe(1005);
    expect(parseCents('0.29')).toBe(29);
    expect(parseCents('.5')).toBe(50);
    expect(parseCents('$1,234.56')).toBe(123456);
    expect(parseCents('10.')).toBe(1000);
  });
  it('rejects blank and invalid', () => {
    expect(parseCents('')).toBeUndefined();
    expect(parseCents('.')).toBeUndefined();
    expect(parseCents('1.234')).toBeUndefined();
    expect(parseCents('-5')).toBeUndefined();
  });
});

describe('dates', () => {
  it('todayLocal uses local calendar fields', () => {
    expect(todayLocal(new Date(2026, 10, 26, 23, 59))).toBe('2026-11-26');
    expect(todayLocal(new Date(2026, 11, 1, 0, 1))).toBe('2026-12-01');
  });
  it('clamps into the trip', () => {
    expect(clampDate('2026-11-01', '2026-11-26', '2026-12-20')).toBe('2026-11-26');
    expect(clampDate('2027-01-01', '2026-11-26', '2026-12-20')).toBe('2026-12-20');
    expect(clampDate('2026-12-05', '2026-11-26', '2026-12-20')).toBe('2026-12-05');
  });
});

import { centsToInput, dayLabel } from './money';
describe('input/label helpers', () => {
  it('centsToInput round-trips through parseCents', () => {
    expect(centsToInput(1050)).toBe('10.50');
    expect(centsToInput(5)).toBe('0.05');
    expect(centsToInput(undefined)).toBe('');
    expect(parseCents(centsToInput(123456))).toBe(123456);
  });
  it('dayLabel', () => {
    expect(dayLabel('2026-11-26')).toBe('Thu 11/26');
    expect(dayLabel('2026-12-20')).toBe('Sun 12/20');
  });
});
