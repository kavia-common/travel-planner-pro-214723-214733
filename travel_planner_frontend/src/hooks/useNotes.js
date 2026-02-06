import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { notesApi } from "../api/notes";
import { mockNotes } from "../mocks/data";

/**
 * PUBLIC_INTERFACE
 * Manage notes list CRUD for a trip (backend-first with mock fallback) with pagination.
 */
export function useNotes(tripId, options = {}) {
  /** Returns { notes, status, error, usingMock, limit, offset, setOffset, reload, createNote, updateNote, deleteNote, hasMore }. */
  const initialLimit = typeof options.limit === "number" ? options.limit : 50;

  const [notes, setNotes] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  const [limit, setLimit] = useState(initialLimit);
  const [offset, setOffset] = useState(0);

  const lastReloadAtRef = useRef(0);
  const loadedCountRef = useRef(0);

  const fallbackToMock = useCallback(() => {
    const list = Array.isArray(mockNotes?.[tripId]) ? mockNotes[tripId] : [];
    // Convert string array to objects so we can edit/delete with ids in UI.
    const normalized = list.map((text, idx) => ({
      id: `mock-${tripId}-${idx}`,
      content: String(text),
      _mock: true,
    }));
    setNotes(normalized);
    setUsingMock(true);
  }, [tripId]);

  const reload = useCallback(
    async (paging = { limit, offset }) => {
      if (!tripId) return;

      setStatus("pending");
      setError(null);
      try {
        const res = await notesApi.list(tripId, paging);

        if (res?.mocked) {
          fallbackToMock();
          setStatus("success");
          loadedCountRef.current = notes.length;
          return { notes: null, mocked: true };
        }

        setNotes(res.notes);
        setUsingMock(false);
        setStatus("success");
        lastReloadAtRef.current = Date.now();
        loadedCountRef.current = res.notes.length;
        return { notes: res.notes, mocked: false };
      } catch (e) {
        fallbackToMock();
        setUsingMock(true);
        setStatus("error");
        setError(e);
        return { notes: null, mocked: true, error: e };
      }
    },
    [tripId, limit, offset, fallbackToMock, notes.length]
  );

  useEffect(() => {
    setOffset(0);
    setLimit(initialLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  useEffect(() => {
    reload({ limit, offset });
  }, [reload, limit, offset]);

  const createNote = useCallback(
    async (draft) => {
      if (!tripId) return null;

      const tempId = `tmp-${Math.random().toString(16).slice(2)}`;
      const optimistic = {
        id: tempId,
        content: draft?.content?.trim() || "",
        _optimistic: true,
      };

      setNotes((prev) => [optimistic, ...prev]);

      try {
        const payload = { content: optimistic.content };
        const { note, mocked } = await notesApi.create(tripId, payload);

        if (mocked) {
          setUsingMock(true);
          setNotes((prev) => prev.map((n) => (n.id === tempId ? { ...n, _optimistic: false } : n)));
          return { note: optimistic, mocked: true };
        }

        setNotes((prev) => prev.map((n) => (n.id === tempId ? note : n)));
        setUsingMock(false);
        return { note, mocked: false };
      } catch (e) {
        setNotes((prev) => prev.filter((n) => n.id !== tempId));
        throw e;
      }
    },
    [tripId]
  );

  const updateNote = useCallback(
    async (noteId, patch) => {
      if (!tripId) return null;

      let previous = null;
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id !== noteId) return n;
          previous = n;
          return { ...n, ...patch, _optimistic: true };
        })
      );

      try {
        const { note, mocked } = await notesApi.update(tripId, noteId, patch);

        if (mocked) {
          setUsingMock(true);
          setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, _optimistic: false } : n)));
          return { note: null, mocked: true };
        }

        setNotes((prev) => prev.map((n) => (n.id === noteId ? note : n)));
        setUsingMock(false);
        return { note, mocked: false };
      } catch (e) {
        if (previous) {
          setNotes((prev) => prev.map((n) => (n.id === noteId ? previous : n)));
        }
        const now = Date.now();
        if (now - lastReloadAtRef.current > 500) {
          reload({ limit, offset });
        }
        throw e;
      }
    },
    [tripId, reload, limit, offset]
  );

  const deleteNote = useCallback(
    async (noteId) => {
      if (!tripId) return null;

      let removed = null;
      setNotes((prev) => {
        const next = [];
        for (const n of prev) {
          if (n.id === noteId) removed = n;
          else next.push(n);
        }
        return next;
      });

      try {
        const res = await notesApi.remove(tripId, noteId);
        if (res?.mocked) setUsingMock(true);
        else setUsingMock(false);
        return res;
      } catch (e) {
        if (removed) {
          setNotes((prev) => [removed, ...prev]);
        }
        reload({ limit, offset });
        throw e;
      }
    },
    [tripId, reload, limit, offset]
  );

  const hasMore = useMemo(() => {
    if (usingMock) return false;
    return loadedCountRef.current >= limit;
  }, [usingMock, limit, notes.length]);

  return {
    notes,
    status,
    error,
    usingMock,
    limit,
    offset,
    setLimit,
    setOffset,
    reload,
    setNotes,
    createNote,
    updateNote,
    deleteNote,
    hasMore,
  };
}
