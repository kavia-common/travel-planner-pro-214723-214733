import { apiClient } from "./client";

/**
 * @typedef {Object} TripNote
 * @property {string} id
 * @property {string} content
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

/**
 * @param {any} n
 * @returns {TripNote}
 */
function normalizeNote(n) {
  if (!n || typeof n !== "object") {
    return { id: "", content: "" };
  }
  const id = n.id ?? n.note_id ?? n.uuid ?? "";
  const content = n.content ?? n.text ?? n.note ?? "";
  return {
    id: String(id),
    content: String(content),
    created_at: n.created_at ?? n.createdAt ?? undefined,
    updated_at: n.updated_at ?? n.updatedAt ?? undefined,
  };
}

/**
 * PUBLIC_INTERFACE
 * Notes API wrapper for /api/trips/{trip_id}/notes endpoints.
 */
export const notesApi = {
  // PUBLIC_INTERFACE
  async list(tripId, { limit = 50, offset = 0 } = {}) {
    /** List notes for a trip. Returns { notes, mocked }. */
    const res = await apiClient.get(`/api/trips/${encodeURIComponent(tripId)}/notes`, {
      params: { limit, offset },
    });

    const raw = res?.data;
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    return { notes: list.map(normalizeNote), mocked: !!res?.mocked };
  },

  // PUBLIC_INTERFACE
  async get(tripId, noteId) {
    /** Get a note by id. Returns { note, mocked }. */
    const res = await apiClient.get(
      `/api/trips/${encodeURIComponent(tripId)}/notes/${encodeURIComponent(noteId)}`
    );
    return { note: normalizeNote(res?.data), mocked: !!res?.mocked };
  },

  // PUBLIC_INTERFACE
  async create(tripId, payload) {
    /** Create a note. Returns { note, mocked }. */
    const res = await apiClient.post(`/api/trips/${encodeURIComponent(tripId)}/notes`, payload);
    return { note: normalizeNote(res?.data), mocked: !!res?.mocked };
  },

  // PUBLIC_INTERFACE
  async update(tripId, noteId, patch) {
    /** Patch/update a note. Returns { note, mocked }. */
    const res = await apiClient.patch(
      `/api/trips/${encodeURIComponent(tripId)}/notes/${encodeURIComponent(noteId)}`,
      patch
    );
    return { note: normalizeNote(res?.data), mocked: !!res?.mocked };
  },

  // PUBLIC_INTERFACE
  async remove(tripId, noteId) {
    /** Delete a note. Returns { data, mocked }. */
    const res = await apiClient.delete(
      `/api/trips/${encodeURIComponent(tripId)}/notes/${encodeURIComponent(noteId)}`
    );
    return { data: res?.data ?? null, mocked: !!res?.mocked };
  },
};
