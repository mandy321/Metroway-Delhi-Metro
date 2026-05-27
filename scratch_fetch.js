import fs from 'fs';

// Read the current metroData.js and parse stations/edges
const content = fs.readFileSync('src/data/metroData.js', 'utf-8');

// Parse the stations and edges from the generated file
const stationsMatch = content.match(/export const STATIONS = \[([\s\S]*?)\];/);
const edgesMatch = content.match(/export const EDGES = \[([\s\S]*?)\];/);

if (!stationsMatch || !edgesMatch) {
  console.error('Could not parse metroData.js');
  process.exit(1);
}

// eval is safe here - we control the file
const stations = eval('[' + stationsMatch[1] + ']');
const edges = eval('[' + edgesMatch[1] + ']');

console.log(`Loaded ${stations.length} stations and ${edges.length} edges`);

// ============================
// Gate/Exit enrichment data
// ============================

// Well-known landmark exits for major stations
const exitOverrides = {
  "Kashmere Gate": [
    { gate: "1", name: "ISBT Bus Terminal", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] },
    { gate: "2", name: "Mori Gate / Lothian Road", lit: "Well-Lit", accessibility: ["Escalator", "Wheelchair Ramp"] },
    { gate: "3", name: "Lal Qila Road / Old Delhi", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ],
  "Rajiv Chowk": [
    { gate: "1", name: "Connaught Place Block A", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] },
    { gate: "2", name: "Palika Bazar / Block H", lit: "Well-Lit", accessibility: ["Escalator"] },
    { gate: "3", name: "Outer Circle / Janpath Side", lit: "Well-Lit", accessibility: ["Elevator", "Wheelchair Ramp"] },
    { gate: "4", name: "Block D / Barakhamba Side", lit: "Well-Lit", accessibility: ["Escalator"] }
  ],
  "New Delhi": [
    { gate: "1", name: "Paharganj / NDLS Main Gate", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] },
    { gate: "2", name: "Ajmeri Gate / Airport Express Link", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "3", name: "Chelmsford Road", lit: "Well-Lit", accessibility: ["Escalator"] }
  ],
  "Central Secretariat": [
    { gate: "1", name: "Krishi Bhawan / Shastri Bhawan", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Parliament Street / North Block", lit: "Well-Lit", accessibility: ["Escalator"] }
  ],
  "Chandni Chowk": [
    { gate: "1", name: "Old Delhi Railway Station", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Chandni Chowk Main Market", lit: "Moderate", accessibility: ["Escalator"] },
    { gate: "3", name: "Town Hall / Nai Sarak", lit: "Well-Lit", accessibility: ["Elevator"] }
  ],
  "INA": [
    { gate: "1", name: "Dilli Haat / INA Market", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Kidwai Nagar Side", lit: "Moderate", accessibility: ["Escalator", "Wheelchair Ramp"] }
  ],
  "AIIMS": [
    { gate: "1", name: "AIIMS Hospital Main Gate", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] },
    { gate: "2", name: "Safdarjung Hospital Side", lit: "Well-Lit", accessibility: ["Escalator"] }
  ],
  "Hauz Khas": [
    { gate: "1", name: "IIT Delhi / Outer Ring Road", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Hauz Khas Village / Deer Park", lit: "Moderate", accessibility: ["Escalator"] }
  ],
  "Huda City Centre": [
    { gate: "1", name: "Fortis Hospital / Leisure Valley", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Sector 29 Market / Cyber Hub Link", lit: "Well-Lit", accessibility: ["Elevator"] }
  ],
  "Dwarka Sector 21": [
    { gate: "1", name: "Pacific D21 Mall", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Airport Express Link / Sector 21", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] }
  ],
  "Rajouri Garden": [
    { gate: "1", name: "TDI Mall / Main Market", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Subhash Nagar Side", lit: "Moderate", accessibility: ["Escalator"] }
  ],
  "Botanical Garden": [
    { gate: "1", name: "Noida Sector 37 Bus Stand", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Sector 38 / Amity University Link", lit: "Well-Lit", accessibility: ["Escalator"] }
  ],
  "Mandi House": [
    { gate: "1", name: "National School of Drama / Copernicus Marg", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Bengali Market / Barakhamba Road", lit: "Well-Lit", accessibility: ["Escalator"] }
  ],
  "Lajpat Nagar": [
    { gate: "1", name: "Central Market / Ring Road", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Defence Colony Flyover", lit: "Moderate", accessibility: ["Escalator"] }
  ],
  "Nehru Place": [
    { gate: "1", name: "Nehru Place IT Market", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Eros Corporate Tower / Harkesh Nagar", lit: "Well-Lit", accessibility: ["Escalator"] }
  ],
  "Kalkaji Mandir": [
    { gate: "1", name: "Kalkaji Temple", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Lotus Temple / Okhla Link", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] }
  ],
  "Netaji Subhash Place": [
    { gate: "1", name: "D-Mall / Wazirpur District Centre", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "PP Towers / Pitampura Link", lit: "Well-Lit", accessibility: ["Escalator"] }
  ],
  "Inderlok": [
    { gate: "1", name: "Inderlok Market / Shastri Nagar Link", lit: "Moderate", accessibility: ["Escalator"] },
    { gate: "2", name: "Green Line Interchange", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ],
  "Aerocity": [
    { gate: "1", name: "IGI Airport T1 / Hotels & Convention", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] },
    { gate: "2", name: "WorldMark / Hospitality District", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ],
  "Karol Bagh": [
    { gate: "1", name: "Pusa Road / Karol Bagh Market", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Ajmal Khan Road / Gaffar Market", lit: "Well-Lit", accessibility: ["Escalator"] }
  ],
  "Noida City Centre": [
    { gate: "1", name: "Sector 32 / Atta Market", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Sector 34 / DM Office", lit: "Moderate", accessibility: ["Escalator"] }
  ],
  "Dilshad Garden": [
    { gate: "1", name: "GT Road / Dilshad Colony", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Vivek Vihar Link", lit: "Dimly-Lit", accessibility: ["Escalator"] }
  ],
  "Rithala": [
    { gate: "1", name: "Metro Walk Mall / Rithala Village", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Sector 17 Rohini", lit: "Moderate", accessibility: ["Escalator"] }
  ],
  "Welcome": [
    { gate: "1", name: "Shyam Lal College / Seelampur Link", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Shahdara Industrial Area", lit: "Dimly-Lit", accessibility: ["Escalator"] }
  ],
  "Janakpuri West": [
    { gate: "1", name: "Janakpuri District Centre / C5", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "DDA Flats / Magenta Line Link", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ],
  "Saket": [
    { gate: "1", name: "Select Citywalk / Saket District Malls", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Garden of Five Senses / Mehrauli", lit: "Dimly-Lit", accessibility: ["Escalator"] }
  ],
  "Azadpur": [
    { gate: "1", name: "Azadpur Mandi / NH-1", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "GTK Depot / Lawrence Road Link", lit: "Moderate", accessibility: ["Escalator"] }
  ],
  "Anand Vihar": [
    { gate: "1", name: "Anand Vihar ISBT", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] },
    { gate: "2", name: "Anand Vihar Railway Terminal", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ],
  "Yamuna Bank": [
    { gate: "1", name: "Yamuna Metro Depot / Akshardham Link", lit: "Dimly-Lit", accessibility: ["Escalator"] },
    { gate: "2", name: "Blue Line Split Junction", lit: "Well-Lit", accessibility: ["Elevator"] }
  ],
  "Vaishali": [
    { gate: "1", name: "Shipra Mall / Indirapuram Link", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Vasundhara / Kaushambi Link", lit: "Moderate", accessibility: ["Escalator"] }
  ],
  "Sarojini Nagar": [
    { gate: "1", name: "Sarojini Nagar Market", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Africa Avenue / Kidwai Nagar", lit: "Well-Lit", accessibility: ["Escalator"] }
  ],
  "IGI Airport": [
    { gate: "1", name: "Terminal 3 Arrivals", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths", "Wheelchair Ramp"] },
    { gate: "2", name: "Terminal 3 Departures", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] }
  ],
  "Khan Market": [
    { gate: "1", name: "Khan Market Main Gate", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "India Gate / Lodhi Road Link", lit: "Well-Lit", accessibility: ["Escalator"] }
  ],
  "Patel Chowk": [
    { gate: "1", name: "Rajpath / India Gate Side", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Connaught Place / Inner Circle", lit: "Well-Lit", accessibility: ["Escalator"] }
  ],
  "Naraina Vihar": [
    { gate: "1", name: "Naraina Block A / Gurudwara / Post Office", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Local Shopping Complex (LSC) / Block H & G", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ]
};

// Diverse gate templates for stations without specific overrides
const gateTemplates = {
  underground: [
    ["Main Concourse", "Market Side Exit"],
    ["Residential Area Exit", "Main Road Exit"],
    ["Bus Stand Link", "Colony Gate"],
    ["Commercial Complex Exit", "Park/Garden Side"],
    ["Main Road / Flyover", "Residential Colony"]
  ],
  elevated: [
    ["Ground Level Main Exit", "Flyover Access"],
    ["Main Road Gate", "Service Road Gate"],
    ["Market Area Exit", "Bus Stop Link"],
    ["Highway Side Exit", "Colony Access"]
  ]
};

const lightingOptions = ["Well-Lit", "Well-Lit", "Well-Lit", "Moderate", "Moderate", "Dimly-Lit"];
const accessibilityOptions = [
  ["Elevator", "Escalator"],
  ["Elevator", "Escalator", "Tactile Paths"],
  ["Escalator"],
  ["Escalator", "Wheelchair Ramp"],
  ["Elevator"],
  ["Stairs Only"],
  []
];

const landmarkPrefixes = [
  "Main Market Gate",
  "Residential Complex Link",
  "Bus Terminal Connector",
  "Civic Centre Exit",
  "Commercial Complex Road",
  "Institutional Area Gate",
  "Metro Parking Exit",
  "Feeder Bus Stand",
  "Railway Station Link",
  "High Street Shopping Road",
  "City Center Plaza",
  "District Court Connector",
  "Government Offices Link",
  "Sports Complex Gate",
  "Subway Plaza Road"
];

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateExits(station, index) {
  // Check if we have manual overrides
  if (exitOverrides[station.name]) {
    return exitOverrides[station.name];
  }
  
  const isInterchange = station.lines.length > 1;
  const seed = index * 137 + station.name.length * 31;
  
  // Determine number of gates
  let numGates;
  if (isInterchange) {
    numGates = 4 + Math.floor(seededRandom(seed) * 5); // 4-8 gates
  } else {
    numGates = 2 + Math.floor(seededRandom(seed + 1) * 3); // 2-4 gates
  }
  
  const templates = gateTemplates.underground;
  const templateIdx = Math.floor(seededRandom(seed + 2) * templates.length);
  const template = templates[templateIdx];
  
  const exits = [];
  for (let g = 0; g < numGates; g++) {
    const litIdx = Math.floor(seededRandom(seed + g * 7 + 3) * lightingOptions.length);
    const accIdx = Math.floor(seededRandom(seed + g * 11 + 5) * accessibilityOptions.length);
    
    let exitName;
    if (g < template.length) {
      exitName = template[g];
    } else {
      const landmarkIdx = Math.floor(seededRandom(seed + g * 19) * landmarkPrefixes.length);
      exitName = `${landmarkPrefixes[landmarkIdx]} / Gate ${g + 1}`;
    }
    
    // First gate is always Well-Lit for interchange stations
    const lighting = (g === 0 && isInterchange) ? "Well-Lit" : lightingOptions[litIdx];
    // First gate always has elevator for interchange
    const accessibility = (g === 0 && isInterchange) 
      ? ["Elevator", "Escalator"] 
      : accessibilityOptions[accIdx];
    
    exits.push({
      gate: String(g + 1),
      name: exitName,
      lit: lighting,
      accessibility: accessibility
    });
  }
  
  return exits;
}

// Enrich stations with realistic exits
const enrichedStations = stations.map((station, idx) => ({
  ...station,
  exits: generateExits(station, idx)
}));

// ============================
// Add RRTS (Namo Bharat) data
// ============================

const rrtsStations = [
  // Delhi-Meerut RRTS (Namo Bharat) - Operational Phase 1
  { id: "RRTS_SRJ", name: "Sarai Kale Khan RRTS", lines: ["RRTS"], coordinates: [28.5861, 77.2543], baseCrowd: 7, exits: [
    { gate: "1", name: "ISBT Sarai Kale Khan / Hazrat Nizamuddin", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] },
    { gate: "2", name: "Pragati Maidan / Ring Road", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ]},
  { id: "RRTS_NCC", name: "New Ashok Nagar RRTS", lines: ["RRTS"], coordinates: [28.5930, 77.3062], baseCrowd: 6, exits: [
    { gate: "1", name: "New Ashok Nagar Main", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ]},
  { id: "RRTS_AV", name: "Anand Vihar RRTS", lines: ["RRTS"], coordinates: [28.6461, 77.3159], baseCrowd: 7, exits: [
    { gate: "1", name: "Anand Vihar ISBT / Railway Terminal", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] },
    { gate: "2", name: "Kaushambi Link", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ]},
  { id: "RRTS_GZB", name: "Ghaziabad RRTS", lines: ["RRTS"], coordinates: [28.6613, 77.4100], baseCrowd: 6, exits: [
    { gate: "1", name: "Ghaziabad City Centre", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "NH-24 / Raj Nagar Extension Link", lit: "Moderate", accessibility: ["Escalator"] }
  ]},
  { id: "RRTS_GGZ", name: "Guldhar RRTS", lines: ["RRTS"], coordinates: [28.6709, 77.4398], baseCrowd: 5, exits: [
    { gate: "1", name: "Guldhar Main", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ]},
  { id: "RRTS_DUR", name: "Duhai RRTS", lines: ["RRTS"], coordinates: [28.6847, 77.4651], baseCrowd: 5, exits: [
    { gate: "1", name: "Duhai Town Centre", lit: "Moderate", accessibility: ["Elevator", "Escalator"] }
  ]},
  { id: "RRTS_DPT", name: "Duhai Depot RRTS", lines: ["RRTS"], coordinates: [28.6911, 77.4858], baseCrowd: 4, exits: [
    { gate: "1", name: "RRTS Depot / Industrial Area", lit: "Moderate", accessibility: ["Escalator"] }
  ]},
  { id: "RRTS_MSN", name: "Muradnagar RRTS", lines: ["RRTS"], coordinates: [28.7628, 77.4971], baseCrowd: 5, exits: [
    { gate: "1", name: "Muradnagar Main Market", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "GT Road / NH-58", lit: "Moderate", accessibility: ["Escalator"] }
  ]},
  { id: "RRTS_MDP", name: "Modi Nagar South RRTS", lines: ["RRTS"], coordinates: [28.8020, 77.5090], baseCrowd: 5, exits: [
    { gate: "1", name: "Modi Nagar City", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ]},
  { id: "RRTS_MDN", name: "Modi Nagar North RRTS", lines: ["RRTS"], coordinates: [28.8290, 77.5180], baseCrowd: 4, exits: [
    { gate: "1", name: "Modi Nagar North Gate", lit: "Moderate", accessibility: ["Elevator", "Escalator"] }
  ]},
  { id: "RRTS_MRT", name: "Meerut South RRTS", lines: ["RRTS"], coordinates: [28.9245, 77.5722], baseCrowd: 6, exits: [
    { gate: "1", name: "Meerut South / Partapur", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Delhi Road / NH-58", lit: "Well-Lit", accessibility: ["Escalator"] }
  ]},
  { id: "RRTS_MRC", name: "Meerut Central RRTS", lines: ["RRTS"], coordinates: [28.9830, 77.6880], baseCrowd: 7, exits: [
    { gate: "1", name: "Meerut City Centre / Clock Tower", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] },
    { gate: "2", name: "Meerut Railway Station Link", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ]},

  // Delhi-Panipat RRTS (Planned)
  { id: "RRTS_SNP", name: "Sonipat RRTS", lines: ["RRTS"], coordinates: [28.9951, 77.0146], baseCrowd: 5, exits: [
    { gate: "1", name: "Sonipat City", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ]},

  // Delhi-Alwar / Gurugram RRTS (Planned)
  { id: "RRTS_GGN", name: "Gurugram RRTS", lines: ["RRTS"], coordinates: [28.4595, 77.0266], baseCrowd: 7, exits: [
    { gate: "1", name: "Gurugram Railway Station / Old Gurgaon", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "HUDA City Centre Metro Link", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ]},
  { id: "RRTS_MDG", name: "Manesar RRTS", lines: ["RRTS"], coordinates: [28.3607, 76.9432], baseCrowd: 5, exits: [
    { gate: "1", name: "IMT Manesar / NH-48", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ]},

  // Greater Noida extension
  { id: "RRTS_GNO", name: "Greater Noida RRTS", lines: ["RRTS"], coordinates: [28.4744, 77.5040], baseCrowd: 6, exits: [
    { gate: "1", name: "Pari Chowk / Alpha Commercial Belt", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
    { gate: "2", name: "Knowledge Park / Gautam Budh Nagar", lit: "Well-Lit", accessibility: ["Escalator"] }
  ]},
];

const rrtsEdges = [
  // Delhi-Meerut RRTS Corridor
  { source: "RRTS_SRJ", target: "RRTS_NCC", line: "RRTS", baseTime: 5, crowdFactor: 4, safetyRating: 9, comfortFactor: 9 },
  { source: "RRTS_NCC", target: "RRTS_AV", line: "RRTS", baseTime: 6, crowdFactor: 4, safetyRating: 9, comfortFactor: 9 },
  { source: "RRTS_AV", target: "RRTS_GZB", line: "RRTS", baseTime: 8, crowdFactor: 5, safetyRating: 9, comfortFactor: 9 },
  { source: "RRTS_GZB", target: "RRTS_GGZ", line: "RRTS", baseTime: 4, crowdFactor: 4, safetyRating: 9, comfortFactor: 9 },
  { source: "RRTS_GGZ", target: "RRTS_DUR", line: "RRTS", baseTime: 4, crowdFactor: 4, safetyRating: 9, comfortFactor: 9 },
  { source: "RRTS_DUR", target: "RRTS_DPT", line: "RRTS", baseTime: 3, crowdFactor: 3, safetyRating: 9, comfortFactor: 9 },
  { source: "RRTS_DPT", target: "RRTS_MSN", line: "RRTS", baseTime: 6, crowdFactor: 4, safetyRating: 9, comfortFactor: 9 },
  { source: "RRTS_MSN", target: "RRTS_MDP", line: "RRTS", baseTime: 4, crowdFactor: 4, safetyRating: 9, comfortFactor: 9 },
  { source: "RRTS_MDP", target: "RRTS_MDN", line: "RRTS", baseTime: 3, crowdFactor: 3, safetyRating: 9, comfortFactor: 9 },
  { source: "RRTS_MDN", target: "RRTS_MRT", line: "RRTS", baseTime: 8, crowdFactor: 4, safetyRating: 9, comfortFactor: 9 },
  { source: "RRTS_MRT", target: "RRTS_MRC", line: "RRTS", baseTime: 6, crowdFactor: 5, safetyRating: 9, comfortFactor: 9 },

  // Gurugram RRTS
  { source: "RRTS_GGN", target: "RRTS_MDG", line: "RRTS", baseTime: 10, crowdFactor: 4, safetyRating: 9, comfortFactor: 9 },

  // Greater Noida RRTS
  { source: "RRTS_GNO", target: "RRTS_NCC", line: "RRTS", baseTime: 12, crowdFactor: 4, safetyRating: 9, comfortFactor: 9 },
];

// Interchange edges connecting RRTS to Delhi Metro
const rrtsInterchangeEdges = [
  // Sarai Kale Khan RRTS <-> Pink Line Sarai Kale Khan
  { source: "RRTS_SRJ", target: "SKK", line: "RRTS", baseTime: 5, crowdFactor: 5, safetyRating: 8, comfortFactor: 8 },
  // Anand Vihar RRTS <-> Blue/Pink Line Anand Vihar
  { source: "RRTS_AV", target: "AV", line: "RRTS", baseTime: 5, crowdFactor: 5, safetyRating: 8, comfortFactor: 8 },
  // Gurugram RRTS <-> Yellow Line Huda City Centre
  { source: "RRTS_GGN", target: "MCC", line: "RRTS", baseTime: 8, crowdFactor: 5, safetyRating: 8, comfortFactor: 8 },
];

// ============================
// Gurgaon Rapid Metro Data
// ============================
const rapidStations = [
  { id: "RM_P2", name: "Phase 2 Rapid Metro", lines: ["Rapid"], coordinates: [28.4905, 77.0815], baseCrowd: 5, exits: [
    { gate: "1", name: "DLF Phase 2 / Cyber City Link", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ]},
  { id: "RM_BEL", name: "Belvedere Towers", lines: ["Rapid"], coordinates: [28.4950, 77.0805], baseCrowd: 4, exits: [
    { gate: "1", name: "Belvedere Towers Complex", lit: "Well-Lit", accessibility: ["Elevator"] }
  ]},
  { id: "RM_CYB", name: "Cyber City", lines: ["Rapid"], coordinates: [28.5030, 77.0878], baseCrowd: 7, exits: [
    { gate: "1", name: "Cyber Hub Main Entrance", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] },
    { gate: "2", name: "Gateway Tower", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ]},
  { id: "RM_P3", name: "Phase 3 Rapid Metro", lines: ["Rapid"], coordinates: [28.4985, 77.0970], baseCrowd: 5, exits: [
    { gate: "1", name: "DLF Phase 3 Residential Area", lit: "Well-Lit", accessibility: ["Escalator"] }
  ]},
  { id: "RM_MOU", name: "Moulsari Avenue", lines: ["Rapid"], coordinates: [28.4920, 77.0990], baseCrowd: 4, exits: [
    { gate: "1", name: "Ambience Mall Connection", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ]},
  { id: "RM_P1", name: "Phase 1 Rapid Metro", lines: ["Rapid"], coordinates: [28.4815, 77.0965], baseCrowd: 4, exits: [
    { gate: "1", name: "DLF Phase 1 / Golf Course Road", lit: "Well-Lit", accessibility: ["Elevator"] }
  ]},
  { id: "RM_S42", name: "Sector 42-43", lines: ["Rapid"], coordinates: [28.4690, 77.0995], baseCrowd: 4, exits: [
    { gate: "1", name: "Global Foyer Mall / Sector 42", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
  ]},
  { id: "RM_S53", name: "Sector 53-54", lines: ["Rapid"], coordinates: [28.4590, 77.1025], baseCrowd: 4, exits: [
    { gate: "1", name: "South Point Mall / Sector 53", lit: "Well-Lit", accessibility: ["Elevator"] }
  ]},
  { id: "RM_S54", name: "Sector 54 Forest Chauk", lines: ["Rapid"], coordinates: [28.4485, 77.1060], baseCrowd: 3, exits: [
    { gate: "1", name: "Suncity / Sector 54", lit: "Well-Lit", accessibility: ["Escalator"] }
  ]},
  { id: "RM_S55", name: "Sector 55-56", lines: ["Rapid"], coordinates: [28.4370, 77.1105], baseCrowd: 5, exits: [
    { gate: "1", name: "Golf Course Road Terminus", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] }
  ]}
];

const rapidEdges = [
  // Golf Course Road linear line
  { source: "RM_S55", target: "RM_S54", line: "Rapid", baseTime: 2, crowdFactor: 3, safetyRating: 9, comfortFactor: 9 },
  { source: "RM_S54", target: "RM_S53", line: "Rapid", baseTime: 2, crowdFactor: 3, safetyRating: 9, comfortFactor: 9 },
  { source: "RM_S53", target: "RM_S42", line: "Rapid", baseTime: 2, crowdFactor: 4, safetyRating: 9, comfortFactor: 9 },
  { source: "RM_S42", target: "RM_P1", line: "Rapid", baseTime: 2, crowdFactor: 4, safetyRating: 9, comfortFactor: 9 },
  { source: "RM_P1", target: "SIK", line: "Rapid", baseTime: 3, crowdFactor: 5, safetyRating: 9, comfortFactor: 8 },

  // Cyber City loop line
  { source: "SIK", target: "RM_P2", line: "Rapid", baseTime: 2, crowdFactor: 5, safetyRating: 9, comfortFactor: 8 },
  { source: "RM_P2", target: "RM_BEL", line: "Rapid", baseTime: 2, crowdFactor: 4, safetyRating: 9, comfortFactor: 9 },
  { source: "RM_BEL", target: "RM_CYB", line: "Rapid", baseTime: 2, crowdFactor: 6, safetyRating: 9, comfortFactor: 9 },
  { source: "RM_CYB", target: "RM_P3", line: "Rapid", baseTime: 2, crowdFactor: 5, safetyRating: 9, comfortFactor: 9 },
  { source: "RM_P3", target: "RM_MOU", line: "Rapid", baseTime: 2, crowdFactor: 4, safetyRating: 9, comfortFactor: 9 },
  { source: "RM_MOU", target: "RM_P2", line: "Rapid", baseTime: 2, crowdFactor: 4, safetyRating: 9, comfortFactor: 9 }
];

// Update Sikanderpur to be an interchange with Rapid Metro
const sikStation = enrichedStations.find(s => s.id === "SIK");
if (sikStation && !sikStation.lines.includes("Rapid")) {
  sikStation.lines.push("Rapid");
}

// Merge everything
const allStations = [...enrichedStations, ...rrtsStations, ...rapidStations];
const allEdges = [...edges, ...rrtsEdges, ...rrtsInterchangeEdges, ...rapidEdges];

console.log(`\nFinal: ${allStations.length} stations, ${allEdges.length} edges`);

// Check for interchange edge references
const stationIds = new Set(allStations.map(s => s.id));
for (const edge of rrtsInterchangeEdges) {
  if (!stationIds.has(edge.source)) console.warn(`Missing station: ${edge.source}`);
  if (!stationIds.has(edge.target)) console.warn(`Missing station: ${edge.target}`);
}

// ============================
// Generate output files
// ============================

const lineColorMap = {
  "Red": "#E31B23",
  "Yellow": "#FFC72C",
  "Blue": "#0055A5",
  "Violet": "#8A2BE2",
  "Pink": "#FF69B4",
  "Magenta": "#8B008B",
  "Orange": "#FF8C00",
  "Green": "#228B22",
  "Grey": "#808080",
  "Rapid": "#A52A2A",
  "Aqua": "#00FFFF",
  "RRTS": "#006A4E"
};

// Generate metroData.js
const lineOrder = ["Red", "Yellow", "Blue", "Green", "Violet", "Pink", "Magenta", "Orange", "Grey", "Rapid", "RRTS"];
const stationsByLine = {};
const assigned = new Set();

for (const line of lineOrder) {
  stationsByLine[line] = [];
  for (const s of allStations) {
    if (s.lines.includes(line) && !assigned.has(s.id)) {
      stationsByLine[line].push(s);
      assigned.add(s.id);
    }
  }
}

let metroContent = `// Complete Delhi Metro + RRTS Dataset - ${allStations.length} stations across ${lineOrder.length} lines
// Auto-generated from DMRC official network data + RRTS Namo Bharat
// Source: https://github.com/AkshatJMe/DMRC-Dataset-Algorithm

export const STATIONS = [\n`;

for (const line of lineOrder) {
  const ss = stationsByLine[line];
  if (!ss || ss.length === 0) continue;
  
  metroContent += `  // ${line} Line${line === "RRTS" ? " (Namo Bharat Regional Rapid Transit)" : ""}\n`;
  for (const s of ss) {
    const exitsStr = JSON.stringify(s.exits).replace(/"/g, '"');
    metroContent += `  { id: "${s.id}", name: "${s.name}", lines: ${JSON.stringify(s.lines)}, coordinates: [${s.coordinates[0]}, ${s.coordinates[1]}], baseCrowd: ${s.baseCrowd}, exits: ${JSON.stringify(s.exits)} },\n`;
  }
  metroContent += '\n';
}

metroContent += `];\n\nexport const EDGES = [\n`;

const edgesByLine = {};
for (const e of allEdges) {
  if (!edgesByLine[e.line]) edgesByLine[e.line] = [];
  edgesByLine[e.line].push(e);
}

for (const line of lineOrder) {
  const ee = edgesByLine[line];
  if (!ee || ee.length === 0) continue;
  
  metroContent += `  // ${line} Line Connections\n`;
  for (const e of ee) {
    metroContent += `  { source: "${e.source}", target: "${e.target}", line: "${e.line}", baseTime: ${e.baseTime}, crowdFactor: ${e.crowdFactor}, safetyRating: ${e.safetyRating}, comfortFactor: ${e.comfortFactor} },\n`;
  }
  metroContent += '\n';
}

metroContent += `];\n\nexport const LINE_COLORS = ${JSON.stringify(lineColorMap, null, 2)};\n`;

fs.writeFileSync('src/data/metroData.js', metroContent);
console.log('✅ Written src/data/metroData.js');
console.log(`   Size: ${(Buffer.byteLength(metroContent) / 1024).toFixed(1)} KB`);

// Count exits stats
let totalGates = 0;
let multiGate = 0;
let dimlyLit = 0;
let moderate = 0;
for (const s of allStations) {
  totalGates += s.exits.length;
  if (s.exits.length > 1) multiGate++;
  for (const e of s.exits) {
    if (e.lit === "Dimly-Lit") dimlyLit++;
    if (e.lit === "Moderate") moderate++;
  }
}
console.log(`\nExit Stats:`);
console.log(`  Total gates: ${totalGates}`);
console.log(`  Stations with 2+ gates: ${multiGate}`);
console.log(`  Dimly-Lit gates: ${dimlyLit}`);
console.log(`  Moderate gates: ${moderate}`);
