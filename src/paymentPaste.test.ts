import { describe, expect, it } from 'vitest';
import { CURRENCIES } from './currency';
import { matchCard, normalizeNumber, parseAmount, parsePayment } from './paymentPaste';

const JPY = CURRENCIES.JPY;
const EUR = CURRENCIES.EUR;
const AUD = CURRENCIES.AUD;
const cards = ['Apple Card', 'Capital One'];

describe('normalizeNumber', () => {
  it('reads thousands and decimal separators', () => {
    expect(normalizeNumber('1,600')).toBe('1600');
    expect(normalizeNumber('1.600')).toBe('1600');
    expect(normalizeNumber('12,50')).toBe('12.50');
    expect(normalizeNumber('1.234,56')).toBe('1234.56');
    expect(normalizeNumber('1,234.56')).toBe('1234.56');
    expect(normalizeNumber('1 234.5')).toBe('1234.5');
    expect(normalizeNumber('800')).toBe('800');
    expect(normalizeNumber('abc')).toBeUndefined();
  });
});

describe('parseAmount', () => {
  it('reads the trip currency, with or without a sign', () => {
    expect(parseAmount('¥1,600', JPY)).toEqual({ yen: 1600 });
    expect(parseAmount('JP¥1,600', JPY)).toEqual({ yen: 1600 });
    expect(parseAmount('JPY 1,600', JPY)).toEqual({ yen: 1600 });
    expect(parseAmount('1600', JPY)).toEqual({ yen: 1600 });
    expect(parseAmount('¥1,600.00', JPY)).toEqual({ yen: 1600 });
    expect(parseAmount('€12,50', EUR)).toEqual({ yen: 1250 });
    expect(parseAmount('12.5 €', EUR)).toEqual({ yen: 1250 });
    expect(parseAmount('A$12.00', AUD)).toEqual({ yen: 1200 });
  });

  it('reads US dollars as cents', () => {
    expect(parseAmount('$24.99', JPY)).toEqual({ cents: 2499 });
    expect(parseAmount('US$24.99', JPY)).toEqual({ cents: 2499 });
    expect(parseAmount('USD 1,024.50', EUR)).toEqual({ cents: 102450 });
  });

  it('rejects another currency and unreadable amounts', () => {
    expect(parseAmount('€12.50', JPY)).toBe('currency');
    expect(parseAmount('A$12.00', JPY)).toBe('currency');
    expect(parseAmount('¥', JPY)).toBe('amount');
    expect(parseAmount('¥1,600.50', JPY)).toBe('amount');
    expect(parseAmount('¥0', JPY)).toBe('amount');
  });
});

describe('matchCard', () => {
  it('matches the same name, ignoring case and spacing', () => {
    expect(matchCard('apple card', cards)).toBe('Apple Card');
    expect(matchCard('Capital One Venture X', cards)).toBe('Capital One');
    expect(matchCard('CapitalOne', cards)).toBe('Capital One');
  });
  it('leaves unknown cards unmatched', () => {
    expect(matchCard('Chase Sapphire', cards)).toBeUndefined();
    expect(matchCard('', cards)).toBeUndefined();
  });
});

describe('parsePayment', () => {
  it('reads the text the Shortcut copies', () => {
    const text = 'Trip Tracker payment\nAmount: ¥1,600\nMerchant: Lawson\nCard: Apple Card\nDate: 2026-11-27';
    expect(parsePayment(text, JPY, cards)).toEqual({
      ok: true,
      payment: { yen: 1600, merchant: 'Lawson', walletCard: 'Apple Card', card: 'Apple Card', date: '2026-11-27' },
    });
  });

  it('works without the optional lines and with Windows line ends', () => {
    expect(parsePayment('Amount: $9.50\r\n', JPY, cards)).toEqual({
      ok: true,
      payment: { cents: 950, merchant: undefined, walletCard: undefined, card: undefined, date: undefined },
    });
  });

  it('keeps an unmatched card name so Add can say so', () => {
    const r = parsePayment('Amount: ¥500\nCard: Chase Sapphire', JPY, cards);
    expect(r.ok && r.payment.walletCard).toBe('Chase Sapphire');
    expect(r.ok && r.payment.card).toBeUndefined();
  });

  it('says why when nothing usable was copied', () => {
    expect(parsePayment('hello', JPY, cards)).toEqual({ ok: false, reason: 'none' });
    expect(parsePayment('Amount: €3.00', JPY, cards)).toEqual({ ok: false, reason: 'currency' });
    expect(parsePayment('Amount: lots', JPY, cards)).toEqual({ ok: false, reason: 'amount' });
  });
});
