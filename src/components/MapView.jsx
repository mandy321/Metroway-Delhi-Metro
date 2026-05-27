import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { useMetroStore } from "../store/useMetroStore";
import { LINE_COLORS } from "../data/metroData";
import { Plus, Minus, Navigation, Layers, HelpCircle, Construction } from "lucide-react";

// Hook to auto-fit map view to the current active route
function RouteBoundsFitter({ activeRoute }) {
  const map = useMap();

  useEffect(() => {
    if (activeRoute && activeRoute.path && activeRoute.path.length > 0) {
      const coordinates = activeRoute.path.map((s) => s.coordinates);
      map.fitBounds(coordinates, {
        padding: [60, 60],
        maxZoom: 13,
        animate: true,
        duration: 1.2
      });
    }
  }, [activeRoute, map]);

  return null;
}

export default function MapView() {
  // Query stations and edges dynamically from the persisted store
  const { stations, edges, activeRoute, startStationId, endStationId, infrastructureStatus } = useMetroStore();
  
  const [customZoom, setCustomZoom] = useState(null);
  const [centerCoords, setCenterCoords] = useState(null);
  const [mapRef, setMapRef] = useState(null);

  const delhiCenter = [28.6143, 77.2106];

  const handleRecenter = () => {
    setCenterCoords([...delhiCenter]);
  };

  const handleZoomIn = () => {
    if (mapRef) {
      setCustomZoom(mapRef.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef) {
      setCustomZoom(mapRef.getZoom() - 1);
    }
  };

  // Custom marker icons
  const getStationIcon = (station) => {
    const isOrigin = station.id === startStationId;
    const isDest = station.id === endStationId;
    const isInRoute = activeRoute?.path.some((s) => s.id === station.id) || false;

    // Origin Pin
    if (isOrigin) {
      return L.divIcon({
        className: "custom-pin-origin",
        html: `<div class="relative flex items-center justify-center">
                 <div class="absolute w-7 h-7 rounded-full bg-cyan-400/20 animate-ping"></div>
                 <div class="w-4 h-4 rounded-full bg-cyan-400 border-[3px] border-white shadow-[0_2px_8px_rgba(6,182,212,0.5)] z-10"></div>
               </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
    }

    // Destination Pin
    if (isDest) {
      return L.divIcon({
        className: "custom-pin-dest",
        html: `<div class="relative flex items-center justify-center">
                 <div class="absolute w-7 h-7 rounded-full bg-rose-500/20 animate-ping"></div>
                 <div class="w-4 h-4 rounded-full bg-rose-500 border-[3px] border-white shadow-[0_2px_8px_rgba(244,63,94,0.5)] z-10"></div>
               </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
    }

    // Interchange Node
    if (station.lines.length > 1) {
      const activeBorder = isInRoute ? "border-cyan-400 scale-110 shadow-lg" : "border-slate-400";
      return L.divIcon({
        className: "custom-station-interchange-icon",
        html: `<div class="w-4 h-4 rounded-full bg-slate-950 border-[3px] ${activeBorder} flex items-center justify-center transition-all duration-300">
                 <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
               </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
    }

    // Single line stations
    const primaryLine = station.lines[0];
    let dotColor = "bg-slate-400";
    if (primaryLine === "Yellow") dotColor = "bg-[#FFC72C]";
    else if (primaryLine === "Blue") dotColor = "bg-[#0055A5]";
    else if (primaryLine === "Violet") dotColor = "bg-[#8A2BE2]";
    else if (primaryLine === "Red") dotColor = "bg-[#E31B23]";
    else if (primaryLine === "Pink") dotColor = "bg-[#FF69B4]";
    else if (primaryLine === "Magenta") dotColor = "bg-[#8B008B]";
    else if (primaryLine === "Orange") dotColor = "bg-[#FF8C00]";
    else if (primaryLine === "Green") dotColor = "bg-[#00FF00]";
    else if (primaryLine === "Grey") dotColor = "bg-[#808080]";
    else if (primaryLine === "Rapid") dotColor = "bg-[#A52A2A]";
    else if (primaryLine === "Aqua") dotColor = "bg-[#00FFFF]";

    const activeScale = isInRoute ? "scale-110 border-white border" : "opacity-45 border-slate-950/20 border-[1px] scale-90";

    return L.divIcon({
      className: "custom-station-dot",
      html: `<div class="w-3.5 h-3.5 rounded-full ${dotColor} ${activeScale} shadow-sm transition-all duration-300"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  };

  const renderNetworkEdges = () => {
    return edges.map((edge, idx) => {
      const sourceStation = stations.find((s) => s.id === edge.source);
      const targetStation = stations.find((s) => s.id === edge.target);
      
      if (!sourceStation || !targetStation) return null;

      const color = LINE_COLORS[edge.line] || "#64748b";
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
            weight: 2.5,
            opacity: activeRoute ? (isEdgeInRoute ? 0 : 0.08) : 0.45,
            lineCap: "round"
          }}
        />
      );
    });
  };

  const renderActiveRoute = () => {
    if (!activeRoute || !activeRoute.edges) return null;

    return activeRoute.edges.map((edge, idx) => {
      const sourceStation = stations.find((s) => s.id === edge.source);
      const targetStation = stations.find((s) => s.id === edge.target);

      if (!sourceStation || !targetStation) return null;

      const routeColor = edge.isTransfer ? "#a855f7" : (LINE_COLORS[edge.line] || "#06b6d4");

      return (
        <React.Fragment key={`active-edge-${idx}`}>
          <Polyline
            positions={[sourceStation.coordinates, targetStation.coordinates]}
            pathOptions={{
              color: routeColor,
              weight: 6,
              opacity: 0.8,
              lineCap: "round",
              className: "active-route-polyline"
            }}
          />
          <Polyline
            positions={[sourceStation.coordinates, targetStation.coordinates]}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              opacity: 0.95,
              lineCap: "round",
              dashArray: edge.isTransfer ? "4, 4" : undefined
            }}
          />
        </React.Fragment>
      );
    });
  };

  return (
    <div className="relative w-full h-[350px] lg:h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-10 bg-slate-950">
      
      {/* Map */}
      <MapContainer
        center={delhiCenter}
        zoom={11}
        zoomControl={false}
        className="w-full h-full"
        ref={setMapRef}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        <RouteBoundsFitter activeRoute={activeRoute} zoomLevel={customZoom} centerCoords={centerCoords} />
        {renderNetworkEdges()}
        {renderActiveRoute()}

        {stations.map((station) => {
          const infra = infrastructureStatus[station.id] || { escalator: "Operational", elevator: "Operational" };
          const isEscalatorBroken = infra.escalator === "Under Maintenance";
          const isElevatorBroken = infra.elevator === "Under Maintenance";

          return (
            <Marker
              key={station.id}
              position={station.coordinates}
              icon={getStationIcon(station)}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95} permanent={false}>
                <span className="font-semibold text-slate-800 text-[10px] px-1 py-0.5">{station.name}</span>
              </Tooltip>
              
              <Popup>
                <div className="p-1 max-w-[220px] text-slate-800">
                  <h4 className="font-outfit font-bold text-sm text-slate-900 mb-1 border-b border-slate-100 pb-1">
                    {station.name}
                  </h4>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {station.lines.map((l) => (
                      <span
                        key={l}
                        className="text-[9px] font-bold px-1.5 py-0.2 rounded border"
                        style={{
                          backgroundColor: `${LINE_COLORS[l] || "#cbd5e1"}15`,
                          color: LINE_COLORS[l] || "#475569",
                          borderColor: `${LINE_COLORS[l] || "#cbd5e1"}25`
                        }}
                      >
                        {l}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-1 text-slate-600 text-[10px] mb-2">
                    <div className="flex items-center justify-between">
                      <span>Escalator:</span>
                      <span className={`font-bold flex items-center ${isEscalatorBroken ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {infra.escalator}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Elevator:</span>
                      <span className={`font-bold flex items-center ${isElevatorBroken ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {infra.elevator}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-[9px] text-slate-500 border-t border-slate-100 pt-1">
                    <div className="font-semibold text-slate-700 mb-0.5">Exits:</div>
                    <ul className="list-disc pl-3.5 space-y-0.5">
                      {station.exits?.map((exit) => (
                        <li key={exit.gate} className="truncate">
                          Gate {exit.gate}: {exit.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Apple-style Zoom controls */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col space-y-2 select-none">
        <div className="flex flex-col bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-lg overflow-hidden w-9">
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-b border-slate-200/50 flex items-center justify-center transition"
            title="Zoom In"
          >
            <Plus className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition"
            title="Zoom Out"
          >
            <Minus className="h-4.5 w-4.5" />
          </button>
        </div>
        
        <button
          onClick={handleRecenter}
          className="p-2 text-slate-700 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-lg flex items-center justify-center hover:bg-slate-100 w-9 h-9 transition"
          title="Recenter Map"
        >
          <Navigation className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Floating Apple-style Legend (Top-Right) */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/85 backdrop-blur-md border border-slate-200/60 px-3 py-2.5 rounded-xl shadow-lg text-[10px] space-y-1 text-slate-600 pointer-events-none select-none w-28 max-h-[300px] overflow-y-auto">
        <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1 tracking-tight flex items-center gap-1 sticky top-0 bg-white/5 bg-opacity-10">
          <Layers className="h-3 w-3 text-cyan-500" /> TRANSIT
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFC72C] inline-block shadow-sm"></span>
          <span className="font-semibold text-slate-700">Yellow</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0055A5] inline-block shadow-sm"></span>
          <span className="font-semibold text-slate-700">Blue</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8A2BE2] inline-block shadow-sm"></span>
          <span className="font-semibold text-slate-700">Violet</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E31B23] inline-block shadow-sm"></span>
          <span className="font-semibold text-slate-700">Red</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF69B4] inline-block shadow-sm"></span>
          <span className="font-semibold text-slate-700">Pink</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8B008B] inline-block shadow-sm"></span>
          <span className="font-semibold text-slate-700">Magenta</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF8C00] inline-block shadow-sm"></span>
          <span className="font-semibold text-slate-700">Orange</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF00] inline-block shadow-sm"></span>
          <span className="font-semibold text-slate-700">Green</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#808080] inline-block shadow-sm"></span>
          <span className="font-semibold text-slate-700">Grey</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A52A2A] inline-block shadow-sm"></span>
          <span className="font-semibold text-slate-700">Rapid</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FFFF] inline-block shadow-sm"></span>
          <span className="font-semibold text-slate-700">Aqua</span>
        </div>
      </div>

    </div>
  );
}
