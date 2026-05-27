import { STATIONS, EDGES } from "./src/data/metroData.js";

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

    // Endpoint 1: Dynamic Network Data
    if (url.pathname === "/api/network-data") {
      return new Response(JSON.stringify({ stations: STATIONS, edges: EDGES }), {
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
