import React, { useState } from "react";
import { useToasts } from "../../components/ToastProvider";
import { useNotes } from "../../hooks/useNotes";

/**
 * PUBLIC_INTERFACE
 * Notes tab for a trip.
 */
export function TripNotesTab({ trip }) {
  /** Displays notes with CRUD, backend-first + mock fallback. */
  const { pushToast } = useToasts();

  const state = useNotes(trip?.id, { limit: 25 });

  const [draft, setDraft] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditDraft(note.content || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft("");
  };

  return (
    <div>
      <p className="tp-muted" style={{ marginTop: 0, marginBottom: 10 }}>
        Trip notes are great for reservation codes, packing lists, and quick ideas.{" "}
        <span className={["tp-badge", state.usingMock ? "tp-badge-info" : "tp-badge-success"].join(" ")}>
          {state.usingMock ? "mock" : "live"}
        </span>{" "}
        <span className="tp-muted" style={{ fontSize: 12 }}>
          status: <strong>{state.status}</strong>
          {state.error ? <span style={{ color: "#EF4444" }}> — {state.error.message}</span> : null}
        </span>
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <button
          className="tp-btn"
          type="button"
          onClick={async () => {
            try {
              await state.reload({ limit: state.limit, offset: state.offset });
              pushToast({ type: "success", title: "Refreshed", message: "Notes updated." });
            } catch (e) {
              pushToast({
                type: "error",
                title: "Refresh failed",
                message: e?.message || "Unable to refresh notes.",
                timeoutMs: 6000,
              });
            }
          }}
        >
          Refresh
        </button>
      </div>

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
          disabled={state.status === "pending"}
          onClick={async () => {
            const trimmed = draft.trim();
            if (!trimmed) return;

            try {
              const res = await state.createNote({ content: trimmed });
              setDraft("");
              pushToast({
                type: "success",
                title: "Note added",
                message: res?.mocked ? "Saved locally (mock mode)." : "Saved to backend.",
              });
            } catch (e) {
              pushToast({
                type: "error",
                title: "Create failed",
                message: e?.message || "Unable to create note.",
                timeoutMs: 6000,
              });
            }
          }}
        >
          Add
        </button>
      </div>

      {state.status === "pending" && state.notes.length === 0 ? (
        <div className="tp-muted">Loading notes…</div>
      ) : null}

      {state.notes.length === 0 && state.status !== "pending" ? (
        <div className="tp-muted">No notes yet.</div>
      ) : null}

      {state.notes.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {state.notes.map((n) => (
            <li key={n.id} style={{ marginBottom: 10 }}>
              {editingId === n.id ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10 }}>
                  <input
                    className="tp-input"
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    aria-label="Edit note"
                  />
                  <button
                    className="tp-btn tp-btn-primary"
                    type="button"
                    onClick={async () => {
                      const trimmed = editDraft.trim();
                      if (!trimmed) return;

                      try {
                        const res = await state.updateNote(n.id, { content: trimmed });
                        pushToast({
                          type: "success",
                          title: "Saved",
                          message: res?.mocked ? "Saved locally (mock mode)." : "Updated on backend.",
                        });
                        cancelEdit();
                      } catch (e) {
                        pushToast({
                          type: "error",
                          title: "Update failed",
                          message: e?.message || "Unable to update note.",
                          timeoutMs: 6000,
                        });
                      }
                    }}
                  >
                    Save
                  </button>
                  <button className="tp-btn" type="button" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "start" }}>
                  <div style={{ minWidth: 0 }}>
                    {n.content}{" "}
                    {n._optimistic ? (
                      <span className="tp-badge tp-badge-info" title="Pending sync">
                        syncing
                      </span>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <button className="tp-btn" type="button" onClick={() => startEdit(n)}>
                      Edit
                    </button>
                    <button
                      className="tp-btn"
                      type="button"
                      style={{ borderColor: "rgba(239, 68, 68, 0.35)" }}
                      onClick={async () => {
                        const ok = window.confirm("Delete this note?");
                        if (!ok) return;

                        try {
                          const res = await state.deleteNote(n.id);
                          pushToast({
                            type: "success",
                            title: "Deleted",
                            message: res?.mocked ? "Deleted locally (mock mode)." : "Deleted on backend.",
                          });
                        } catch (e) {
                          pushToast({
                            type: "error",
                            title: "Delete failed",
                            message: e?.message || "Unable to delete note.",
                            timeoutMs: 6000,
                          });
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
        <button
          className="tp-btn"
          type="button"
          disabled={state.offset <= 0 || state.usingMock}
          onClick={() => state.setOffset(Math.max(0, state.offset - state.limit))}
        >
          Prev
        </button>
        <button
          className="tp-btn"
          type="button"
          disabled={!state.hasMore || state.usingMock}
          onClick={() => state.setOffset(state.offset + state.limit)}
        >
          Next
        </button>
        <span className="tp-muted" style={{ fontSize: 12 }}>
          offset <strong>{state.offset}</strong>, limit <strong>{state.limit}</strong>
        </span>
      </div>
    </div>
  );
}
