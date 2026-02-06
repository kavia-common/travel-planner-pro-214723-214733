import { apiClient } from "./client";

/**
 * @typedef {Object} TripReminder
 * @property {string} id
 * @property {string} content
 * @property {string} [due_at]
 * @property {boolean} [done]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

/**
 * @param {any} r
 * @returns {TripReminder}
 */
function normalizeReminder(r) {
  if (!r || typeof r !== "object") {
    return { id: "", content: "" };
  }
  const id = r.id ?? r.reminder_id ?? r.uuid ?? "";
  const content = r.content ?? r.text ?? r.reminder ?? "";
  return {
    id: String(id),
    content: String(content),
    due_at: r.due_at ?? r.dueAt ?? undefined,
    done: typeof r.done === "boolean" ? r.done : typeof r.is_done === "boolean" ? r.is_done : undefined,
    created_at: r.created_at ?? r.createdAt ?? undefined,
    updated_at: r.updated_at ?? r.updatedAt ?? undefined,
  };
}

/**
 * PUBLIC_INTERFACE
 * Reminders API wrapper for /api/trips/{trip_id}/reminders endpoints.
 */
export const remindersApi = {
  // PUBLIC_INTERFACE
  async list(tripId, { limit = 50, offset = 0 } = {}) {
    /** List reminders for a trip. Returns { reminders, mocked }. */
    const res = await apiClient.get(`/api/trips/${encodeURIComponent(tripId)}/reminders`, {
      params: { limit, offset },
    });

    const raw = res?.data;
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    return { reminders: list.map(normalizeReminder), mocked: !!res?.mocked };
  },

  // PUBLIC_INTERFACE
  async get(tripId, reminderId) {
    /** Get a reminder by id. Returns { reminder, mocked }. */
    const res = await apiClient.get(
      `/api/trips/${encodeURIComponent(tripId)}/reminders/${encodeURIComponent(reminderId)}`
    );
    return { reminder: normalizeReminder(res?.data), mocked: !!res?.mocked };
  },

  // PUBLIC_INTERFACE
  async create(tripId, payload) {
    /** Create a reminder. Returns { reminder, mocked }. */
    const res = await apiClient.post(
      `/api/trips/${encodeURIComponent(tripId)}/reminders`,
      payload
    );
    return { reminder: normalizeReminder(res?.data), mocked: !!res?.mocked };
  },

  // PUBLIC_INTERFACE
  async update(tripId, reminderId, patch) {
    /** Patch/update a reminder. Returns { reminder, mocked }. */
    const res = await apiClient.patch(
      `/api/trips/${encodeURIComponent(tripId)}/reminders/${encodeURIComponent(reminderId)}`,
      patch
    );
    return { reminder: normalizeReminder(res?.data), mocked: !!res?.mocked };
  },

  // PUBLIC_INTERFACE
  async remove(tripId, reminderId) {
    /** Delete a reminder. Returns { data, mocked }. */
    const res = await apiClient.delete(
      `/api/trips/${encodeURIComponent(tripId)}/reminders/${encodeURIComponent(reminderId)}`
    );
    return { data: res?.data ?? null, mocked: !!res?.mocked };
  },
};
