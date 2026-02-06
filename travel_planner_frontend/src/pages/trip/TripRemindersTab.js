import React, { useMemo, useState } from "react";
import { mockReminders } from "../../mocks/data";
import { useToasts } from "../../components/ToastProvider";

/**
 * PUBLIC_INTERFACE
 * Reminders tab for a trip.
 */
export function TripRemindersTab({ trip }) {
  /** Displays and locally adds reminders (non-persistent placeholder). */
  const { pushToast } = useToasts();
  const initial = useMemo(() => mockReminders[trip.id] || [], [trip.id]);

  const [reminders, setReminders] = useState(initial);
  const [draft, setDraft] = useState("");

  return (
    <div>
      <p className="tp-muted" style={{ marginTop: 0 }}>
        Reminders shell (local only). Notifications/scheduling will be added later.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 12 }}>
        <input
          className="tp-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a reminder (e.g., 'Check-in 24h before flight')"
          aria-label="Reminder text"
        />
        <button
          className="tp-btn tp-btn-primary"
          type="button"
          onClick={() => {
            const trimmed = draft.trim();
            if (!trimmed) return;
            setReminders((prev) => [trimmed, ...prev]);
            setDraft("");
            pushToast({ type: "success", title: "Reminder added", message: "Saved locally for now." });
          }}
        >
          Add
        </button>
      </div>

      {reminders.length === 0 ? (
        <div className="tp-muted">No reminders yet.</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {reminders.map((r, idx) => (
            <li key={`${idx}-${r}`} style={{ marginBottom: 8 }}>
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
