import { apiClient } from "./client";

/**
 * @typedef {Object} Trip
 * @property {string|number} id
 * @property {string} name
 * @property {string} [dateRange]
 * @property {string[]} [destinations]
 */

/**
 * @typedef {Object} ApiResult
 * @property {any} data
 * @property {boolean} mocked
 */

/**
 * Coerce backend trip payloads into the UI's current shape.
 * Backend might return: {id, name, start_date, end_date, destinations:[...]}
 * UI expects: {id, name, dateRange, destinations}
 *
 * @param {any} t
 * @returns {Trip}
 */
function normalizeTrip(t) {
  if (!t || typeof t !== "object") {
    return { id: "", name: "", dateRange: "", destinations: [] };
  }

  const id = t.id ?? t.trip_id ?? t.uuid ?? "";
  const name = t.name ?? t.title ?? "Untitled trip";
  const destinations = Array.isArray(t.destinations)
    ? t.destinations.map((d) => (typeof d === "string" ? d : d?.name ?? "")).filter(Boolean)
    : [];

  const start = t.start_date ?? t.startDate ?? null;
  const end = t.end_date ?? t.endDate ?? null;

  const dateRange =
    t.dateRange ??
    t.date_range ??
    (start && end ? `${start}–${end}` : start ? String(start) : end ? String(end) : "Dates TBD");

  return {
    id: String(id),
    name: String(name),
    dateRange: String(dateRange),
    destinations,
  };
}

/**
 * PUBLIC_INTERFACE
 * Trips API wrapper for /api/trips endpoints.
 */
export const tripsApi = {
  // PUBLIC_INTERFACE
  async listTrips() {
    /** Fetch all trips. Returns { trips, mocked }. */
    const res = await apiClient.get("/api/trips");
    const raw = res?.data;

    // Allow either {items:[...]} or [...] response shapes.
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    return { trips: list.map(normalizeTrip), mocked: !!res?.mocked };
  },

  // PUBLIC_INTERFACE
  async getTrip(tripId) {
    /** Fetch a single trip by id. Returns { trip, mocked }. */
    const res = await apiClient.get(`/api/trips/${encodeURIComponent(tripId)}`);
    return { trip: normalizeTrip(res?.data), mocked: !!res?.mocked };
  },

  // PUBLIC_INTERFACE
  async createTrip(payload) {
    /**
     * Create a trip.
     * Payload is intentionally flexible to match backend models.
     */
    const res = await apiClient.post("/api/trips", payload);
    return { trip: normalizeTrip(res?.data), mocked: !!res?.mocked };
  },

  // PUBLIC_INTERFACE
  async updateTrip(tripId, patch) {
    /** Update a trip (PATCH). */
    const res = await apiClient.patch(`/api/trips/${encodeURIComponent(tripId)}`, patch);
    return { trip: normalizeTrip(res?.data), mocked: !!res?.mocked };
  },

  // PUBLIC_INTERFACE
  async deleteTrip(tripId) {
    /** Delete a trip. */
    const res = await apiClient.delete(`/api/trips/${encodeURIComponent(tripId)}`);
    return { data: res?.data ?? null, mocked: !!res?.mocked };
  },
};

