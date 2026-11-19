/**
 * Light haptic feedback for the moments that matter: saving an entry, a warning (over the daily limit,
 * a destructive confirm), a form error, lifting and moving an item while reordering, and switching
 * Card / Cash.
 *
 * Safari on iPhone has no vibration API. From iOS 18 it plays the system "tick" when a switch control
 * (`<input type="checkbox" switch>`) is toggled, including from a script during a tap, so a hidden switch is
 * toggled once per pulse. Android browsers use `navigator.vibrate`. Elsewhere this does nothing.
 * It follows the phone's own System Haptics setting; there is no in-app switch.
 */

export type Haptic = 'tick' | 'tap' | 'success' | 'warning' | 'error';

/** Vibration patterns (ms) for Android; iOS gets the same number of ticks. */
const PATTERN: Record<Haptic, number[]> = {
  tick: [8],
  tap: [14],
  success: [14, 70, 14],
  warning: [24, 90, 24],
  error: [16, 60, 16, 60, 16],
};

let label: HTMLLabelElement | null = null;

function iosSwitch(): HTMLLabelElement | null {
  if (typeof document === 'undefined') return null;
  if (label?.isConnected) return label;
  label = document.createElement('label');
  label.setAttribute('aria-hidden', 'true');
  label.style.cssText = 'position:fixed;left:-100px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.tabIndex = -1;
  label.appendChild(input);
  document.body.appendChild(label);
  return label;
}

/** Play a haptic. Call it from a tap (or right after one): iOS only plays it during a user gesture. */
export function haptic(kind: Haptic = 'tap'): void {
  const pattern = PATTERN[kind];
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
      return;
    }
    const sw = iosSwitch();
    if (!sw) return;
    // Toggling the switch moves focus to it; hand focus straight back so a field being typed in keeps the keyboard.
    const el = {
      click() {
        const prev = document.activeElement as HTMLElement | null;
        sw.click();
        if (prev && prev !== document.activeElement && prev !== document.body) prev.focus({ preventScroll: true });
      },
    };
    // One tick per pulse in the pattern, spaced like the vibration.
    let at = 0;
    pattern.forEach((ms, i) => {
      if (i % 2 === 1) {
        at += ms;
        return;
      }
      if (at === 0) el.click();
      else setTimeout(() => el.click(), at);
      at += ms;
    });
  } catch {
    /* haptics are a nicety; never let them break a tap */
  }
}

/**
 * App-wide taps that always deserve a haptic, handled in one place: confirming a destructive action
 * (red "armed" buttons) and switching a segmented control. Installed once at startup.
 */
export function installTapHaptics(): void {
  if (typeof document === 'undefined') return;
  document.addEventListener(
    'click',
    (e) => {
      const t = e.target as Element | null;
      const b = t?.closest?.('button');
      if (!b || b.disabled) return;
      if (b.matches('.danger.armed')) haptic('warning');
      else if (b.matches('.seg button:not(.on)')) haptic('tick');
    },
    true,
  );
}
