import type { CSSProperties } from 'react';

/**
 * Countries a trip can be set to. The flag is the system's flag emoji for the ISO code; the color
 * is a representative national color used as the app's main color inside that trip.
 */
export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  color: string; // #rrggbb
}

export const COUNTRIES: Country[] = [
  { code: 'AR', name: 'Argentina', color: '#74ACDF' },
  { code: 'AU', name: 'Australia', color: '#00843D' },
  { code: 'AT', name: 'Austria', color: '#ED2939' },
  { code: 'BE', name: 'Belgium', color: '#FDDA24' },
  { code: 'BR', name: 'Brazil', color: '#009C3B' },
  { code: 'CA', name: 'Canada', color: '#D80621' },
  { code: 'CL', name: 'Chile', color: '#D52B1E' },
  { code: 'CN', name: 'China', color: '#DE2910' },
  { code: 'CO', name: 'Colombia', color: '#FCD116' },
  { code: 'CR', name: 'Costa Rica', color: '#002B7F' },
  { code: 'HR', name: 'Croatia', color: '#171796' },
  { code: 'CU', name: 'Cuba', color: '#002A8F' },
  { code: 'CZ', name: 'Czechia', color: '#11457E' },
  { code: 'DK', name: 'Denmark', color: '#C8102E' },
  { code: 'EG', name: 'Egypt', color: '#CE1126' },
  { code: 'FJ', name: 'Fiji', color: '#68BFE5' },
  { code: 'FI', name: 'Finland', color: '#003580' },
  { code: 'FR', name: 'France', color: '#0055A4' },
  { code: 'DE', name: 'Germany', color: '#DD0000' },
  { code: 'GR', name: 'Greece', color: '#0D5EAF' },
  { code: 'HK', name: 'Hong Kong', color: '#DE2910' },
  { code: 'HU', name: 'Hungary', color: '#477050' },
  { code: 'IS', name: 'Iceland', color: '#02529C' },
  { code: 'IN', name: 'India', color: '#FF9933' },
  { code: 'ID', name: 'Indonesia', color: '#CE1126' },
  { code: 'IE', name: 'Ireland', color: '#169B62' },
  { code: 'IL', name: 'Israel', color: '#0038B8' },
  { code: 'IT', name: 'Italy', color: '#009246' },
  { code: 'JP', name: 'Japan', color: '#BC002D' },
  { code: 'JO', name: 'Jordan', color: '#007A3D' },
  { code: 'KE', name: 'Kenya', color: '#BB0000' },
  { code: 'MY', name: 'Malaysia', color: '#CC0001' },
  { code: 'MX', name: 'Mexico', color: '#006847' },
  { code: 'MA', name: 'Morocco', color: '#C1272D' },
  { code: 'NP', name: 'Nepal', color: '#DC143C' },
  { code: 'NL', name: 'Netherlands', color: '#F36C21' },
  { code: 'NZ', name: 'New Zealand', color: '#00247D' },
  { code: 'NO', name: 'Norway', color: '#BA0C2F' },
  { code: 'PE', name: 'Peru', color: '#D91023' },
  { code: 'PH', name: 'Philippines', color: '#0038A8' },
  { code: 'PL', name: 'Poland', color: '#DC143C' },
  { code: 'PT', name: 'Portugal', color: '#046A38' },
  { code: 'RU', name: 'Russia', color: '#0039A6' },
  { code: 'SA', name: 'Saudi Arabia', color: '#006C35' },
  { code: 'SG', name: 'Singapore', color: '#EF3340' },
  { code: 'ZA', name: 'South Africa', color: '#007A4D' },
  { code: 'KR', name: 'South Korea', color: '#0047A0' },
  { code: 'ES', name: 'Spain', color: '#AA151B' },
  { code: 'LK', name: 'Sri Lanka', color: '#8D153A' },
  { code: 'SE', name: 'Sweden', color: '#006AA7' },
  { code: 'CH', name: 'Switzerland', color: '#DA291C' },
  { code: 'TW', name: 'Taiwan', color: '#C8102E' },
  { code: 'TZ', name: 'Tanzania', color: '#1EB53A' },
  { code: 'TH', name: 'Thailand', color: '#A51931' },
  { code: 'TR', name: 'Turkey', color: '#E30A17' },
  { code: 'UA', name: 'Ukraine', color: '#0057B7' },
  { code: 'AE', name: 'United Arab Emirates', color: '#00732F' },
  { code: 'GB', name: 'United Kingdom', color: '#012169' },
  { code: 'US', name: 'United States', color: '#3C3B6E' },
  { code: 'VN', name: 'Vietnam', color: '#DA251D' },
];

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

/**
 * The 50 states, for domestic trips. Each color comes from the state's flag or official colors and becomes
 * the trip's main color (nudged for readable text, like country colors).
 */
export const US_STATES: Country[] = [
  { code: 'AL', name: 'Alabama', color: '#9E1B32' },
  { code: 'AK', name: 'Alaska', color: '#FFB81C' },
  { code: 'AZ', name: 'Arizona', color: '#CE5C17' },
  { code: 'AR', name: 'Arkansas', color: '#C8102E' },
  { code: 'CA', name: 'California', color: '#C0362C' },
  { code: 'CO', name: 'Colorado', color: '#35618F' },
  { code: 'CT', name: 'Connecticut', color: '#1E4D8C' },
  { code: 'DE', name: 'Delaware', color: '#6CACE4' },
  { code: 'FL', name: 'Florida', color: '#F47321' },
  { code: 'GA', name: 'Georgia', color: '#F28C6B' },
  { code: 'HI', name: 'Hawaii', color: '#00A19B' },
  { code: 'ID', name: 'Idaho', color: '#8B1A2B' },
  { code: 'IL', name: 'Illinois', color: '#13294B' },
  { code: 'IN', name: 'Indiana', color: '#002D72' },
  { code: 'IA', name: 'Iowa', color: '#4C7A2A' },
  { code: 'KS', name: 'Kansas', color: '#FBC02D' },
  { code: 'KY', name: 'Kentucky', color: '#0033A0' },
  { code: 'LA', name: 'Louisiana', color: '#5B2A86' },
  { code: 'ME', name: 'Maine', color: '#0B6E4F' },
  { code: 'MD', name: 'Maryland', color: '#B22234' },
  { code: 'MA', name: 'Massachusetts', color: '#14558F' },
  { code: 'MI', name: 'Michigan', color: '#1E6FA6' },
  { code: 'MN', name: 'Minnesota', color: '#2E6F95' },
  { code: 'MS', name: 'Mississippi', color: '#7A1F3D' },
  { code: 'MO', name: 'Missouri', color: '#A6192E' },
  { code: 'MT', name: 'Montana', color: '#4A90C2' },
  { code: 'NE', name: 'Nebraska', color: '#D00000' },
  { code: 'NV', name: 'Nevada', color: '#8A8D8F' },
  { code: 'NH', name: 'New Hampshire', color: '#8E6AAE' },
  { code: 'NJ', name: 'New Jersey', color: '#4A79B5' },
  { code: 'NM', name: 'New Mexico', color: '#FFD100' },
  { code: 'NY', name: 'New York', color: '#0039A6' },
  { code: 'NC', name: 'North Carolina', color: '#7BAFD4' },
  { code: 'ND', name: 'North Dakota', color: '#9B7B2C' },
  { code: 'OH', name: 'Ohio', color: '#BB0000' },
  { code: 'OK', name: 'Oklahoma', color: '#5DA9D6' },
  { code: 'OR', name: 'Oregon', color: '#154733' },
  { code: 'PA', name: 'Pennsylvania', color: '#203864' },
  { code: 'RI', name: 'Rhode Island', color: '#2A7F9E' },
  { code: 'SC', name: 'South Carolina', color: '#1B365D' },
  { code: 'SD', name: 'South Dakota', color: '#1D74B9' },
  { code: 'TN', name: 'Tennessee', color: '#FF8200' },
  { code: 'TX', name: 'Texas', color: '#BF5700' },
  { code: 'UT', name: 'Utah', color: '#C1502E' },
  { code: 'VT', name: 'Vermont', color: '#2E7D32' },
  { code: 'VA', name: 'Virginia', color: '#1A3668' },
  { code: 'WA', name: 'Washington', color: '#00843D' },
  { code: 'WV', name: 'West Virginia', color: '#002855' },
  { code: 'WI', name: 'Wisconsin', color: '#C5050C' },
  { code: 'WY', name: 'Wyoming', color: '#6E4B2A' },
];

const STATE_BY_CODE = new Map(US_STATES.map((s) => [s.code, s]));

export function findState(code: string | undefined): Country | undefined {
  return code ? STATE_BY_CODE.get(code) : undefined;
}

export function findCountry(code: string | undefined): Country | undefined {
  return code ? BY_CODE.get(code) : undefined;
}

/** "JP" -> the flag emoji, built from regional-indicator letters. Empty for anything that isn't two letters. */
export function flagEmoji(code: string | undefined): string {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...[...code.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

// ---------- color math (WCAG relative luminance) ----------

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (c: [number, number, number]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const INK = '#1a1a1a';
const WHITE = '#ffffff';
export const DARK_PANEL = '#1e1e1e';
/** The app's orange, used inside trips that have no country set. */
export const DEFAULT_BRAND = '#f39700';
/** Main color of a trip with no country: the app's ink in light mode, its warm white in dark mode. */
export const NEUTRAL_LIGHT = '#2b2420';
export const NEUTRAL_DARK = '#f3ece7';

function mix(hex: string, target: [number, number, number], t: number): string {
  const [r, g, b] = rgb(hex);
  return toHex([r + (target[0] - r) * t, g + (target[1] - g) * t, b + (target[2] - b) * t]);
}

const readableTextContrast = (hex: string) => Math.max(contrast(hex, INK), contrast(hex, WHITE));

/** Text color (ink or white) that reads best on a brand-colored surface. */
export function onColor(hex: string): string {
  return contrast(hex, INK) >= contrast(hex, WHITE) ? INK : WHITE;
}

/**
 * Nudge a color (toward black or white in 4% steps) until ink or white text on it reaches 4.5:1.
 * Colors that already pass are returned unchanged.
 */
export function readable(hex: string, toward: 'black' | 'white'): string {
  let c = hex;
  for (let t = 0.04; readableTextContrast(c) < 4.5 && t <= 1; t += 0.04) {
    c = mix(hex, toward === 'black' ? [0, 0, 0] : [255, 255, 255], t);
  }
  return c;
}

/** The brand color for dark mode: lightened until it stands out from the dark panel (3:1) and carries readable text. */
export function forDark(hex: string): string {
  let c = hex;
  for (let t = 0.1; contrast(c, DARK_PANEL) < 3 && t <= 1; t += 0.1) c = mix(hex, [255, 255, 255], t);
  return readable(c, 'white');
}

/** Light-mode brand color for a country: its color, nudged only if text on it would be hard to read. */
export function forLight(hex: string): string {
  return readable(hex, 'black');
}

/** Hue (0-360) and saturation (0-1) of a hex color. */
function hueSat(hex: string): [number, number] {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return [0, 0];
  const l = (max + min) / 2;
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s];
}

/**
 * True for a country color in the same family as the app's warning red (crimsons, scarlets, vermilions).
 * Such trips draw their money meters in ink, so red on a meter always means "over".
 */
export function isReddish(hex: string): boolean {
  const [h, s] = hueSat(hex);
  return s > 0.35 && (h >= 330 || h <= 28);
}

/**
 * Inline CSS variables that retheme a trip (used with the `.themed` class). A trip with no (known)
 * country gets the neutral main color.
 */
export function tripTheme(code: string | undefined): CSSProperties {
  return themeFor(findCountry(code)?.color);
}

/** The theme for a trip: a domestic trip takes its state's color (the US color when no state is set), others their country's. */
export function tripThemeOf(trip: { country?: string; scope?: string; state?: string }): CSSProperties {
  if (trip.scope === 'domestic') return themeFor(findState(trip.state)?.color ?? findCountry('US')?.color);
  return tripTheme(trip.country);
}

/** Flag and its label for a trip's header and list card: the US flag (named by its state) for a domestic trip. */
export function tripPlace(trip: { country?: string; scope?: string; state?: string }): { flag: string; label: string } | undefined {
  if (trip.scope === 'domestic') return { flag: flagEmoji('US'), label: findState(trip.state)?.name ?? 'United States' };
  if (!trip.country) return undefined;
  return { flag: flagEmoji(trip.country), label: findCountry(trip.country)?.name ?? 'Flag' };
}

function themeFor(color: string | undefined): CSSProperties {
  if (!color) {
    // No country: the neutral main color of the home page (near-black in light mode, warm white in dark mode).
    return {
      '--brand': NEUTRAL_LIGHT,
      '--on-brand': '#ffffff',
      '--brand-dark': NEUTRAL_DARK,
      '--on-brand-dark': '#1b1715',
    } as CSSProperties;
  }
  const base = color;
  const light = forLight(base);
  const dark = forDark(base);
  return {
    '--brand': light,
    '--on-brand': onColor(light),
    '--brand-dark': dark,
    '--on-brand-dark': onColor(dark),
    // Money meters normally take the trip color; on a red trip they take the ink so they never look "over"
    // (the track stays tinted with the country color either way).
    ...(isReddish(base) ? { '--meter': 'var(--ink)' } : {}),
  } as CSSProperties;
}
