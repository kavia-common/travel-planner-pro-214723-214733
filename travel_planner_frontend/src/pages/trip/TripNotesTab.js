import React, { useMemo, useState } from "react";
import { mockNotes } from "../../mocks/data";
import { useToasts } from "../../components/ToastProvider";

/**
 * PUBLIC_INTERFACE
 * Notes tab for a trip.
 */
export function TripNotesTab({ trip }) {
  /** Displays and locally adds notes (non-persistent placeholder). */
  const { pushToast } = useToasts();
  const initial = useMemo(() => mockNotes[trip.id] || [], [trip.id]);

  const [notes, setNotes] = useState(initial);
  const [draft, setDraft] = useState("");

  return (
    <div>
      <p className="tp-muted" style={{ marginTop: 0 }}>
        Notes shell (local only). Persistence will be wired to backend later.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 12 }}>
        <input
          className="tp-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note (e.g., reservation code, packing tip)"
          aria-label="Note text"
        />
        <button
          className="tp-btn tp-btn-primary"
          type="button"
          onClick={() => {
            const trimmed = draft.trim();
            if (!trimmed) return;
            setNotes((prev) => [trimmed, ...prev]);
            setDraft("");
            pushToast({ type: "success", title: "Note added", message: "Saved locally for now." });
          }}
        >
          Add
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="tp-muted">No notes yet.</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {notes.map((n, idx) => (
            <li key={`${idx}-${n}`} style={{ marginBottom: 8 }}>
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
