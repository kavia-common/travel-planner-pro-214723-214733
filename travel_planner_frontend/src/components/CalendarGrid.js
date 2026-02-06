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
              aria-label={`Select ${c.dateKey}${total ? `, ${total} items` : ""}`}
              aria-pressed={isSelected}
            >
              <div className="tp-cal-cell-top">
                <span className="tp-cal-daynum" aria-hidden="true">
                  {Number(c.dateKey.slice(-2))}
                </span>

                {total > 0 ? (
                  <span className="tp-cal-total" aria-label={`${total} total items`}>
                    {total}
                  </span>
                ) : null}
              </div>

              {total > 0 ? (
                <div className="tp-cal-badges" aria-hidden="true">
                  {counts.itinerary ? (
                    <span className="tp-cal-dot tp-cal-dot-itinerary" title="Itinerary" />
                  ) : null}
                  {counts.notes ? <span className="tp-cal-dot tp-cal-dot-notes" title="Notes" /> : null}
                  {counts.reminders ? (
                    <span className="tp-cal-dot tp-cal-dot-reminders" title="Reminders" />
                  ) : null}
                </div>
              ) : (
                <div className="tp-cal-badges" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
