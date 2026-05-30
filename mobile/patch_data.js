const fs = require('fs');
const path = '/Users/mandeep/Documents/Metroway- Delhi Metro App, Map/mobile/src/data/metroData.js';
let content = fs.readFileSync(path, 'utf8');

const newStations = `
  { id: "LZN", name: "Laxmi Nagar", lines: ["Blue"], coordinates: [28.6305, 77.2773], baseCrowd: 7, exits: [] },
  { id: "NVR", name: "Nirman Vihar", lines: ["Blue"], coordinates: [28.6366, 77.2871], baseCrowd: 6, exits: [] },
  { id: "PRV", name: "Preet Vihar", lines: ["Blue"], coordinates: [28.6384, 77.2947], baseCrowd: 5, exits: [] },
  { id: "KSM", name: "Kaushambi", lines: ["Blue"], coordinates: [28.6454, 77.3252], baseCrowd: 5, exits: [] },
  { id: "VSH", name: "Vaishali", lines: ["Blue"], coordinates: [28.6499, 77.3400], baseCrowd: 6, exits: [] },
`;

const newEdges = `
  { source: "IND", target: "YB", line: "Blue", baseTime: 3, crowdFactor: 6, safetyRating: 8, comfortFactor: 7 },
  { source: "YB", target: "MVI", line: "Blue", baseTime: 5, crowdFactor: 6, safetyRating: 8, comfortFactor: 7 },
  { source: "YB", target: "LZN", line: "Blue", baseTime: 3, crowdFactor: 6, safetyRating: 8, comfortFactor: 7 },
  { source: "LZN", target: "NVR", line: "Blue", baseTime: 2, crowdFactor: 6, safetyRating: 8, comfortFactor: 7 },
  { source: "NVR", target: "PRV", line: "Blue", baseTime: 2, crowdFactor: 6, safetyRating: 8, comfortFactor: 7 },
  { source: "PRV", target: "KK", line: "Blue", baseTime: 3, crowdFactor: 6, safetyRating: 8, comfortFactor: 7 },
  { source: "AV", target: "KSM", line: "Blue", baseTime: 3, crowdFactor: 6, safetyRating: 8, comfortFactor: 7 },
  { source: "KSM", target: "VSH", line: "Blue", baseTime: 3, crowdFactor: 6, safetyRating: 8, comfortFactor: 7 },
`;

content = content.replace('export const STATIONS = [', 'export const STATIONS = [' + newStations);
content = content.replace('export const EDGES = [', 'export const EDGES = [' + newEdges);

fs.writeFileSync(path, content);
console.log('Patched');
