export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    // Handle CORS preflight options request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);

    // Mock API Endpoint for DMRC scraper status updates
    if (url.pathname === "/api/status") {
      const mockDMRCUpdate = {
        status: "Success",
        source: "DMRC Scraper Proxy",
        timestamp: new Date().toISOString(),
        networkStatus: "Normal Service",
        infrastructureOutages: [
          // Simulated occasional outage to verify UI components react correctly
          {
            stationId: "KG",
            facility: "escalator",
            status: "Under Maintenance",
            reason: "Routine safety inspection",
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
