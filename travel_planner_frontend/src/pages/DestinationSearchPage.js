import React, { useMemo, useState } from "react";
import { apiClient } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { mockDestinationResults } from "../mocks/data";
import { useToasts } from "../components/ToastProvider";

/**
 * PUBLIC_INTERFACE
 * Destination search page shell.
 */
export function DestinationSearchPage() {
  /** Allows user to search destinations (mocked / gated for now). */
  const { pushToast } = useToasts();
  const [query, setQuery] = useState("");

  const search = useAsync(
    async () => {
      // Backend OpenAPI currently only has health check; keep endpoint placeholders gated.
      // When backend is implemented, replace with the real path (e.g., /destinations/search?q=...).
      const res = await apiClient.get(`/destinations/search?q=${encodeURIComponent(query.trim())}`);
      return res;
    },
    [query]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mockDestinationResults;
    return mockDestinationResults.filter(
      (r) => r.name.toLowerCase().includes(q) || r.country.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="tp-card">
      <div className="tp-card-header">
        <h2>Destination Search</h2>
        <button
          className="tp-btn"
          onClick={async () => {
            try {
              const res = await search.run();
              if (res?.mocked) {
                pushToast({
                  type: "info",
                  title: "Mock mode",
                  message: "Backend calls are disabled; showing local sample results.",
                });
              } else {
                pushToast({ type: "success", title: "Searched", message: "Loaded results from backend." });
              }
            } catch (e) {
              pushToast({
                type: "error",
                title: "Search failed",
                message: e?.message || "Unable to search destinations.",
                timeoutMs: 6000,
              });
            }
          }}
        >
          Run API Search
        </button>
      </div>

      <div className="tp-card-body">
        <p className="tp-muted" style={{ marginTop: 0 }}>
          Type to filter sample results. “Run API Search” is wired to the API client but gated by
          feature flags until backend endpoints exist.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 12 }}>
          <input
            className="tp-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a city, park, or region…"
            aria-label="Destination search query"
          />
          <button
            className="tp-btn tp-btn-primary"
            type="button"
            onClick={() =>
              pushToast({
                type: "info",
                title: "Tip",
                message: "Backend search will replace this mock filter when endpoints are ready.",
              })
            }
          >
            Tip
          </button>
        </div>

        <div className="tp-muted" style={{ fontSize: 12, marginBottom: 10 }}>
          API call status: <strong>{search.status}</strong>
          {search.error ? <span style={{ color: "#EF4444" }}> — {search.error.message}</span> : null}
        </div>

        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {results.map((r) => (
            <li key={r.id} style={{ marginBottom: 10 }}>
              <strong>{r.name}</strong> — <span className="tp-muted">{r.country}</span>
              <div className="tp-muted" style={{ fontSize: 13, marginTop: 2 }}>
                {r.summary}
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
                <button className="tp-btn" type="button" disabled>
                  Add to trip (coming soon)
                </button>
                <button
                  className="tp-btn"
                  type="button"
                  onClick={() => pushToast({ type: "success", title: "Saved", message: "Pinned locally (placeholder)." })}
                >
                  Pin
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
