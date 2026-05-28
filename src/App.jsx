import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import SearchPanel from "./components/SearchPanel";
import MapView from "./components/MapView";
import RouteDetails from "./components/RouteDetails";
import StationExplorer from "./components/StationExplorer";
import { useMetroStore } from "./store/useMetroStore";
import { Navigation, Map, Info, AlertTriangle } from "lucide-react";
import { triggerHaptic } from "./utils/device";

export default function App() {
  const {
    initializeInfrastructureStatus,
    loadDynamicData,
    triggerLiveMockUpdates,
    setOffline,
    activeRoute,
    stations,
    startStationId,
    endStationId
  } = useMetroStore();

  const [activeTab, setActiveTab] = useState("planner");
  const [isEditingRoute, setIsEditingRoute] = useState(false);
  const [hadRoute, setHadRoute] = useState(false);

  // Auto collapse inputs only when active route is first calculated
  useEffect(() => {
    if (activeRoute && !hadRoute) {
      setIsEditingRoute(false);
      setHadRoute(true);
    } else if (!activeRoute && hadRoute) {
      setHadRoute(false);
    }
  }, [activeRoute, hadRoute]);

  const startStationName = stations.find(s => s.id === startStationId)?.name || "";
  const endStationName = stations.find(s => s.id === endStationId)?.name || "";

  // Initialize and listen for network changes + start live updates stream
  useEffect(() => {
    // 1. Load initial infrastructure status
    initializeInfrastructureStatus();

    // 2. Load dynamic metro data from Cloudflare Worker proxy
    loadDynamicData();

    // 3. Setup periodic mock updates representing active web scraping/push streams
    const mockUpdateInterval = setInterval(() => {
      triggerLiveMockUpdates();
    }, 8000); // update some station every 8 seconds

    // 4. Online/Offline status listeners
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(mockUpdateInterval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [initializeInfrastructureStatus, loadDynamicData, triggerLiveMockUpdates, setOffline]);

  return (
    <div className="relative min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Decorative premium radial gradients for background styling */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none z-0" />
      
      {/* Main Navigation */}
      <Navbar />

      {/* Desktop Dashboard Layout (hidden on mobile, lg:flex) */}
      <main className="hidden lg:flex flex-1 w-full max-w-[1400px] mx-auto p-6 gap-6 z-10">
        
        {/* Column 1: Journey Planner Inputs & Station directory search */}
        <div className="flex flex-col space-y-6 w-96 shrink-0">
          <SearchPanel />
          <StationExplorer />
        </div>

        {/* Column 2: Interactive Leaflet Map & Smart Outputs */}
        <div className="flex-1 flex flex-col space-y-6">
          {/* Map View */}
          <div className="h-[450px]">
            <MapView />
          </div>

          {/* Route details metrics, timeline & exit recommendations */}
          <RouteDetails />
        </div>
      </main>

      {/* Mobile/Tablet Screen Views (lg:hidden) */}
      <main className="lg:hidden flex-1 w-full p-4 pb-28 z-10 flex flex-col space-y-4">
        {activeTab === "planner" && (
          <div className="flex flex-col space-y-4">
            {activeRoute && !isEditingRoute ? (
              <div className="flex flex-col space-y-4">
                {/* Premium Native Header Summary */}
                <div className="glass-panel p-4 rounded-2xl border border-white/10 shadow-xl flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Active Journey</span>
                    <h3 className="font-outfit font-bold text-sm text-slate-100 truncate flex items-center gap-1.5 mt-0.5">
                      <span className="text-cyan-400">{startStationName}</span>
                      <span className="text-slate-500">➔</span>
                      <span className="text-rose-400">{endStationName}</span>
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsEditingRoute(true)}
                    className="ml-3 px-3.5 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-cyan-400 active:scale-95 transition-all duration-150 shadow-md"
                  >
                    Edit
                  </button>
                </div>
                
                {/* Visual preview map on mobile */}
                <div className="h-44 w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                  <MapView />
                </div>
                
                <RouteDetails />
              </div>
            ) : (
              <SearchPanel onSelectEnd={() => setIsEditingRoute(false)} />
            )}
          </div>
        )}

        {activeTab === "map" && (
          <div className="h-[calc(100dvh-150px)] min-h-[400px] w-full">
            <MapView />
          </div>
        )}

        {activeTab === "stations" && (
          <StationExplorer />
        )}

        {activeTab === "status" && (
          <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col space-y-1">
              <h3 className="font-outfit font-bold text-base text-slate-100 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-400 animate-pulse" />
                Network System Alerts
              </h3>
              <p className="text-[11px] text-slate-400">
                Real-time active tracking of escalators, elevators, and connection services.
              </p>
            </div>
            
            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl space-y-2">
              <h4 className="font-outfit font-bold text-xs text-slate-300 uppercase tracking-wider">Live System Sync</h4>
              <div className="flex items-center space-x-2 text-xs text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold">DMRC Live Scraper: Active</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Automatic status pings verify equipment operations at all stations. Go to the <strong>Stations Directory</strong> tab to view a specific station's elevators/escalators and exits.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Bar for Mobile/Tablet Devices (lg:hidden) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[2000] bg-slate-950/80 backdrop-blur-lg border-t border-white/10 px-4 py-2 bottom-nav-safe">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button
            onClick={() => {
              setActiveTab("planner");
              triggerHaptic(10);
            }}
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all duration-200 ${
              activeTab === "planner" ? "text-cyan-400 scale-105" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Navigation className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Planner</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("map");
              triggerHaptic(10);
            }}
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all duration-200 ${
              activeTab === "map" ? "text-cyan-400 scale-105" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Map className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Map</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("stations");
              triggerHaptic(10);
            }}
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all duration-200 ${
              activeTab === "stations" ? "text-cyan-400 scale-105" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Info className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Stations</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("status");
              triggerHaptic(10);
            }}
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all duration-200 ${
              activeTab === "status" ? "text-cyan-400 scale-105" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Alerts</span>
          </button>
        </div>
      </div>

      {/* Footer Info (Desktop only) */}
      <footer className="hidden lg:block text-center py-6 border-t border-white/5 text-[11px] text-slate-500 z-10 select-none">
        <p>© 2026 Metroway Delhi Metro. High-Fidelity offline navigation mockup using OpenStreetMap & Leaflet.</p>
        <p className="mt-1 text-slate-600">Zero Premium Keys Required. Offline-First PWA Prototype.</p>
      </footer>
    </div>
  );
}
