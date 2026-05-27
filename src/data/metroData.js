// Expanded Delhi Metro Dataset (40 major stations across 6 lines + Airport Express)
export const STATIONS = [
  // Yellow Line (North to South)
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
      { gate: "1", name: "GT Road / Block A", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
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
      { gate: "1", name: "Hudson Lane", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Kingsway Camp", lit: "Well-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "VV",
    name: "Vishwavidyalaya",
    lines: ["Yellow"],
    coordinates: [28.6924, 77.2105],
    baseCrowd: 8,
    exits: [
      { gate: "1", name: "Delhi University North Campus", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Chhatra Marg", lit: "Well-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "KG",
    name: "Kashmere Gate",
    lines: ["Yellow", "Red", "Violet"],
    coordinates: [28.6675, 77.2282],
    baseCrowd: 9,
    exits: [
      { gate: "1", name: "Lothian Road / ISBT", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] },
      { gate: "2", name: "Mori Gate", lit: "Well-Lit", accessibility: ["Escalator", "Wheelchair Ramp"] },
      { gate: "3", name: "St. James Church", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
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
      { gate: "2", name: "Chandni Chowk Market", lit: "Well-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "ND",
    name: "New Delhi",
    lines: ["Yellow", "Orange"],
    coordinates: [28.6431, 77.2223],
    baseCrowd: 9,
    exits: [
      { gate: "1", name: "New Delhi Railway Station (Paharganj)", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Ajmeri Gate Exit / Airport Line Link", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] }
    ]
  },
  {
    id: "RC",
    name: "Rajiv Chowk",
    lines: ["Yellow", "Blue"],
    coordinates: [28.6304, 77.2177],
    baseCrowd: 10,
    exits: [
      { gate: "1", name: "Block A Connaught Place", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Palika Bazar", lit: "Well-Lit", accessibility: ["Escalator"] },
      { gate: "3", name: "Block D CPC", lit: "Well-Lit", accessibility: ["Elevator"] }
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
      { gate: "2", name: "Parliament / North Block", lit: "Well-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "IN",
    name: "INA",
    lines: ["Yellow", "Pink"],
    coordinates: [28.5752, 77.2102],
    baseCrowd: 7,
    exits: [
      { gate: "1", name: "Dilli Haat", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "INA Market", lit: "Well-Lit", accessibility: ["Escalator", "Wheelchair Ramp"] }
    ]
  },
  {
    id: "AI",
    name: "AIIMS",
    lines: ["Yellow"],
    coordinates: [28.5684, 77.2078],
    baseCrowd: 8,
    exits: [
      { gate: "1", name: "AIIMS Hospital Main Entrance", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] },
      { gate: "2", name: "Safdarjung Hospital", lit: "Well-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "HK",
    name: "Hauz Khas",
    lines: ["Yellow", "Magenta"],
    coordinates: [28.5434, 77.2064],
    baseCrowd: 9,
    exits: [
      { gate: "1", name: "IIT Delhi / Outer Ring Road", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Hauz Khas Enclave", lit: "Well-Lit", accessibility: ["Escalator"] }
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
      { gate: "2", name: "Garden of Five Senses", lit: "Dimly-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "HC",
    name: "Huda City Centre",
    lines: ["Yellow"],
    coordinates: [28.4593, 77.0724],
    baseCrowd: 7,
    exits: [
      { gate: "1", name: "Fortis Hospital", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Sector 29 Market", lit: "Well-Lit", accessibility: ["Elevator"] }
    ]
  },

  // Blue Line (West to East)
  {
    id: "DW",
    name: "Dwarka Sector 21",
    lines: ["Blue", "Orange"],
    coordinates: [28.5523, 77.0583],
    baseCrowd: 5,
    exits: [
      { gate: "1", name: "Pacific D21 Mall", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
    ]
  },
  {
    id: "JW",
    name: "Janakpuri West",
    lines: ["Blue", "Magenta"],
    coordinates: [28.6294, 77.0778],
    baseCrowd: 8,
    exits: [
      { gate: "1", name: "Janakpuri District Centre", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "DDA Flats", lit: "Dimly-Lit", accessibility: ["Wheelchair Ramp"] }
    ]
  },
  {
    id: "RG",
    name: "Rajouri Garden",
    lines: ["Blue", "Pink"],
    coordinates: [28.6492, 77.1219],
    baseCrowd: 8,
    exits: [
      { gate: "1", name: "TDI Mall / Main Market", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
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
      { gate: "1", name: "Pusa Road Market", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Ajmal Khan Road Market", lit: "Well-Lit", accessibility: ["Escalator"] }
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
      { gate: "2", name: "Bengali Market", lit: "Well-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "YB",
    name: "Yamuna Bank",
    lines: ["Blue"],
    coordinates: [28.6214, 77.2651],
    baseCrowd: 6,
    exits: [
      { gate: "1", name: "Yamuna Metro Depot", lit: "Dimly-Lit", accessibility: ["Escalator"] },
      { gate: "2", name: "Akshardham Link Road", lit: "Well-Lit", accessibility: ["Elevator"] }
    ]
  },
  {
    id: "NC",
    name: "Noida City Centre",
    lines: ["Blue"],
    coordinates: [28.5747, 77.3560],
    baseCrowd: 7,
    exits: [
      { gate: "1", name: "Sector 32/34 Link", lit: "Dimly-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "VS",
    name: "Vaishali",
    lines: ["Blue"],
    coordinates: [28.6498, 77.3396],
    baseCrowd: 7,
    exits: [
      { gate: "1", name: "Shipra Mall Link", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
    ]
  },
  {
    id: "BG",
    name: "Botanical Garden",
    lines: ["Blue", "Magenta"],
    coordinates: [28.5641, 77.3342],
    baseCrowd: 8,
    exits: [
      { gate: "1", name: "Noida Sector 37 Bus Stand", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Captain Vijyant Thapar Marg", lit: "Well-Lit", accessibility: ["Escalator"] }
    ]
  },

  // Violet Line
  {
    id: "LQ",
    name: "Lal Quila",
    lines: ["Violet"],
    coordinates: [28.6568, 77.2410],
    baseCrowd: 6,
    exits: [
      { gate: "1", name: "Red Fort (Lal Quila)", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Lajpat Rai Market", lit: "Dimly-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "LN",
    name: "Lajpat Nagar",
    lines: ["Violet", "Pink"],
    coordinates: [28.5694, 77.2405],
    baseCrowd: 9,
    exits: [
      { gate: "1", name: "Central Market", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Defence Colony", lit: "Well-Lit", accessibility: ["Escalator"] }
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
      { gate: "2", name: "Eros Corporate Tower", lit: "Well-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "KM",
    name: "Kalkaji Mandir",
    lines: ["Violet", "Magenta"],
    coordinates: [28.5495, 77.2585],
    baseCrowd: 8,
    exits: [
      { gate: "1", name: "Kalkaji Temple", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "Lotus Temple Exit", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] }
    ]
  },
  {
    id: "BB",
    name: "Badarpur Border",
    lines: ["Violet"],
    coordinates: [28.4984, 77.3023],
    baseCrowd: 7,
    exits: [
      { gate: "1", name: "Mathura Road Link", lit: "Dimly-Lit", accessibility: ["Escalator"] }
    ]
  },

  // Red Line
  {
    id: "RT",
    name: "Rithala",
    lines: ["Red"],
    coordinates: [28.7208, 77.1072],
    baseCrowd: 6,
    exits: [
      { gate: "1", name: "Metro Walk Mall", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
    ]
  },
  {
    id: "NP_RED",
    name: "Netaji Subhash Place",
    lines: ["Red", "Pink"],
    coordinates: [28.6946, 77.1517],
    baseCrowd: 8,
    exits: [
      { gate: "1", name: "D-Mall NSP", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] },
      { gate: "2", name: "PP Towers", lit: "Well-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "IL",
    name: "Inderlok",
    lines: ["Red"],
    coordinates: [28.6731, 77.1704],
    baseCrowd: 7,
    exits: [
      { gate: "1", name: "Inderlok Market", lit: "Dimly-Lit", accessibility: ["Escalator"] }
    ]
  },
  {
    id: "WL",
    name: "Welcome",
    lines: ["Red", "Pink"],
    coordinates: [28.6719, 77.2778],
    baseCrowd: 7,
    exits: [
      { gate: "1", name: "Shyam Lal College", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
    ]
  },
  {
    id: "DG",
    name: "Dilshad Garden",
    lines: ["Red"],
    coordinates: [28.6759, 77.3218],
    baseCrowd: 7,
    exits: [
      { gate: "1", name: "GT Road Link", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
    ]
  },

  // Pink Line
  {
    id: "MV",
    name: "Mayur Vihar-I",
    lines: ["Blue", "Pink"],
    coordinates: [28.6041, 77.2911],
    baseCrowd: 7,
    exits: [
      { gate: "1", name: "Mayur Vihar Pocket 1", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
    ]
  },
  {
    id: "KK",
    name: "Karkarduma",
    lines: ["Blue", "Pink"],
    coordinates: [28.6483, 77.3005],
    baseCrowd: 6,
    exits: [
      { gate: "1", name: "Karkarduma Court", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
    ]
  },

  // Magenta Line
  {
    id: "OK",
    name: "Okhla NSIC",
    lines: ["Magenta"],
    coordinates: [28.5422, 77.2721],
    baseCrowd: 5,
    exits: [
      { gate: "1", name: "NSIC Exhibition Ground", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
    ]
  },
  {
    id: "GH",
    name: "Greater Kailash",
    lines: ["Magenta"],
    coordinates: [28.5414, 77.2341],
    baseCrowd: 6,
    exits: [
      { gate: "1", name: "GK 2 M-Block Market", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
    ]
  },
  {
    id: "VS_RED",
    name: "Vasant Vihar",
    lines: ["Magenta"],
    coordinates: [28.5611, 77.1624],
    baseCrowd: 6,
    exits: [
      { gate: "1", name: "Vasant Vihar Market", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
    ]
  },
  {
    id: "MN",
    name: "Munirka",
    lines: ["Magenta"],
    coordinates: [28.5583, 77.1714],
    baseCrowd: 6,
    exits: [
      { gate: "1", name: "Munirka Village / DDA Flats", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }
    ]
  },
  {
    id: "AP",
    name: "Aerocity",
    lines: ["Magenta", "Orange"],
    coordinates: [28.5552, 77.1234],
    baseCrowd: 6,
    exits: [
      { gate: "1", name: "IGI Airport T1 Link / Hotels", lit: "Well-Lit", accessibility: ["Elevator", "Escalator", "Tactile Paths"] }
    ]
  }
];

export const EDGES = [
  // Yellow Line Connections
  { source: "SB", target: "JP", line: "Yellow", baseTime: 4, crowdFactor: 3, safetyRating: 8, comfortFactor: 8 },
  { source: "JP", target: "GT", line: "Yellow", baseTime: 6, crowdFactor: 4, safetyRating: 8, comfortFactor: 8 },
  { source: "GT", target: "VV", line: "Yellow", baseTime: 2, crowdFactor: 7, safetyRating: 7, comfortFactor: 7 },
  { source: "VV", target: "KG", line: "Yellow", baseTime: 3, crowdFactor: 8, safetyRating: 7, comfortFactor: 6 },
  { source: "KG", target: "CC", line: "Yellow", baseTime: 2, crowdFactor: 9, safetyRating: 6, comfortFactor: 4 },
  { source: "CC", target: "ND", line: "Yellow", baseTime: 3, crowdFactor: 9, safetyRating: 7, comfortFactor: 5 },
  { source: "ND", target: "RC", line: "Yellow", baseTime: 2, crowdFactor: 10, safetyRating: 8, comfortFactor: 4 },
  { source: "RC", target: "CS", line: "Yellow", baseTime: 4, crowdFactor: 8, safetyRating: 9, comfortFactor: 7 },
  { source: "CS", target: "IN", line: "Yellow", baseTime: 7, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
  { source: "IN", target: "AI", line: "Yellow", baseTime: 2, crowdFactor: 8, safetyRating: 8, comfortFactor: 7 },
  { source: "AI", target: "HK", line: "Yellow", baseTime: 5, crowdFactor: 8, safetyRating: 8, comfortFactor: 6 },
  { source: "HK", target: "SK", line: "Yellow", baseTime: 3, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
  { source: "SK", target: "HC", line: "Yellow", baseTime: 16, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },

  // Blue Line Connections
  { source: "DW", target: "JW", line: "Blue", baseTime: 18, crowdFactor: 5, safetyRating: 8, comfortFactor: 8 },
  { source: "JW", target: "RG", line: "Blue", baseTime: 6, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
  { source: "RG", target: "KB", line: "Blue", baseTime: 11, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
  { source: "KB", target: "RC", line: "Blue", baseTime: 5, crowdFactor: 8, safetyRating: 8, comfortFactor: 6 },
  { source: "RC", target: "MH", line: "Blue", baseTime: 3, crowdFactor: 7, safetyRating: 9, comfortFactor: 8 },
  { source: "MH", target: "YB", line: "Blue", baseTime: 5, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
  { source: "YB", target: "MV", line: "Blue", baseTime: 3, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
  { source: "MV", target: "KK", line: "Blue", baseTime: 5, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },
  { source: "KK", target: "NC", line: "Blue", baseTime: 9, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
  { source: "KK", target: "VS", line: "Blue", baseTime: 7, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },
  { source: "NC", target: "BG", line: "Blue", baseTime: 4, crowdFactor: 8, safetyRating: 8, comfortFactor: 7 },

  // Violet Line Connections
  { source: "KG", target: "LQ", line: "Violet", baseTime: 3, crowdFactor: 5, safetyRating: 9, comfortFactor: 8 },
  { source: "LQ", target: "MH", line: "Violet", baseTime: 6, crowdFactor: 6, safetyRating: 9, comfortFactor: 8 },
  { source: "MH", target: "CS", line: "Violet", baseTime: 3, crowdFactor: 6, safetyRating: 9, comfortFactor: 8 },
  { source: "CS", target: "LN", line: "Violet", baseTime: 9, crowdFactor: 8, safetyRating: 8, comfortFactor: 7 },
  { source: "LN", target: "NP", line: "Violet", baseTime: 4, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
  { source: "NP", target: "KM", line: "Violet", baseTime: 2, crowdFactor: 8, safetyRating: 8, comfortFactor: 7 },
  { source: "KM", target: "BB", line: "Violet", baseTime: 12, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },

  // Red Line Connections
  { source: "RT", target: "NP_RED", line: "Red", baseTime: 5, crowdFactor: 6, safetyRating: 7, comfortFactor: 7 },
  { source: "NP_RED", target: "IL", line: "Red", baseTime: 4, crowdFactor: 7, safetyRating: 7, comfortFactor: 7 },
  { source: "IL", target: "KG", line: "Red", baseTime: 8, crowdFactor: 8, safetyRating: 7, comfortFactor: 6 },
  { source: "KG", target: "WL", line: "Red", baseTime: 7, crowdFactor: 7, safetyRating: 7, comfortFactor: 7 },
  { source: "WL", target: "DG", line: "Red", baseTime: 8, crowdFactor: 7, safetyRating: 7, comfortFactor: 7 },

  // Pink Line Connections
  { source: "NP_RED", target: "RG", line: "Pink", baseTime: 8, crowdFactor: 6, safetyRating: 8, comfortFactor: 7 },
  { source: "RG", target: "IN", line: "Pink", baseTime: 15, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
  { source: "IN", target: "LN", line: "Pink", baseTime: 6, crowdFactor: 8, safetyRating: 9, comfortFactor: 7 },
  { source: "LN", target: "MV", line: "Pink", baseTime: 9, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
  { source: "MV", target: "WL", line: "Pink", baseTime: 11, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },

  // Magenta Line Connections
  { source: "JW", target: "AP", line: "Magenta", baseTime: 12, crowdFactor: 5, safetyRating: 8, comfortFactor: 8 },
  { source: "AP", target: "VS_RED", line: "Magenta", baseTime: 6, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },
  { source: "VS_RED", target: "MN", line: "Magenta", baseTime: 2, crowdFactor: 5, safetyRating: 8, comfortFactor: 8 },
  { source: "MN", target: "HK", line: "Magenta", baseTime: 4, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
  { source: "HK", target: "GH", line: "Magenta", baseTime: 5, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },
  { source: "GH", target: "KM", line: "Magenta", baseTime: 4, crowdFactor: 7, safetyRating: 8, comfortFactor: 8 },
  { source: "KM", target: "OK", line: "Magenta", baseTime: 2, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },
  { source: "OK", target: "BG", line: "Magenta", baseTime: 10, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },

  // Orange Line (Airport Express) Connections
  // Connecting New Delhi (ND) <-> Aerocity (AP) <-> Dwarka Sector 21 (DW)
  { source: "ND", target: "AP", line: "Orange", baseTime: 15, crowdFactor: 3, safetyRating: 10, comfortFactor: 9 },
  { source: "AP", target: "DW", line: "Orange", baseTime: 6, crowdFactor: 3, safetyRating: 10, comfortFactor: 9 }
];

export const LINE_COLORS = {
  Yellow: "#FFC72C",
  Blue: "#0055A5",
  Violet: "#8A2BE2",
  Red: "#E31B23",
  Pink: "#FF69B4",
  Magenta: "#8B008B",
  Orange: "#FF8C00"
};
