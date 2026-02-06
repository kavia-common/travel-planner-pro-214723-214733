import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToasts } from "../components/ToastProvider";

/**
 * PUBLIC_INTERFACE
 * Trips home page: selects a trip or directs user to destination search.
 */
export function TripsHomePage({ trips, status, error, usingMock, onCreateTrip }) {
  /** Lists trips and provides a clear next step. */
  const { pushToast } = useToasts();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  return (
    <div className="tp-card">
      <div className="tp-card-header">
        <h2>Trips</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
            {creating ? "Creating…" : "New Trip"}
          </button>

          <Link className="tp-btn" to="/destinations">
            Search Destinations
          </Link>
        </div>
      </div>

      <div className="tp-card-body">
        {usingMock ? (
          <div className="tp-muted" style={{ marginTop: 0, marginBottom: 10 }}>
            You’re currently seeing <strong>mock trips</strong> because the backend can’t be reached.
          </div>
        ) : null}

        {status === "pending" ? (
          <p className="tp-muted" style={{ marginTop: 0 }}>
            Loading trips…
          </p>
        ) : null}

        {status === "error" && error ? (
          <p className="tp-muted" style={{ marginTop: 0 }}>
            <span style={{ color: "#EF4444", fontWeight: 700 }}>Backend error:</span> {error.message}
          </p>
        ) : null}

        <p className="tp-muted">
          Choose a trip from the sidebar (or below) to view itinerary, notes, and reminders.
        </p>

        {trips.length === 0 ? (
          <div className="tp-muted">No trips yet.</div>
        ) : (
          <ul>
            {trips.map((t) => (
              <li key={t.id}>
                <Link to={`/trips/${t.id}/itinerary`}>{t.name}</Link>{" "}
                <span className="tp-muted" style={{ fontSize: 12 }}>
                  ({t.dateRange})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

