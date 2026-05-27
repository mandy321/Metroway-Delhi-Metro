import React, { useEffect } from "react";
import Navbar from "./components/Navbar";
import SearchPanel from "./components/SearchPanel";
import MapView from "./components/MapView";
import RouteDetails from "./components/RouteDetails";
import { useMetroStore } from "./store/useMetroStore";

export default function App() {
  const {
    initializeInfrastructureStatus,
    triggerLiveMockUpdates,
    setOffline
  } = useMetroStore();

  // Initialize and listen for network changes + start live updates stream
  useEffect(() => {
    // 1. Load initial infrastructure status
    initializeInfrastructureStatus();

    // 2. Setup periodic mock updates representing active web scraping/push streams
    const mockUpdateInterval = setInterval(() => {
      triggerLiveMockUpdates();
    }, 8000); // update some station every 8 seconds

    // 3. Online/Offline status listeners
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(mockUpdateInterval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [initializeInfrastructureStatus, triggerLiveMockUpdates, setOffline]);

  return (
    <div className="relative min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Decorative premium radial gradients for background styling */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none z-0" />
      
      {/* Main Navigation */}
      <Navbar />

      {/* Main Workspace Layout */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 z-10">
        
        {/* Column 1: Journey Planner Inputs & History */}
        <div className="flex flex-col space-y-6 lg:w-96 shrink-0">
          <SearchPanel />
        </div>

        {/* Column 2: Interactive Leaflet Map & Smart Outputs */}
        <div className="flex-1 flex flex-col space-y-6">
          {/* Map View */}
          <div className="h-[400px] lg:h-[480px]">
            <MapView />
          </div>

          {/* Route details metrics, timeline & exit recommendations */}
          <RouteDetails />
        </div>

      </main>

      {/* Footer Info */}
      <footer className="text-center py-6 border-t border-white/5 text-[11px] text-slate-500 z-10 select-none">
        <p>© 2026 Metroway Delhi. High-Fidelity offline navigation mockup using OpenStreetMap & Leaflet.</p>
        <p className="mt-1 text-slate-600">Zero Premium Keys Required. Offline-First PWA Prototype.</p>
      </footer>
    </div>
  );
}
