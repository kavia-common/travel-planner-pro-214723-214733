import React, { useMemo } from "react";
import { NavLink, Route, Routes, useParams } from "react-router-dom";
import { TripItineraryTab } from "./trip/TripItineraryTab";
import { TripNotesTab } from "./trip/TripNotesTab";
import { TripRemindersTab } from "./trip/TripRemindersTab";

/**
 * PUBLIC_INTERFACE
 * Trip detail page layout with nested tab routes.
 */
export function TripDetailLayout({ trips }) {
  /** Renders the trip card plus nested routes for tabs. */
  const { tripId } = useParams();
  const trip = useMemo(() => trips.find((t) => t.id === tripId) || null, [trips, tripId]);

  if (!trip) {
    return (
      <div className="tp-card">
        <div className="tp-card-header">
          <h2>Trip Not Found</h2>
        </div>
        <div className="tp-card-body">
          <p className="tp-muted">We couldn’t find that trip.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-card">
      <div className="tp-card-header">
        <div>
          <h2 style={{ margin: 0 }}>{trip.name}</h2>
          <div className="tp-muted" style={{ fontSize: 12, marginTop: 4 }}>
            {trip.dateRange} • {trip.destinations.join(" • ")}
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
        </div>
      </div>

      <div className="tp-card-body">
        <Routes>
          <Route path="itinerary" element={<TripItineraryTab trip={trip} />} />
          <Route path="notes" element={<TripNotesTab trip={trip} />} />
          <Route path="reminders" element={<TripRemindersTab trip={trip} />} />
          <Route path="*" element={<TripItineraryTab trip={trip} />} />
        </Routes>
      </div>
    </div>
  );
}
