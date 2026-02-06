import React, { useMemo } from "react";
import { mockItineraryItems } from "../../mocks/data";

/**
 * PUBLIC_INTERFACE
 * Itinerary tab for a trip.
 */
export function TripItineraryTab({ trip }) {
  /** Displays itinerary items (mocked for now). */
  const items = useMemo(() => mockItineraryItems[trip.id] || [], [trip.id]);

  return (
    <div>
      <p className="tp-muted" style={{ marginTop: 0 }}>
        Itinerary builder shell. Backend calls are gated until endpoints are implemented.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button className="tp-btn tp-btn-primary" type="button" disabled>
          Add item (coming soon)
        </button>
        <button className="tp-btn" type="button" disabled>
          Optimize route (coming soon)
        </button>
      </div>

      {items.length === 0 ? (
        <div className="tp-muted">No itinerary items yet.</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {items.map((it) => (
            <li key={it.id} style={{ marginBottom: 8 }}>
              <strong>{it.day}</strong> — {it.time} — {it.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
