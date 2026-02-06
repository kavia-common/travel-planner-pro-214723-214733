import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import { TripsList } from "./components/TripsList";
import { ToastProvider, useToasts } from "./components/ToastProvider";
import { DestinationSearchPage } from "./pages/DestinationSearchPage";
import { TripDetailLayout } from "./pages/TripDetailLayout";
import { TripsHomePage } from "./pages/TripsHomePage";
import { getApiBaseUrl, isBackendEnabled } from "./config/env";
import { useTrips } from "./hooks/useTrips";

function TopbarStatus() {
  const { pushToast } = useToasts();
  const backendEnabled = isBackendEnabled();
  const baseUrl = getApiBaseUrl();
  const location = useLocation();

  return (
    <>
      <h1>Travel Planner</h1>
      <span className="tp-muted" style={{ fontSize: 12 }}>
        {location.pathname}
      </span>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        <span className={["tp-badge", backendEnabled ? "tp-badge-success" : "tp-badge-info"].join(" ")}>
          {backendEnabled ? "Backend: ON" : "Backend: MOCK"}
        </span>
        <button
          className="tp-btn"
          onClick={() =>
            pushToast({
              type: "info",
              title: "API Base URL",
              message: baseUrl,
              timeoutMs: 5000,
            })
          }
        >
          API Info
        </button>
      </div>
    </>
  );
}

// PUBLIC_INTERFACE
function App() {
  /**
   * Main app entry component with layout + routes.
   */
  const tripsState = useTrips();

  return (
    <ToastProvider>
      <div className="tp-scanlines" />
      <div className="tp-app">
        <aside className="tp-sidebar">
          <div className="tp-brand" aria-label="App brand">
            <div className="tp-brand-badge" aria-hidden="true" />
            <div className="tp-brand-title">
              <strong>Travel Planner</strong>
              <span>Plan, jot, and remember</span>
            </div>
          </div>

          <TripsList
            trips={tripsState.trips}
            status={tripsState.status}
            error={tripsState.error}
            usingMock={tripsState.usingMock}
            onCreateTrip={tripsState.createTrip}
            onReload={tripsState.reload}
          />
        </aside>

        <main className="tp-main">
          <header className="tp-topbar">
            <TopbarStatus />
          </header>

          <section className="tp-content" aria-label="Main content">
            <Routes>
              <Route path="/" element={<Navigate to="/trips" replace />} />
              <Route
                path="/trips"
                element={
                  <TripsHomePage
                    trips={tripsState.trips}
                    status={tripsState.status}
                    error={tripsState.error}
                    usingMock={tripsState.usingMock}
                    onCreateTrip={tripsState.createTrip}
                  />
                }
              />
              <Route path="/destinations" element={<DestinationSearchPage />} />

              <Route path="/trips/:tripId" element={<Navigate to="itinerary" replace />} />
              <Route
                path="/trips/:tripId/*"
                element={
                  <TripDetailLayout
                    trips={tripsState.trips}
                    status={tripsState.status}
                    usingMock={tripsState.usingMock}
                    onUpdateTrip={tripsState.updateTrip}
                    onDeleteTrip={tripsState.deleteTrip}
                    onReload={tripsState.reload}
                  />
                }
              />

              <Route
                path="*"
                element={
                  <div className="tp-card">
                    <div className="tp-card-header">
                      <h2>Not Found</h2>
                    </div>
                    <div className="tp-card-body">
                      <p className="tp-muted">That page doesn’t exist yet.</p>
                    </div>
                  </div>
                }
              />
            </Routes>
          </section>
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;

