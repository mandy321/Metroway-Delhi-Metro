import React, { useState } from "react";
import { useMetroStore } from "../store/useMetroStore";
import { LINE_COLORS } from "../data/metroData";
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
  Sparkles,
  CreditCard,
  Gauge,
  Navigation
} from "lucide-react";

export default function RouteDetails() {
  // Query stations list dynamically from the persisted store
  const { 
    stations, 
    edges, // Query full network connections
    activeRoute, 
    infrastructureStatus, 
    accessibilityOnly, 
    useSmartCard, 
    timeOfDay,
    submitCrowdReport,
    communityReports,
    calculateActiveRoute
  } = useMetroStore();
  const [activeTab, setActiveTab] = useState("timeline");

  const [reportingStationId, setReportingStationId] = useState("");
  const [reportedLevel, setReportedLevel] = useState("Moderate");
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportingStationId) return;
    submitCrowdReport(reportingStationId, reportedLevel);
    setReportSuccess(true);
    setTimeout(() => {
      calculateActiveRoute();
    }, 50);
    setTimeout(() => {
      setReportSuccess(false);
      setReportingStationId("");
    }, 2000);
  };

  if (!activeRoute) {
    return (
      <div className="glass-panel flex-1 p-8 rounded-2xl flex flex-col items-center justify-center text-center border border-white/10 shadow-xl min-h-[300px]">
        <div className="bg-slate-900 p-4 rounded-full border border-white/5 mb-4 text-cyan-400 animate-pulse">
          <Navigation className="h-8 w-8" />
        </div>
        <h3 className="font-outfit font-bold text-lg text-slate-200">No Journey Selected</h3>
        <p className="text-sm text-slate-400 max-w-sm mt-1">
          Select origin and destination stations in the planner panel to compute the optimal route.
        </p>
      </div>
    );
  }

  const { metrics, path, edges: routeEdges } = activeRoute;
  const destinationStation = path[path.length - 1];

  // Exit recommendation engine
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

  const getTerminalStationName = (startId, nextId, line) => {
    if (!startId || !nextId || !line) return "";
    
    // Find all remaining stations on the active route to handle branches correctly
    const remainingStationIds = new Set();
    let foundNext = false;
    for (const station of path) {
      if (station.id === nextId) {
        foundNext = true;
      }
      if (foundNext) {
        remainingStationIds.add(station.id);
      }
    }

    const visited = new Set([startId, nextId]);
    let curr = nextId;
    
    while (true) {
      // Find all neighbors on the same line in the full network edges
      const neighbors = edges
        .filter(e => e.line === line && (e.source === curr || e.target === curr))
        .map(e => e.source === curr ? e.target : e.source)
        .filter(nId => !visited.has(nId));
      
      if (neighbors.length === 0) {
        break; // Reached a terminal station
      }
      
      if (neighbors.length === 1) {
        curr = neighbors[0];
        visited.add(curr);
      } else {
        // We have a branch! (e.g. Blue Line splitting at Yamuna Bank)
        // Pick the branch that is on the user's remaining path if possible
        const nextOnPath = neighbors.find(nId => remainingStationIds.has(nId));
        if (nextOnPath) {
          curr = nextOnPath;
        } else {
          curr = neighbors[0];
        }
        visited.add(curr);
      }
    }
    
    const termStation = stations.find(s => s.id === curr);
    return termStation ? termStation.name : "";
  };

  const getPlatformNumber = (station, line, terminalName) => {
    if (!station || !line) return 1;
    
    // Canonical order of Delhi Metro lines to reflect real-world layout
    const LINE_ORDER = ["Red", "Yellow", "Blue", "Green", "Violet", "Pink", "Magenta", "Orange", "Grey", "RRTS"];
    
    // Sort lines by canonical order to determine base platform
    const sortedLines = [...station.lines].sort((a, b) => LINE_ORDER.indexOf(a) - LINE_ORDER.indexOf(b));
    const lineIndex = sortedLines.indexOf(line);
    const basePlatform = 2 * (lineIndex >= 0 ? lineIndex : 0);
    
    const terminalStation = stations.find(s => s.name === terminalName);
    if (!terminalStation || !station.coordinates || !terminalStation.coordinates) {
      return basePlatform + 1;
    }
    
    // Determine orientation: compare Latitude for North-South lines, Longitude for East-West lines
    const isNorthSouth = ["Yellow", "Violet", "RRTS"].includes(line);
    const coordIndex = isNorthSouth ? 0 : 1; // 0 = Latitude, 1 = Longitude
    
    const currentVal = station.coordinates[coordIndex];
    const terminalVal = terminalStation.coordinates[coordIndex];
    
    if (terminalVal >= currentVal) {
      return basePlatform + 1;
    } else {
      return basePlatform + 2;
    }
  };

  const getLegBoardingInfo = (leg) => {
    if (!leg || !leg.edges || leg.edges.length === 0) return null;
    const edge = leg.edges[0];
    const nextId = edge.source === leg.startStation.id ? edge.target : edge.source;
    const termName = getTerminalStationName(leg.startStation.id, nextId, leg.line);
    const platNum = getPlatformNumber(leg.startStation, leg.line, termName);
    return { termName, platNum };
  };

  const getTransferWalkInfo = (stationId, toLine) => {
    // Noida Sector 52 (Blue) to Sector 51 (Aqua)
    if (stationId === "NS52" || stationId === "NS51") {
      return {
        type: "Footpath Pathway Walkway",
        distance: "300m",
        time: 8,
        description: "Walk via dedicated pedestrian pathway between Sector 52 & 51 (Free e-rickshaws available)"
      };
    }
    // Dhaula Kuan / DDS interchange walk
    if (stationId === "DK" || stationId === "DDS") {
      return {
        type: "Skywalk with Travelators",
        distance: "1.2 km",
        time: 10,
        description: "Walk via the iconic covered foot overbridge skywalk connecting Orange & Pink platforms (equipped with travelators)"
      };
    }
    // Rajouri Garden
    if (stationId === "RG") {
      return {
        type: "Interchange Bridge Skywalk",
        distance: "400m",
        time: 6,
        description: "Walk via skywalk bridge connecting elevated Blue Line and Pink Line platforms"
      };
    }
    // Hauz Khas
    if (stationId === "HK") {
      return {
        type: "Deep Escalator Walk",
        distance: "350m",
        time: 6,
        description: "Walk via deep underground escalators connecting the Yellow and Magenta platforms"
      };
    }
    // Rajiv Chowk
    if (stationId === "RC") {
      return {
        type: "Concourse Interchange Way",
        distance: "200m",
        time: 4,
        description: "Walk via main central concourse escalators/stairs between Blue and Yellow platforms"
      };
    }
    // Kashmere Gate
    if (stationId === "KG") {
      return {
        type: "Multi-level Interchange Tunnel",
        distance: "300m",
        time: 5,
        description: "Walk via multi-level escalator shafts connecting Red, Yellow, and Violet lines"
      };
    }
    
    // Default interchange walk
    return {
      type: "Interchange Concourse Walk",
      distance: "150m",
      time: 4,
      description: "Standard interchange walk via station concourse walkway"
    };
  };

  const getCrowdColor = (val) => {
    if (val < 4) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (val < 7) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  const getSafetyColor = (val) => {
    if (val >= 8) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (val >= 6) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  const getCondensedLegs = () => {
    const legs = [];
    if (path.length === 0) return legs;

    let currentLeg = {
      line: routeEdges[0]?.line || path[0].lines[0],
      startStation: path[0],
      endStation: path[0],
      stopsCount: 0,
      duration: 0,
      edges: []
    };

    routeEdges.forEach((edge, idx) => {
      if (edge.isTransfer) {
        legs.push(currentLeg);
        currentLeg = {
          line: edge.line,
          startStation: path[idx],
          endStation: path[idx + 1],
          stopsCount: 1,
          duration: edge.adjustedTime || edge.baseTime,
          edges: [edge]
        };
      } else {
        currentLeg.endStation = path[idx + 1];
        currentLeg.stopsCount++;
        currentLeg.duration += edge.adjustedTime || edge.baseTime;
        currentLeg.edges.push(edge);
      }
    });
    legs.push(currentLeg);
    return legs;
  };

  const condensedLegs = getCondensedLegs();

  // Smart Card Savings details
  const discountPercentage = timeOfDay === "Off-Peak" ? 20 : 10;
  const regularFare = metrics.fare;
  const smartCardFare = Math.round(regularFare * (1 - discountPercentage / 100));
  const savings = regularFare - smartCardFare;

  // Outages
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
      
      {/* Route Overview Metrics */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
        <div className="bg-slate-900/50 border border-white/5 p-3 rounded-xl flex flex-col justify-center text-center">
          <Clock className="h-4 w-4 mx-auto mb-1 text-cyan-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time</span>
          <span className="text-base font-outfit font-extrabold text-white mt-0.5">{metrics.time}m</span>
        </div>

        <div className="bg-slate-900/50 border border-white/5 p-3 rounded-xl flex flex-col justify-center text-center">
          <Gauge className="h-4 w-4 mx-auto mb-1 text-sky-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Distance</span>
          <span className="text-base font-outfit font-extrabold text-white mt-0.5">{metrics.distance} km</span>
        </div>

        <div className="bg-slate-900/50 border border-white/5 p-3 rounded-xl flex flex-col justify-center text-center">
          <GitCompare className="h-4 w-4 mx-auto mb-1 text-purple-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transfers</span>
          <span className="text-base font-outfit font-extrabold text-white mt-0.5">{metrics.transfers}</span>
        </div>

        <div className="bg-slate-900/50 border border-white/5 p-3 rounded-xl flex flex-col justify-center text-center">
          <Coins className="h-4 w-4 mx-auto mb-1 text-[#FFC72C]" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fare</span>
          <span className="text-base font-outfit font-extrabold text-white mt-0.5">
            ₹{useSmartCard ? smartCardFare : regularFare}
          </span>
        </div>

        <div className={`border p-3 rounded-xl flex flex-col justify-center text-center ${getCrowdColor(metrics.crowd)}`}>
          <Users className="h-4 w-4 mx-auto mb-1" />
          <span className="text-xs font-bold opacity-80 uppercase tracking-wider">Crowd</span>
          <span className="text-base font-outfit font-extrabold mt-0.5">{metrics.crowd}/10</span>
        </div>

        <div className="bg-slate-900/50 border border-white/5 p-3 rounded-xl flex flex-col justify-center text-center">
          <Smile className="h-4 w-4 mx-auto mb-1 text-emerald-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comfort</span>
          <span className="text-base font-outfit font-extrabold text-white mt-0.5">{metrics.comfort}/10</span>
        </div>

        <div className={`border p-3 rounded-xl flex flex-col justify-center text-center ${getSafetyColor(metrics.safety)}`}>
          <Shield className="h-4 w-4 mx-auto mb-1" />
          <span className="text-xs font-bold opacity-80 uppercase tracking-wider">Safety</span>
          <span className="text-base font-outfit font-extrabold mt-0.5">{metrics.safety}/10</span>
        </div>
      </div>

      {/* Visual Subway Node Flow Map */}
      <div className="bg-slate-900/40 border border-white/5 p-4 rounded-xl flex items-center overflow-x-auto select-none space-x-3 max-w-full">
        {condensedLegs.map((leg, idx) => {
          const isLast = idx === condensedLegs.length - 1;
          const lineColor = LINE_COLORS[leg.line] || "#475569";

          return (
            <React.Fragment key={idx}>
              <div className="flex items-center shrink-0 bg-slate-950/60 border border-white/5 px-3 py-2 rounded-xl">
                <span 
                  className="w-3.5 h-3.5 rounded-full inline-block mr-2 shrink-0 border border-white/10"
                  style={{ backgroundColor: lineColor }}
                />
                <div className="flex flex-col text-left">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{leg.line} Line</span>
                  <span className="text-xs font-bold text-white whitespace-nowrap">{leg.startStation.name}</span>
                  {(() => {
                    const boardingInfo = getLegBoardingInfo(leg);
                    return boardingInfo ? (
                      <span className="text-[10px] text-cyan-400 font-semibold mt-0.5 whitespace-nowrap">
                        Plat {boardingInfo.platNum} • to {boardingInfo.termName}
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>

              {!isLast && (
                <div className="flex flex-col items-center justify-center shrink-0 px-1 text-slate-500">
                  <ArrowRight className="h-4 w-4 text-purple-400 animate-pulse" />
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mt-0.5">Transfer</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
        
        <div className="flex items-center shrink-0 bg-rose-950/20 border border-rose-500/20 px-3 py-2 rounded-xl">
          <MapPin className="h-4 w-4 text-rose-400 mr-2 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-[11px] text-rose-400 font-bold uppercase tracking-wider">Destination</span>
            <span className="text-xs font-bold text-white whitespace-nowrap">{destinationStation.name}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 pb-2 space-x-4">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-all ${
            activeTab === "timeline" ? "text-cyan-400 border-cyan-400" : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Timeline
        </button>
        <button
          onClick={() => setActiveTab("fare")}
          className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-all ${
            activeTab === "fare" ? "text-cyan-400 border-cyan-400" : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Fare Breakdowns
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
          Facility Outages {pathAlerts.length > 0 && (
            <span className="ml-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
              {pathAlerts.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto max-h-[350px]">
        
        {/* Timeline */}
        {activeTab === "timeline" && (
          <div className="relative pl-5 border-l border-slate-700/80 space-y-5 py-2">
            {path.map((station, idx) => {
              const isStart = idx === 0;
              const isEnd = idx === path.length - 1;
              const nextEdge = routeEdges[idx];
              const hasAlert = infrastructureStatus[station.id]?.escalator === "Under Maintenance" || 
                                infrastructureStatus[station.id]?.elevator === "Under Maintenance";

              return (
                <div key={station.id} className="relative group">
                  <span
                    className={`absolute -left-[27px] top-[5px] w-[14px] h-[14px] rounded-full border-3 border-slate-950 transition-all ${
                      isStart 
                        ? "bg-cyan-400 shadow-glow-cyan" 
                        : isEnd 
                        ? "bg-rose-500 shadow-glow-red" 
                        : "bg-slate-400"
                    }`}
                  />

                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-outfit text-sm font-bold text-slate-100">{station.name}</span>
                      {hasAlert && (
                        <span className="flex items-center space-x-0.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Alert</span>
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-1.5">
                      {station.lines.map(l => (
                        <span
                          key={l}
                          className="text-[10px] font-bold px-1.5 py-0.2 rounded border"
                          style={{
                            borderColor: `${LINE_COLORS[l] || "#475569"}25`,
                            color: LINE_COLORS[l] || "#94a3b8",
                            backgroundColor: `${LINE_COLORS[l] || "#475569"}10`
                          }}
                        >
                          {l}
                        </span>
                      ))}
                    </div>

                    {isStart && nextEdge && (() => {
                      const termName = getTerminalStationName(station.id, path[1]?.id, nextEdge.line);
                      const platNum = getPlatformNumber(station, nextEdge.line, termName);
                      return (
                        <div className="text-xs text-cyan-400 font-bold mt-1.5 bg-cyan-950/25 border border-cyan-500/20 px-2.5 py-1 rounded w-fit">
                          Board <span className="text-white">{nextEdge.line} Line</span> towards <span className="text-white">{termName}</span> (Platform {platNum})
                        </div>
                      );
                    })()}

                    {!isStart && nextEdge?.isTransfer && (() => {
                      const termName = getTerminalStationName(station.id, path[idx + 1]?.id, nextEdge.line);
                      const platNum = getPlatformNumber(station, nextEdge.line, termName);
                      const walkInfo = getTransferWalkInfo(station.id, nextEdge.line);
                      const adjustedWalkTime = timeOfDay === "Peak" ? walkInfo.time + 3 : walkInfo.time;
                      return (
                        <div className="mt-1.5 space-y-1.5">
                          <div className="text-xs text-purple-400 font-bold bg-purple-950/25 border border-purple-500/20 px-2.5 py-1 rounded w-fit">
                            Change to <span className="text-white">{nextEdge.line} Line</span> towards <span className="text-white">{termName}</span> (Platform {platNum})
                          </div>
                          <div className="text-xs text-slate-400 pl-2 border-l-2 border-purple-500/30 flex flex-col space-y-1 text-left">
                            <span className="text-purple-300 font-medium">🚶 {walkInfo.type}: ~{adjustedWalkTime} mins walk ({walkInfo.distance})</span>
                            <span className="text-[11px] text-slate-500">{walkInfo.description} {timeOfDay === "Peak" && "(+3 mins peak crowd delay)"}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {isEnd && (
                      <div className="text-xs text-rose-400 font-bold mt-1.5 bg-rose-950/25 border border-rose-500/20 px-2.5 py-1 rounded w-fit">
                        Destination reached
                      </div>
                    )}

                    {nextEdge && !isEnd && (
                      <div className="mt-2.5 pl-4 py-2 border-l-2 border-dashed border-slate-800 text-xs text-slate-400 flex flex-col space-y-1.5 bg-slate-900/10 rounded-r-lg">
                        <div className="flex items-center space-x-1 text-slate-300">
                          <ArrowRight className="h-3 w-3 text-cyan-400" />
                          <span>Ride <span className="font-bold text-white">{nextEdge.line} Line</span></span>
                        </div>
                        <div className="flex items-center space-x-4 text-[11px]">
                          <span>Duration: <strong>{Math.round(nextEdge.adjustedTime || nextEdge.baseTime)} mins</strong></span>
                          <span>Crowd: <strong className={getCrowdColor(nextEdge.crowdFactor).split(" ")[0]}>{nextEdge.crowdFactor}/10</strong></span>
                        </div>
                        
                        {nextEdge.isTransfer && (() => {
                          const walkInfo = getTransferWalkInfo(station.id, nextEdge.line);
                          const adjustedWalkTime = timeOfDay === "Peak" ? walkInfo.time + 3 : walkInfo.time;
                          return (
                            <div className="mt-1.5 p-2 rounded bg-purple-950/20 border border-purple-500/15 text-purple-300 flex flex-col space-y-1 text-xs text-left">
                              <div className="flex items-center space-x-1.5 font-bold">
                                <GitCompare className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                                <span>Transfer via {walkInfo.type} ({walkInfo.distance})</span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Walk time: <strong>~{adjustedWalkTime} mins</strong> • {walkInfo.description}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Fare */}
        {activeTab === "fare" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Single Journey Token</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Vending Machine Purchase</p>
                </div>
                <div className="text-2xl font-outfit font-extrabold text-white mt-4 font-outfit">₹{regularFare}</div>
              </div>

              <div className={`border p-4 rounded-xl flex flex-col justify-between ${
                useSmartCard ? "bg-amber-500/10 border-amber-500/30" : "bg-slate-900/30 border-white/5 opacity-60"
              }`}>
                <div>
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 font-outfit">
                    <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
                    Metro Smart Card
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Includes {discountPercentage}% discount</p>
                </div>
                <div className="text-2xl font-outfit font-extrabold text-amber-300 mt-4 font-outfit">₹{smartCardFare}</div>
              </div>
            </div>

            {useSmartCard ? (
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/25 p-3 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span><strong>Smart Card Discount Active!</strong> You saved ₹{savings} ({discountPercentage}% off).</span>
                </div>
                <span className="text-xs bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded shadow uppercase">Saved</span>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-white/5 p-3.5 rounded-xl text-xs text-slate-400 flex items-start space-x-2.5">
                <CreditCard className="h-4.5 w-4.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-200">Recommendation: Use a Smart Card</h5>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Using a metro card gives you a 10% discount during Peak Hours, and a <strong>20% discount</strong> during Off-Peak hours. Enable "Metro Smart Card" in the Planner panel to calculate discounted pricing.
                  </p>
                </div>
              </div>
            )}

            <div className="border border-white/5 rounded-xl p-3.5 text-xs bg-slate-900/20 space-y-2">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-xs">Fare Breakdown Details</h5>
              <div className="space-y-1 text-slate-400">
                {routeEdges.some(e => e.line === "Orange") ? (
                  <div className="flex justify-between text-cyan-400 font-semibold">
                    <span>Airport Express Premium Flat Fare:</span>
                    <span>₹60.00</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Base Minimum Fare:</span>
                      <span className="text-slate-200">₹10.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distance Charge ({metrics.distance} km @ ₹2.5/km):</span>
                      <span className="text-slate-200">₹{Math.round(metrics.distance * 2.5 * 100) / 100}</span>
                    </div>
                    {metrics.transfers > 0 && (
                      <div className="flex justify-between">
                        <span>Interchange surcharge (₹2/transfer):</span>
                        <span className="text-slate-200">₹{metrics.transfers * 2}.00</span>
                      </div>
                    )}
                  </>
                )}
                <div className="border-t border-white/5 pt-1.5 flex justify-between font-bold text-slate-200">
                  <span>Subtotal Calculated Fare:</span>
                  <span>₹{regularFare}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exits */}
        {activeTab === "exits" && (
          <div className="space-y-4">
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
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    recommendedExit.lit === "Well-Lit" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                  }`}>
                    {recommendedExit.lit}
                  </span>
                  {recommendedExit.accessibility?.map(acc => (
                    <span key={acc} className="text-xs font-bold px-2 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-300 border-indigo-500/20 flex items-center gap-0.5">
                      <Accessibility className="h-2.5 w-2.5" /> {acc}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 italic">
                  * Recommended based on lighting security checks and your {accessibilityOnly ? "accessibility settings" : "safety mode"}.
                </p>
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic">No exit data available for destination.</p>
            )}

            <div className="space-y-2">
              <h4 className="font-outfit font-bold text-xs text-slate-300 uppercase tracking-wider">All Gates / Exits</h4>
              <div className="space-y-2">
                {destinationStation.exits?.map(exit => (
                  <div key={exit.gate} className="p-3 rounded-lg bg-slate-900/50 border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-slate-800 text-slate-300 font-bold px-1.5 py-0.2 rounded border border-white/10">Gate {exit.gate}</span>
                        <span className="font-semibold text-slate-200">{exit.name}</span>
                      </div>
                      <div className="flex space-x-1.5 mt-1.5 text-xs text-slate-400">
                        <span>Lighting: <strong className="text-slate-300">{exit.lit}</strong></span>
                        <span>•</span>
                        <span>Accessibility: <strong className="text-slate-300">{exit.accessibility?.join(", ") || "None"}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Status Alerts & Live Reporting */}
        {activeTab === "status" && (
          <div className="space-y-4">
            {/* Community Crowd Report Form */}
            <form onSubmit={handleReportSubmit} className="bg-slate-900/60 border border-white/5 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-outfit">
                <Users className="h-4 w-4 text-cyan-400" />
                Report Live Crowd Density
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Select Station</label>
                  <select
                    value={reportingStationId}
                    onChange={(e) => setReportingStationId(e.target.value)}
                    className="w-full pl-2.5 pr-8 py-2 rounded-lg bg-slate-950/80 border border-white/5 text-slate-300 font-semibold cursor-pointer"
                    required
                  >
                    <option value="">Choose station...</option>
                    {path.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Crowd Level</label>
                  <select
                    value={reportedLevel}
                    onChange={(e) => setReportedLevel(e.target.value)}
                    className="w-full pl-2.5 pr-8 py-2 rounded-lg bg-slate-950/80 border border-white/5 text-slate-300 font-semibold cursor-pointer"
                  >
                    <option value="Low">🟢 Low / Seats Empty</option>
                    <option value="Moderate">🟡 Moderate / Standing Room</option>
                    <option value="High">🟠 High / Very Crowded</option>
                    <option value="Heavy Rush">🔴 Heavy Rush / Snags</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={!reportingStationId || reportSuccess}
                className={`w-full py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  reportSuccess 
                    ? "bg-emerald-500 text-slate-950" 
                    : "bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                }`}
              >
                {reportSuccess ? "✓ Crowd Report Submitted" : "Submit Live Report"}
              </button>
            </form>

            {/* Outage Alerts */}
            {pathAlerts.length > 0 ? (
              <div className="space-y-2.5">
                {pathAlerts.map((alert, idx) => (
                  <div key={idx} className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start space-x-2.5 text-xs text-rose-300">
                    <AlertTriangle className="h-4.5 w-4.5 mt-0.5 text-rose-400" />
                    <div>
                      <h5 className="font-bold text-slate-200">{alert.stationName} Outage</h5>
                      <p className="text-xs text-rose-300/80 mt-0.5">
                        The station's <strong>{alert.type}</strong> is currently down for maintenance. Access via stairs/alternate gates.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl flex items-center space-x-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <h5 className="font-bold text-slate-200">All Infrastructure Clear</h5>
                  <p className="text-xs text-emerald-300/80 mt-0.5">
                    All escalators and elevators on your selected path are reported fully operational.
                  </p>
                </div>
              </div>
            )}

            <div className="border border-white/5 rounded-xl overflow-hidden mt-3 text-xs bg-slate-900/20">
              <div className="grid grid-cols-3 bg-slate-900/60 p-2.5 font-bold text-slate-300 text-xs uppercase border-b border-white/5">
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
