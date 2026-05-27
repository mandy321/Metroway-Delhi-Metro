import React, { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { useMetroStore } from "../store/useMetroStore";
import { STATIONS, EDGES, LINE_COLORS } from "../data/metroData";
import { Zap, ShieldCheck, Heart, Users, Construction } from "lucide-react";

// Hook to auto-fit map view to the current active route
function RouteBoundsFitter({ activeRoute }) {
  const map = useMap();

  useEffect(() => {
    if (activeRoute && activeRoute.path && activeRoute.path.length > 0) {
      const coordinates = activeRoute.path.map((s) => s.coordinates);
      // Fit to bounds with comfortable padding
      map.fitBounds(coordinates, {
        padding: [50, 50],
        maxZoom: 14,
        animate: true,
        duration: 1.0
      });
    }
  }, [activeRoute, map]);

  return null;
}

export default function MapView() {
  const { activeRoute, startStationId, endStationId, infrastructureStatus, isOffline } = useMetroStore();

  // Create custom marker icons based on station lines and selection state
  const getStationIcon = (station) => {
    const isOrigin = station.id === startStationId;
    const isDest = station.id === endStationId;
    const isInRoute = activeRoute?.path.some((s) => s.id === station.id) || false;

    let iconColor = "bg-slate-400";
    let pulseClass = "";
    let borderClass = "border-2 border-slate-950";
    let glowShadow = "";

    if (station.lines.length > 1) {
      // Interchange station
      iconColor = "bg-white";
      borderClass = "border-[3px] border-slate-900";
      glowShadow = isInRoute 
        ? "ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-950 shadow-glow-cyan" 
        : "ring-2 ring-slate-600/60 ring-offset-1 ring-offset-slate-950";
      
      return L.divIcon({
        className: "custom-station-interchange-icon",
        html: `<div class="flex items-center justify-center rounded-full w-5.5 h-5.5 ${iconColor} ${borderClass} ${glowShadow} transition-all duration-300">
                 <div class="w-1.5 h-1.5 rounded-full bg-slate-950"></div>
               </div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
    }

    // Single line station
    const primaryLine = station.lines[0];
    if (primaryLine === "Yellow") {
      iconColor = "bg-[#FFC72C]";
      glowShadow = isInRoute ? "ring-4 ring-[#FFC72C]/50 shadow-glow-yellow" : "";
    } else if (primaryLine === "Blue") {
      iconColor = "bg-[#0055A5]";
      glowShadow = isInRoute ? "ring-4 ring-[#0055A5]/50 shadow-glow-blue" : "";
    } else if (primaryLine === "Violet") {
      iconColor = "bg-[#8A2BE2]";
      glowShadow = isInRoute ? "ring-4 ring-[#8A2BE2]/50 shadow-glow-violet" : "";
    } else if (primaryLine === "Red") {
      iconColor = "bg-[#E31B23]";
      glowShadow = isInRoute ? "ring-4 ring-[#E31B23]/50 shadow-glow-red" : "";
    }

    if (isOrigin) {
      pulseClass = "station-pulse-marker ring-4 ring-cyan-400 border-white scale-110";
      iconColor = "bg-cyan-400";
    } else if (isDest) {
      pulseClass = "station-pulse-marker ring-4 ring-rose-500 border-white scale-110";
      iconColor = "bg-rose-500";
    } else if (isInRoute) {
      pulseClass = "station-pulse-marker ring-2 border-slate-900 scale-105";
    }

    return L.divIcon({
      className: "custom-station-marker-icon",
      html: `<div class="rounded-full w-4.5 h-4.5 ${iconColor} ${borderClass} ${pulseClass} ${glowShadow} transition-all duration-300"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  };

  // Delhi center coordinates to cover the entire grid of our 20 stations
  const delhiCenter = [28.6143, 77.2106];

  // Helper to structure polylines for the full network map
  const renderNetworkEdges = () => {
    return EDGES.map((edge, idx) => {
      const sourceStation = STATIONS.find((s) => s.id === edge.source);
      const targetStation = STATIONS.find((s) => s.id === edge.target);
      
      if (!sourceStation || !targetStation) return null;

      const color = LINE_COLORS[edge.line] || "#64748b";

      // If active route exists, we draw base lines dimmer, and high-contrast glowing routes over them
      const isEdgeInRoute = activeRoute?.edges.some(
        (e) => (e.source === edge.source && e.target === edge.target) || 
               (e.source === edge.target && e.target === edge.source)
      );

      return (
        <Polyline
          key={`edge-${idx}`}
          positions={[sourceStation.coordinates, targetStation.coordinates]}
          pathOptions={{
            color: color,
            weight: 3.5,
            opacity: activeRoute ? (isEdgeInRoute ? 0 : 0.15) : 0.7,
            lineCap: "round"
          }}
        />
      );
    });
  };

  // Render the selected active path with glowing aesthetics
  const renderActiveRoute = () => {
    if (!activeRoute || !activeRoute.edges) return null;

    return activeRoute.edges.map((edge, idx) => {
      const sourceStation = STATIONS.find((s) => s.id === edge.source);
      const targetStation = STATIONS.find((s) => s.id === edge.target);

      if (!sourceStation || !targetStation) return null;

      // Glow effect via double layer drawing:
      // Layer 1: Thick glowing translucent background line
      // Layer 2: Core solid bright line
      const routeColor = edge.isTransfer ? "#a5f3fc" : (LINE_COLORS[edge.line] || "#22d3ee");

      return (
        <React.Fragment key={`active-edge-${idx}`}>
          <Polyline
            positions={[sourceStation.coordinates, targetStation.coordinates]}
            pathOptions={{
              color: routeColor,
              weight: 8,
              opacity: 0.45,
              lineCap: "round",
              className: "active-route-polyline"
            }}
          />
          <Polyline
            positions={[sourceStation.coordinates, targetStation.coordinates]}
            pathOptions={{
              color: "#ffffff",
              weight: 3.5,
              opacity: 0.9,
              lineCap: "round",
              dashArray: edge.isTransfer ? "5, 5" : undefined
            }}
          />
        </React.Fragment>
      );
    });
  };

  return (
    <div className="relative w-full h-[350px] lg:h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-10">
      
      {/* Map Element */}
      <MapContainer
        center={delhiCenter}
        zoom={11}
        zoomControl={true}
        className="w-full h-full"
      >
        {/* CartoDB Dark Matter map tile layer */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* View Bounds Fitter */}
        <RouteBoundsFitter activeRoute={activeRoute} />

        {/* Static Base Network Edges */}
        {renderNetworkEdges()}

        {/* Active Route Edges */}
        {renderActiveRoute()}

        {/* Station Markers */}
        {STATIONS.map((station) => {
          const infra = infrastructureStatus[station.id] || { escalator: "Operational", elevator: "Operational" };
          const isEscalatorBroken = infra.escalator === "Under Maintenance";
          const isElevatorBroken = infra.elevator === "Under Maintenance";

          return (
            <Marker
              key={station.id}
              position={station.coordinates}
              icon={getStationIcon(station)}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent={false}>
                <span className="font-semibold text-slate-100">{station.name}</span>
              </Tooltip>
              
              <Popup>
                <div className="p-1 max-w-[220px]">
                  {/* Station Name */}
                  <h4 className="font-outfit font-bold text-sm text-white mb-1 border-b border-white/10 pb-1">
                    {station.name} Station
                  </h4>

                  {/* Lines Badge */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {station.lines.map((l) => (
                      <span
                        key={l}
                        className="text-[9px] font-bold px-1.5 py-0.2 rounded border"
                        style={{
                          backgroundColor: `${LINE_COLORS[l]}20`,
                          color: LINE_COLORS[l],
                          borderColor: `${LINE_COLORS[l]}40`
                        }}
                      >
                        {l} Line
                      </span>
                    ))}
                  </div>

                  {/* Operational Status */}
                  <div className="space-y-1 text-slate-300 text-[10px] mb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Escalator:</span>
                      <span className={`font-bold flex items-center ${isEscalatorBroken ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isEscalatorBroken && <Construction className="h-2.5 w-2.5 mr-0.5 animate-pulse" />}
                        {infra.escalator}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Elevator:</span>
                      <span className={`font-bold flex items-center ${isElevatorBroken ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isElevatorBroken && <Construction className="h-2.5 w-2.5 mr-0.5 animate-pulse" />}
                        {infra.elevator}
                      </span>
                    </div>
                  </div>

                  {/* Exits */}
                  <div className="mt-2 text-[9px] text-slate-400">
                    <div className="font-semibold text-slate-300 mb-0.5">Exits / Gates:</div>
                    <ul className="list-disc pl-3.5 space-y-0.5">
                      {station.exits.slice(0, 2).map((exit) => (
                        <li key={exit.gate} className="truncate">
                          Gate {exit.gate}: {exit.name}
                        </li>
                      ))}
                      {station.exits.length > 2 && (
                        <li className="list-none text-cyan-400 italic">+{station.exits.length - 2} more gates</li>
                      )}
                    </ul>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-filter backdrop-blur-md border border-white/10 px-3 py-2 rounded-xl text-[10px] space-y-1 text-slate-300 pointer-events-none select-none z-[1000]">
        <div className="font-bold text-slate-100 border-b border-white/5 pb-0.5 mb-1">LINES</div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFC72C]"></span>
          <span>Yellow Line</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0055A5]"></span>
          <span>Blue Line</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8A2BE2]"></span>
          <span>Violet Line</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E31B23]"></span>
          <span>Red Line</span>
        </div>
      </div>

    </div>
  );
}
