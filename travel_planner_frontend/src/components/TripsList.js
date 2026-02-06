import React from "react";
import { NavLink } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * Sidebar trips list navigation component.
 */
export function TripsList({ trips }) {
  /** Renders a list of NavLink items for trips. */
  return (
    <nav className="tp-nav" aria-label="Trips navigation">
      <div className="tp-nav-section-title">Your Trips</div>
      {trips.map((trip) => (
        <NavLink
          key={trip.id}
          to={`/trips/${trip.id}/itinerary`}
          className="tp-trip-item"
        >
          <div className="tp-trip-item-title">{trip.name}</div>
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
