import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { itineraryApi } from "../api/itinerary";
import { mockItineraryItems } from "../mocks/data";

/**
 * @typedef {Object} UseItineraryState
 * @property {Array<any>} items
 * @property {"idle"|"pending"|"success"|"error"} status
 * @property {any} error
 * @property {boolean} usingMock
 * @property {number} limit
 * @property {number} offset
 */

/**
 * PUBLIC_INTERFACE
 * Manage itinerary list CRUD for a trip (backend-first with mock fallback) with pagination.
 */
export function useItinerary(tripId, options = {}) {
  /** Returns { items, status, error, usingMock, limit, offset, setOffset, reload, createItem, updateItem, deleteItem, hasMore }. */
  const initialLimit = typeof options.limit === "number" ? options.limit : 50;

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  const [limit, setLimit] = useState(initialLimit);
  const [offset, setOffset] = useState(0);

  const lastReloadAtRef = useRef(0);
  const loadedCountRef = useRef(0);

  const fallbackToMock = useCallback(() => {
    const list = Array.isArray(mockItineraryItems?.[tripId]) ? mockItineraryItems[tripId] : [];
    // Normalize mock shape to match UI fields we render.
    const normalized = list.map((it) => ({
      id: String(it.id),
      day: it.day,
      title: it.title,
      time: it.time,
    }));
    setItems(normalized);
    setUsingMock(true);
  }, [tripId]);

  const reload = useCallback(
    async (paging = { limit, offset }) => {
      if (!tripId) return;

      setStatus("pending");
      setError(null);
      try {
        const res = await itineraryApi.list(tripId, paging);
        if (res?.mocked) {
          fallbackToMock();
          setStatus("success");
          loadedCountRef.current = items.length;
          return { items: null, mocked: true };
        }

        setItems(res.items);
        setUsingMock(false);
        setStatus("success");
        lastReloadAtRef.current = Date.now();
        loadedCountRef.current = res.items.length;
        return { items: res.items, mocked: false };
      } catch (e) {
        // Backend enabled but unreachable => fallback to mocks
        fallbackToMock();
        setStatus("error");
        setError(e);
        return { items: null, mocked: true, error: e };
      }
    },
    [tripId, limit, offset, fallbackToMock, items.length]
  );

  useEffect(() => {
    // Reset pagination when trip changes
    setOffset(0);
    setLimit(initialLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  useEffect(() => {
    reload({ limit, offset });
  }, [reload, limit, offset]);

  const createItem = useCallback(
    async (draft) => {
      if (!tripId) return null;

      const tempId = `tmp-${Math.random().toString(16).slice(2)}`;
      const optimistic = {
        id: tempId,
        title: draft?.title?.trim() || "New item",
        day: draft?.day?.trim() || "",
        time: draft?.time?.trim() || "",
        notes: draft?.notes?.trim() || "",
        _optimistic: true,
      };

      setItems((prev) => [optimistic, ...prev]);

      try {
        const payload = {
          title: optimistic.title,
          day: optimistic.day || undefined,
          time: optimistic.time || undefined,
          notes: optimistic.notes || undefined,
        };

        const { item, mocked } = await itineraryApi.create(tripId, payload);

        if (mocked) {
          // Mock mode: just clear optimistic flag
          setUsingMock(true);
          setItems((prev) => prev.map((x) => (x.id === tempId ? { ...x, _optimistic: false } : x)));
          return { item: optimistic, mocked: true };
        }

        setItems((prev) => prev.map((x) => (x.id === tempId ? item : x)));
        setUsingMock(false);
        return { item, mocked: false };
      } catch (e) {
        setItems((prev) => prev.filter((x) => x.id !== tempId));
        throw e;
      }
    },
    [tripId]
  );

  const updateItem = useCallback(
    async (itemId, patch) => {
      if (!tripId) return null;

      let previous = null;
      setItems((prev) =>
        prev.map((x) => {
          if (x.id !== itemId) return x;
          previous = x;
          return { ...x, ...patch, _optimistic: true };
        })
      );

      try {
        const { item, mocked } = await itineraryApi.update(tripId, itemId, patch);

        if (mocked) {
          setUsingMock(true);
          setItems((prev) => prev.map((x) => (x.id === itemId ? { ...x, _optimistic: false } : x)));
          return { item: null, mocked: true };
        }

        setItems((prev) => prev.map((x) => (x.id === itemId ? item : x)));
        setUsingMock(false);
        return { item, mocked: false };
      } catch (e) {
        if (previous) {
          setItems((prev) => prev.map((x) => (x.id === itemId ? previous : x)));
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

  const deleteItem = useCallback(
    async (itemId) => {
      if (!tripId) return null;

      let removed = null;
      setItems((prev) => {
        const next = [];
        for (const x of prev) {
          if (x.id === itemId) removed = x;
          else next.push(x);
        }
        return next;
      });

      try {
        const res = await itineraryApi.remove(tripId, itemId);
        if (res?.mocked) setUsingMock(true);
        else setUsingMock(false);
        return res;
      } catch (e) {
        if (removed) {
          setItems((prev) => [removed, ...prev]);
        }
        reload({ limit, offset });
        throw e;
      }
    },
    [tripId, reload, limit, offset]
  );

  const hasMore = useMemo(() => {
    // Heuristic: if we loaded a full page, there might be more.
    if (usingMock) return false;
    return loadedCountRef.current >= limit;
  }, [usingMock, limit, items.length]);

  return {
    items,
    status,
    error,
    usingMock,
    limit,
    offset,
    setLimit,
    setOffset,
    reload,
    setItems,
    createItem,
    updateItem,
    deleteItem,
    hasMore,
  };
}
