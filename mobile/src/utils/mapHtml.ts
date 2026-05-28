import { LEAFLET_CSS, LEAFLET_JS } from "./leafletAssets";

export function getMapHtml(stations: any[], edges: any[], initialRoute: any, startStationId: string, endStationId: string, theme: 'light' | 'dark' = 'dark') {
  const isDark = true;
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  const LINE_COLORS: Record<string, string> = {
    Red: "#E21D24",
    Yellow: "#FDB813",
    Blue: "#0072BB",
    Green: "#00A550",
    Violet: "#702082",
    Pink: "#E91E63",
    Magenta: "#9C27B0",
    Orange: "#FF5722",
    Airport: "#FF5722",
    Gray: "#7E8B92",
    Grey: "#7E8B92",
    Aqua: "#00BCD4",
    "Rapid Metro": "#FF9800",
    Rapid: "#A52A2A",
    RRTS: "#006A4E",
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    ${LEAFLET_CSS}
  </style>
  <style>
    body {
      padding: 0;
      margin: 0;
      background-color: ${isDark ? '#121212' : '#f4f4f7'};
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    html, body, #map {
      height: 100%;
      width: 100vw;
    }
    /* Hide Leaflet default controls for clean Apple-look */
    .leaflet-control-zoom {
      display: none !important;
    }
    .leaflet-control-attribution {
      font-size: 8px !important;
      background: rgba(255, 255, 255, 0.7) !important;
      color: #8e8e93 !important;
      border-radius: 4px;
      padding: 2px 4px !important;
      margin: 4px !important;
    }
    ${isDark ? `
    .leaflet-control-attribution {
      background: rgba(0, 0, 0, 0.7) !important;
      color: #8e8e93 !important;
    }
    ` : ''}

    /* Custom Pins */
    .station-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    .station-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #ffffff;
      border: 2px solid #555555;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      transition: all 0.2s ease;
    }

    .station-dot-interchange {
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background: #ffffff;
      border: 3px solid #111111;
      box-shadow: 0 2px 4px rgba(0,0,0,0.25);
    }

    ${isDark ? `
    .station-dot {
      background: #1e1e1e;
      border-color: #aaaaaa;
    }
    .station-dot-interchange {
      background: #1e1e1e;
      border-color: #ffffff;
    }
    ` : ''}

    /* Selection markers */
    .pin-selected {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3.5px solid #ffffff;
      box-shadow: 0 0 0 2.5px rgba(0,0,0,0.2), 0 3px 8px rgba(0,0,0,0.3);
      position: relative;
    }
    
    .pin-start {
      background: ' + (isDark ? '#30D158' : '#34C759') + ' !important; /* Apple Green */
    }
    
    .pin-end {
      background: ' + (isDark ? '#FF453A' : '#FF3B30') + ' !important; /* Apple Red */
    }

    .pulse-ring {
      position: absolute;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(52, 199, 89, 0.2);
      animation: pulse 1.8s infinite ease-in-out;
      pointer-events: none;
      z-index: -1;
    }
    
    .pin-end .pulse-ring {
      background: rgba(255, 59, 48, 0.2);
    }

    @keyframes pulse {
      0% {
        transform: scale(0.5);
        opacity: 1;
      }
      100% {
        transform: scale(1.6);
        opacity: 0;
      }
    }

    /* Geolocation dot style */
    .user-location-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #007aff;
      border: 3px solid #ffffff;
      box-shadow: 0 0 0 2px rgba(0,122,255,0.4), 0 2px 6px rgba(0,0,0,0.3);
    }
    
    .user-location-pulse {
      position: absolute;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(0, 122, 255, 0.15);
      animation: pulse 2s infinite ease-out;
    }

    /* Popups Apple-Style */
    .leaflet-popup-content-wrapper {
      background: ${isDark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)'};
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, ${isDark ? '0.35' : '0.12'});
      border: 0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
      color: ${isDark ? '#ffffff' : '#000000'};
      padding: 0;
    }
    .leaflet-popup-content {
      margin: 12px 14px;
      font-size: 13px;
      line-height: 1.4;
    }
    .leaflet-popup-tip {
      background: ${isDark ? '#1e1e1e' : '#ffffff'};
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script>
    ${LEAFLET_JS}
  </script>
  <script>
    // Configuration Data
    var stations = ${JSON.stringify(stations)};
    var edges = ${JSON.stringify(edges)};
    var lineColors = ${JSON.stringify(LINE_COLORS)};
    var startStationId = ${JSON.stringify(startStationId || "")};
    var endStationId = ${JSON.stringify(endStationId || "")};
    var activeRoute = ${JSON.stringify(initialRoute || null)};

    // Map instances & layers definitions
    var map;
    var edgesGroup;
    var activeRouteGroup;
    var stationsGroup;
    
    // Markers & Polylines indices
    var stationMarkers = {};
    var userLocationMarker = null;

    // Notify React Native that map is ready with bridge polling
    function checkAndNotifyReady() {
      if (window.ReactNativeWebView) {
        sendToReactNative({ type: 'MAP_READY' });
      } else {
        setTimeout(checkAndNotifyReady, 100);
      }
    }

    // Safe Map Initialization
    function initMap() {
      if (typeof L === 'undefined') {
        setTimeout(initMap, 100);
        return;
      }

      try {
        map = L.map('map', {
          zoomControl: false,
          maxZoom: 16,
          minZoom: 10,
          zoomSnap: 0.5,
          zoomDelta: 0.5
        }).setView([28.6304, 77.2177], 11);

        // Add Tile Layer
        L.tileLayer('${tileUrl}', {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
        }).addTo(map);

        edgesGroup = L.layerGroup().addTo(map);
        activeRouteGroup = L.layerGroup().addTo(map);
        stationsGroup = L.layerGroup().addTo(map);

        // Set up location handlers
        map.on('locationfound', function(e) {
          if (userLocationMarker) {
            userLocationMarker.setLatLng(e.latlng);
          } else {
            var userIcon = L.divIcon({
              className: 'station-marker',
              html: '<div class="user-location-pulse"></div><div class="user-location-dot"></div>',
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });
            userLocationMarker = L.marker(e.latlng, { icon: userIcon, zIndexOffset: 2000 }).addTo(map);
          }

          if (window.userAccuracyCircle) {
            window.userAccuracyCircle.setLatLng(e.latlng).setRadius(e.accuracy);
          } else {
            window.userAccuracyCircle = L.circle(e.latlng, e.accuracy, {
              color: '#007aff',
              fillColor: '#007aff',
              fillOpacity: 0.15,
              weight: 1
            }).addTo(map);
          }
        });

        map.on('locationerror', function(e) {
          // Fallback center
          map.setView([28.6304, 77.2177], 11);
        });

        // Draw bases
        drawBaseNetwork();
        drawStations();
        if (activeRoute) {
          drawActiveRoute();
        }

        // Force container dimensions recalculation to prevent grey/blank screen
        map.invalidateSize();
        setTimeout(function() {
          if (map) map.invalidateSize();
        }, 100);
        setTimeout(function() {
          if (map) map.invalidateSize();
        }, 500);

        // Notify app shell
        checkAndNotifyReady();
      } catch (err) {
        if (window.ReactNativeWebView) {
          sendToReactNative({ type: 'MAP_READY' }); // Dismiss overlay
        }
      }
    }

    // Build Delhi Metro base tracks
    function drawBaseNetwork() {
      edgesGroup.clearLayers();
      
      // Calculate active route path set for opacity reduction
      var activeEdges = new Set();
      if (activeRoute && activeRoute.edges) {
        activeRoute.edges.forEach(function(e) {
          activeEdges.add(e.source + '-' + e.target);
          activeEdges.add(e.target + '-' + e.source);
        });
      }

      edges.forEach(function(edge) {
        var source = stations.find(s => s.id === edge.source);
        var target = stations.find(s => s.id === edge.target);
        if (!source || !target) return;

        var sourceCoords = [source.coordinates[0], source.coordinates[1]];
        var targetCoords = [target.coordinates[0], target.coordinates[1]];

        var isDashed = edge.line === 'Orange' || edge.line === 'Airport';
        var color = lineColors[edge.line] || '#888888';
        var hasActiveRoute = activeEdges.size > 0;
        
        var key = edge.source + '-' + edge.target;
        var opacity = hasActiveRoute ? (activeEdges.has(key) ? 0.8 : 0.15) : 0.5;
        var weight = 2.5;

        // Draw track
        L.polyline([sourceCoords, targetCoords], {
          color: color,
          weight: weight,
          opacity: opacity,
          dashArray: isDashed ? '6, 5' : null,
          lineCap: 'round',
          interactive: false
        }).addTo(edgesGroup);
      });
    }

    // Draw active highlighted route
    function drawActiveRoute() {
      activeRouteGroup.clearLayers();
      if (!activeRoute || !activeRoute.edges) return;

      var routeCoords = [];

      activeRoute.edges.forEach(function(edge) {
        var source = stations.find(s => s.id === edge.source);
        var target = stations.find(s => s.id === edge.target);
        if (!source || !target) return;

        var sourceCoords = [source.coordinates[0], source.coordinates[1]];
        var targetCoords = [target.coordinates[0], target.coordinates[1]];
        routeCoords.push(sourceCoords);
        routeCoords.push(targetCoords);

        var routeColor = edge.isTransfer ? '#a855f7' : (lineColors[edge.line] || '#0072BB');

        // Render black background stroke for highlight separation
        L.polyline([sourceCoords, targetCoords], {
          color: '${isDark ? '#000000' : '#1f2937'}',
          weight: 7,
          opacity: 1.0,
          lineCap: 'round',
          interactive: false
        }).addTo(activeRouteGroup);

        // Render color foreground stroke
        L.polyline([sourceCoords, targetCoords], {
          color: routeColor,
          weight: 4,
          opacity: 1.0,
          dashArray: edge.isTransfer ? '5, 5' : null,
          lineCap: 'round',
          interactive: false
        }).addTo(activeRouteGroup);
      });

      // Fit map bounds to active route
      if (routeCoords.length > 0) {
        map.fitBounds(routeCoords, {
          padding: [50, 50],
          maxZoom: 13,
          animate: true,
          duration: 0.8
        });
      }
    }

    // Draw Station Markers
    function drawStations() {
      stationsGroup.clearLayers();
      
      var activeStationIds = new Set();
      if (activeRoute && activeRoute.path) {
        activeRoute.path.forEach(function(s) {
          activeStationIds.add(s.id);
        });
      }
      var hasActiveRoute = activeStationIds.size > 0;
      
      stations.forEach(function(station) {
        var coords = [station.coordinates[0], station.coordinates[1]];
        var isStart = station.id === startStationId;
        var isEnd = station.id === endStationId;
        var isInterchange = station.lines.length > 1;
        var isOnActiveRoute = activeStationIds.has(station.id);
        var opacity = hasActiveRoute ? (isOnActiveRoute || isStart || isEnd ? 1.0 : 0.18) : 1.0;

        var iconHtml = '';
        var size = [16, 16];

        if (isStart) {
          iconHtml = '<div class="pin-selected pin-start"><div class="pulse-ring"></div></div>';
          size = [36, 36];
        } else if (isEnd) {
          iconHtml = '<div class="pin-selected pin-end"><div class="pulse-ring"></div></div>';
          size = [36, 36];
        } else if (isInterchange) {
          iconHtml = '<div class="station-dot-interchange"></div>';
          size = [20, 20];
        } else {
          var lineColor = lineColors[station.lines[0]] || '#888888';
          iconHtml = '<div class="station-dot" style="border-color: ' + lineColor + ';"></div>';
          size = [16, 16];
        }

        var customIcon = L.divIcon({
          className: 'station-marker',
          html: iconHtml,
          iconSize: size,
          iconAnchor: [size[0] / 2, size[1] / 2]
        });

        // Popup HTML with Apple styling
        var popupHtml = '<div style="font-family: inherit;">' +
          '<div style="font-weight: 700; font-size: 14px; margin-bottom: 2px;">' + station.name + '</div>' +
          '<div style="color: #8e8e93; font-size: 11px; margin-bottom: 8px;">' + station.lines.join(' &bull; ') + ' Line' + (station.lines.length > 1 ? 's' : '') + '</div>' +
          '<div style="display: flex; gap: 8px;">' +
            '<button onclick="setStationAsStart(\\'' + station.id + '\\')" style="flex: 1; border: none; background: ' + (isDark ? '#30D158' : '#34C759') + '; color: white; padding: 6px 10px; border-radius: 8px; font-weight: 600; font-size: 11px; cursor: pointer;">From Here</button>' +
            '<button onclick="setStationAsEnd(\\'' + station.id + '\\')" style="flex: 1; border: none; background: ' + (isDark ? '#FF453A' : '#FF3B30') + '; color: white; padding: 6px 10px; border-radius: 8px; font-weight: 600; font-size: 11px; cursor: pointer;">To Here</button>' +
          '</div>' +
        '</div>';

        var marker = L.marker(coords, {
          icon: customIcon,
          opacity: opacity,
          zIndexOffset: (isStart || isEnd) ? 1000 : isOnActiveRoute ? 600 : isInterchange ? 500 : 0
        })
        .bindPopup(popupHtml, {
          closeButton: false,
          minWidth: 160
        })
        .addTo(stationsGroup);

        // Notify react native when marker is clicked (popup opening)
        marker.on('click', function() {
          sendToReactNative({
            type: 'STATION_CLICK',
            stationId: station.id,
            name: station.name
          });
        });

        stationMarkers[station.id] = marker;
      });
    }

    // Setters called from HTML popup buttons
    window.setStationAsStart = function(id) {
      sendToReactNative({ type: 'SET_START', stationId: id });
      map.closePopup();
    };

    window.setStationAsEnd = function(id) {
      sendToReactNative({ type: 'SET_END', stationId: id });
      map.closePopup();
    };

    // Communication Helper
    function sendToReactNative(data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    // Listen to messages from React Native
    window.addEventListener('message', function(event) {
      var message;
      try {
        message = JSON.parse(event.data);
      } catch (e) {
        return;
      }

      if (message.type === 'UPDATE_ROUTE') {
        startStationId = message.startStationId;
        endStationId = message.endStationId;
        activeRoute = message.activeRoute;
        
        drawBaseNetwork();
        drawActiveRoute();
        drawStations();
      } else if (message.type === 'CENTER_ON_DELHI') {
        map.setView([28.6304, 77.2177], 11, { animate: true });
      } else if (message.type === 'ZOOM_IN') {
        map.zoomIn();
      } else if (message.type === 'ZOOM_OUT') {
        map.zoomOut();
      } else if (message.type === 'UPDATE_USER_LOCATION') {
        var lat = message.latitude;
        var lng = message.longitude;
        
        if (userLocationMarker) {
          userLocationMarker.setLatLng([lat, lng]);
        } else {
          var userIcon = L.divIcon({
            className: 'station-marker',
            html: '<div class="user-location-pulse"></div><div class="user-location-dot"></div>',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          userLocationMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 2000 }).addTo(map);
        }
        
        if (message.recenter) {
          map.setView([lat, lng], 14, { animate: true });
        }
      }
    });

    // Start Initialization
    initMap();
  </script>
</body>
</html>
`;
}
