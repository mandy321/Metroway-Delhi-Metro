import React, { useState } from "react";
import { useMetroStore } from "../store/useMetroStore";
import { STATIONS, LINE_COLORS } from "../data/metroData";
import {
  Clock,
  Coins,
  GitCompare,
  Users,
  Smile,
  Shield,
  MapPin,
  DoorOpen,
  AlertTriangle,
  CheckCircle2,
  Accessibility,
  ArrowRight,
  TrendingDown,
  Info
} from "lucide-react";

export default function RouteDetails() {
  const { activeRoute, infrastructureStatus, accessibilityOnly } = useMetroStore();
  const [activeTab, setActiveTab] = useState("timeline"); // "timeline" | "exits" | "status"

  if (!activeRoute) {
    return (
      <div className="glass-panel flex-1 p-8 rounded-2xl flex flex-col items-center justify-center text-center border border-white/10 shadow-xl min-h-[300px]">
        <div className="bg-slate-900 p-4 rounded-full border border-white/5 mb-4 text-cyan-400 animate-pulse">
          <MapPin className="h-8 w-8" />
        </div>
        <h3 className="font-outfit font-bold text-lg text-slate-200">No Journey Selected</h3>
        <p className="text-sm text-slate-400 max-w-sm mt-1">
          Select origin and destination stations in the planner panel to compute the optimal route.
        </p>
      </div>
    );
  }

  const { metrics, path, edges, transfersList } = activeRoute;
  const destinationStation = path[path.length - 1];

  // Logic to recommend the best exit gate:
  // - If accessibilityOnly is on, prefer exits with "Elevator"
  // - If women's safety mode or general safety, prefer "Well-Lit" exits
  // - Return first matching exit, or gate 1 fallback
  const getRecommendedExit = () => {
    if (!destinationStation || !destinationStation.exits) return null;
    
    let candidates = destinationStation.exits;

    if (accessibilityOnly) {
      const accessible = candidates.filter(e => e.accessibility.includes("Elevator") || e.accessibility.includes("Wheelchair Ramp"));
      if (accessible.length > 0) candidates = accessible;
    }

    const wellLit = candidates.filter(e => e.lit === "Well-Lit");
    if (wellLit.length > 0) return wellLit[0];

    return candidates[0] || null;
  };

  const recommendedExit = getRecommendedExit();

  // Helper to color crowd badge
  const getCrowdColor = (val) => {
    if (val < 4) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (val < 7) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  // Helper to color safety badge
  const getSafetyColor = (val) => {
    if (val >= 8) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (val >= 6) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  // Check if any station in path has a broken elevator/escalator
  const getPathStatusAlerts = () => {
    const alerts = [];
    path.forEach(station => {
      const infra = infrastructureStatus[station.id];
      if (infra) {
        if (infra.escalator === "Under Maintenance") {
          alerts.push({ stationName: station.name, type: "Escalator", status: "Maintenance" });
        }
        if (infra.elevator === "Under Maintenance") {
          alerts.push({ stationName: station.name, type: "Elevator", status: "Maintenance" });
        }
      }
    });
    return alerts;
  };

  const pathAlerts = getPathStatusAlerts();

  return (
    <div className="glass-panel flex-1 p-5 rounded-2xl flex flex-col space-y-5 border border-white/10 shadow-xl overflow-hidden">
      
      {/* Route Overview Metrics Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {/* Metric: Time */}
        <div className="bg-slate-900/50 border border-white/5 p-3 rounded-xl flex flex-col justify-center text-center">
          <Clock className="h-4 w-4 mx-auto mb-1 text-cyan-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</span>
          <span className="text-base font-outfit font-extrabold text-white mt-0.5">{metrics.time}m</span>
        </div>

        {/* Metric: Transfers */}
        <div className="bg-slate-900/50 border border-white/5 p-3 rounded-xl flex flex-col justify-center text-center">
          <GitCompare className="h-4 w-4 mx-auto mb-1 text-purple-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transfers</span>
          <span className="text-base font-outfit font-extrabold text-white mt-0.5">{metrics.transfers}</span>
        </div>

        {/* Metric: Fare */}
        <div className="bg-slate-900/50 border border-white/5 p-3 rounded-xl flex flex-col justify-center text-center">
          <Coins className="h-4 w-4 mx-auto mb-1 text-[#FFC72C]" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fare</span>
          <span className="text-base font-outfit font-extrabold text-white mt-0.5">₹{metrics.fare}</span>
        </div>

        {/* Metric: Crowd */}
        <div className={`border p-3 rounded-xl flex flex-col justify-center text-center ${getCrowdColor(metrics.crowd)}`}>
          <Users className="h-4 w-4 mx-auto mb-1" />
          <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Crowd</span>
          <span className="text-base font-outfit font-extrabold mt-0.5">{metrics.crowd}/10</span>
        </div>

        {/* Metric: Comfort */}
        <div className="bg-slate-900/50 border border-white/5 p-3 rounded-xl flex flex-col justify-center text-center">
          <Smile className="h-4 w-4 mx-auto mb-1 text-emerald-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comfort</span>
          <span className="text-base font-outfit font-extrabold text-white mt-0.5">{metrics.comfort}/10</span>
        </div>

        {/* Metric: Safety */}
        <div className={`border p-3 rounded-xl flex flex-col justify-center text-center ${getSafetyColor(metrics.safety)}`}>
          <Shield className="h-4 w-4 mx-auto mb-1" />
          <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Safety</span>
          <span className="text-base font-outfit font-extrabold mt-0.5">{metrics.safety}/10</span>
        </div>
      </div>

      {/* Tabs Toggles */}
      <div className="flex border-b border-white/5 pb-2 space-x-4">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-all ${
            activeTab === "timeline" ? "text-cyan-400 border-cyan-400" : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Route Steps
        </button>
        <button
          onClick={() => setActiveTab("exits")}
          className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-all ${
            activeTab === "exits" ? "text-cyan-400 border-cyan-400" : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Exit Recommender
        </button>
        <button
          onClick={() => setActiveTab("status")}
          className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-all ${
            activeTab === "status" ? "text-cyan-400 border-cyan-400" : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Infrastructure Alerts {pathAlerts.length > 0 && (
            <span className="ml-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] px-1.5 py-0.2 rounded-full font-extrabold">
              {pathAlerts.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto max-h-[350px]">
        {activeTab === "timeline" && (
          <div className="relative pl-5 border-l border-slate-700/80 space-y-5 py-2">
            {path.map((station, idx) => {
              const isStart = idx === 0;
              const isEnd = idx === path.length - 1;
              const nextEdge = edges[idx];
              const prevEdge = edges[idx - 1];
              
              // Find if this station has active alerts
              const hasAlert = infrastructureStatus[station.id]?.escalator === "Under Maintenance" || 
                                infrastructureStatus[station.id]?.elevator === "Under Maintenance";

              return (
                <div key={station.id} className="relative group">
                  {/* Timeline bullet dot */}
                  <span
                    className={`absolute -left-[27px] top-[5px] w-[14px] h-[14px] rounded-full border-3 border-slate-950 transition-all ${
                      isStart 
                        ? "bg-cyan-400 shadow-glow-cyan" 
                        : isEnd 
                        ? "bg-rose-500 shadow-glow-red" 
                        : "bg-slate-400"
                    }`}
                  />

                  {/* Step Contents */}
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-outfit text-sm font-bold text-slate-100">{station.name}</span>
                      
                      {/* Alert Tag on Station */}
                      {hasAlert && (
                        <span className="flex items-center space-x-0.5 text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          <span>Outage</span>
                        </span>
                      )}
                    </div>

                    {/* Show station lines */}
                    <div className="flex space-x-1">
                      {station.lines.map(l => (
                        <span
                          key={l}
                          className="text-[8px] font-bold px-1 rounded-sm border"
                          style={{
                            borderColor: `${LINE_COLORS[l]}25`,
                            color: LINE_COLORS[l],
                            backgroundColor: `${LINE_COLORS[l]}10`
                          }}
                        >
                          {l} Line
                        </span>
                      ))}
                    </div>

                    {/* Edge Connection Details */}
                    {nextEdge && !isEnd && (
                      <div className="mt-2 pl-4 py-2 border-l-2 border-dashed border-slate-800 text-[11px] text-slate-400 flex flex-col space-y-1 bg-slate-900/10 rounded-r-lg">
                        <div className="flex items-center space-x-1 text-slate-300">
                          <ArrowRight className="h-3 w-3 text-cyan-400" />
                          <span>Ride <span className="font-bold text-white">{nextEdge.line} Line</span> to next station</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span>Duration: <strong>{nextEdge.baseTime} mins</strong></span>
                          <span>Crowd: <strong className={getCrowdColor(nextEdge.crowdFactor).split(" ")[0]}>{nextEdge.crowdFactor}/10</strong></span>
                        </div>
                        
                        {/* Highlight Transfer next */}
                        {nextEdge.isTransfer && (
                          <div className="mt-1 p-2 rounded bg-purple-950/20 border border-purple-500/20 text-purple-300 flex items-center space-x-1.5 font-semibold text-[10px]">
                            <GitCompare className="h-3 w-3" />
                            <span>Transfer at {station.name} to {nextEdge.line} Line (+5 mins transfer walk)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "exits" && (
          <div className="space-y-4">
            {/* Recommended Gate Card */}
            {recommendedExit ? (
              <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/25 p-4 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-cyan-300">
                  <DoorOpen className="h-4.5 w-4.5" />
                  <h4 className="font-outfit font-bold text-sm">Recommended Exit</h4>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="bg-cyan-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded shadow">
                    GATE {recommendedExit.gate}
                  </span>
                  <span className="text-sm font-bold text-slate-200">{recommendedExit.name}</span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    recommendedExit.lit === "Well-Lit" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                  }`}>
                    {recommendedExit.lit}
                  </span>
                  {recommendedExit.accessibility.map(acc => (
                    <span key={acc} className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-300 border-indigo-500/20 flex items-center gap-0.5">
                      <Accessibility className="h-2.5 w-2.5" /> {acc}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  * Recommended based on lighting security checks and your {accessibilityOnly ? "accessibility needs" : "route parameters"}.
                </p>
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic">No exit data available for destination.</p>
            )}

            {/* List of All Exits */}
            <div className="space-y-2">
              <h4 className="font-outfit font-bold text-xs text-slate-300 uppercase tracking-wider">All Available Exits at Destination</h4>
              <div className="space-y-2">
                {destinationStation.exits.map(exit => (
                  <div key={exit.gate} className="p-3 rounded-lg bg-slate-900/50 border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-slate-800 text-slate-300 font-bold px-1.5 py-0.2 rounded border border-white/10">Gate {exit.gate}</span>
                        <span className="font-semibold text-slate-200">{exit.name}</span>
                      </div>
                      <div className="flex space-x-1.5 mt-1 text-[9px] text-slate-400">
                        <span>Lighting: <strong className="text-slate-300">{exit.lit}</strong></span>
                        <span>•</span>
                        <span>Access: <strong className="text-slate-300">{exit.accessibility.join(", ") || "None"}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "status" && (
          <div className="space-y-3">
            <div className="flex items-center space-x-1 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <Info className="h-3.5 w-3.5" />
              <span>Real-Time Facility Stream</span>
            </div>

            {/* Alerts summary */}
            {pathAlerts.length > 0 ? (
              <div className="space-y-2.5">
                {pathAlerts.map((alert, idx) => (
                  <div key={idx} className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start space-x-2.5 text-xs text-rose-300">
                    <AlertTriangle className="h-4.5 w-4.5 mt-0.5 text-rose-400" />
                    <div>
                      <h5 className="font-bold text-slate-200">{alert.stationName} Outage</h5>
                      <p className="text-[10px] text-rose-300/80 mt-0.5">
                        The station's <strong>{alert.type}</strong> is currently down for maintenance. Use elevator/stairs if needed.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center space-x-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <h5 className="font-bold text-slate-200">All Infrastructure Clear</h5>
                  <p className="text-[10px] text-emerald-300/80 mt-0.5">
                    All escalators and elevators on your selected path are reported fully operational.
                  </p>
                </div>
              </div>
            )}

            {/* All stations in path facility table */}
            <div className="border border-white/5 rounded-xl overflow-hidden mt-3 text-xs bg-slate-900/20">
              <div className="grid grid-cols-3 bg-slate-900/60 p-2 font-bold text-slate-300 text-[10px] uppercase border-b border-white/5">
                <span>Station</span>
                <span>Escalator</span>
                <span>Elevator</span>
              </div>
              <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                {path.map(station => {
                  const stat = infrastructureStatus[station.id] || { escalator: "Operational", elevator: "Operational" };
                  return (
                    <div key={station.id} className="grid grid-cols-3 p-2 text-slate-300 items-center">
                      <span className="font-semibold text-slate-200">{station.name}</span>
                      <span className={`font-bold ${stat.escalator === 'Operational' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stat.escalator}
                      </span>
                      <span className={`font-bold ${stat.elevator === 'Operational' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stat.elevator}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
