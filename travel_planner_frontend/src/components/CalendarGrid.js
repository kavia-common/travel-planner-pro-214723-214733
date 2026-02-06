import React, { useMemo } from "react";
import { getMonthGridCells } from "../utils/date";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * PUBLIC_INTERFACE
 * Lightweight month-grid calendar with per-day badges and selection.
 *
 * Props:
 * - monthKey: "YYYY-MM"
 * - selectedDateKey: "YYYY-MM-DD" | null
 * - countsByDate: Record<dateKey, { itinerary: number, notes: number, reminders: number }>
 * - onSelectDate: (dateKey: string) => void
 */
export function CalendarGrid({ monthKey, selectedDateKey, countsByDate, onSelectDate }) {
  const cells = useMemo(() => getMonthGridCells(monthKey), [monthKey]);

  return (
    <div className="tp-cal-grid" aria-label="Calendar month view">
      <div className="tp-cal-dow" role="row">
        {DOW.map((d) => (
          <div key={d} className="tp-cal-dow-cell" role="columnheader">
            {d}
          </div>
        ))}
      </div>

      <div className="tp-cal-cells" role="grid" aria-label={`Month ${monthKey}`}>
        {cells.map((c) => {
          const counts = countsByDate?.[c.dateKey] || { itinerary: 0, notes: 0, reminders: 0 };
          const total = (counts.itinerary || 0) + (counts.notes || 0) + (counts.reminders || 0);
          const isSelected = selectedDateKey === c.dateKey;

          const itineraryCount = counts.itinerary || 0;
          const notesCount = counts.notes || 0;
          const remindersCount = counts.reminders || 0;

          return (
            <button
              key={c.dateKey}
              type="button"
              className={[
                "tp-cal-cell",
                c.inMonth ? "is-in-month" : "is-out-month",
                c.isToday ? "is-today" : "",
                isSelected ? "is-selected" : "",
              ].join(" ")}
              onClick={() => onSelectDate?.(c.dateKey)}
              // Accessibility: make selection explicit for assistive tech.
              aria-selected={isSelected}
              aria-label={`Select ${c.dateKey}${total ? `, ${total} items` : ""}`}
            >
              <div className="tp-cal-cell-top">
                <span className="tp-cal-daynum" aria-hidden="true">
                  {Number(c.dateKey.slice(-2))}
                </span>

                {total > 0 ? (
                  <span className="tp-cal-total" aria-label={`${total} total items`} title={`${total} total items`}>
                    {total}
                  </span>
                ) : null}
              </div>

              <div className="tp-cal-badges" aria-label="Day item counts">
                {itineraryCount ? (
                  <span
                    className="tp-cal-pill tp-cal-pill-itinerary"
                    title={`${itineraryCount} itinerary item${itineraryCount === 1 ? "" : "s"}`}
                    aria-label={`${itineraryCount} itinerary item${itineraryCount === 1 ? "" : "s"}`}
                  >
                    Itin <span className="tp-cal-pill-count">{itineraryCount}</span>
                  </span>
                ) : null}

                {notesCount ? (
                  <span
                    className="tp-cal-pill tp-cal-pill-notes"
                    title={`${notesCount} note${notesCount === 1 ? "" : "s"}`}
                    aria-label={`${notesCount} note${notesCount === 1 ? "" : "s"}`}
                  >
                    Notes <span className="tp-cal-pill-count">{notesCount}</span>
                  </span>
                ) : null}

                {remindersCount ? (
                  <span
                    className="tp-cal-pill tp-cal-pill-reminders"
                    title={`${remindersCount} reminder${remindersCount === 1 ? "" : "s"}`}
                    aria-label={`${remindersCount} reminder${remindersCount === 1 ? "" : "s"}`}
                  >
                    Rem <span className="tp-cal-pill-count">{remindersCount}</span>
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
