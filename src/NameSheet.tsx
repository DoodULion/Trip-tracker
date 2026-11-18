import { useState, type FormEvent } from 'react';
import SheetBackdrop from './SheetBackdrop';

/**
 * A small sheet that asks for one name (a new category or card). The field is focused here on
 * purpose: the person just tapped "New", so typing the name is the only thing to do.
 */
export default function NameSheet({ title, label, hint, existing, onSave, onClose }: {
  title: string;
  label: string;
  hint?: string;
  /** Names already in use (compared ignoring case). */
  existing: string[];
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (n === '') return setError('Type a name.');
    if (n.length > 24) return setError('Keep it to 24 characters or fewer.');
    if (existing.some((x) => x.toLowerCase() === n.toLowerCase())) return setError(`"${n}" is already there.`);
    await onSave(n);
    onClose();
  }

  return (
    <SheetBackdrop onClose={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <form className="sheet" onSubmit={submit}>
        <h2>{title}</h2>
        {hint && <p className="muted small">{hint}</p>}
        <label className="field">
          <span>{label}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus autoComplete="off" maxLength={40} enterKeyHint="done" />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="sheet-actions">
          <button type="submit" className="primary">Add</button>
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </SheetBackdrop>
  );
}
