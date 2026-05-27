import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { useMetroStore } from "../store/useMetroStore";
import { STATIONS, EDGES, LINE_COLORS } from "../data/metroData";
import { Plus, Minus, Navigation, Layers, HelpCircle, Construction } from "lucide-react";

// Hook to control map zoom & centering dynamically
function MapController({ activeRoute, zoomLevel, centerCoords }) {
  const map = useMap();

  // Handle active route bounding box centering
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

  // Handle custom zoom controls
  useEffect(() => {
    if (zoomLevel !== null) {
      map.setZoom(zoomLevel);
    }
  }, [zoomLevel, map]);

  // Handle locating/re-centering
  useEffect(() => {
    if (centerCoords) {
      map.setView(centerCoords, map.getZoom(), { animate: true, duration: 0.8 });
    }
  }, [centerCoords, map]);

  return null;
}

export default function MapView() {
  const { activeRoute, startStationId, endStationId, infrastructureStatus } = useMetroStore();
  
  // Custom states for our Apple-style map controls
  const [customZoom, setCustomZoom] = useState(null);
  const [centerCoords, setCenterCoords] = useState(null);
  const [mapRef, setMapRef] = useState(null);

  const delhiCenter = [28.6143, 77.2106];

  // Helper to re-center map to original view
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

  // Apple-transit styled marker icons (clean, vector-style dot nodes)
  const getStationIcon = (station) => {
    const isOrigin = station.id === startStationId;
    const isDest = station.id === endStationId;
    const isInRoute = activeRoute?.path.some((s) => s.id === station.id) || false;

    // Default dimensions
    let size = isInRoute ? 12 : 8;
    let iconClass = "bg-white border-2 border-slate-900 shadow-md";
    let pulseDiv = "";

    // Origin Pin (Apple Maps style: glowing cyan pin)
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

    // Destination Pin (Apple Maps style: glowing rose pin)
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

    // Regular Station Nodes
    const primaryLine = station.lines[0];
    let dotColor = "bg-slate-400";
    if (primaryLine === "Yellow") dotColor = "bg-[#FFC72C]";
    else if (primaryLine === "Blue") dotColor = "bg-[#0055A5]";
    else if (primaryLine === "Violet") dotColor = "bg-[#8A2BE2]";
    else if (primaryLine === "Red") dotColor = "bg-[#E31B23]";
    else if (primaryLine === "Pink") dotColor = "bg-[#FF69B4]";
    else if (primaryLine === "Magenta") dotColor = "bg-[#8B008B]";

    const activeScale = isInRoute ? "scale-110 border-white border" : "opacity-45 border-slate-950/20 border-[1px] scale-90";

    return L.divIcon({
      className: "custom-station-dot",
      html: `<div class="w-3.5 h-3.5 rounded-full ${dotColor} ${activeScale} shadow-sm transition-all duration-300"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  };

  const renderNetworkEdges = () => {
    return EDGES.map((edge, idx) => {
      const sourceStation = STATIONS.find((s) => s.id === edge.source);
      const targetStation = STATIONS.find((s) => s.id === edge.target);
      
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
      const sourceStation = STATIONS.find((s) => s.id === edge.source);
      const targetStation = STATIONS.find((s) => s.id === edge.target);

      if (!sourceStation || !targetStation) return null;

      const routeColor = edge.isTransfer ? "#a855f7" : (LINE_COLORS[edge.line] || "#06b6d4");

      // Draw two polylines for the clean Apple Maps transit path layout:
      // 1. Core solid bright color line
      // 2. Underlying soft-glowing path to give it a neat overlay depth
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
      
      {/* Interactive Map */}
      <MapContainer
        center={delhiCenter}
        zoom={11}
        zoomControl={false} // Disable standard bulky Leaflet controls
        className="w-full h-full"
        ref={setMapRef}
      >
        {/* CartoDB Positron: Sleek desaturated light-grey tiles that mimic premium engineering views */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        <MapController activeRoute={activeRoute} zoomLevel={customZoom} centerCoords={centerCoords} />
        {renderNetworkEdges()}
        {renderActiveRoute()}

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
                          backgroundColor: `${LINE_COLORS[l]}15`,
                          color: LINE_COLORS[l],
                          borderColor: `${LINE_COLORS[l]}25`
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
                      {station.exits.map((exit) => (
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

      {/* Apple-style Floating Controls (Glassmorphic Rounded Cards) */}
      
      {/* Zoom / Locate widgets (Top-Left) */}
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
      <div className="absolute top-4 right-4 z-[1000] bg-white/85 backdrop-blur-md border border-slate-200/60 px-3 py-2.5 rounded-xl shadow-lg text-[10px] space-y-1.5 text-slate-600 pointer-events-none select-none w-28">
        <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1 tracking-tight flex items-center gap-1">
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
      </div>

    </div>
  );
}
