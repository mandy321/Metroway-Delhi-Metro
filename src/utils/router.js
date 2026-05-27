// Modified Dijkstra Routing Engine decoupled from static imports
export function getWeights(mode) {
  switch (mode) {
    case "Fastest":
      return { time: 0.8, crowd: 0.06, comfort: 0.06, safety: 0.08 };
    case "Least Crowd":
      return { time: 0.06, crowd: 0.8, comfort: 0.06, safety: 0.08 };
    case "Women's Safety":
      return { time: 0.06, crowd: 0.06, comfort: 0.08, safety: 0.8 };
    case "Balanced":
    default:
      return { time: 0.4, crowd: 0.3, comfort: 0.2, safety: 0.1 };
  }
}

// Haversine distance calculator
export function getHaversineDistance(coord1, coord2) {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  const R = 6371; // Earth's radius in km

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Build adjacency graph dynamically from edge array
function buildGraph(stations, edges) {
  const graph = {};
  
  stations.forEach(station => {
    graph[station.id] = [];
  });

  edges.forEach(edge => {
    // Add forward direction (undirected)
    if (graph[edge.source]) {
      graph[edge.source].push({
        to: edge.target,
        line: edge.line,
        baseTime: edge.baseTime,
        crowdFactor: edge.crowdFactor,
        safetyRating: edge.safetyRating,
        comfortFactor: edge.comfortFactor
      });
    }

    // Add backward direction
    if (graph[edge.target]) {
      graph[edge.target].push({
        to: edge.source,
        line: edge.line,
        baseTime: edge.baseTime,
        crowdFactor: edge.crowdFactor,
        safetyRating: edge.safetyRating,
        comfortFactor: edge.comfortFactor
      });
    }
  });

  return graph;
}

/**
 * Calculates optimal path using Dijkstra dynamically supplied with station & edge datasets
 */
export function calculateRoute(stations, edges, startId, endId, mode, timeOfDay = "Off-Peak") {
  if (!startId || !endId || !stations || !edges) return null;

  const startStation = stations.find(s => s.id === startId);
  const endStation = stations.find(s => s.id === endId);

  if (!startStation || !endStation) return null;

  if (startId === endId) {
    return {
      path: [startStation],
      edges: [],
      metrics: {
        time: 0,
        transfers: 0,
        fare: 0,
        crowd: startStation.baseCrowd,
        comfort: 10,
        safety: 10,
        distance: 0
      },
      transfersList: []
    };
  }

  const graph = buildGraph(stations, edges);
  const weights = getWeights(mode);
  const isPeak = timeOfDay === "Peak";

  const dist = {};
  const prev = {};
  const queue = [];

  // Initialize start states
  startStation.lines.forEach(line => {
    const key = `${startId}:${line}`;
    dist[key] = 0;
    queue.push({ key, stationId: startId, line, cost: 0 });
  });

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const curr = queue.shift();
    const currKey = curr.key;

    if (dist[currKey] < curr.cost) continue;

    const neighbors = graph[curr.stationId] || [];
    neighbors.forEach(neighbor => {
      const isTransfer = curr.line !== neighbor.line;
      const transferTimePenalty = isTransfer ? (isPeak ? 8 : 5) : 0;
      const transferComfortPenalty = isTransfer ? 2 : 0;

      let adjustedBaseTime = neighbor.baseTime;
      if (isPeak && neighbor.crowdFactor >= 7 && neighbor.line !== "Orange") {
        adjustedBaseTime = neighbor.baseTime * 1.25;
      }

      const edgeCost = 
        (weights.time * adjustedBaseTime) + 
        (weights.crowd * neighbor.crowdFactor) + 
        (weights.comfort * neighbor.comfortFactor) + 
        (weights.safety * (10 - neighbor.safetyRating));
      
      const penaltyCost = 
        (weights.time * transferTimePenalty) + 
        (weights.comfort * transferComfortPenalty);

      const transitionCost = edgeCost + penaltyCost;
      const nextKey = `${neighbor.to}:${neighbor.line}`;
      const newDist = dist[currKey] + transitionCost;

      if (dist[nextKey] === undefined || newDist < dist[nextKey]) {
        dist[nextKey] = newDist;
        prev[nextKey] = {
          key: currKey,
          stationId: curr.stationId,
          line: curr.line,
          edgeUsed: {
            source: curr.stationId,
            target: neighbor.to,
            line: neighbor.line,
            baseTime: neighbor.baseTime,
            adjustedTime: adjustedBaseTime,
            crowdFactor: neighbor.crowdFactor,
            safetyRating: neighbor.safetyRating,
            comfortFactor: neighbor.comfortFactor,
            isTransfer
          }
        };
        queue.push({ key: nextKey, stationId: neighbor.to, line: neighbor.line, cost: newDist });
      }
    });
  }

  // Find optimal terminus
  let bestEndKey = null;
  let minEndCost = Infinity;

  endStation.lines.forEach(line => {
    const key = `${endId}:${line}`;
    if (dist[key] !== undefined && dist[key] < minEndCost) {
      minEndCost = dist[key];
      bestEndKey = key;
    }
  });

  if (!bestEndKey) return null;

  // Reconstruct path
  const pathStates = [];
  let currKey = bestEndKey;
  while (currKey) {
    const [stationId, line] = currKey.split(":");
    pathStates.unshift({ stationId, line, prevInfo: prev[currKey] });
    currKey = prev[currKey] ? prev[currKey].key : null;
  }

  const pathStations = [];
  const pathEdges = [];
  const transfersList = [];

  pathStates.forEach((state, idx) => {
    const station = stations.find(s => s.id === state.stationId);
    if (station) {
      pathStations.push(station);
    }

    if (idx > 0) {
      const prevInfo = state.prevInfo;
      pathEdges.push(prevInfo.edgeUsed);

      if (prevInfo.edgeUsed.isTransfer) {
        const transferStation = stations.find(s => s.id === prevInfo.stationId);
        transfersList.push({
          stationName: transferStation ? transferStation.name : prevInfo.stationId,
          fromLine: prevInfo.line,
          toLine: prevInfo.edgeUsed.line
        });
      }
    }
  });

  // Calculate metrics
  let totalTime = 0;
  let totalCrowd = 0;
  let totalSafety = 0;
  let transfersCount = 0;
  let totalDistance = 0;

  pathEdges.forEach((edge) => {
    totalTime += edge.adjustedTime;
    totalCrowd += edge.crowdFactor;
    totalSafety += edge.safetyRating;
    
    if (edge.isTransfer) {
      transfersCount++;
      totalTime += isPeak ? 8 : 5;
    }

    const sCoord = stations.find(s => s.id === edge.source)?.coordinates;
    const tCoord = stations.find(s => s.id === edge.target)?.coordinates;
    
    if (sCoord && tCoord) {
      totalDistance += getHaversineDistance(sCoord, tCoord);
    }
  });

  const edgeCount = pathEdges.length;
  const avgCrowd = edgeCount > 0 ? totalCrowd / edgeCount : startStation.baseCrowd;
  const avgSafety = edgeCount > 0 ? totalSafety / edgeCount : 10;

  let peakPenalty = isPeak ? 1.5 : 0;
  let comfortScore = 10 - (avgCrowd * 0.6 + transfersCount * 1.2 + peakPenalty);
  comfortScore = Math.max(1, Math.min(10, Math.round(comfortScore * 10) / 10));

  const hasAirportExpress = pathEdges.some(edge => edge.line === "Orange");
  let fare = 0;
  if (hasAirportExpress) {
    fare = 60;
  } else {
    let baseFare = 10 + (totalDistance * 2.5) + (transfersCount * 2);
    fare = Math.min(60, Math.max(10, Math.round(baseFare)));
  }

  return {
    path: pathStations,
    edges: pathEdges,
    metrics: {
      time: Math.round(totalTime),
      transfers: transfersCount,
      fare,
      crowd: Math.round(avgCrowd * 10) / 10,
      comfort: comfortScore,
      safety: Math.round(avgSafety * 10) / 10,
      distance: Math.round(totalDistance * 10) / 10
    },
    transfersList
  };
}
