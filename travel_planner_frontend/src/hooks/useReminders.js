import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { remindersApi } from "../api/reminders";
import { mockReminders } from "../mocks/data";

/**
 * PUBLIC_INTERFACE
 * Manage reminders list CRUD for a trip (backend-first with mock fallback) with pagination.
 */
export function useReminders(tripId, options = {}) {
  /** Returns { reminders, status, error, usingMock, limit, offset, setOffset, reload, createReminder, updateReminder, deleteReminder, hasMore }. */
  const initialLimit = typeof options.limit === "number" ? options.limit : 50;

  const [reminders, setReminders] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  const [limit, setLimit] = useState(initialLimit);
  const [offset, setOffset] = useState(0);

  const lastReloadAtRef = useRef(0);
  const loadedCountRef = useRef(0);

  const fallbackToMock = useCallback(() => {
    const list = Array.isArray(mockReminders?.[tripId]) ? mockReminders[tripId] : [];
    const normalized = list.map((text, idx) => ({
      id: `mock-${tripId}-${idx}`,
      content: String(text),
      done: false,
      _mock: true,
    }));
    setReminders(normalized);
    setUsingMock(true);
  }, [tripId]);

  const reload = useCallback(
    async (paging = { limit, offset }) => {
      if (!tripId) return;

      setStatus("pending");
      setError(null);
      try {
        const res = await remindersApi.list(tripId, paging);

        if (res?.mocked) {
          fallbackToMock();
          setStatus("success");
          loadedCountRef.current = reminders.length;
          return { reminders: null, mocked: true };
        }

        setReminders(res.reminders);
        setUsingMock(false);
        setStatus("success");
        lastReloadAtRef.current = Date.now();
        loadedCountRef.current = res.reminders.length;
        return { reminders: res.reminders, mocked: false };
      } catch (e) {
        fallbackToMock();
        setStatus("error");
        setError(e);
        return { reminders: null, mocked: true, error: e };
      }
    },
    [tripId, limit, offset, fallbackToMock, reminders.length]
  );

  useEffect(() => {
    setOffset(0);
    setLimit(initialLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  useEffect(() => {
    reload({ limit, offset });
  }, [reload, limit, offset]);

  const createReminder = useCallback(
    async (draft) => {
      if (!tripId) return null;

      const tempId = `tmp-${Math.random().toString(16).slice(2)}`;
      const optimistic = {
        id: tempId,
        content: draft?.content?.trim() || "",
        due_at: draft?.due_at || undefined,
        done: !!draft?.done,
        _optimistic: true,
      };

      setReminders((prev) => [optimistic, ...prev]);

      try {
        const payload = {
          content: optimistic.content,
          due_at: optimistic.due_at,
          done: optimistic.done,
        };

        const { reminder, mocked } = await remindersApi.create(tripId, payload);

        if (mocked) {
          setUsingMock(true);
          setReminders((prev) =>
            prev.map((r) => (r.id === tempId ? { ...r, _optimistic: false } : r))
          );
          return { reminder: optimistic, mocked: true };
        }

        setReminders((prev) => prev.map((r) => (r.id === tempId ? reminder : r)));
        setUsingMock(false);
        return { reminder, mocked: false };
      } catch (e) {
        setReminders((prev) => prev.filter((r) => r.id !== tempId));
        throw e;
      }
    },
    [tripId]
  );

  const updateReminder = useCallback(
    async (reminderId, patch) => {
      if (!tripId) return null;

      let previous = null;
      setReminders((prev) =>
        prev.map((r) => {
          if (r.id !== reminderId) return r;
          previous = r;
          return { ...r, ...patch, _optimistic: true };
        })
      );

      try {
        const { reminder, mocked } = await remindersApi.update(tripId, reminderId, patch);

        if (mocked) {
          setUsingMock(true);
          setReminders((prev) =>
            prev.map((r) => (r.id === reminderId ? { ...r, _optimistic: false } : r))
          );
          return { reminder: null, mocked: true };
        }

        setReminders((prev) => prev.map((r) => (r.id === reminderId ? reminder : r)));
        setUsingMock(false);
        return { reminder, mocked: false };
      } catch (e) {
        if (previous) {
          setReminders((prev) => prev.map((r) => (r.id === reminderId ? previous : r)));
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

  const deleteReminder = useCallback(
    async (reminderId) => {
      if (!tripId) return null;

      let removed = null;
      setReminders((prev) => {
        const next = [];
        for (const r of prev) {
          if (r.id === reminderId) removed = r;
          else next.push(r);
        }
        return next;
      });

      try {
        const res = await remindersApi.remove(tripId, reminderId);
        if (res?.mocked) setUsingMock(true);
        else setUsingMock(false);
        return res;
      } catch (e) {
        if (removed) {
          setReminders((prev) => [removed, ...prev]);
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
  }, [usingMock, limit, reminders.length]);

  return {
    reminders,
    status,
    error,
    usingMock,
    limit,
    offset,
    setLimit,
    setOffset,
    reload,
    setReminders,
    createReminder,
    updateReminder,
    deleteReminder,
    hasMore,
  };
}
