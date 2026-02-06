import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tripsApi } from "../api/trips";
import { mockTrips } from "../mocks/data";

/**
 * PUBLIC_INTERFACE
 * Hook that owns trips state and CRUD operations (backend-first with mock fallback).
 */
export function useTrips() {
  /** Returns { trips, status, error, usingMock, reload, createTrip, updateTrip, deleteTrip }. */
  const [trips, setTrips] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | pending | success | error
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  const lastReloadAtRef = useRef(0);

  const reload = useCallback(async () => {
    setStatus("pending");
    setError(null);
    try {
      const { trips: loaded, mocked } = await tripsApi.listTrips();

      if (mocked) {
        setTrips(mockTrips);
        setUsingMock(true);
      } else {
        setTrips(loaded);
        setUsingMock(false);
      }

      setStatus("success");
      lastReloadAtRef.current = Date.now();
    } catch (e) {
      // Backend enabled but unreachable (network/CORS/etc) => fallback to mocks.
      setTrips(mockTrips);
      setUsingMock(true);
      setStatus("error");
      setError(e);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const createTrip = useCallback(async (draft) => {
    // Optimistic add with a temporary id; replace on success; reload on conflict.
    const tempId = `tmp-${Math.random().toString(16).slice(2)}`;
    const optimistic = {
      id: tempId,
      name: draft?.name?.trim() || "New Trip",
      dateRange: draft?.dateRange?.trim() || "Dates TBD",
      destinations: Array.isArray(draft?.destinations) ? draft.destinations : [],
      _optimistic: true,
    };

    setTrips((prev) => [optimistic, ...prev]);

    try {
      const payload = {
        name: optimistic.name,
        dateRange: optimistic.dateRange,
        destinations: optimistic.destinations,
      };
      const { trip, mocked } = await tripsApi.createTrip(payload);

      if (mocked) {
        // In mock mode, keep local optimistic trip as "created".
        setUsingMock(true);
        setTrips((prev) => prev.map((t) => (t.id === tempId ? { ...t, _optimistic: false } : t)));
        return { trip: optimistic, mocked: true };
      }

      setTrips((prev) => prev.map((t) => (t.id === tempId ? trip : t)));
      setUsingMock(false);
      return { trip, mocked: false };
    } catch (e) {
      // Roll back optimistic item.
      setTrips((prev) => prev.filter((t) => t.id !== tempId));
      throw e;
    }
  }, []);

  const updateTrip = useCallback(async (tripId, patch) => {
    // Optimistic patch; if server rejects/conflicts, reload safely.
    let previous = null;
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== tripId) return t;
        previous = t;
        return { ...t, ...patch, _optimistic: true };
      })
    );

    try {
      const { trip, mocked } = await tripsApi.updateTrip(tripId, patch);

      if (mocked) {
        setUsingMock(true);
        setTrips((prev) => prev.map((t) => (t.id === tripId ? { ...t, _optimistic: false } : t)));
        return { trip: null, mocked: true };
      }

      setTrips((prev) => prev.map((t) => (t.id === tripId ? trip : t)));
      setUsingMock(false);
      return { trip, mocked: false };
    } catch (e) {
      // rollback optimistic if we have previous; otherwise just reload
      if (previous) {
        setTrips((prev) => prev.map((t) => (t.id === tripId ? previous : t)));
      }
      // Safe reload after potential conflict/stale state.
      const now = Date.now();
      if (now - lastReloadAtRef.current > 500) {
        // prevent rapid loops
        reload();
      }
      throw e;
    }
  }, [reload]);

  const deleteTrip = useCallback(async (tripId) => {
    // Optimistic remove; rollback on failure; safe reload on server mismatch.
    let removed = null;
    setTrips((prev) => {
      const next = [];
      for (const t of prev) {
        if (t.id === tripId) removed = t;
        else next.push(t);
      }
      return next;
    });

    try {
      const res = await tripsApi.deleteTrip(tripId);
      if (res?.mocked) {
        setUsingMock(true);
      } else {
        setUsingMock(false);
      }
      return res;
    } catch (e) {
      if (removed) {
        setTrips((prev) => [removed, ...prev]);
      }
      // Safe reload after potential conflict/stale state.
      reload();
      throw e;
    }
  }, [reload]);

  const byId = useMemo(() => {
    const m = new Map();
    trips.forEach((t) => m.set(String(t.id), t));
    return m;
  }, [trips]);

  return {
    trips,
    tripsById: byId,
    status,
    error,
    usingMock,
    reload,
    setTrips,
    createTrip,
    updateTrip,
    deleteTrip,
  };
}

