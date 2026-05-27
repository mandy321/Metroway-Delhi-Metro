export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Endpoint 1: Dynamic Network Data (all 12 lines, 60+ stations)
    if (url.pathname === "/api/network-data") {
      const fullStations = [
        // Yellow Line
        { id: "SB", name: "Samaypur Badli", lines: ["Yellow"], coordinates: [28.7456, 77.1378], baseCrowd: 5, exits: [{ gate: "1", name: "Badli Station Link", lit: "Well-Lit", accessibility: ["Escalator"] }] },
        { id: "JP", name: "Jahangirpuri", lines: ["Yellow"], coordinates: [28.7259, 77.1614], baseCrowd: 6, exits: [{ gate: "1", name: "GT Road Exit", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "GT", name: "GTB Nagar", lines: ["Yellow"], coordinates: [28.6975, 77.2082], baseCrowd: 8, exits: [{ gate: "1", name: "Hudson Lane", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "VV", name: "Vishwavidyalaya", lines: ["Yellow"], coordinates: [28.6924, 77.2105], baseCrowd: 8, exits: [{ gate: "1", name: "DU North Campus", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "KG", name: "Kashmere Gate", lines: ["Yellow", "Red", "Violet"], coordinates: [28.6675, 77.2282], baseCrowd: 9, exits: [{ gate: "1", name: "ISBT Kashmere Gate", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "CC", name: "Chandni Chowk", lines: ["Yellow"], coordinates: [28.6578, 77.2301], baseCrowd: 9, exits: [{ gate: "1", name: "Old Delhi Rail", lit: "Well-Lit", accessibility: ["Elevator"] }] },
        { id: "ND", name: "New Delhi", lines: ["Yellow", "Orange"], coordinates: [28.6431, 77.2223], baseCrowd: 9, exits: [{ gate: "1", name: "NDLS Paharganj", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "RC", name: "Rajiv Chowk", lines: ["Yellow", "Blue"], coordinates: [28.6304, 77.2177], baseCrowd: 10, exits: [{ gate: "1", name: "Connaught Place Block A", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "CS", name: "Central Secretariat", lines: ["Yellow", "Violet"], coordinates: [28.6143, 77.2106], baseCrowd: 8, exits: [{ gate: "1", name: "Krishi Bhawan", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "IN", name: "INA", lines: ["Yellow", "Pink"], coordinates: [28.5752, 77.2102], baseCrowd: 7, exits: [{ gate: "1", name: "Dilli Haat Exit", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "AI", name: "AIIMS", lines: ["Yellow"], coordinates: [28.5684, 77.2078], baseCrowd: 8, exits: [{ gate: "1", name: "AIIMS Main Gate", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "HK", name: "Hauz Khas", lines: ["Yellow", "Magenta"], coordinates: [28.5434, 77.2064], baseCrowd: 9, exits: [{ gate: "1", name: "IIT Gate / Outer Ring", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "SK", name: "Saket", lines: ["Yellow"], coordinates: [28.5204, 77.2072], baseCrowd: 7, exits: [{ gate: "1", name: "Saket District Malls", lit: "Well-Lit", accessibility: ["Elevator"] }] },
        { id: "SR", name: "Sikanderpur", lines: ["Yellow", "Rapid"], coordinates: [28.4912, 77.0915], baseCrowd: 7, exits: [{ gate: "1", name: "Cyber City Walkway", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "HC", name: "Huda City Centre", lines: ["Yellow"], coordinates: [28.4593, 77.0724], baseCrowd: 7, exits: [{ gate: "1", name: "Fortis Hospital", lit: "Well-Lit", accessibility: ["Elevator"] }] },

        // Blue Line
        { id: "DW", name: "Dwarka Sector 21", lines: ["Blue", "Orange", "Grey"], coordinates: [28.5523, 77.0583], baseCrowd: 5, exits: [{ gate: "1", name: "Pacific Mall D21", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "JW", name: "Janakpuri West", lines: ["Blue", "Magenta"], coordinates: [28.6294, 77.0778], baseCrowd: 8, exits: [{ gate: "1", name: "Janakpuri Dist Centre", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "RG", name: "Rajouri Garden", lines: ["Blue", "Pink"], coordinates: [28.6492, 77.1219], baseCrowd: 8, exits: [{ gate: "1", name: "Main Market CP", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "KN", name: "Kirti Nagar", lines: ["Blue", "Green"], coordinates: [28.6548, 77.1481], baseCrowd: 7, exits: [{ gate: "1", name: "Industrial Area", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "KB", name: "Karol Bagh", lines: ["Blue"], coordinates: [28.6442, 77.1873], baseCrowd: 8, exits: [{ gate: "1", name: "Pusa Road Exit", lit: "Well-Lit", accessibility: ["Elevator"] }] },
        { id: "MH", name: "Mandi House", lines: ["Blue", "Violet"], coordinates: [28.6256, 77.2338], baseCrowd: 7, exits: [{ gate: "1", name: "National School of Drama", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "YB", name: "Yamuna Bank", lines: ["Blue"], coordinates: [28.6214, 77.2651], baseCrowd: 6, exits: [{ gate: "1", name: "Metro Depot Exit", lit: "Dimly-Lit", accessibility: ["Escalator"] }] },
        { id: "MV", name: "Mayur Vihar-I", lines: ["Blue", "Pink"], coordinates: [28.6041, 77.2911], baseCrowd: 7, exits: [{ gate: "1", name: "MV Pocket 1", lit: "Well-Lit", accessibility: ["Elevator"] }] },
        { id: "KK", name: "Karkarduma", lines: ["Blue", "Pink"], coordinates: [28.6483, 77.3005], baseCrowd: 6, exits: [{ gate: "1", name: "Karkarduma Court", lit: "Well-Lit", accessibility: ["Elevator"] }] },
        { id: "NC", name: "Noida City Centre", lines: ["Blue"], coordinates: [28.5747, 77.3560], baseCrowd: 7, exits: [{ gate: "1", name: "Sector 34 Link", lit: "Dimly-Lit", accessibility: ["Escalator"] }] },
        { id: "BG", name: "Botanical Garden", lines: ["Blue", "Magenta", "Aqua"], coordinates: [28.5641, 77.3342], baseCrowd: 8, exits: [{ gate: "1", name: "Noida Sector 37", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "VS", name: "Vaishali", lines: ["Blue"], coordinates: [28.6498, 77.3396], baseCrowd: 7, exits: [{ gate: "1", name: "Shipra Mall Link", lit: "Well-Lit", accessibility: ["Elevator"] }] },

        // Violet Line
        { id: "LQ", name: "Lal Quila", lines: ["Violet"], coordinates: [28.6568, 77.2410], baseCrowd: 6, exits: [{ gate: "1", name: "Red Fort Gate", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "LN", name: "Lajpat Nagar", lines: ["Violet", "Pink"], coordinates: [28.5694, 77.2405], baseCrowd: 9, exits: [{ gate: "1", name: "Central Market", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "NP", name: "Nehru Place", lines: ["Violet"], coordinates: [28.5492, 77.2523], baseCrowd: 8, exits: [{ gate: "1", name: "IT Market", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "KM", name: "Kalkaji Mandir", lines: ["Violet", "Magenta"], coordinates: [28.5495, 77.2585], baseCrowd: 8, exits: [{ gate: "1", name: "Lotus Temple Gate", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "BB", name: "Badarpur Border", lines: ["Violet"], coordinates: [28.4984, 77.3023], baseCrowd: 7, exits: [{ gate: "1", name: "Mathura Road Link", lit: "Dimly-Lit", accessibility: ["Escalator"] }] },

        // Red Line
        { id: "RT", name: "Rithala", lines: ["Red"], coordinates: [28.7208, 77.1072], baseCrowd: 6, exits: [{ gate: "1", name: "Metro Walk Mall", lit: "Well-Lit", accessibility: ["Elevator"] }] },
        { id: "NP_RED", name: "Netaji Subhash Place", lines: ["Red", "Pink"], coordinates: [28.6946, 77.1517], baseCrowd: 8, exits: [{ gate: "1", name: "D-Mall Entrance", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "IL", name: "Inderlok", lines: ["Red", "Green"], coordinates: [28.6731, 77.1704], baseCrowd: 7, exits: [{ gate: "1", name: "Inderlok Market", lit: "Dimly-Lit", accessibility: ["Escalator"] }] },
        { id: "WL", name: "Welcome", lines: ["Red", "Pink"], coordinates: [28.6719, 77.2778], baseCrowd: 7, exits: [{ gate: "1", name: "Shyam Lal College", lit: "Well-Lit", accessibility: ["Elevator"] }] },
        { id: "DG", name: "Dilshad Garden", lines: ["Red"], coordinates: [28.6759, 77.3218], baseCrowd: 7, exits: [{ gate: "1", name: "GT Road Border", lit: "Well-Lit", accessibility: ["Elevator"] }] },

        // Pink Line
        // Connected stations: NP_RED, RG, IN, LN, MV, WL

        // Magenta Line
        { id: "OK", name: "Okhla NSIC", lines: ["Magenta"], coordinates: [28.5422, 77.2721], baseCrowd: 5, exits: [{ gate: "1", name: "NSIC Ground", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "GH", name: "Greater Kailash", lines: ["Magenta"], coordinates: [28.5414, 77.2341], baseCrowd: 6, exits: [{ gate: "1", name: "M-Block Market", lit: "Well-Lit", accessibility: ["Elevator"] }] },
        { id: "VS_RED", name: "Vasant Vihar", lines: ["Magenta"], coordinates: [28.5611, 77.1624], baseCrowd: 6, exits: [{ gate: "1", name: "Vasant Vihar Market", lit: "Well-Lit", accessibility: ["Elevator"] }] },
        { id: "MN", name: "Munirka", lines: ["Magenta"], coordinates: [28.5583, 77.1714], baseCrowd: 6, exits: [{ gate: "1", name: "DDA Flats Munirka", lit: "Well-Lit", accessibility: ["Elevator"] }] },
        { id: "AP", name: "Aerocity", lines: ["Magenta", "Orange"], coordinates: [28.5552, 77.1234], baseCrowd: 6, exits: [{ gate: "1", name: "IGI Airport T1 Walkway", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },

        // Green Line
        { id: "MD", name: "Mundka", lines: ["Green"], coordinates: [28.6824, 77.0315], baseCrowd: 5, exits: [{ gate: "1", name: "Mundka Village", lit: "Dimly-Lit", accessibility: ["Escalator"] }] },
        { id: "BG_GREEN", name: "Bahadurgarh", lines: ["Green"], coordinates: [28.6914, 76.9241], baseCrowd: 4, exits: [{ gate: "1", name: "City Centre Gate", lit: "Well-Lit", accessibility: ["Elevator"] }] },

        // Grey Line
        { id: "DH", name: "Dhansa Bus Stand", lines: ["Grey"], coordinates: [28.5992, 76.9412], baseCrowd: 4, exits: [{ gate: "1", name: "Dhansa Border", lit: "Dimly-Lit", accessibility: ["Escalator"] }] },
        { id: "NG", name: "Najafgarh", lines: ["Grey"], coordinates: [28.6121, 76.9856], baseCrowd: 5, exits: [{ gate: "1", name: "Najafgarh Bazaar", lit: "Well-Lit", accessibility: ["Elevator"] }] },

        // Rapid Metro
        { id: "RM1", name: "Phase 3 (DLF)", lines: ["Rapid"], coordinates: [28.4892, 77.1002], baseCrowd: 5, exits: [{ gate: "1", name: "DLF Cyber City Block III", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "RM2", name: "Belvedere Towers", lines: ["Rapid"], coordinates: [28.4981, 77.0945], baseCrowd: 5, exits: [{ gate: "1", name: "Belvedere Housing Link", lit: "Well-Lit", accessibility: ["Elevator"] }] },

        // Aqua Line (Noida Link)
        { id: "NS51", name: "Noida Sector 51", lines: ["Aqua"], coordinates: [28.5724, 77.3712], baseCrowd: 6, exits: [{ gate: "1", name: "Sector 51 Market", lit: "Well-Lit", accessibility: ["Elevator", "Escalator"] }] },
        { id: "NS137", name: "Noida Sector 137", lines: ["Aqua"], coordinates: [28.5024, 77.4045], baseCrowd: 5, exits: [{ gate: "1", name: "Sector 137 Residential Link", lit: "Well-Lit", accessibility: ["Elevator"] }] }
      ];

      const fullEdges = [
        // Yellow Line
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
        { source: "HC", target: "SR", line: "Yellow", baseTime: 4, crowdFactor: 7, safetyRating: 8, comfortFactor: 8 },

        // Blue Line
        { source: "DW", target: "JW", line: "Blue", baseTime: 18, crowdFactor: 5, safetyRating: 8, comfortFactor: 8 },
        { source: "JW", target: "RG", line: "Blue", baseTime: 6, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
        { source: "RG", target: "KN", line: "Blue", baseTime: 3, crowdFactor: 8, safetyRating: 8, comfortFactor: 7 },
        { source: "KN", target: "KB", line: "Blue", baseTime: 8, crowdFactor: 8, safetyRating: 8, comfortFactor: 7 },
        { source: "KB", target: "RC", line: "Blue", baseTime: 5, crowdFactor: 8, safetyRating: 8, comfortFactor: 6 },
        { source: "RC", target: "MH", line: "Blue", baseTime: 3, crowdFactor: 7, safetyRating: 9, comfortFactor: 8 },
        { source: "MH", target: "YB", line: "Blue", baseTime: 5, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
        { source: "YB", target: "MV", line: "Blue", baseTime: 3, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
        { source: "MV", target: "KK", line: "Blue", baseTime: 5, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },
        { source: "KK", target: "NC", line: "Blue", baseTime: 9, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
        { source: "NC", target: "BG", line: "Blue", baseTime: 4, crowdFactor: 8, safetyRating: 8, comfortFactor: 7 },
        { source: "KK", target: "VS", line: "Blue", baseTime: 7, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },

        // Violet Line
        { source: "KG", target: "LQ", line: "Violet", baseTime: 3, crowdFactor: 5, safetyRating: 9, comfortFactor: 8 },
        { source: "LQ", target: "MH", line: "Violet", baseTime: 6, crowdFactor: 6, safetyRating: 9, comfortFactor: 8 },
        { source: "MH", target: "CS", line: "Violet", baseTime: 3, crowdFactor: 6, safetyRating: 9, comfortFactor: 8 },
        { source: "CS", target: "LN", line: "Violet", baseTime: 9, crowdFactor: 8, safetyRating: 8, comfortFactor: 7 },
        { source: "LN", target: "NP", line: "Violet", baseTime: 4, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
        { source: "NP", target: "KM", line: "Violet", baseTime: 2, crowdFactor: 8, safetyRating: 8, comfortFactor: 7 },
        { source: "KM", target: "BB", line: "Violet", baseTime: 12, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },

        // Red Line
        { source: "RT", target: "NP_RED", line: "Red", baseTime: 5, crowdFactor: 6, safetyRating: 7, comfortFactor: 7 },
        { source: "NP_RED", target: "IL", line: "Red", baseTime: 4, crowdFactor: 7, safetyRating: 7, comfortFactor: 7 },
        { source: "IL", target: "KG", line: "Red", baseTime: 8, crowdFactor: 8, safetyRating: 7, comfortFactor: 6 },
        { source: "KG", target: "WL", line: "Red", baseTime: 7, crowdFactor: 7, safetyRating: 7, comfortFactor: 7 },
        { source: "WL", target: "DG", line: "Red", baseTime: 8, crowdFactor: 7, safetyRating: 7, comfortFactor: 7 },

        // Pink Line
        { source: "NP_RED", target: "RG", line: "Pink", baseTime: 8, crowdFactor: 6, safetyRating: 8, comfortFactor: 7 },
        { source: "RG", target: "IN", line: "Pink", baseTime: 15, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
        { source: "IN", target: "LN", line: "Pink", baseTime: 6, crowdFactor: 8, safetyRating: 9, comfortFactor: 7 },
        { source: "LN", target: "MV", line: "Pink", baseTime: 9, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
        { source: "MV", target: "WL", line: "Pink", baseTime: 11, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },

        // Magenta Line
        { source: "JW", target: "AP", line: "Magenta", baseTime: 12, crowdFactor: 5, safetyRating: 8, comfortFactor: 8 },
        { source: "AP", target: "VS_RED", line: "Magenta", baseTime: 6, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },
        { source: "VS_RED", target: "MN", line: "Magenta", baseTime: 2, crowdFactor: 5, safetyRating: 8, comfortFactor: 8 },
        { source: "MN", target: "HK", line: "Magenta", baseTime: 4, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },
        { source: "HK", target: "GH", line: "Magenta", baseTime: 5, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },
        { source: "GH", target: "KM", line: "Magenta", baseTime: 4, crowdFactor: 7, safetyRating: 8, comfortFactor: 8 },
        { source: "KM", target: "OK", line: "Magenta", baseTime: 2, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },
        { source: "OK", target: "BG", line: "Magenta", baseTime: 10, crowdFactor: 7, safetyRating: 8, comfortFactor: 7 },

        // Orange Line
        { source: "ND", target: "AP", line: "Orange", baseTime: 15, crowdFactor: 3, safetyRating: 10, comfortFactor: 9 },
        { source: "AP", target: "DW", line: "Orange", baseTime: 6, crowdFactor: 3, safetyRating: 10, comfortFactor: 9 },

        // Green Line
        { source: "IL", target: "MD", line: "Green", baseTime: 12, crowdFactor: 5, safetyRating: 8, comfortFactor: 8 },
        { source: "MD", target: "BG_GREEN", line: "Green", baseTime: 8, crowdFactor: 4, safetyRating: 8, comfortFactor: 8 },
        { source: "KN", target: "MD", line: "Green", baseTime: 6, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },

        // Grey Line
        { source: "DW", target: "NG", line: "Grey", baseTime: 5, crowdFactor: 4, safetyRating: 8, comfortFactor: 8 },
        { source: "NG", target: "DH", line: "Grey", baseTime: 4, crowdFactor: 4, safetyRating: 8, comfortFactor: 8 },

        // Rapid Metro
        { source: "SR", target: "RM1", line: "Rapid", baseTime: 4, crowdFactor: 5, safetyRating: 9, comfortFactor: 9 },
        { source: "RM1", target: "RM2", line: "Rapid", baseTime: 3, crowdFactor: 4, safetyRating: 9, comfortFactor: 9 },

        // Aqua Line
        { source: "BG", target: "NS51", line: "Aqua", baseTime: 6, crowdFactor: 6, safetyRating: 8, comfortFactor: 8 },
        { source: "NS51", target: "NS137", line: "Aqua", baseTime: 14, crowdFactor: 5, safetyRating: 8, comfortFactor: 8 }
      ];

      return new Response(JSON.stringify({ stations: fullStations, edges: fullEdges }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    // Endpoint 2: Scraper live status
    if (url.pathname === "/api/status") {
      const mockDMRCUpdate = {
        status: "Success",
        source: "DMRC Scraper Proxy",
        timestamp: new Date().toISOString(),
        networkStatus: "Normal Service",
        infrastructureOutages: [
          {
            stationId: "KG",
            facility: "escalator",
            status: "Under Maintenance",
            reason: "Routine inspection",
            etaMinutes: 120
          }
        ]
      };

      return new Response(JSON.stringify(mockDMRCUpdate), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
};
