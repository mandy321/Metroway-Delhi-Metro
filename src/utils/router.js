import { STATIONS, EDGES } from "../data/metroData";

// Retrieve weights based on routing mode
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

// Build adjacency graph from metro edges
// Since connections are bidirectional, we add both ways
function buildGraph() {
  const graph = {};
  
  STATIONS.forEach(station => {
    graph[station.id] = [];
  });

  EDGES.forEach(edge => {
    // Forward direction
    graph[edge.source].push({
      to: edge.target,
      line: edge.line,
      baseTime: edge.baseTime,
      crowdFactor: edge.crowdFactor,
      safetyRating: edge.safetyRating,
      comfortFactor: edge.comfortFactor
    });

    // Backward direction
    graph[edge.target].push({
      to: edge.source,
      line: edge.line,
      baseTime: edge.baseTime,
      crowdFactor: edge.crowdFactor,
      safetyRating: edge.safetyRating,
      comfortFactor: edge.comfortFactor
    });
  });

  return graph;
}

/**
 * Calculates the optimal route from start to end station using Modified Dijkstra
 * Nodes in Dijkstra are pairs of (stationId, line) to handle transfer penalties correctly
 */
export function calculateRoute(startId, endId, mode) {
  if (!startId || !endId) return null;
  if (startId === endId) {
    const station = STATIONS.find(s => s.id === startId);
    return {
      path: [station],
      edges: [],
      metrics: {
        time: 0,
        transfers: 0,
        fare: 0,
        crowd: station.baseCrowd,
        comfort: 10,
        safety: 10
      },
      transfersList: []
    };
  }

  const graph = buildGraph();
  const weights = getWeights(mode);

  // Dijkstra data structures
  // key: "stationId:line"
  const dist = {};
  const prev = {};
  const queue = [];

  const startStation = STATIONS.find(s => s.id === startId);
  const endStation = STATIONS.find(s => s.id === endId);

  if (!startStation || !endStation) return null;

  // Initialize start states
  // User can start on any line passing through the start station
  startStation.lines.forEach(line => {
    const key = `${startId}:${line}`;
    dist[key] = 0;
    queue.push({ key, stationId: startId, line, cost: 0 });
  });

  while (queue.length > 0) {
    // Sort queue to get the node with the minimum cost (simple priority queue)
    queue.sort((a, b) => a.cost - b.cost);
    const curr = queue.shift();
    const currKey = curr.key;

    // If we reached the end station, we don't stop immediately to ensure we find the absolute shortest path,
    // but standard Dijkstra guarantees it once it is popped if weights are non-negative.
    if (dist[currKey] < curr.cost) continue;

    const neighbors = graph[curr.stationId] || [];
    neighbors.forEach(neighbor => {
      // Transition from curr.line to neighbor.line
      // If lines differ, there is a transfer penalty
      const isTransfer = curr.line !== neighbor.line;
      const transferTimePenalty = isTransfer ? 5 : 0; // 5 mins penalty
      const transferComfortPenalty = isTransfer ? 2 : 0; // comfort penalty

      // Cost calculation
      const edgeCost = 
        (weights.time * neighbor.baseTime) + 
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

  // Find the end state with the lowest cost
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

  // Build the list of stations, edges, and transfers
  const pathStations = [];
  const pathEdges = [];
  const transfersList = [];

  pathStates.forEach((state, idx) => {
    const station = STATIONS.find(s => s.id === state.stationId);
    pathStations.push(station);

    if (idx > 0) {
      const prevInfo = state.prevInfo;
      pathEdges.push(prevInfo.edgeUsed);

      if (prevInfo.edgeUsed.isTransfer) {
        transfersList.push({
          stationName: STATIONS.find(s => s.id === prevInfo.stationId).name,
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

  pathEdges.forEach(edge => {
    totalTime += edge.baseTime;
    totalCrowd += edge.crowdFactor;
    totalSafety += edge.safetyRating;
    if (edge.isTransfer) {
      transfersCount++;
      totalTime += 5; // Add transfer time penalty to total time metric
    }
  });

  const edgeCount = pathEdges.length;
  const avgCrowd = edgeCount > 0 ? totalCrowd / edgeCount : startStation.baseCrowd;
  const avgSafety = edgeCount > 0 ? totalSafety / edgeCount : 10;

  // Comfort Score: starts at 10, penalizes for crowd and transfers
  let comfortScore = 10 - (avgCrowd * 0.6 + transfersCount * 1.2);
  comfortScore = Math.max(1, Math.min(10, Math.round(comfortScore * 10) / 10));

  // Fare: INR 10 base + INR 3 per station connection, max 60
  const fare = Math.min(60, 10 + edgeCount * 3);

  return {
    path: pathStations,
    edges: pathEdges,
    metrics: {
      time: Math.round(totalTime),
      transfers: transfersCount,
      fare,
      crowd: Math.round(avgCrowd * 10) / 10,
      comfort: comfortScore,
      safety: Math.round(avgSafety * 10) / 10
    },
    transfersList
  };
}
