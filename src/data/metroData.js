// Delhi Metro Hardcoded Dataset (exactly 20 real stations across 4 lines)
export const STATIONS = [
  {
    id: "KG",
    name: "Kashmere Gate",
    lines: ["Yellow", "Red", "Violet"],
    coordinates: [28.6675, 77.2282],
    baseCrowd: 9,
    exits: [
      { gate: "1", name: "Lothian Road / ISBT", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] },
      { gate: "2", name: "Mori Gate", lit: "Well-Lit", accessibility: ["Escalator", "Wheelchair Ramp"] },
      { gate: "3", name: "St. James Church", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "4", name: "Kudsiya Park", lit: "Dimly-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "RC",
    name: "Rajiv Chowk",
    lines: ["Yellow", "Blue"],
    coordinates: [28.6304, 77.2177],
    baseCrowd: 10,
    exits: [
      { gate: "1", name: "Radial Road 1 (A Block / Connaught Place)", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Radial Road 2 (B Block / Palika Bazar)", lit: "Well-Lit", accessibility: ["Escalator"] },
      { gate: "3", name: "Radial Road 3 (D Block)", lit: "Well-Lit", accessibility: ["Elevator"] },
      { gate: "4", name: "Radial Road 4 (E Block)", lit: "Dimly-Lit", accessibility: ["Escalator", "Wheelchair Ramp"] }
    ]
  },
  {
    id: "CS",
    name: "Central Secretariat",
    lines: ["Yellow", "Violet"],
    coordinates: [28.6143, 77.2106],
    baseCrowd: 8,
    exits: [
      { gate: "1", name: "Krishi Bhawan", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "North Block / Parliament", lit: "Well-Lit", accessibility: ["Escalator"] },
      { gate: "3", name: "Dr. Rajendra Prasad Road", lit: "Well-Lit", accessibility: ["Elevator"] },
      { gate: "4", name: "National Museum", lit: "Well-Lit", accessibility: ["Wheelchair Ramp"] }
    ]
  },
  {
    id: "MH",
    name: "Mandi House",
    lines: ["Blue", "Violet"],
    coordinates: [28.6256, 77.2338],
    baseCrowd: 7,
    exits: [
      { gate: "1", name: "National School of Drama (NSD)", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Copernicus Marg / Bengali Market", lit: "Well-Lit", accessibility: ["Escalator"] },
      { gate: "3", name: "Sikandra Road", lit: "Dimly-Lit", accessibility: ["Elevator"] },
      { gate: "4", name: "Himachal Bhawan", lit: "Well-Lit", accessibility: ["Wheelchair Ramp"] }
    ]
  },
  {
    id: "SB",
    name: "Samaypur Badli",
    lines: ["Yellow"],
    coordinates: [28.7456, 77.1378],
    baseCrowd: 5,
    exits: [
      { gate: "1", name: "Badli Railway Station", lit: "Dimly-Lit", accessibility: ["Escalator"] },
      { gate: "2", name: "Samaypur Village", lit: "Dimly-Lit", accessibility: ["Wheelchair Ramp"] }
    ]
  },
  {
    id: "JP",
    name: "Jahangirpuri",
    lines: ["Yellow"],
    coordinates: [28.7259, 77.1614],
    baseCrowd: 6,
    exits: [
      { gate: "1", name: "Grand Trunk Road / Jahangirpuri Block A", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Mahendra Park", lit: "Dimly-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "GT",
    name: "GTB Nagar",
    lines: ["Yellow"],
    coordinates: [28.6975, 77.2082],
    baseCrowd: 8,
    exits: [
      { gate: "1", name: "Delhi University / Hudson Lane", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Kingsway Camp", lit: "Well-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "CC",
    name: "Chandni Chowk",
    lines: ["Yellow"],
    coordinates: [28.6578, 77.2301],
    baseCrowd: 9,
    exits: [
      { gate: "1", name: "Old Delhi Railway Station", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Chandni Chowk Market / Red Fort", lit: "Well-Lit", accessibility: ["Escalator"] },
      { gate: "3", name: "Katra Neel", lit: "Dimly-Lit", accessibility: ["Wheelchair Ramp"] }
    ]
  },
  {
    id: "SK",
    name: "Saket",
    lines: ["Yellow"],
    coordinates: [28.5204, 77.2072],
    baseCrowd: 7,
    exits: [
      { gate: "1", name: "Saket District Centre / Malls", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Garden of Five Senses / Saidulajab", lit: "Dimly-Lit", accessibility: ["Escalator", "Wheelchair Ramp"] }
    ]
  },
  {
    id: "HC",
    name: "Huda City Centre",
    lines: ["Yellow"],
    coordinates: [28.4593, 77.0724],
    baseCrowd: 7,
    exits: [
      { gate: "1", name: "Fortis Hospital", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] },
      { gate: "2", name: "Unitech Cyber Park", lit: "Well-Lit", accessibility: ["Escalator"] },
      { gate: "3", name: "Sector 29 Market", lit: "Well-Lit", accessibility: ["Elevator"] }
    ]
  },
  {
    id: "DW",
    name: "Dwarka Sector 21",
    lines: ["Blue"],
    coordinates: [28.5523, 77.0583],
    baseCrowd: 6,
    exits: [
      { gate: "1", name: "Pacific Mall / Dwarka", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Sector 21 Pocket 1", lit: "Well-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "RG",
    name: "Rajouri Garden",
    lines: ["Blue"],
    coordinates: [28.6492, 77.1219],
    baseCrowd: 8,
    exits: [
      { gate: "1", name: "Main Market / TDI Mall", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Subhash Nagar", lit: "Well-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "KB",
    name: "Karol Bagh",
    lines: ["Blue"],
    coordinates: [28.6442, 77.1873],
    baseCrowd: 8,
    exits: [
      { gate: "1", name: "Pusa Road / Metro Bazar", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Ajmal Khan Road Market", lit: "Well-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "YB",
    name: "Yamuna Bank",
    lines: ["Blue"],
    coordinates: [28.6214, 77.2651],
    baseCrowd: 7,
    exits: [
      { gate: "1", name: "Yamuna Depot", lit: "Dimly-Lit", accessibility: ["Escalator"] },
      { gate: "2", name: "Akshardham Temple Link", lit: "Well-Lit", accessibility: ["Elevator", "Wheelchair Ramp"] }
    ]
  },
  {
    id: "NC",
    name: "Noida City Centre",
    lines: ["Blue"],
    coordinates: [28.5747, 77.3560],
    baseCrowd: 8,
    exits: [
      { gate: "1", name: "Logix City Centre", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Sector 32/34", lit: "Dimly-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "VS",
    name: "Vaishali",
    lines: ["Blue"],
    coordinates: [28.6498, 77.3396],
    baseCrowd: 7,
    exits: [
      { gate: "1", name: "Shipra Mall / Indirapuram Link", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Vaishali Sector 4", lit: "Well-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "NP",
    name: "Nehru Place",
    lines: ["Violet"],
    coordinates: [28.5492, 77.2523],
    baseCrowd: 8,
    exits: [
      { gate: "1", name: "Nehru Place IT Market", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Eros Corporate Tower", lit: "Well-Lit", accessibility: ["Escalator", "Wheelchair Ramp"] },
      { gate: "3", name: "Kalkaji Mandir Link", lit: "Well-Lit", accessibility: ["Elevator"] }
    ]
  },
  {
    id: "BB",
    name: "Badarpur Border",
    lines: ["Violet"],
    coordinates: [28.4984, 77.3023],
    baseCrowd: 7,
    exits: [
      { gate: "1", name: "Mathura Road / Faridabad Border", lit: "Dimly-Lit", accessibility: ["Escalator"] },
      { gate: "2", name: "Badarpur Bus Stand", lit: "Dimly-Lit", accessibility: ["Escalator", "Wheelchair Ramp"] }
    ]
  },
  {
    id: "RT",
    name: "Rithala",
    lines: ["Red"],
    coordinates: [28.7208, 77.1072],
    baseCrowd: 6,
    exits: [
      { gate: "1", name: "Metro Walk Mall / Adventure Island", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Rithala Village", lit: "Dimly-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "DG",
    name: "Dilshad Garden",
    lines: ["Red"],
    coordinates: [28.6759, 77.3218],
    baseCrowd: 7,
    exits: [
      { gate: "1", name: "Dilshad Garden Pocket A", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "GT Road / Ghaziabad Link", lit: "Well-Lit", accessibility: ["Escalator", "Wheelchair Ramp"] }
    ]
  }
];

export const EDGES = [
  // Yellow Line
  { source: "SB", target: "JP", line: "Yellow", baseTime: 4, crowdFactor: 3, safetyRating: 8, comfortFactor: 8 },
  { source: "JP", target: "GT", line: "Yellow", baseTime: 6, crowdFactor: 4, safetyRating: 8, comfortFactor: 8 },
  { source: "GT", target: "KG", line: "Yellow", baseTime: 5, crowdFactor: 7, safetyRating: 7, comfortFactor: 6 },
  { source: "KG", target: "CC", line: "Yellow", baseTime: 2, crowdFactor: 9, safetyRating: 6, comfortFactor: 4 },
  { source: "CC", target: "RC", line: "Yellow", baseTime: 5, crowdFactor: 9, safetyRating: 7, comfortFactor: 5 },
  { source: "RC", target: "CS", line: "Yellow", baseTime: 4, crowdFactor: 8, safetyRating: 9, comfortFactor: 7 },
  { source: "CS", target: "SK", line: "Yellow", baseTime: 14, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
  { source: "SK", target: "HC", line: "Yellow", baseTime: 16, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },

  // Blue Line
  { source: "DW", target: "RG", line: "Blue", baseTime: 18, crowdFactor: 5, safetyRating: 8, comfortFactor: 8 },
  { source: "RG", target: "KB", line: "Blue", baseTime: 10, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
  { source: "KB", target: "RC", line: "Blue", baseTime: 5, crowdFactor: 8, safetyRating: 8, comfortFactor: 6 },
  { source: "RC", target: "MH", line: "Blue", baseTime: 3, crowdFactor: 7, safetyRating: 9, comfortFactor: 8 },
  { source: "MH", target: "YB", line: "Blue", baseTime: 5, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
  { source: "YB", target: "NC", line: "Blue", baseTime: 14, crowdFactor: 8, safetyRating: 8, comfortFactor: 7 },
  { source: "YB", target: "VS", line: "Blue", baseTime: 8, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },

  // Violet Line
  { source: "KG", target: "MH", line: "Violet", baseTime: 7, crowdFactor: 5, safetyRating: 9, comfortFactor: 8 },
  { source: "MH", target: "CS", line: "Violet", baseTime: 3, crowdFactor: 6, safetyRating: 9, comfortFactor: 8 },
  { source: "CS", target: "NP", line: "Violet", baseTime: 13, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
  { source: "NP", target: "BB", line: "Violet", baseTime: 12, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },

  // Red Line
  { source: "RT", target: "KG", line: "Red", baseTime: 18, crowdFactor: 6, safetyRating: 7, comfortFactor: 7 },
  { source: "KG", target: "DG", line: "Red", baseTime: 14, crowdFactor: 7, safetyRating: 7, comfortFactor: 7 }
];

export const LINE_COLORS = {
  Yellow: "#FFC72C",
  Blue: "#0055A5",
  Violet: "#8A2BE2",
  Red: "#E31B23"
};
