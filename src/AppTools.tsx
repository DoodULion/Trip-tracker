import { useEffect, useRef, useState } from 'react';
import { buildBackup, parseBackup, toCsv, type Backup, type BackupTrip } from './backup';
import { CATEGORIES } from './calc';
import { getLastExport, setLastExport } from './db';
import NameSheet from './NameSheet';
import { Roundel } from './Roundel';
import SheetBackdrop from './SheetBackdrop';
import { saveFile } from './download';
import { todayLocal } from './money';
import { EMPTY_DATA, type App } from './store';
import { getThemeChoice, setThemeChoice, type ThemeChoice } from './theme';

const THEMES: { id: ThemeChoice; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const entryCount = (d: { cardCharges: unknown[]; cashPurchases: unknown[]; cashBought: unknown[] }) =>
  d.cardCharges.length + d.cashPurchases.length + d.cashBought.length;

/** App-wide tools: backup and restore of all trips, CSV export, delete everything. */
export default function AppTools({ app }: { app: App }) {
  const [pending, setPending] = useState<{ file: string; backup: Backup } | null>(null);
  const [importErr, setImportErr] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [theme, setTheme] = useState<ThemeChoice>(getThemeChoice);
  const [lastExport, setLastExportState] = useState<string | undefined>();
  const [naming, setNaming] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    void getLastExport().then(setLastExportState);
  }, []);
  const fileRef = useRef<HTMLInputElement>(null);

  const items = (): BackupTrip[] => app.trips.map((trip) => ({ trip, data: app.data[trip.id] ?? EMPTY_DATA }));
  const total = items().reduce((t, i) => t + entryCount(i.data), 0);

  async function exportBackup() {
    setMsg('');
    await saveFile(`trip-tracker-backup-${todayLocal()}.json`, JSON.stringify(buildBackup(items(), new Date(), app.categories), null, 2), 'application/json');
    const now = new Date().toISOString();
    await setLastExport(now);
    setLastExportState(now);
  }

  async function exportCsv() {
    setMsg('');
    await saveFile(`trip-tracker-entries-${todayLocal()}.csv`, toCsv(items()), 'text/csv');
  }

  async function chooseFile(files: FileList | null) {
    setImportErr('');
    setPending(null);
    const f = files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!f) return;
    try {
      setPending({ file: f.name, backup: parseBackup(await f.text()) });
    } catch (e) {
      setImportErr(e instanceof Error ? e.message : 'Could not read that file.');
    }
  }

  async function confirmImport() {
    if (!pending) return;
    await app.replaceAll(pending.backup.trips, pending.backup.categories);
    setPending(null);
    setMsg('Backup restored.');
  }

  async function deleteAll() {
    await app.deleteAll();
    setConfirmText('');
    setMsg('All data deleted.');
  }

  /** How many entries, across all trips, are filed under a category. */
  const usedBy = (category: string) =>
    Object.values(app.data).reduce(
      (t, d) => t + d.cardCharges.filter((e) => e.category === category).length + d.cashPurchases.filter((e) => e.category === category).length,
      0,
    );
  const missingBuiltIns = CATEGORIES.filter((c) => !app.categories.includes(c));

  const describe = (list: BackupTrip[]) =>
    `${plural(list.length, 'trip', 'trips')}, ${plural(list.reduce((t, i) => t + entryCount(i.data), 0), 'entry', 'entries')}`;

  return (
    <div className="cols settings-cols">
      <section className="card">
        <h2>Appearance</h2>
        <p className="muted small">System follows your phone's light or dark setting.</p>
        <div className="seg theme-pick" role="radiogroup" aria-label="Appearance">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={theme === t.id}
              className={theme === t.id ? 'on' : ''}
              onClick={() => {
                setThemeChoice(t.id);
                setTheme(t.id);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Categories</h2>
        <p className="muted small">These are offered on every trip. Deleting one stops offering it; past entries keep their category.</p>
        <ul className="cat-list">
          {app.categories.map((c) => (
            <li key={c}>
              <Roundel category={c} small />
              <span>{c}</span>
              {app.categories.length > 1 && (
                <button type="button" className="link-danger" onClick={() => setDeleting(c)} aria-label={`Delete ${c}`}>
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
        <button type="button" className="secondary" onClick={() => setNaming(true)}>Add a category</button>
        {missingBuiltIns.length > 0 && (
          <button type="button" className="secondary" onClick={() => void app.restoreBuiltInCategories()}>
            Restore {missingBuiltIns.length === 1 ? missingBuiltIns[0] : `${missingBuiltIns.length} built-in categories`}
          </button>
        )}
        {naming && (
          <NameSheet
            title="New category"
            label="Category name"
            hint="It's added for every trip."
            existing={app.categories}
            onClose={() => setNaming(false)}
            onSave={(name) => app.addCategory(name)}
          />
        )}
        {deleting && (
          <SheetBackdrop onClose={() => setDeleting(null)}>
            <div className="sheet menu" role="alertdialog" aria-modal="true" aria-label={`Delete ${deleting}`}>
              <h2>Delete “{deleting}”?</h2>
              <p className="muted small">
                {usedBy(deleting) > 0
                  ? `It won't be offered for new entries. Your ${plural(usedBy(deleting), 'entry', 'entries')} in ${deleting} ${usedBy(deleting) === 1 ? 'keeps it and still counts' : 'keep it and still count'} in totals.`
                  : `It won't be offered for new entries.`}{' '}
                {(CATEGORIES as readonly string[]).includes(deleting) ? 'You can restore it here later.' : 'You can add it again here later.'}
              </p>
              <button
                type="button"
                className="danger armed"
                onClick={async () => {
                  await app.removeCategory(deleting);
                  setDeleting(null);
                }}
              >
                Delete category
              </button>
              <button type="button" className="secondary" onClick={() => setDeleting(null)}>Cancel</button>
            </div>
          </SheetBackdrop>
        )}
      </section>

      <section className="card">
        <h2>Backup</h2>
        <p className="muted small">
          {describe(items())} on this device. A backup holds all your trips. Export one now and then and keep the file somewhere safe (Files, email).
        </p>
        <p className={`small last-export${lastExport ? '' : ' never'}`}>
          {lastExport
            ? `Last exported ${new Date(lastExport).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${new Date(lastExport).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`
            : 'Not exported from this device yet.'}
        </p>
        <button type="button" className="secondary" onClick={() => void exportBackup()}>Export backup (JSON)</button>
        <button type="button" className="secondary" onClick={() => void exportCsv()} disabled={total === 0}>Export CSV (all trips)</button>

        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => void chooseFile(e.target.files)} />
        <button type="button" className="secondary" onClick={() => fileRef.current?.click()}>Import backup…</button>

        {importErr && <p className="error" role="alert">{importErr}</p>}
        {pending && (
          <div className="confirm" role="alertdialog" aria-label="Confirm import">
            <p><strong>Replace all data on this device?</strong></p>
            <p className="muted small">
              {pending.file} contains {describe(pending.backup.trips)}
              {pending.backup.exportedAt ? ` (exported ${pending.backup.exportedAt.slice(0, 10)})` : ''}. Your current {describe(items())} will be erased.
            </p>
            <div className="sheet-actions">
              <button type="button" className="danger armed" onClick={() => void confirmImport()}>Replace my data</button>
              <button type="button" className="secondary" onClick={() => setPending(null)}>Cancel</button>
            </div>
          </div>
        )}
        {msg && <p className="toast show" role="status">{msg}</p>}
      </section>

      <section className="card">
        <h2>Delete all data</h2>
        <p className="muted small">Erases every trip and entry on this device. Type DELETE to enable the button. Export a backup first.</p>
        <input
          aria-label="Type DELETE to confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="confirm-input"
          placeholder="DELETE"
          autoCapitalize="characters"
          autoComplete="off"
        />
        <button type="button" className="danger" disabled={confirmText.trim() !== 'DELETE'} onClick={() => void deleteAll()}>
          Delete all data
        </button>
      </section>
    </div>
  );
}
