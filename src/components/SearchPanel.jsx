import React, { useState, useEffect, useRef } from "react";
import { useMetroStore } from "../store/useMetroStore";
import { STATIONS } from "../data/metroData";
import { 
  MapPin, 
  ArrowUpDown, 
  Search, 
  Zap, 
  Users, 
  ShieldCheck, 
  Scale, 
  History, 
  Accessibility, 
  X,
  Sparkles,
  Clock,
  CreditCard
} from "lucide-react";

export default function SearchPanel() {
  const {
    startStationId,
    endStationId,
    mode,
    timeOfDay,
    useSmartCard,
    searchHistory,
    accessibilityOnly,
    setStartStationId,
    setEndStationId,
    setMode,
    setTimeOfDay,
    setUseSmartCard,
    swapStations,
    calculateActiveRoute,
    toggleAccessibilityOnly,
    clearHistory
  } = useMetroStore();

  const [startQuery, setStartQuery] = useState("");
  const [endQuery, setEndQuery] = useState("");
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const startRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    const startStation = STATIONS.find(s => s.id === startStationId);
    setStartQuery(startStation ? startStation.name : "");
  }, [startStationId]);

  useEffect(() => {
    const endStation = STATIONS.find(s => s.id === endStationId);
    setEndQuery(endStation ? endStation.name : "");
  }, [endStationId]);

  // Click outside listener to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (startRef.current && !startRef.current.contains(event.target)) {
        setStartOpen(false);
        const station = STATIONS.find(s => s.id === startStationId);
        setStartQuery(station ? station.name : "");
      }
      if (endRef.current && !endRef.current.contains(event.target)) {
        setEndOpen(false);
        const station = STATIONS.find(s => s.id === endStationId);
        setEndQuery(station ? station.name : "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [startStationId, endStationId]);

  // Recalculate route when inputs, modes, times, or settings update
  useEffect(() => {
    if (startStationId && endStationId) {
      calculateActiveRoute();
    }
  }, [startStationId, endStationId, mode, timeOfDay, useSmartCard, calculateActiveRoute]);

  const filterStations = (query) => {
    if (!query) return STATIONS;
    return STATIONS.filter((station) =>
      station.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  const startFiltered = filterStations(startQuery);
  const endFiltered = filterStations(endQuery);

  const handleSelectStart = (station) => {
    setStartStationId(station.id);
    setStartQuery(station.name);
    setStartOpen(false);
  };

  const handleSelectEnd = (station) => {
    setEndStationId(station.id);
    setEndQuery(station.name);
    setEndOpen(false);
  };

  const selectHistoryItem = (item) => {
    setStartStationId(item.startStationId);
    setEndStationId(item.endStationId);
    setMode(item.mode);
    if (item.timeOfDay) setTimeOfDay(item.timeOfDay);
  };

  const getLineBadgeClass = (lineName) => {
    switch (lineName) {
      case "Yellow": return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "Blue": return "bg-blue-600/20 text-blue-300 border-blue-600/30";
      case "Violet": return "bg-purple-600/20 text-purple-300 border-purple-600/30";
      case "Red": return "bg-red-600/20 text-red-300 border-red-600/30";
      case "Pink": return "bg-pink-500/20 text-pink-300 border-pink-500/30";
      case "Magenta": return "bg-fuchsia-600/20 text-fuchsia-300 border-fuchsia-600/30";
      default: return "bg-slate-700/20 text-slate-300 border-slate-600/30";
    }
  };

  const modesConfig = [
    { name: "Balanced", icon: Scale },
    { name: "Fastest", icon: Zap },
    { name: "Least Crowd", icon: Users },
    { name: "Women's Safety", icon: ShieldCheck }
  ];

  return (
    <div className="glass-panel w-full lg:w-96 p-5 rounded-2xl flex flex-col space-y-5 border border-white/10 shadow-xl overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center space-x-2 text-cyan-400">
        <Sparkles className="h-4 w-4" />
        <h2 className="font-outfit font-semibold text-sm tracking-wide uppercase">Journey Planner</h2>
      </div>

      {/* From / To Stations */}
      <div className="relative flex flex-col space-y-3">
        {/* From Station */}
        <div ref={startRef} className="relative">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">From Station</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-cyan-400" />
            <input
              type="text"
              placeholder="Search origin..."
              value={startQuery}
              onChange={(e) => {
                setStartQuery(e.target.value);
                setStartOpen(true);
              }}
              onFocus={() => setStartOpen(true)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl text-sm font-medium glass-input"
            />
            {startQuery && (
              <button 
                onClick={() => { setStartQuery(""); setStartStationId(""); }} 
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white text-slate-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          
          {startOpen && startFiltered.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl glass-panel border border-white/10 z-[1100] shadow-2xl">
              {startFiltered.map((station) => (
                <div
                  key={station.id}
                  onClick={() => handleSelectStart(station)}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-white/5 cursor-pointer border-b border-white/5 transition duration-150"
                >
                  <span className="text-sm font-semibold text-slate-200">{station.name}</span>
                  <div className="flex space-x-1">
                    {station.lines.map(line => (
                      <span key={line} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getLineBadgeClass(line)}`}>
                        {line[0]}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Swap Button */}
        <div className="absolute right-6 top-[54px] z-10">
          <button
            onClick={swapStations}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-900/90 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50 hover:shadow-glow-cyan/20 transition-all duration-200 active:scale-95"
            title="Swap Stations"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>

        {/* To Station */}
        <div ref={endRef} className="relative">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">To Station</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-rose-400" />
            <input
              type="text"
              placeholder="Search destination..."
              value={endQuery}
              onChange={(e) => {
                setEndQuery(e.target.value);
                setEndOpen(true);
              }}
              onFocus={() => setEndOpen(true)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl text-sm font-medium glass-input"
            />
            {endQuery && (
              <button 
                onClick={() => { setEndQuery(""); setEndEndStationId(""); }} 
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white text-slate-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {endOpen && endFiltered.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl glass-panel border border-white/10 z-[1100] shadow-2xl">
              {endFiltered.map((station) => (
                <div
                  key={station.id}
                  onClick={() => handleSelectEnd(station)}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-white/5 cursor-pointer border-b border-white/5 transition duration-150"
                >
                  <span className="text-sm font-semibold text-slate-200">{station.name}</span>
                  <div className="flex space-x-1">
                    {station.lines.map(line => (
                      <span key={line} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getLineBadgeClass(line)}`}>
                        {line[0]}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Time of Day Modifier (Peak vs. Off-Peak) */}
      <div className="flex flex-col space-y-2">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Time of Day (Traffic)</label>
        <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setTimeOfDay("Off-Peak")}
            className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              timeOfDay === "Off-Peak" 
                ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-300" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Off-Peak</span>
          </button>
          <button
            onClick={() => setTimeOfDay("Peak")}
            className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              timeOfDay === "Peak" 
                ? "bg-rose-500/10 border border-rose-500/30 text-rose-300" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="h-3.5 w-3.5 animate-pulse text-rose-400" />
            <span>Peak Hours</span>
          </button>
        </div>
      </div>

      {/* Routing Modes Grid */}
      <div className="flex flex-col space-y-2">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Routing Algorithm Mode</label>
        <div className="grid grid-cols-2 gap-2">
          {modesConfig.map((item) => {
            const Icon = item.icon;
            const isSelected = mode === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setMode(item.name)}
                className={`p-2.5 rounded-xl flex flex-col items-center justify-center border text-center transition-all duration-200 ${
                  isSelected 
                    ? "bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-glow-cyan/10" 
                    : "bg-slate-900/30 border-white/5 text-slate-400 hover:bg-slate-800/40 hover:text-slate-300"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 mb-1 ${isSelected ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
                <span className="text-[11px] font-bold tracking-tight">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment and Accessibility Option Switches */}
      <div className="space-y-2.5">
        {/* Toggle: Use Smart Card */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-200">Metro Smart Card</h3>
              <p className="text-[9px] text-slate-400">Apply 10%–20% discount</p>
            </div>
          </div>
          <button
            onClick={() => setUseSmartCard(!useSmartCard)}
            className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
              useSmartCard ? "bg-amber-500" : "bg-slate-700"
            }`}
          >
            <div
              className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 ease-in-out transform ${
                useSmartCard ? "translate-x-4.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Toggle: Accessibility Access */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Accessibility className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-200">Accessibility Access</h3>
              <p className="text-[9px] text-slate-400">Require elevator/escalator gates</p>
            </div>
          </div>
          <button
            onClick={toggleAccessibilityOnly}
            className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
              accessibilityOnly ? "bg-cyan-500" : "bg-slate-700"
            }`}
          >
            <div
              className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 ease-in-out transform ${
                accessibilityOnly ? "translate-x-4.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="flex flex-col space-y-2 border-t border-white/5 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <History className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Recent Searches</span>
            </div>
            <button 
              onClick={clearHistory}
              className="text-[9px] text-rose-400/80 hover:text-rose-400 font-bold uppercase tracking-wider transition"
            >
              Clear
            </button>
          </div>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {searchHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => selectHistoryItem(item)}
                className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 cursor-pointer text-[11px] transition"
              >
                <div className="truncate max-w-[180px] text-slate-300 font-medium">
                  {item.startName} → {item.endName}
                </div>
                <div className="flex items-center space-x-1 text-slate-500">
                  {item.timeOfDay === "Peak" && (
                    <span className="bg-rose-950/40 text-rose-400 border border-rose-500/10 px-1 py-0.2 rounded text-[8px] font-semibold">Peak</span>
                  )}
                  <span className="bg-slate-800 text-slate-400 px-1 py-0.2 rounded border border-white/5 text-[9px] font-semibold">{item.mode}</span>
                  <span className="text-[9px] text-slate-500 group-hover:text-slate-400">{item.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
