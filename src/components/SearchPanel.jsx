import React, { useState, useEffect, useRef } from "react";
import { useMetroStore } from "../store/useMetroStore";
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
  CreditCard,
  ChevronDown,
  ChevronUp,
  Info,
  Train,
  Milestone,
  Layers
} from "lucide-react";

export default function SearchPanel({ onSelectEnd }) {
  const {
    stations,
    startStationId,
    endStationId,
    mode,
    timeOfDay,
    selectedHour,
    activeEvent,
    setSelectedHour,
    setActiveEvent,
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
  
  // State for official DMRC statistics collapsible card
  const [statsExpanded, setStatsExpanded] = useState(false);

  const startRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    const startStation = stations.find(s => s.id === startStationId);
    setStartQuery(startStation ? startStation.name : "");
  }, [startStationId, stations]);

  useEffect(() => {
    const endStation = stations.find(s => s.id === endStationId);
    setEndQuery(endStation ? endStation.name : "");
  }, [endStationId, stations]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (startRef.current && !startRef.current.contains(event.target)) {
        setStartOpen(false);
        const station = stations.find(s => s.id === startStationId);
        setStartQuery(station ? station.name : "");
      }
      if (endRef.current && !endRef.current.contains(event.target)) {
        setEndOpen(false);
        const station = stations.find(s => s.id === endStationId);
        setEndQuery(station ? station.name : "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [startStationId, endStationId, stations]);

  useEffect(() => {
    if (startStationId && endStationId) {
      calculateActiveRoute();
    }
  }, [startStationId, endStationId, mode, timeOfDay, selectedHour, activeEvent, useSmartCard, calculateActiveRoute]);

  const filterStations = (query) => {
    if (!query) return stations;
    return stations.filter((station) =>
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
    if (onSelectEnd) {
      onSelectEnd();
    }
  };

  const selectHistoryItem = (item) => {
    setStartStationId(item.startStationId);
    setEndStationId(item.endStationId);
    setMode(item.mode);
    if (item.timeOfDay) setTimeOfDay(item.timeOfDay);
    if (onSelectEnd) {
      onSelectEnd();
    }
  };

  const getLineBadgeClass = (lineName) => {
    switch (lineName) {
      case "Yellow": return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "Blue": return "bg-blue-600/20 text-blue-300 border-blue-600/30";
      case "Violet": return "bg-purple-600/20 text-purple-300 border-purple-600/30";
      case "Red": return "bg-red-600/20 text-red-300 border-red-600/30";
      case "Pink": return "bg-pink-500/20 text-pink-300 border-pink-500/30";
      case "Magenta": return "bg-fuchsia-600/20 text-fuchsia-300 border-fuchsia-600/30";
      case "Orange": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Green": return "bg-emerald-400/25 text-emerald-300 border-emerald-400/40";
      case "Grey": return "bg-slate-500/20 text-slate-300 border-slate-500/30";
      case "Rapid": return "bg-rose-900/30 text-rose-300 border-rose-900/40";
      case "Aqua": return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
      case "RRTS": return "bg-emerald-900/30 text-emerald-300 border-emerald-800/40";
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
      <div className="flex items-center justify-between text-cyan-400">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4" />
          <h2 className="font-outfit font-semibold text-sm tracking-wide uppercase">Journey Planner</h2>
        </div>
      </div>

      {/* From / To Stations */}
      <div className="relative flex flex-col space-y-3">
        {/* From Station */}
        <div ref={startRef} className="relative">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">From Station</label>
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
                      <span key={line} className={`text-xs font-bold px-2 py-0.5 rounded border ${getLineBadgeClass(line)}`}>
                        {line === "RRTS" ? "RRTS" : line[0]}
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
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">To Station</label>
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
                onClick={() => { setEndQuery(""); setEndStationId(""); }} 
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
                      <span key={line} className={`text-xs font-bold px-2 py-0.5 rounded border ${getLineBadgeClass(line)}`}>
                        {line === "RRTS" ? "RRTS" : line[0]}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 24-Hour Departure Time Slider */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Departure Time</label>
          <span className="text-xs font-bold font-outfit text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {String(selectedHour).padStart(2, '0')}:00 {selectedHour >= 12 ? 'PM' : 'AM'}
            <span className={`w-1.5 h-1.5 rounded-full inline-block ml-1 ${timeOfDay === "Peak" ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
          </span>
        </div>
        <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1.5">
          <input
            type="range"
            min="5"
            max="23"
            value={selectedHour || 12}
            onChange={(e) => setSelectedHour(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-lg bg-slate-800 appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[11px] font-bold text-slate-500 px-1">
            <span>05:00 AM</span>
            <span>12:00 PM</span>
            <span>11:00 PM</span>
          </div>
          <div className="text-xs text-slate-400 text-center font-medium border-t border-white/5 pt-2 mt-1 flex justify-center items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span>
              {timeOfDay === "Peak" 
                ? "Active Peak Rush: +25% delay, +1.5 comfort penalty" 
                : "Off-Peak Travel: Normal speed, 20% smart card discount"}
            </span>
          </div>
        </div>
      </div>

      {/* Event Simulation Widget */}
      <div className="flex flex-col space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Event Simulator</label>
        <div className="relative">
          <select
            value={activeEvent || "None"}
            onChange={(e) => {
              setActiveEvent(e.target.value);
              // Recalculate route immediately on event switch
              setTimeout(calculateActiveRoute, 50);
            }}
            className="w-full pl-3 pr-8 py-2 rounded-xl text-xs font-semibold glass-input appearance-none bg-slate-900/80 cursor-pointer text-slate-200"
          >
            <option value="None" className="bg-slate-950 text-slate-300">🟢 No Event (Standard Routine)</option>
            <option value="IPL Match" className="bg-slate-950 text-slate-300">🏏 IPL Cricket Match (Arun Jaitley / JLN Stadium)</option>
            <option value="Music Concert" className="bg-slate-950 text-slate-300">🎵 Concert Live Event (JLN Stadium)</option>
            <option value="Diwali Shopping Rush" className="bg-slate-950 text-slate-300">🛍️ Diwali Festive Rush (Rajiv Chowk / Chandni Chowk)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-cyan-400">
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>
        {activeEvent && activeEvent !== "None" && (
          <div className="text-xs bg-cyan-950/30 border border-cyan-500/20 text-cyan-300 px-3 py-2.5 rounded-xl flex items-start gap-1.5 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-cyan-400" />
            <div>
              <span className="font-bold">Active Simulation: </span>
              {activeEvent === "IPL Match" && "Heavy crowd surges near Delhi Gate & JLN Stadium. Avoid Violet Line hubs."}
              {activeEvent === "Music Concert" && "JLN Stadium Metro station overcrowding. Platform queue times +15 mins."}
              {activeEvent === "Diwali Shopping Rush" && "Massive shopping rush at Rajiv Chowk & Chandni Chowk. Expect long transfer queues."}
            </div>
          </div>
        )}
      </div>

      {/* Routing Modes */}
      <div className="flex flex-col space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Routing Algorithm Mode</label>
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
                <span className="text-xs font-bold tracking-tight">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-200">Metro Smart Card</h3>
              <p className="text-xs text-slate-400">Apply 10%–20% discount</p>
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

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Accessibility className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-200">Accessibility Access</h3>
              <p className="text-xs text-slate-400">Require elevator/escalator gates</p>
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

      {/* DMRC Official Network Stats Collapsible Dashboard */}
      <div className="border border-white/5 bg-slate-900/10 rounded-xl overflow-hidden transition-all duration-300">
        <button
          onClick={() => setStatsExpanded(!statsExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition text-left select-none text-slate-300"
        >
          <div className="flex items-center space-x-2 text-slate-200">
            <Info className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold font-outfit">DMRC Network Overview</span>
          </div>
          {statsExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {statsExpanded && (
          <div className="p-3 border-t border-white/5 grid grid-cols-2 gap-2 bg-slate-950/20 animate-fade-in">
            {/* Stat: Length */}
            <div className="p-2 rounded-lg bg-slate-900/30 border border-white/5">
              <div className="flex items-center text-sky-400 gap-1">
                <Milestone className="h-3.5 w-3.5" />
                <span className="text-sm font-extrabold font-outfit">416 km</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Network Length</p>
            </div>

            {/* Stat: Lines */}
            <div className="p-2 rounded-lg bg-slate-900/30 border border-white/5">
              <div className="flex items-center text-purple-400 gap-1">
                <Layers className="h-3.5 w-3.5" />
                <span className="text-sm font-extrabold font-outfit">12 Lines</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Operational Lines</p>
            </div>

            {/* Stat: Stations */}
            <div className="p-2 rounded-lg bg-slate-900/30 border border-white/5">
              <div className="flex items-center text-[#FFC72C] gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-sm font-extrabold font-outfit">303 Stations</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Total Stations</p>
            </div>

            {/* Stat: Trains */}
            <div className="p-2 rounded-lg bg-slate-900/30 border border-white/5">
              <div className="flex items-center text-emerald-400 gap-1">
                <Train className="h-3.5 w-3.5" />
                <span className="text-sm font-extrabold font-outfit">350+ Trains</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Daily Fleet</p>
            </div>
          </div>
        )}
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="flex flex-col space-y-2 border-t border-white/5 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <History className="h-3.5 w-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">Recent Searches</span>
            </div>
            <button 
              onClick={clearHistory}
              className="text-xs text-rose-400/80 hover:text-rose-400 font-bold uppercase tracking-wider transition"
            >
              Clear
            </button>
          </div>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {searchHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => selectHistoryItem(item)}
                className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 cursor-pointer text-xs transition"
              >
                <div className="truncate max-w-[180px] text-slate-300 font-semibold">
                  {item.startName} → {item.endName}
                </div>
                <div className="flex items-center space-x-1.5 text-slate-500">
                  {item.timeOfDay === "Peak" && (
                    <span className="bg-rose-950/40 text-rose-400 border border-rose-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold">Peak</span>
                  )}
                  <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-white/5 text-[10px] font-bold">{item.mode}</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-400">{item.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
