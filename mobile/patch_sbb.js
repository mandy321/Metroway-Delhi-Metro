const fs = require('fs');
const path = '/Users/mandeep/Documents/Metroway- Delhi Metro App, Map/mobile/src/data/metroData.js';
let content = fs.readFileSync(path, 'utf8');

const sbbStation = `  { id: "RRTS_SBB", name: "Sahibabad RRTS", lines: ["RRTS"], coordinates: [28.6653, 77.3488], baseCrowd: 6, exits: [] },\n`;

// Insert the station before Ghaziabad RRTS
content = content.replace(
  '{ id: "RRTS_GZB"',
  sbbStation + '  { id: "RRTS_GZB"'
);

// Replace RRTS_AV -> RRTS_GZB edge with RRTS_AV -> RRTS_SBB and RRTS_SBB -> RRTS_GZB
// Since the edges array has multiple copies or might have multiple occurrences, let's replace all occurrences globally.
const oldEdge = '{ source: "RRTS_AV", target: "RRTS_GZB", line: "RRTS", baseTime: 8, crowdFactor: 5, safetyRating: 9, comfortFactor: 9 },';
const newEdges = '{ source: "RRTS_AV", target: "RRTS_SBB", line: "RRTS", baseTime: 5, crowdFactor: 5, safetyRating: 9, comfortFactor: 9 },\n  { source: "RRTS_SBB", target: "RRTS_GZB", line: "RRTS", baseTime: 4, crowdFactor: 5, safetyRating: 9, comfortFactor: 9 },';

content = content.split(oldEdge).join(newEdges);

fs.writeFileSync(path, content);
console.log('Sahibabad Patched');
