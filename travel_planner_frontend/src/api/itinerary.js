import { apiClient } from "./client";

/**
 * @typedef {Object} ItineraryItem
 * @property {string} id
 * @property {string} [day]
 * @property {string} title
 * @property {string} [time]
 * @property {string} [notes]
 * @property {number} [order]
 * @property {string} [start_at]
 * @property {string} [end_at]
 * @property {string} [location]
 */

/**
 * Coerce backend itinerary payloads into a stable UI shape.
 * The backend schema may evolve; this keeps UI resilient.
 *
 * @param {any} it
 * @returns {ItineraryItem}
 */
function normalizeItineraryItem(it) {
  if (!it || typeof it !== "object") {
    return { id: "", title: "" };
  }

  const id = it.id ?? it.item_id ?? it.itinerary_item_id ?? it.uuid ?? "";
  const title = it.title ?? it.name ?? it.summary ?? "";

  return {
    id: String(id),
    day: it.day ?? it.day_label ?? it.dayLabel ?? undefined,
    title: String(title),
    time: it.time ?? it.at_time ?? it.atTime ?? undefined,
    notes: it.notes ?? it.description ?? undefined,
    order: typeof it.order === "number" ? it.order : undefined,
    start_at: it.start_at ?? it.startAt ?? undefined,
    end_at: it.end_at ?? it.endAt ?? undefined,
    location: it.location ?? it.place ?? undefined,
  };
}

/**
 * PUBLIC_INTERFACE
 * Itinerary API wrapper for /api/trips/{trip_id}/itinerary endpoints.
 */
export const itineraryApi = {
  // PUBLIC_INTERFACE
  async list(tripId, { limit = 50, offset = 0 } = {}) {
    /** List itinerary items for a trip. Returns { items, mocked }. */
    const res = await apiClient.get(
      `/api/trips/${encodeURIComponent(tripId)}/itinerary`,
      { params: { limit, offset } }
    );

    const raw = res?.data;
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    return { items: list.map(normalizeItineraryItem), mocked: !!res?.mocked };
  },

  // PUBLIC_INTERFACE
  async get(tripId, itemId) {
    /** Get itinerary item by id. Returns { item, mocked }. */
    const res = await apiClient.get(
      `/api/trips/${encodeURIComponent(tripId)}/itinerary/${encodeURIComponent(itemId)}`
    );
    return { item: normalizeItineraryItem(res?.data), mocked: !!res?.mocked };
  },

  // PUBLIC_INTERFACE
  async create(tripId, payload) {
    /** Create itinerary item. Returns { item, mocked }. */
    const res = await apiClient.post(
      `/api/trips/${encodeURIComponent(tripId)}/itinerary`,
      payload
    );
    return { item: normalizeItineraryItem(res?.data), mocked: !!res?.mocked };
  },

  // PUBLIC_INTERFACE
  async update(tripId, itemId, patch) {
    /** Patch/update itinerary item. Returns { item, mocked }. */
    const res = await apiClient.patch(
      `/api/trips/${encodeURIComponent(tripId)}/itinerary/${encodeURIComponent(itemId)}`,
      patch
    );
    return { item: normalizeItineraryItem(res?.data), mocked: !!res?.mocked };
  },

  // PUBLIC_INTERFACE
  async remove(tripId, itemId) {
    /** Delete itinerary item. Returns { data, mocked }. */
    const res = await apiClient.delete(
      `/api/trips/${encodeURIComponent(tripId)}/itinerary/${encodeURIComponent(itemId)}`
    );
    return { data: res?.data ?? null, mocked: !!res?.mocked };
  },
};
