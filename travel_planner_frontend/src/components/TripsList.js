import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useToasts } from "./ToastProvider";

/**
 * PUBLIC_INTERFACE
 * Sidebar trips list navigation component.
 */
export function TripsList({ trips, status, error, usingMock, onCreateTrip, onReload }) {
  /** Renders a list of NavLink items for trips, plus create/reload actions. */
  const { pushToast } = useToasts();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  return (
    <nav className="tp-nav" aria-label="Trips navigation">
      <div
        className="tp-nav-section-title"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
      >
        <span>Your Trips</span>
        <button
          className="tp-btn"
          style={{ padding: "6px 10px", borderRadius: 10, fontSize: 12, boxShadow: "none" }}
          type="button"
          onClick={async () => {
            if (!onReload) return;
            try {
              await onReload();
              pushToast({ type: "success", title: "Refreshed", message: "Trips list updated." });
            } catch (e) {
              pushToast({
                type: "error",
                title: "Refresh failed",
                message: e?.message || "Unable to refresh trips.",
                timeoutMs: 6000,
              });
            }
          }}
          aria-label="Reload trips"
        >
          Reload
        </button>
      </div>

      {usingMock ? (
        <div className="tp-muted" style={{ fontSize: 12, margin: "6px 4px 10px 4px" }}>
          Using mock trips (backend unavailable).
        </div>
      ) : null}

      {status === "pending" ? (
        <div className="tp-muted" style={{ fontSize: 12, margin: "6px 4px 10px 4px" }}>
          Loading trips…
        </div>
      ) : null}

      {status === "error" && error ? (
        <div className="tp-muted" style={{ fontSize: 12, margin: "6px 4px 10px 4px" }}>
          <span style={{ color: "#EF4444", fontWeight: 700 }}>Sync issue:</span> {error.message}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10, padding: "0 4px 10px 4px" }}>
        <button
          className="tp-btn tp-btn-primary"
          type="button"
          disabled={!onCreateTrip || creating}
          onClick={async () => {
            if (!onCreateTrip) return;
            setCreating(true);
            try {
              const res = await onCreateTrip({
                name: "New Trip",
                dateRange: "Dates TBD",
                destinations: [],
              });
              pushToast({
                type: "success",
                title: "Trip created",
                message: res?.mocked ? "Created locally (mock mode)." : "Created on the backend.",
              });

              // Navigate to the new trip if we have an id.
              const newId = res?.trip?.id;
              if (newId) navigate(`/trips/${newId}/itinerary`);
            } catch (e) {
              pushToast({
                type: "error",
                title: "Create failed",
                message: e?.message || "Unable to create trip.",
                timeoutMs: 6000,
              });
            } finally {
              setCreating(false);
            }
          }}
        >
          {creating ? "Creating…" : "New"}
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="tp-muted" style={{ fontSize: 12, margin: "6px 4px 10px 4px" }}>
          No trips yet. Create your first one.
        </div>
      ) : null}

      {trips.map((trip) => (
        <NavLink key={trip.id} to={`/trips/${trip.id}/itinerary`} className="tp-trip-item">
          <div className="tp-trip-item-title">
            {trip.name}{" "}
            {trip._optimistic ? (
              <span className="tp-muted" style={{ fontWeight: 700, fontSize: 11 }}>
                (syncing)
              </span>
            ) : null}
          </div>
          <div className="tp-trip-item-subtitle">{trip.dateRange}</div>
        </NavLink>
      ))}

      <div className="tp-nav-section-title">Explore</div>
      <NavLink to="/destinations" className="tp-trip-item">
        <div className="tp-trip-item-title">Destination Search</div>
        <div className="tp-trip-item-subtitle">Find places and add to trips</div>
      </NavLink>
    </nav>
  );
}

