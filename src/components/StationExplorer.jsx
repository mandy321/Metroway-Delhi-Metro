import React, { useState } from "react";
import { useMetroStore } from "../store/useMetroStore";
import { LINE_COLORS } from "../data/metroData";
import { Search, DoorOpen, Accessibility, Users, Activity, ShieldCheck, AlertTriangle } from "lucide-react";

export default function StationExplorer() {
  const { stations, getStationCrowd, infrastructureStatus } = useMetroStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStationId, setSelectedStationId] = useState("");

  const filteredStations = stations.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeStation = stations.find(s => s.id === selectedStationId) || stations[0];

  const handleStationSelect = (id) => {
    setSelectedStationId(id);
    setSearchQuery("");
  };

  const getCrowdBadgeColor = (val) => {
    if (val < 4) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (val < 7) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  const infra = activeStation ? (infrastructureStatus[activeStation.id] || { escalator: "Operational", elevator: "Operational" }) : { escalator: "Operational", elevator: "Operational" };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-xl w-full flex flex-col space-y-4">
      <div className="flex flex-col space-y-1">
        <h3 className="font-outfit font-bold text-lg text-slate-100 flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan-400" />
          Station Directory & Gates
        </h3>
        <p className="text-[11px] text-slate-400">
          Search any station on the Delhi Metro network to verify gates, lighting, and lift operations.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search station (e.g. Naraina Vihar, Rajiv Chowk)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm transition-all"
        />

        {/* Dropdown Suggestions */}
        {searchQuery && (
          <div className="absolute top-12 left-0 right-0 max-h-52 overflow-y-auto rounded-xl bg-slate-900 border border-white/10 shadow-2xl z-50 divide-y divide-white/5">
            {filteredStations.length > 0 ? (
              filteredStations.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleStationSelect(s.id)}
                  className="w-full text-left px-4 py-3 text-xs text-slate-200 hover:bg-slate-800 transition flex items-center justify-between"
                >
                  <span className="font-semibold">{s.name}</span>
                  <div className="flex gap-1">
                    {s.lines.map(l => (
                      <span
                        key={l}
                        className="text-[8px] font-bold px-1 rounded-sm border"
                        style={{
                          borderColor: `${LINE_COLORS[l]}25`,
                          color: LINE_COLORS[l]
                        }}
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-slate-500 italic">No stations match query.</div>
            )}
          </div>
        )}
      </div>

      {/* Selected Station Card Details */}
      {activeStation && (
        <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 flex flex-col space-y-4">
          <div className="flex items-start justify-between border-b border-white/5 pb-3">
            <div>
              <h4 className="font-outfit font-black text-base text-white">{activeStation.name}</h4>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {activeStation.lines.map(l => (
                  <span
                    key={l}
                    className="text-[9px] font-bold px-2 py-0.5 rounded border"
                    style={{
                      borderColor: `${LINE_COLORS[l]}30`,
                      color: LINE_COLORS[l],
                      backgroundColor: `${LINE_COLORS[l]}10`
                    }}
                  >
                    {l} Line
                  </span>
                ))}
              </div>
            </div>

            {/* Live Crowd Badge */}
            <div className={`border px-3 py-1.5 rounded-lg flex items-center space-x-1.5 text-xs ${getCrowdBadgeColor(getStationCrowd(activeStation.id))}`}>
              <Users className="h-3.5 w-3.5" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] opacity-75 font-semibold uppercase tracking-wider leading-none">Crowd</span>
                <span className="font-bold leading-tight mt-0.5">{getStationCrowd(activeStation.id)}/10</span>
              </div>
            </div>
          </div>

          {/* Infrastructure Health Outages */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/50 border border-white/5 p-3 rounded-lg flex items-start space-x-2">
              <Activity className={`h-4.5 w-4.5 shrink-0 ${infra.escalator === "Operational" ? "text-emerald-400" : "text-rose-400"}`} />
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Escalators</span>
                <span className="font-bold text-slate-200 mt-0.5 inline-block">{infra.escalator}</span>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-white/5 p-3 rounded-lg flex items-start space-x-2">
              <Accessibility className={`h-4.5 w-4.5 shrink-0 ${infra.elevator === "Operational" ? "text-emerald-400" : "text-rose-400"}`} />
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Elevators / Lifts</span>
                <span className="font-bold text-slate-200 mt-0.5 inline-block">{infra.elevator}</span>
              </div>
            </div>
          </div>

          {/* Gate Listings */}
          <div className="space-y-2">
            <h5 className="font-outfit font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <DoorOpen className="h-4 w-4 text-cyan-400" />
              Verified Gates & Exits ({activeStation.exits?.length || 0})
            </h5>
            
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {activeStation.exits && activeStation.exits.length > 0 ? (
                activeStation.exits.map(exit => (
                  <div key={exit.gate} className="p-3 rounded-lg bg-slate-900/60 border border-white/5 flex flex-col space-y-1.5 text-xs text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="bg-cyan-500/10 text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-cyan-500/20">Gate {exit.gate}</span>
                        <span className="font-bold text-slate-200">{exit.name}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        exit.lit === "Well-Lit" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                      }`}>
                        {exit.lit}
                      </span>
                    </div>

                    {exit.accessibility && exit.accessibility.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
                        {exit.accessibility.map(acc => (
                          <span key={acc} className="text-[9px] text-slate-400 flex items-center gap-0.5 font-medium">
                            <ShieldCheck className="h-3 w-3 text-cyan-400" /> {acc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-900/30 rounded border border-dashed border-white/5 text-center text-slate-500 text-xs italic">
                  No gate exit data compiled for this station yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
