import React from "react";
import { useMetroStore } from "../store/useMetroStore";
import { Train, Wifi, WifiOff, Activity, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const { isOffline } = useMetroStore();

  return (
    <nav className="glass-panel sticky top-0 z-[1000] px-6 py-4 flex items-center justify-between border-b border-white/10 shadow-lg select-none">
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-xl shadow-glow-cyan animate-pulse">
          <Train className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-outfit text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Metroway <span className="text-cyan-400 font-semibold">Delhi</span>
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-cyan-500" /> Smart Navigation MVP
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Network Status Badge */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-900/60 border border-white/5 py-1.5 px-3 rounded-full text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 font-medium flex items-center gap-1">
            <Activity className="h-3 w-3 text-emerald-400" />
            DMRC Feeds: Live & Operational
          </span>
        </div>

        {/* Offline / Online Badge */}
        {isOffline ? (
          <div className="flex items-center space-x-1.5 bg-rose-500/20 border border-rose-500/30 text-rose-300 py-1.5 px-3 rounded-full text-xs font-medium animate-pulse">
            <WifiOff className="h-3.5 w-3.5" />
            <span>Offline (Cached)</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 py-1.5 px-3 rounded-full text-xs font-medium">
            <Wifi className="h-3.5 w-3.5" />
            <span>Online</span>
          </div>
        )}
      </div>
    </nav>
  );
}
