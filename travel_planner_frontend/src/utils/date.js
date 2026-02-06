import dayjs from "dayjs";

/**
 * NOTE: We use dayjs for small/fast date utilities (keeps bundle light).
 */

/**
 * PUBLIC_INTERFACE
 * Build a stable YYYY-MM-DD key from a Date/dayjs/string input.
 * Returns null if the input cannot be parsed.
 *
 * @param {Date|string|number|import("dayjs").Dayjs|null|undefined} value
 * @returns {string|null}
 */
export function toDateKey(value) {
  if (value === null || value === undefined || value === "") return null;
  const d = dayjs(value);
  if (!d.isValid()) return null;
  return d.format("YYYY-MM-DD");
}

/**
 * PUBLIC_INTERFACE
 * Format a YYYY-MM-DD date key into a human-friendly label.
 *
 * @param {string} dateKey
 * @returns {string}
 */
export function formatDateKeyHuman(dateKey) {
  const d = dayjs(dateKey, "YYYY-MM-DD", true);
  if (!d.isValid()) return dateKey;
  return d.format("ddd, MMM D, YYYY");
}

/**
 * PUBLIC_INTERFACE
 * Create a month descriptor from a YYYY-MM string or Date/dayjs.
 *
 * @param {string|Date|number|import("dayjs").Dayjs} value
 * @returns {{ year: number, monthIndex: number, monthKey: string, label: string }}
 */
export function getMonthInfo(value) {
  const d = dayjs(value);
  const start = d.startOf("month");
  return {
    year: start.year(),
    monthIndex: start.month(), // 0-11
    monthKey: start.format("YYYY-MM"),
    label: start.format("MMMM YYYY"),
  };
}

/**
 * PUBLIC_INTERFACE
 * Get all visible cells for a month grid (6 rows x 7 cols), Monday-first.
 *
 * @param {string} monthKey YYYY-MM
 * @returns {Array<{ dateKey: string, inMonth: boolean, isToday: boolean }>}
 */
export function getMonthGridCells(monthKey) {
  const monthStart = dayjs(`${monthKey}-01`, "YYYY-MM-DD", true).startOf("month");
  // dayjs day(): 0=Sunday...6=Saturday. Convert to Monday-first index.
  const mondayIndex = (monthStart.day() + 6) % 7;
  const gridStart = monthStart.subtract(mondayIndex, "day");

  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const d = gridStart.add(i, "day");
    cells.push({
      dateKey: d.format("YYYY-MM-DD"),
      inMonth: d.month() === monthStart.month(),
      isToday: d.isSame(dayjs(), "day"),
    });
  }
  return cells;
}

/**
 * PUBLIC_INTERFACE
 * Parse a YYYY-MM query param (month key). Returns null if invalid.
 *
 * @param {string|null} raw
 * @returns {string|null}
 */
export function parseMonthKey(raw) {
  if (!raw) return null;
  const d = dayjs(`${raw}-01`, "YYYY-MM-DD", true);
  if (!d.isValid()) return null;
  return d.format("YYYY-MM");
}

/**
 * PUBLIC_INTERFACE
 * Get current month key in YYYY-MM.
 *
 * @returns {string}
 */
export function getTodayMonthKey() {
  return dayjs().format("YYYY-MM");
}
