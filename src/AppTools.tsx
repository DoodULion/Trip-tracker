import { useRef, useState } from 'react';
import { buildBackup, parseBackup, toCsv, type Backup, type BackupTrip } from './backup';
import { saveFile } from './download';
import { todayLocal } from './money';
import { EMPTY_DATA, type App } from './store';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const entryCount = (d: { cardCharges: unknown[]; cashPurchases: unknown[]; cashBought: unknown[] }) =>
  d.cardCharges.length + d.cashPurchases.length + d.cashBought.length;

/** App-wide tools: backup and restore of all trips, CSV export, delete everything. */
export default function AppTools({ app }: { app: App }) {
  const [pending, setPending] = useState<{ file: string; backup: Backup } | null>(null);
  const [importErr, setImportErr] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const items = (): BackupTrip[] => app.trips.map((trip) => ({ trip, data: app.data[trip.id] ?? EMPTY_DATA }));
  const total = items().reduce((t, i) => t + entryCount(i.data), 0);

  async function exportBackup() {
    setMsg('');
    await saveFile(`trip-tracker-backup-${todayLocal()}.json`, JSON.stringify(buildBackup(items()), null, 2), 'application/json');
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
    await app.replaceAll(pending.backup.trips);
    setPending(null);
    setMsg('Backup restored.');
  }

  async function deleteAll() {
    await app.deleteAll();
    setConfirmText('');
    setMsg('All data deleted.');
  }

  const describe = (list: BackupTrip[]) =>
    `${plural(list.length, 'trip', 'trips')}, ${plural(list.reduce((t, i) => t + entryCount(i.data), 0), 'entry', 'entries')}`;

  return (
    <div className="cols">
      <section className="card">
        <h2>Backup</h2>
        <p className="muted small">
          {describe(items())} on this device. A backup holds all your trips. Export one now and then and keep the file somewhere safe (Files, email).
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
