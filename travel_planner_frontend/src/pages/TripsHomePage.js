import React from "react";
import { Link } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * Trips home page: selects a trip or directs user to destination search.
 */
export function TripsHomePage({ trips }) {
  /** Lists trips and provides a clear next step. */
  return (
    <div className="tp-card">
      <div className="tp-card-header">
        <h2>Trips</h2>
        <Link className="tp-btn tp-btn-primary" to="/destinations">
          Search Destinations
        </Link>
      </div>
      <div className="tp-card-body">
        <p className="tp-muted">
          Choose a trip from the sidebar to view itinerary, notes, and reminders.
        </p>
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
      </div>
    </div>
  );
}
