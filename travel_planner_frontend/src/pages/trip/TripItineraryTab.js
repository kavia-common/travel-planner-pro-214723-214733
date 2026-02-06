import React, { useMemo, useState } from "react";
import { useToasts } from "../../components/ToastProvider";
import { useItinerary } from "../../hooks/useItinerary";

/**
 * PUBLIC_INTERFACE
 * Itinerary tab for a trip.
 */
export function TripItineraryTab({ trip }) {
  /** Displays itinerary items with CRUD, backend-first + mock fallback. */
  const { pushToast } = useToasts();
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDay, setDraftDay] = useState("");
  const [draftTime, setDraftTime] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDay, setEditDay] = useState("");
  const [editTime, setEditTime] = useState("");

  const state = useItinerary(trip?.id, { limit: 25 });

  const items = state.items;

  const headerMeta = useMemo(() => {
    if (state.usingMock) return "mock";
    if (state.status === "pending") return "loading";
    if (state.status === "error") return "sync issue";
    return "live";
  }, [state.usingMock, state.status]);

  const startEdit = (it) => {
    setEditingId(it.id);
    setEditTitle(it.title || "");
    setEditDay(it.day || "");
    setEditTime(it.time || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDay("");
    setEditTime("");
  };

  return (
    <div>
      <div className="tp-muted" style={{ marginTop: 0, marginBottom: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <span>
          Build your day-by-day plan. Status: <strong>{state.status}</strong>
          {state.error ? <span style={{ color: "#EF4444" }}> — {state.error.message}</span> : null}
        </span>
        <span className={["tp-badge", state.usingMock ? "tp-badge-info" : "tp-badge-success"].join(" ")}>
          {headerMeta}
        </span>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <button
          className="tp-btn"
          type="button"
          onClick={async () => {
            try {
              await state.reload({ limit: state.limit, offset: state.offset });
              pushToast({ type: "success", title: "Refreshed", message: "Itinerary updated." });
            } catch (e) {
              pushToast({
                type: "error",
                title: "Refresh failed",
                message: e?.message || "Unable to refresh itinerary.",
                timeoutMs: 6000,
              });
            }
          }}
        >
          Refresh
        </button>

        <button
          className="tp-btn"
          type="button"
          disabled={state.usingMock}
          onClick={() =>
            pushToast({
              type: "info",
              title: "Tip",
              message: "Use Next/Prev to page through itinerary items if your trip is long.",
            })
          }
        >
          Pagination tip
        </button>
      </div>

      <div className="tp-card" style={{ marginBottom: 14 }}>
        <div className="tp-card-header">
          <h2 style={{ margin: 0, fontSize: 13 }}>Add itinerary item</h2>
        </div>
        <div className="tp-card-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 140px auto", gap: 10 }}>
            <input
              className="tp-input"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Title (e.g., Museum + lunch)"
              aria-label="Itinerary item title"
            />
            <input
              className="tp-input"
              value={draftDay}
              onChange={(e) => setDraftDay(e.target.value)}
              placeholder="Day (e.g., Day 2)"
              aria-label="Itinerary item day label"
            />
            <input
              className="tp-input"
              value={draftTime}
              onChange={(e) => setDraftTime(e.target.value)}
              placeholder="Time (e.g., 10:30)"
              aria-label="Itinerary item time"
            />
            <button
              className="tp-btn tp-btn-primary"
              type="button"
              disabled={state.status === "pending"}
              onClick={async () => {
                const title = draftTitle.trim();
                if (!title) {
                  pushToast({ type: "error", title: "Missing title", message: "Please enter a title." });
                  return;
                }

                try {
                  const res = await state.createItem({
                    title,
                    day: draftDay.trim(),
                    time: draftTime.trim(),
                  });

                  setDraftTitle("");
                  setDraftDay("");
                  setDraftTime("");

                  pushToast({
                    type: "success",
                    title: "Added",
                    message: res?.mocked ? "Added locally (mock mode)." : "Itinerary item created.",
                  });
                } catch (e) {
                  pushToast({
                    type: "error",
                    title: "Create failed",
                    message: e?.message || "Unable to create itinerary item.",
                    timeoutMs: 6000,
                  });
                }
              }}
            >
              Add
            </button>
          </div>
          {state.usingMock ? (
            <div className="tp-muted" style={{ fontSize: 12, marginTop: 10 }}>
              You’re in mock mode. Changes won’t persist to the backend.
            </div>
          ) : null}
        </div>
      </div>

      {state.status === "pending" && items.length === 0 ? (
        <div className="tp-muted">Loading itinerary…</div>
      ) : null}

      {items.length === 0 && state.status !== "pending" ? (
        <div className="tp-muted">No itinerary items yet.</div>
      ) : null}

      {items.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {items.map((it) => (
            <li key={it.id} style={{ marginBottom: 10 }}>
              {editingId === it.id ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 140px auto auto", gap: 10 }}>
                  <input
                    className="tp-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    aria-label="Edit itinerary title"
                  />
                  <input
                    className="tp-input"
                    value={editDay}
                    onChange={(e) => setEditDay(e.target.value)}
                    aria-label="Edit itinerary day"
                  />
                  <input
                    className="tp-input"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    aria-label="Edit itinerary time"
                  />
                  <button
                    className="tp-btn tp-btn-primary"
                    type="button"
                    onClick={async () => {
                      const title = editTitle.trim();
                      if (!title) return;

                      try {
                        const res = await state.updateItem(it.id, {
                          title,
                          day: editDay.trim() || undefined,
                          time: editTime.trim() || undefined,
                        });

                        pushToast({
                          type: "success",
                          title: "Saved",
                          message: res?.mocked ? "Saved locally (mock mode)." : "Itinerary item updated.",
                        });
                        cancelEdit();
                      } catch (e) {
                        pushToast({
                          type: "error",
                          title: "Update failed",
                          message: e?.message || "Unable to update item.",
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
                    <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                      <strong>{it.day || "Plan"}</strong>
                      <span className="tp-muted" style={{ fontSize: 12 }}>
                        {it.time ? it.time : "time TBD"}
                      </span>
                      {it._optimistic ? (
                        <span className="tp-badge tp-badge-info" title="Pending sync">
                          syncing
                        </span>
                      ) : null}
                    </div>
                    <div style={{ marginTop: 2 }}>{it.title}</div>
                  </div>

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <button className="tp-btn" type="button" onClick={() => startEdit(it)}>
                      Edit
                    </button>
                    <button
                      className="tp-btn"
                      type="button"
                      style={{ borderColor: "rgba(239, 68, 68, 0.35)" }}
                      onClick={async () => {
                        const ok = window.confirm("Delete this itinerary item?");
                        if (!ok) return;

                        try {
                          const res = await state.deleteItem(it.id);
                          pushToast({
                            type: "success",
                            title: "Deleted",
                            message: res?.mocked ? "Deleted locally (mock mode)." : "Itinerary item deleted.",
                          });
                        } catch (e) {
                          pushToast({
                            type: "error",
                            title: "Delete failed",
                            message: e?.message || "Unable to delete item.",
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
