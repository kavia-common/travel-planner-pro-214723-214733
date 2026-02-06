/**
 * Central environment access for the app.
 * CRA exposes env vars prefixed with REACT_APP_.
 */

/**
 * PUBLIC_INTERFACE
 * Get a string environment variable with fallback.
 */
export function getEnvString(key, fallback) {
  /** Returns the env var value if set and non-empty; otherwise fallback. */
  const value = process.env[key];
  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }
  return String(value);
}

/**
 * PUBLIC_INTERFACE
 * Get API base URL from env, with a local default.
 */
export function getApiBaseUrl() {
  /** Defaults to local backend port per work item (3001). */
  return getEnvString("REACT_APP_API_BASE", "http://localhost:3001");
}

/**
 * PUBLIC_INTERFACE
 * Parse feature flags JSON from REACT_APP_FEATURE_FLAGS.
 */
export function getFeatureFlags() {
  /** Supports REACT_APP_FEATURE_FLAGS="{}" style JSON. */
  const raw = getEnvString("REACT_APP_FEATURE_FLAGS", "{}");
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * PUBLIC_INTERFACE
 * Determine if real backend calls are enabled.
 * Default: false (safe mode) unless explicitly enabled.
 */
export function isBackendEnabled() {
  /** Use REACT_APP_ENABLE_BACKEND_CALLS=true to enable. */
  const raw = getEnvString("REACT_APP_ENABLE_BACKEND_CALLS", "false").toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}
