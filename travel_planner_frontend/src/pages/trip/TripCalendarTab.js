import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { CalendarGrid } from "../../components/CalendarGrid";
import { useToasts } from "../../components/ToastProvider";
import { useItinerary } from "../../hooks/useItinerary";
import { useNotes } from "../../hooks/useNotes";
import { useReminders } from "../../hooks/useReminders";
import { formatDateKeyHuman, getMonthInfo, getTodayMonthKey, parseMonthKey, toDateKey } from "../../utils/date";

/**
 * Attempt to derive a date key from itinerary item fields.
 * Backend spec uses day (int) + optional start_time/end_time. UI mocks use day labels.
 *
 * @param {any} it
 * @param {string|null} tripStartDate ISO date if available
 * @returns {string|null}
 */
function dateKeyFromItineraryItem(it, tripStartDate) {
  const startTime = it?.start_time ?? it?.start_at ?? it?.startAt ?? null;
  const endTime = it?.end_time ?? it?.end_at ?? it?.endAt ?? null;

  // Prefer explicit datetime if present
  const direct = toDateKey(startTime || endTime);
  if (direct) return direct;

  // If backend returns day number and we have trip start date, map: start_date + (day-1)
  const dayNum = typeof it?.day === "number" ? it.day : null;
  if (dayNum && tripStartDate) {
    const d = dayjs(tripStartDate).add(Math.max(0, dayNum - 1), "day");
    return d.isValid() ? d.format("YYYY-MM-DD") : null;
  }

  // Otherwise try to parse "Day 2" (mock label) similarly, but requires start date.
  const dayLabel = typeof it?.day === "string" ? it.day : null;
  const match = dayLabel ? dayLabel.match(/day\s*(\d+)/i) : null;
  if (match && tripStartDate) {
    const n = Number(match[1]);
    if (Number.isFinite(n) && n > 0) {
      const d = dayjs(tripStartDate).add(n - 1, "day");
      return d.isValid() ? d.format("YYYY-MM-DD") : null;
    }
  }

  return null;
}

/**
 * Attempt to derive a date key from a note.
 * Backend note schema: created_at (datetime). Mocks have no timestamps.
 *
 * @param {any} n
 * @returns {string|null}
 */
function dateKeyFromNote(n) {
  return toDateKey(n?.created_at ?? n?.createdAt ?? n?.updated_at ?? n?.updatedAt ?? null);
}

/**
 * Attempt to derive a date key from a reminder.
 * Backend reminder schema: remind_at (datetime). UI currently uses due_at sometimes.
 *
 * @param {any} r
 * @returns {string|null}
 */
function dateKeyFromReminder(r) {
  return toDateKey(r?.remind_at ?? r?.due_at ?? r?.remindAt ?? r?.dueAt ?? null);
}

/**
 * PUBLIC_INTERFACE
 * Calendar tab for a trip: shows itinerary + notes + reminders in a month grid, grouped by date.
 */
export function TripCalendarTab({ trip }) {
  /** Shows an interactive calendar with day details and links to existing tab forms. */
  const { pushToast } = useToasts();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialMonth = parseMonthKey(searchParams.get("month")) || getTodayMonthKey();
  const [monthKey, setMonthKey] = useState(initialMonth);

  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(dayjs()) || null);

  // Keep URL in sync (persist selected month).
  useEffect(() => {
    const current = parseMonthKey(searchParams.get("month"));
    if (current !== monthKey) {
      const next = new URLSearchParams(searchParams);
      next.set("month", monthKey);
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  // If user navigates with browser controls, update state from URL.
  useEffect(() => {
    const current = parseMonthKey(searchParams.get("month"));
    if (current && current !== monthKey) {
      setMonthKey(current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const itineraryState = useItinerary(trip?.id, { limit: 100 });
  const notesState = useNotes(trip?.id, { limit: 100 });
  const remindersState = useReminders(trip?.id, { limit: 100 });

  const monthInfo = useMemo(() => getMonthInfo(`${monthKey}-01`), [monthKey]);

  const anyPending =
    itineraryState.status === "pending" || notesState.status === "pending" || remindersState.status === "pending";
  const anyError = itineraryState.error || notesState.error || remindersState.error;

  const itemsByDate = useMemo(() => {
    /** @type {Record<string, { itinerary: any[], notes: any[], reminders: any[] }>} */
    const map = {};

    const startDate = trip?.start_date ?? trip?.startDate ?? null;

    for (const it of itineraryState.items || []) {
      const key = dateKeyFromItineraryItem(it, startDate);
      if (!key) continue;
      map[key] = map[key] || { itinerary: [], notes: [], reminders: [] };
      map[key].itinerary.push(it);
    }

    for (const n of notesState.notes || []) {
      const key = dateKeyFromNote(n);
      if (!key) continue;
      map[key] = map[key] || { itinerary: [], notes: [], reminders: [] };
      map[key].notes.push(n);
    }

    for (const r of remindersState.reminders || []) {
      const key = dateKeyFromReminder(r);
      if (!key) continue;
      map[key] = map[key] || { itinerary: [], notes: [], reminders: [] };
      map[key].reminders.push(r);
    }

    return map;
  }, [itineraryState.items, notesState.notes, remindersState.reminders, trip]);

  const countsByDate = useMemo(() => {
    /** @type {Record<string, { itinerary: number, notes: number, reminders: number }>} */
    const counts = {};
    for (const [k, v] of Object.entries(itemsByDate)) {
      counts[k] = {
        itinerary: v.itinerary?.length || 0,
        notes: v.notes?.length || 0,
        reminders: v.reminders?.length || 0,
      };
    }
    return counts;
  }, [itemsByDate]);

  const selectedBundle = selectedDateKey ? itemsByDate[selectedDateKey] : null;

  const goPrevMonth = () => {
    setMonthKey(dayjs(`${monthKey}-01`).subtract(1, "month").format("YYYY-MM"));
  };

  const goNextMonth = () => {
    setMonthKey(dayjs(`${monthKey}-01`).add(1, "month").format("YYYY-MM"));
  };

  const goToday = () => {
    setMonthKey(getTodayMonthKey());
    setSelectedDateKey(toDateKey(dayjs()));
  };

  const refreshAll = async () => {
    try {
      await Promise.all([
        itineraryState.reload({ limit: itineraryState.limit, offset: itineraryState.offset }),
        notesState.reload({ limit: notesState.limit, offset: notesState.offset }),
        remindersState.reload({ limit: remindersState.limit, offset: remindersState.offset }),
      ]);

      pushToast({ type: "success", title: "Refreshed", message: "Calendar data updated." });
    } catch (e) {
      pushToast({
        type: "error",
        title: "Refresh failed",
        message: e?.message || "Unable to refresh calendar data.",
        timeoutMs: 6000,
      });
    }
  };

  return (
    <div>
      <div
        className="tp-muted"
        style={{
          marginTop: 0,
          marginBottom: 12,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span>
          Visualize your trip by date. Status: <strong>{anyPending ? "pending" : "ready"}</strong>
          {anyError ? <span style={{ color: "#EF4444" }}> — {anyError.message}</span> : null}
        </span>

        <span
          className={[
            "tp-badge",
            itineraryState.usingMock || notesState.usingMock || remindersState.usingMock
              ? "tp-badge-info"
              : "tp-badge-success",
          ].join(" ")}
          title="Data source"
        >
          {itineraryState.usingMock || notesState.usingMock || remindersState.usingMock ? "mock" : "live"}
        </span>

        <button className="tp-btn" type="button" onClick={refreshAll}>
          Refresh
        </button>
      </div>

      <div className="tp-cal-layout" aria-label="Calendar layout">
        <div className="tp-cal-left">
          <div className="tp-cal-toolbar" role="toolbar" aria-label="Calendar controls">
            <div className="tp-cal-nav">
              <button className="tp-icon-btn" type="button" onClick={goPrevMonth} aria-label="Previous month" title="Previous month">
                <span aria-hidden="true">‹</span>
              </button>

              <div className="tp-cal-title" aria-live="polite">
                <strong>{monthInfo.label}</strong>
                <span className="tp-muted tp-cal-title-sub">({monthInfo.monthKey})</span>
              </div>

              <button className="tp-icon-btn" type="button" onClick={goNextMonth} aria-label="Next month" title="Next month">
                <span aria-hidden="true">›</span>
              </button>
            </div>

            <div className="tp-cal-actions">
              <button className="tp-btn tp-btn-primary" type="button" onClick={goToday} aria-label="Jump to today">
                Today
              </button>
            </div>
          </div>

          {anyPending && itineraryState.items.length === 0 && notesState.notes.length === 0 && remindersState.reminders.length === 0 ? (
            <div className="tp-muted">Loading calendar…</div>
          ) : null}

          <CalendarGrid
            monthKey={monthKey}
            selectedDateKey={selectedDateKey}
            countsByDate={countsByDate}
            onSelectDate={(key) => setSelectedDateKey(key)}
          />

          <div className="tp-muted" style={{ fontSize: 12, marginTop: 10 }}>
            Tip: badges show total items and dots show which categories exist for the day.
          </div>
        </div>

        <aside className="tp-cal-right" aria-label="Selected day details">
          <div className="tp-card">
            <div className="tp-card-header">
              <h2 style={{ margin: 0 }}>{selectedDateKey ? formatDateKeyHuman(selectedDateKey) : "Select a day"}</h2>
              {selectedDateKey ? (
                <span className="tp-badge tp-badge-info" title="Date key">
                  {selectedDateKey}
                </span>
              ) : null}
            </div>

            <div className="tp-card-body">
              {!selectedDateKey ? (
                <p className="tp-muted" style={{ marginTop: 0 }}>
                  Click a date to see itinerary items, notes, and reminders associated with that day.
                </p>
              ) : null}

              {selectedDateKey && (!selectedBundle || (!selectedBundle.itinerary.length && !selectedBundle.notes.length && !selectedBundle.reminders.length)) ? (
                <p className="tp-muted" style={{ marginTop: 0 }}>
                  No dated items for this day yet.
                </p>
              ) : null}

              {selectedDateKey && selectedBundle?.itinerary?.length ? (
                <section style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                    <h3 style={{ margin: 0, fontSize: 13 }}>Itinerary</h3>
                    <Link className="tp-btn tp-btn-ghost" to="../itinerary">
                      Open tab
                    </Link>
                  </div>
                  <ul style={{ margin: "8px 0 0 0", paddingLeft: 18 }}>
                    {selectedBundle.itinerary.map((it) => (
                      <li key={it.id} style={{ marginBottom: 8 }}>
                        <strong>{it.title}</strong>{" "}
                        <span className="tp-muted" style={{ fontSize: 12 }}>
                          {it.time || it.start_time ? `• ${it.time || dayjs(it.start_time).format("HH:mm")}` : ""}
                        </span>
                        <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <Link className="tp-btn" to="../itinerary">
                            View / Edit
                          </Link>
                          <button
                            className="tp-btn"
                            type="button"
                            style={{ borderColor: "rgba(239, 68, 68, 0.35)" }}
                            onClick={async () => {
                              const ok = window.confirm("Delete this itinerary item?");
                              if (!ok) return;
                              try {
                                const res = await itineraryState.deleteItem(it.id);
                                pushToast({
                                  type: "success",
                                  title: "Deleted",
                                  message: res?.mocked ? "Deleted locally (mock mode)." : "Itinerary item deleted.",
                                });
                              } catch (e) {
                                pushToast({
                                  type: "error",
                                  title: "Delete failed",
                                  message: e?.message || "Unable to delete itinerary item.",
                                  timeoutMs: 6000,
                                });
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {selectedDateKey && selectedBundle?.notes?.length ? (
                <section style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                    <h3 style={{ margin: 0, fontSize: 13 }}>Notes</h3>
                    <Link className="tp-btn tp-btn-ghost" to="../notes">
                      Open tab
                    </Link>
                  </div>
                  <ul style={{ margin: "8px 0 0 0", paddingLeft: 18 }}>
                    {selectedBundle.notes.map((n) => (
                      <li key={n.id} style={{ marginBottom: 8 }}>
                        <div style={{ whiteSpace: "pre-wrap" }}>{n.content}</div>
                        <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <Link className="tp-btn" to="../notes">
                            View / Edit
                          </Link>
                          <button
                            className="tp-btn"
                            type="button"
                            style={{ borderColor: "rgba(239, 68, 68, 0.35)" }}
                            onClick={async () => {
                              const ok = window.confirm("Delete this note?");
                              if (!ok) return;
                              try {
                                const res = await notesState.deleteNote(n.id);
                                pushToast({
                                  type: "success",
                                  title: "Deleted",
                                  message: res?.mocked ? "Deleted locally (mock mode)." : "Note deleted.",
                                });
                              } catch (e) {
                                pushToast({
                                  type: "error",
                                  title: "Delete failed",
                                  message: e?.message || "Unable to delete note.",
                                  timeoutMs: 6000,
                                });
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {selectedDateKey && selectedBundle?.reminders?.length ? (
                <section>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                    <h3 style={{ margin: 0, fontSize: 13 }}>Reminders</h3>
                    <Link className="tp-btn tp-btn-ghost" to="../reminders">
                      Open tab
                    </Link>
                  </div>
                  <ul style={{ margin: "8px 0 0 0", paddingLeft: 18 }}>
                    {selectedBundle.reminders.map((r) => (
                      <li key={r.id} style={{ marginBottom: 8 }}>
                        <div>
                          <strong>{r.content || r.message}</strong>{" "}
                          <span className="tp-muted" style={{ fontSize: 12 }}>
                            {r.remind_at ? `• ${dayjs(r.remind_at).format("HH:mm")}` : ""}
                          </span>
                        </div>
                        <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <Link className="tp-btn" to="../reminders">
                            View / Edit
                          </Link>
                          <button
                            className="tp-btn"
                            type="button"
                            style={{ borderColor: "rgba(239, 68, 68, 0.35)" }}
                            onClick={async () => {
                              const ok = window.confirm("Delete this reminder?");
                              if (!ok) return;
                              try {
                                const res = await remindersState.deleteReminder(r.id);
                                pushToast({
                                  type: "success",
                                  title: "Deleted",
                                  message: res?.mocked ? "Deleted locally (mock mode)." : "Reminder deleted.",
                                });
                              } catch (e) {
                                pushToast({
                                  type: "error",
                                  title: "Delete failed",
                                  message: e?.message || "Unable to delete reminder.",
                                  timeoutMs: 6000,
                                });
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <div className="tp-muted" style={{ fontSize: 12, marginTop: 14 }}>
                Note: items appear on the calendar only when they include a real date/time (or when your trip has a
                start date and itinerary uses day numbers).
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
