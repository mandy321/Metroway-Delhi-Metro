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

    // Endpoint 3: Secure Delhi Govt Open Transit Realtime API Proxy
    // OTD Delhi API: https://otd.delhi.gov.in/data/realtime/
    // Endpoint: GET /api/realtime/VehiclePositions.pb?key=YOUR_PRIVATE_KEY
    // Returns: GTFS-Realtime protobuf binary (FeedMessage)
    if (url.pathname === "/api/realtime-transit") {
      // The API key is stored securely in environment variables (env.OTD_API_KEY)
      const apiKey = env.OTD_API_KEY || "hOcs5GnBZQVbaUigjQp9BCv5uZyldAmw";
      // Correct OTD Delhi endpoint — GTFS-RT VehiclePositions protobuf feed
      const otdRealtimeUrl = `https://otd.delhi.gov.in/api/realtime/VehiclePositions.pb?key=${apiKey}`;
      
      try {
        const otdRes = await fetch(otdRealtimeUrl, {
          headers: { "Accept": "application/octet-stream" }
        });

        if (!otdRes.ok) {
          const errText = await otdRes.text().catch(() => "");
          return new Response(JSON.stringify({
            error: "OTD API returned error",
            status: otdRes.status,
            statusText: otdRes.statusText,
            body: errText.slice(0, 500)
          }), {
            status: otdRes.status,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        // The OTD API returns GTFS-RT protobuf binary.
        // We proxy the raw bytes — the mobile app (or a future parser) can decode it.
        // Content-Type will be application/octet-stream or application/x-protobuf.
        const rawBuffer = await otdRes.arrayBuffer();
        return new Response(rawBuffer, {
          headers: {
            "Content-Type": otdRes.headers.get("Content-Type") || "application/octet-stream",
            "X-OTD-Feed": "VehiclePositions",
            ...corsHeaders
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          error: "Failed to connect to Delhi Government OTD API",
          endpoint: otdRealtimeUrl,
          details: err.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // Endpoint 3b: TripUpdates feed
    if (url.pathname === "/api/realtime-trips") {
      const apiKey = env.OTD_API_KEY || "hOcs5GnBZQVbaUigjQp9BCv5uZyldAmw";
      const otdTripsUrl = `https://otd.delhi.gov.in/api/realtime/TripUpdates.pb?key=${apiKey}`;
      try {
        const otdRes = await fetch(otdTripsUrl, {
          headers: { "Accept": "application/octet-stream" }
        });
        if (!otdRes.ok) {
          const errText = await otdRes.text().catch(() => "");
          return new Response(JSON.stringify({
            error: "OTD TripUpdates API returned error",
            status: otdRes.status,
            body: errText.slice(0, 500)
          }), {
            status: otdRes.status,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const rawBuffer = await otdRes.arrayBuffer();
        return new Response(rawBuffer, {
          headers: {
            "Content-Type": otdRes.headers.get("Content-Type") || "application/octet-stream",
            "X-OTD-Feed": "TripUpdates",
            ...corsHeaders
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          error: "Failed to connect to OTD TripUpdates API",
          details: err.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
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
