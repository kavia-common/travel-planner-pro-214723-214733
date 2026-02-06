import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { useToasts } from "../components/ToastProvider";
import { TripItineraryTab } from "./trip/TripItineraryTab";
import { TripNotesTab } from "./trip/TripNotesTab";
import { TripRemindersTab } from "./trip/TripRemindersTab";
import { TripCalendarTab } from "./trip/TripCalendarTab";

/**
 * PUBLIC_INTERFACE
 * Trip detail page layout with nested tab routes.
 */
export function TripDetailLayout({ trips, status, usingMock, onUpdateTrip, onDeleteTrip, onReload }) {
  /** Renders the trip card plus nested routes for tabs. */
  const { pushToast } = useToasts();
  const navigate = useNavigate();
  const { tripId } = useParams();

  const trip = useMemo(() => trips.find((t) => String(t.id) === String(tripId)) || null, [trips, tripId]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    if (trip && !isEditingName) {
      setNameDraft(trip.name || "");
    }
  }, [trip, isEditingName]);

  if (status === "pending" && !trip) {
    return (
      <div className="tp-card">
        <div className="tp-card-header">
          <h2>Loading trip…</h2>
        </div>
        <div className="tp-card-body">
          <p className="tp-muted">Fetching trip details.</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="tp-card">
        <div className="tp-card-header">
          <h2>Trip Not Found</h2>
        </div>
        <div className="tp-card-body">
          <p className="tp-muted">We couldn’t find that trip.</p>
          <button className="tp-btn" type="button" onClick={() => navigate("/trips")}>
            Back to trips
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-card">
      <div className="tp-card-header" style={{ alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {!isEditingName ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>{trip.name}</h2>
              <button
                className="tp-btn"
                type="button"
                disabled={!onUpdateTrip}
                onClick={() => setIsEditingName(true)}
              >
                Rename
              </button>
              {trip._optimistic ? (
                <span className="tp-badge tp-badge-info" title="Pending sync">
                  syncing
                </span>
              ) : null}
              {usingMock ? <span className="tp-badge tp-badge-info">mock</span> : null}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, marginTop: 2 }}>
              <input
                className="tp-input"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                aria-label="Trip name"
              />
              <button
                className="tp-btn tp-btn-primary"
                type="button"
                onClick={async () => {
                  const trimmed = nameDraft.trim();
                  if (!trimmed) return;

                  try {
                    await onUpdateTrip?.(trip.id, { name: trimmed });
                    pushToast({
                      type: "success",
                      title: "Updated",
                      message: usingMock ? "Renamed locally (mock mode)." : "Trip renamed.",
                    });
                    setIsEditingName(false);
                  } catch (e) {
                    pushToast({
                      type: "error",
                      title: "Rename failed",
                      message: e?.message || "Unable to rename trip.",
                      timeoutMs: 6000,
                    });
                    // Safe reload on possible conflict.
                    onReload?.();
                  }
                }}
              >
                Save
              </button>
              <button className="tp-btn" type="button" onClick={() => setIsEditingName(false)}>
                Cancel
              </button>
            </div>
          )}

          <div className="tp-muted" style={{ fontSize: 12, marginTop: 6 }}>
            {trip.dateRange}
            {Array.isArray(trip.destinations) && trip.destinations.length > 0 ? (
              <>
                {" "}
                • {trip.destinations.join(" • ")}
              </>
            ) : null}
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="tp-btn"
              type="button"
              onClick={async () => {
                try {
                  await onReload?.();
                  pushToast({ type: "success", title: "Refreshed", message: "Trip data refreshed." });
                } catch (e) {
                  pushToast({
                    type: "error",
                    title: "Refresh failed",
                    message: e?.message || "Unable to refresh trip.",
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
              style={{ borderColor: "rgba(239, 68, 68, 0.35)" }}
              disabled={!onDeleteTrip}
              onClick={async () => {
                const ok = window.confirm("Delete this trip? This cannot be undone.");
                if (!ok) return;

                try {
                  const res = await onDeleteTrip?.(trip.id);
                  pushToast({
                    type: "success",
                    title: "Deleted",
                    message: res?.mocked ? "Deleted locally (mock mode)." : "Trip deleted.",
                  });
                  navigate("/trips");
                } catch (e) {
                  pushToast({
                    type: "error",
                    title: "Delete failed",
                    message: e?.message || "Unable to delete trip.",
                    timeoutMs: 6000,
                  });
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>

        <div className="tp-tabs" role="tablist" aria-label="Trip sections">
          <NavLink to="itinerary" className="tp-tab" role="tab">
            Itinerary
          </NavLink>
          <NavLink to="notes" className="tp-tab" role="tab">
            Notes
          </NavLink>
          <NavLink to="reminders" className="tp-tab" role="tab">
            Reminders
          </NavLink>
          <NavLink to="calendar" className="tp-tab" role="tab">
            Calendar
          </NavLink>
        </div>
      </div>

      <div className="tp-card-body">
        <Routes>
          <Route path="itinerary" element={<TripItineraryTab trip={trip} />} />
          <Route path="notes" element={<TripNotesTab trip={trip} />} />
          <Route path="reminders" element={<TripRemindersTab trip={trip} />} />
          <Route path="calendar" element={<TripCalendarTab trip={trip} />} />
          <Route path="*" element={<TripItineraryTab trip={trip} />} />
        </Routes>
      </div>
    </div>
  );
}

