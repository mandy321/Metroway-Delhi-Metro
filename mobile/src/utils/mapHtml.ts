import { LEAFLET_CSS, LEAFLET_JS } from "./leafletAssets";

export function getMapHtml(stations: any[], edges: any[], initialRoute: any, startStationId: string, endStationId: string, theme: 'light' | 'dark' = 'dark', realtimeArrivals: Record<string, any> = {}) {
  const isDark = theme === 'dark';
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

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
    .leaflet-container {
      background: ${isDark ? '#121212' : '#f4f4f7'} !important;
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

    /* Neon Glow & Route Morphing Animations */
    .neon-glow path {
      filter: drop-shadow(0 0 6px currentColor);
    }
    .halo-pulse-line {
      stroke-linecap: round;
      stroke-linejoin: round;
      animation: pulseHalo 2s ease-in-out infinite alternate;
    }
    @keyframes pulseHalo {
      0% { 
        stroke-width: 6px; 
        stroke-opacity: 0.15; 
        filter: drop-shadow(0 0 2px currentColor); 
      }
      100% { 
        stroke-width: 12px; 
        stroke-opacity: 0.4; 
        filter: drop-shadow(0 0 6px currentColor); 
      }
    }
    
    @keyframes drawRoute {
      0% {
        stroke-dasharray: 0, 5000px;
      }
      100% {
        stroke-dasharray: 5000px, 0;
      }
    }
    
    .route-morph-line path {
      animation: drawRoute 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    /* Custom Pins */
    .station-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    .station-dot {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #ffffff;
      border: 2px solid #555555;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      transition: all 0.2s ease;
    }

    .station-dot-interchange {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #ffffff;
      border: 3.5px dotted #111111;
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
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 3.5px solid #ffffff;
      box-shadow: 0 0 0 2.5px rgba(0,0,0,0.2), 0 3px 8px rgba(0,0,0,0.3);
      position: relative;
    }
    
    .pin-start {
      background: ${isDark ? '#30D158' : '#34C759'} !important; /* Apple Green */
    }
    
    .pin-end {
      background: ${isDark ? '#FF453A' : '#FF3B30'} !important; /* Apple Red */
    }

    .pin-transfer {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #ffffff;
      border: 3.5px solid #a855f7; /* Purple transfer accent */
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }

    ${isDark ? `
    .pin-transfer {
      background: #1e1e1e;
      border-color: #a855f7;
    }
    ` : ''}

    .pulse-ring {
      position: absolute;
      width: 40px;
      height: 40px;
      top: -12.5px;
      left: -12.5px;
      border-radius: 50%;
      background: rgba(52, 199, 89, 0.25);
      animation: pulse 1.8s infinite ease-in-out;
      pointer-events: none;
      z-index: -1;
    }
    
    .pin-end .pulse-ring {
      background: rgba(255, 59, 48, 0.25);
    }

    @keyframes pulse {
      0% { transform: scale(0.4); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    .pin-intermediate {
      background: ${isDark ? '#007aff' : '#007aff'} !important;
      border: 2px solid #ffffff !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.4) !important;
      width: 12px !important;
      height: 12px !important;
      border-radius: 50% !important;
      margin-left: -6px !important;
      margin-top: -6px !important;
      opacity: 1 !important;
    }

    .flying-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: white url('https://img.icons8.com/fluency/48/train.png') no-repeat center center;
      background-size: 18px 18px;
      box-shadow: 0 0 10px #007aff, 0 0 20px #007aff;
      border: 2px solid #007aff;
      z-index: 2000;
      position: relative;
    }
    
    .flying-icon::after {
      content: '';
      position: absolute;
      top: -8px;
      left: -8px;
      right: -8px;
      bottom: -8px;
      border-radius: 50%;
      background: rgba(0, 122, 255, 0.35);
      animation: pulse-flying 1s infinite;
      z-index: -1;
    }
    
    @keyframes pulse-flying {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(1.5); opacity: 0; }
    }

    .skywalk-line {
      stroke-dasharray: 4, 6;
      animation: dash-flow 1s linear infinite;
    }

    @keyframes dash-flow {
      to { stroke-dashoffset: -10; }
    }

    /* Geolocation dot style */
    .user-location-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: url('https://img.icons8.com/color/48/superman.png') center/cover no-repeat;
      box-shadow: 0 0 10px rgba(0,0,0,0.3);
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
    ${isDark ? `
    .leaflet-tile-pane {
      filter: invert(95%) hue-rotate(180deg) brightness(90%) contrast(110%);
    }
    ` : ''}
  </style>
</head>
<body>
  <div id="map"></div>

  <script>
    ${LEAFLET_JS}
  </script>
  <script>
    window.onerror = function(message, source, lineno, colno, error) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MAP_ERROR',
          message: 'JS Error: ' + message + ' at ' + lineno + ':' + colno
        }));
      }
    };
    
    // Configuration Data
    var isDark = ${isDark};
    var stations = ${JSON.stringify(stations)};
    var edges = ${JSON.stringify(edges)};
    var lineColors = ${JSON.stringify(LINE_COLORS)};
    var startStationId = ${JSON.stringify(startStationId || "")};
    var endStationId = ${JSON.stringify(endStationId || "")};
    var activeRoute = ${JSON.stringify(initialRoute || null)};
    var realtimeArrivals = ${JSON.stringify(realtimeArrivals || {})};

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

        window.showUserLocationPopup = function(overrideStartStationId) {
          if (!userLocationMarker || !window.latestUserLatLng) return;
          var nearest = null;
          var minDist = Infinity;
          
          stations.forEach(function(s) {
            if (s.coordinates && s.coordinates.length === 2) {
              var stLatLng = L.latLng(s.coordinates[0], s.coordinates[1]);
              var d = window.latestUserLatLng.distanceTo(stLatLng);
              if (d < minDist) {
                minDist = d;
                nearest = s;
              }
            }
          });
          
          if (nearest) {
            var d = Math.round(minDist);
            var distStr = d > 1000 ? (d / 1000).toFixed(1) + ' km' : d + ' m';
            var msg = "";
            var targetSt = nearest; // default to nearest station for line drawing
            
            if (d < 100) {
              msg = "<b>You are at " + nearest.name + "</b>";
            } else {
              msg = "<b>Nearest Station:</b> " + nearest.name + "<br>" + distStr;
            }
            
            var sId = overrideStartStationId || startStationId;
            if (sId) {
              var startSt = stations.find(function(s) { return s.id === sId; });
              if (startSt && startSt.coordinates && startSt.coordinates.length === 2 && startSt.id !== nearest.id) {
                var startLatLng = L.latLng(startSt.coordinates[0], startSt.coordinates[1]);
                var startD = Math.round(window.latestUserLatLng.distanceTo(startLatLng));
                var startDistStr = startD > 1000 ? (startD / 1000).toFixed(1) + ' km' : startD + ' m';
                msg += "<br><br><b>Start Station:</b> " + startSt.name + "<br>" + startDistStr;
                targetSt = startSt; // Draw line to Start Station instead if route is active
              }
            }
            
            // Draw temporary dotted line to target station
            if (window.nearestStationLine) {
              map.removeLayer(window.nearestStationLine);
            }
            var targetLatLng = L.latLng(targetSt.coordinates[0], targetSt.coordinates[1]);
            window.nearestStationLine = L.polyline([window.latestUserLatLng, targetLatLng], {
              color: '#007aff',
              weight: 3,
              dashArray: '5, 10',
              className: 'nearest-station-line' // Optional animation
            }).addTo(map);

            // Zoom map to fit both user and target station so we see the full dotted line
            var bounds = L.latLngBounds(window.latestUserLatLng, targetLatLng);
            map.fitBounds(bounds, { padding: [50, 50], animate: true, maxZoom: 15 });

            if (userLocationMarker) {
              if (userLocationMarker.getPopup()) {
                userLocationMarker.setPopupContent(msg);
              } else {
                userLocationMarker.bindPopup(msg, { className: 'custom-popup', autoClose: true, closeOnClick: true });
              }
              userLocationMarker.openPopup();
            }
            
            setTimeout(function() {
              if (userLocationMarker && userLocationMarker.isPopupOpen()) {
                userLocationMarker.closePopup();
              }
              // Fade out and remove the dotted line
              if (window.nearestStationLine) {
                var el = window.nearestStationLine._path;
                if (el) {
                  el.style.transition = 'opacity 0.5s ease-out';
                  el.style.opacity = '0';
                  setTimeout(function() {
                    if (window.nearestStationLine && map.hasLayer(window.nearestStationLine)) {
                      map.removeLayer(window.nearestStationLine);
                      window.nearestStationLine = null;
                    }
                  }, 500);
                } else {
                  map.removeLayer(window.nearestStationLine);
                  window.nearestStationLine = null;
                }
              }
            }, 4000);
          }
        };

        map.on('locationfound', function(e) {
          window.latestUserLatLng = e.latlng;
          window.lastLocationTime = Date.now();

          // Send location to React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'USER_LOCATION',
              latitude: e.latlng.lat,
              longitude: e.latlng.lng
            }));
          }

          // Calculate distance to nearest station
          var minDistance = Infinity;
          var nearestStationLatLng = null;
          for (var i = 0; i < stations.length; i++) {
            if (stations[i].coordinates && stations[i].coordinates.length === 2) {
              var stLatLng = L.latLng(stations[i].coordinates[0], stations[i].coordinates[1]);
              var dist = e.latlng.distanceTo(stLatLng);
              if (dist < minDistance) {
                minDistance = dist;
                nearestStationLatLng = stLatLng;
              }
            }
          }

          if (window.forceLocateView) {
            map.setView(e.latlng, 15, { animate: true }); // Always center on user if forceLocateView is true
            window.forceLocateView = false;
          }

          if (userLocationMarker) {
            if (!map.hasLayer(userLocationMarker)) userLocationMarker.addTo(map);
            userLocationMarker.setLatLng(e.latlng);
            // Don't fully hide Superman, just reduce opacity slightly so they know he's there
            userLocationMarker.setOpacity(minDistance < 100 ? 0.7 : 1);
          } else {
            var userIcon = L.divIcon({
              className: 'station-marker',
              html: '<div class="user-location-pulse"></div><div class="user-location-dot"></div>',
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });
            userLocationMarker = L.marker(e.latlng, { icon: userIcon, zIndexOffset: 9000, opacity: minDistance < 100 ? 0.7 : 1 }).addTo(map);
            userLocationMarker.on('click', function() {
              if (window.showUserLocationPopup) {
                window.showUserLocationPopup();
              }
            });
          }

          if (window.userAccuracyCircle) {
            if (!map.hasLayer(window.userAccuracyCircle)) window.userAccuracyCircle.addTo(map);
            window.userAccuracyCircle.setLatLng(e.latlng).setRadius(e.accuracy);
          } else {
            window.userAccuracyCircle = L.circle(e.latlng, e.accuracy, {
              color: '#007aff',
              fillColor: '#007aff',
              fillOpacity: 0.15,
              weight: 1
            }).addTo(map);
          }

          if (window.forceLocateView) {
            map.setView(e.latlng, 15, { animate: true });
            window.forceLocateView = false;
          }
        });

        map.on('locationerror', function(e) {
          // Fallback center
          map.setView([28.6304, 77.2177], 11);
        });

        // Draw bases
        drawBaseNetwork();
        drawStations();

        // Start locating immediately on launch
        map.locate({ setView: false, maxZoom: 15, watch: true, enableHighAccuracy: true });

        // Force container dimensions recalculation to prevent grey/blank screen
        map.invalidateSize();
        setTimeout(function() {
          if (map) map.invalidateSize();
        }, 100);
        setTimeout(function() {
          if (map) {
            map.invalidateSize();
            if (activeRoute) {
              drawActiveRoute();
            }
          }
        }, 500);

        // Notify app shell
        checkAndNotifyReady();
      } catch (err) {
        var errorMsg = err && err.message ? err.message : String(err);
        console.error('Metroway map init error:', errorMsg);
        if (window.ReactNativeWebView) {
          sendToReactNative({ type: 'MAP_ERROR', message: errorMsg });
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

        var isSkywalk = edge.line === 'Skywalk';
        var isDashed = edge.line === 'Orange' || edge.line === 'Airport' || isSkywalk;
        var color = isSkywalk ? '#a855f7' : (lineColors[edge.line] || '#888888');
        var hasActiveRoute = activeEdges.size > 0;
        
        var key = edge.source + '-' + edge.target;
        var opacity = hasActiveRoute ? (activeEdges.has(key) ? 0.8 : 0.15) : 0.5;
        var weight = isSkywalk ? 3.5 : 2.5;
        var dashArray = isSkywalk ? '3, 6' : (isDashed ? '6, 5' : null);

        // Draw track
        L.polyline([sourceCoords, targetCoords], {
          color: color,
          weight: weight,
          opacity: opacity,
          dashArray: dashArray,
          lineCap: 'round',
          interactive: false
        }).addTo(edgesGroup);

        // Removed midpoint skywalk icon from base network
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

        var isRealSkywalk = edge.line === 'Skywalk';
        var routeColor = isRealSkywalk ? '#a855f7' : (lineColors[edge.line] || '#0072BB');

        // Render black background stroke for highlight separation
        L.polyline([sourceCoords, targetCoords], {
          color: '${isDark ? '#000000' : '#1f2937'}',
          weight: 7,
          opacity: 1.0,
          lineCap: 'round',
          interactive: false
        }).addTo(activeRouteGroup);

        // Render neon glow underlayer (only for solid lines to avoid messy dashes)
        if (!isRealSkywalk && ${isDark}) {
          L.polyline([sourceCoords, targetCoords], {
            color: routeColor,
            weight: 12,
            opacity: 0.3,
            lineCap: 'round',
            interactive: false,
            className: 'neon-glow route-morph-line'
          }).addTo(activeRouteGroup);
        }

        // Render color foreground stroke
        var activeLine = L.polyline([sourceCoords, targetCoords], {
          color: routeColor,
          weight: 4,
          opacity: 1.0,
          dashArray: isRealSkywalk ? '5, 5' : null,
          lineCap: 'round',
          interactive: false,
          className: isRealSkywalk ? '' : 'route-morph-line'
        }).addTo(activeRouteGroup);

        if (isRealSkywalk && activeLine._path) {
          activeLine._path.classList.add('skywalk-line');
        }

        // Add Transfer/Skywalk icon to active route
        if (edge.isTransfer) {
          var midLat = (sourceCoords[0] + targetCoords[0]) / 2;
          var midLng = (sourceCoords[1] + targetCoords[1]) / 2;
          var walkColor = isRealSkywalk ? '#a855f7' : '#5856d6';
          var walkShadow = isRealSkywalk ? 'rgba(168,85,247,0.4)' : 'rgba(88,86,214,0.4)';
          var walkIcon = L.divIcon({
            className: 'station-marker',
            html: '<div style="background: ' + (isDark ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.9)') + '; backdrop-filter: blur(4px); border: 1.5px solid ' + walkColor + '; border-radius: 12px; padding: 2px 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px ' + walkShadow + '; font-size: 10px; font-weight: 700; color: ' + (isDark ? '#fff' : '#000') + ';">🚶 ' + (edge.adjustedTime || edge.baseTime) + ' min</div>',
            iconSize: [50, 20],
            iconAnchor: [25, 25] // Offset it slightly upwards so it floats above the station dot
          });
          L.marker([midLat, midLng], { icon: walkIcon, zIndexOffset: 1500 }).addTo(activeRouteGroup);
        }
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

      // Premium Route Superman Flying Animation
      if (window.routeAnimationReq) {
        cancelAnimationFrame(window.routeAnimationReq);
        window.routeAnimationReq = null;
      }
      if (window.flyingMarker) {
        activeRouteGroup.removeLayer(window.flyingMarker);
        window.flyingMarker = null;
      }

      if (activeRoute.path && activeRoute.path.length > 1) {
        window.orderedCoords = activeRoute.path.map(function(s) {
          return [s.coordinates[0], s.coordinates[1]];
        });

        var totalTimeMs = 0;
        var segments = [];
        for (var i = 0; i < window.orderedCoords.length - 1; i++) {
          var p1 = window.orderedCoords[i];
          var p2 = window.orderedCoords[i+1];
          // Simple euclidean distance for interpolation
          var dist = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
          
          var edgeTimeMinutes = (activeRoute.edges && activeRoute.edges[i]) ? activeRoute.edges[i].baseTime : 2;
          // Scale: 1 real minute = 3000ms animation (so 2 min = 6 seconds)
          var segTimeMs = Math.max(edgeTimeMinutes * 3000, 1000);

          segments.push({ p1: p1, p2: p2, dist: dist, timeMs: segTimeMs });
          totalTimeMs += segTimeMs;
        }

        var initialLine = activeRoute.edges && activeRoute.edges.length > 0 ? activeRoute.edges[0].line : 'Blue';
        var initialRouteColor = initialLine === 'Skywalk' ? '#a855f7' : (lineColors[initialLine] || '#007aff');
        var c = initialRouteColor;
        
        // Single SVG, 3 <g> groups so each coach can be individually rotated for articulation
        // Viewbox: 80 wide × 18 tall. Coach 1 (tail) x=0, Coach 2 (mid) x=28, Coach 3 (nose) x=56
        var trainHtml = '<div class="train-container" style="transition: transform 0.25s linear; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.55));">' +
          '<svg id="train-svg" width="80" height="18" viewBox="0 0 80 18" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            // Tail coach
            '<g id="coach-tail" style="transition: transform 0.25s linear; transform-origin: 13px 9px;">' +
              '<rect x="0" y="1" width="24" height="16" rx="3" fill="#e5e7eb" stroke="#374151" stroke-width="1.2"/>' +
              '<rect x="0" y="7" width="24" height="5" fill="' + c + '"/>' +
              '<rect x="2" y="3" width="5" height="3" rx="1" fill="rgba(0,0,0,0.2)"/>' +
              '<rect x="17" y="3" width="5" height="3" rx="1" fill="rgba(0,0,0,0.2)"/>' +
            '</g>' +
            // Coupler 1
            '<rect x="24" y="7" width="4" height="4" rx="1" fill="#1f2937"/>' +
            // Mid coach
            '<g id="coach-mid" style="transition: transform 0.25s linear; transform-origin: 40px 9px;">' +
              '<rect x="28" y="1" width="24" height="16" rx="3" fill="#e5e7eb" stroke="#374151" stroke-width="1.2"/>' +
              '<rect x="28" y="7" width="24" height="5" fill="' + c + '"/>' +
              '<rect x="30" y="3" width="5" height="3" rx="1" fill="rgba(0,0,0,0.2)"/>' +
              '<rect x="45" y="3" width="5" height="3" rx="1" fill="rgba(0,0,0,0.2)"/>' +
            '</g>' +
            // Coupler 2
            '<rect x="52" y="7" width="4" height="4" rx="1" fill="#1f2937"/>' +
            // Front/nose coach — rounded nose on right
            '<g id="coach-front" style="transition: transform 0.25s linear; transform-origin: 67px 9px;">' +
              '<rect x="56" y="1" width="24" height="16" rx="5" fill="#e5e7eb" stroke="#374151" stroke-width="1.2"/>' +
              '<rect x="56" y="7" width="22" height="5" fill="' + c + '"/>' +
              '<rect x="58" y="3" width="5" height="3" rx="1" fill="rgba(0,0,0,0.2)"/>' +
              // Headlights on nose
              '<rect x="76" y="4" width="3" height="3" rx="1" fill="#fef3c7"/>' +
              '<rect x="76" y="11" width="3" height="3" rx="1" fill="#fef3c7"/>' +
            '</g>' +
          '</svg>' +
          '</div>';
            
        var flyingIcon = L.divIcon({
          className: 'station-marker',
          html: trainHtml,
          iconSize: [80, 18],
          iconAnchor: [40, 9]
        });
        window.flyingMarker = L.marker(window.orderedCoords[0], { icon: flyingIcon, zIndexOffset: 3000 }).addTo(activeRouteGroup);
        
        window.flyingMarker.on('click', function() {
          var content = '<div class="popup-dynamic-content" style="font-size:12px;font-weight:700;padding:2px;text-align:center;line-height:1.4;color:#444;">';

          var isAtStation = window.isTrainStopped;
          var nextOrArrived = isAtStation ? '📍 Arrived at' : '➡️ Arriving at';
          var stationName = isAtStation ? (window.currentStationName || 'Station') : (window.nextStationName || 'Next Station');
          var remMin = window.remainingMinutes || 0;
          var remKm = window.remainingDistanceKm || 0;

          content += '<div style="color:#8e8e93; font-size:10px; text-transform:uppercase; margin-bottom:2px;">Journey Status</div>';
          content += nextOrArrived + '<br/><span style="color:#34c759;font-size:14px;">' + stationName + '</span>';

          if (!isAtStation) {
            content += '<div style="border-top:0.5px solid #eee; margin-top:6px; padding-top:4px; display:flex; justify-content:space-between; gap:10px;">';
            content += '<span>⏱ ' + remMin + 'm left</span>';
            content += '<span>🏁 ' + remKm.toFixed(1) + ' km</span>';
            content += '</div>';
          }

          content += '</div>';

          window.flyingMarker.setPopupContent(content);
          if (!window.flyingMarker.isPopupOpen()) {
             window.flyingMarker.openPopup();
          }
        });

        // Initial binding
        window.flyingMarker.bindPopup('<div class="popup-dynamic-content">Loading Status...</div>', {
          autoClose: false,
          closeOnClick: false,
          offset: [0, -10],
          className: 'custom-popup'
        });

        var duration = totalTimeMs; 
        var start = null;
        var lastNotifiedStationIndex = -1;
        var lastDepartedStationIndex = -1;

        // Initialize the popup state variables from the first segment
        window.isTrainStopped = false;
        window.lastAngle = undefined;
        if (activeRoute.edges && activeRoute.edges.length > 0) {
          var firstTarget = stations.find(function(s) { return s.id === activeRoute.edges[0].target; });
          window.nextStationName = firstTarget ? firstTarget.name : '';
          window.currentStationName = window.nextStationName;
        }

        // Helper for Train snapping: calculate shortest distance from point to line segment
        function distanceToSegment(p, v, w) {
          var l2 = v.distanceTo(w);
          l2 = l2 * l2; // distance squared
          if (l2 == 0) return p.distanceTo(v);
          var dy = w.lat - v.lat;
          var dx = w.lng - v.lng;
          var t = ((p.lng - v.lng) * dx + (p.lat - v.lat) * dy) / (dx*dx + dy*dy); // Simple planar projection approximation for short distances
          t = Math.max(0, Math.min(1, t));
          var proj = L.latLng(v.lat + t * dy, v.lng + t * dx);
          return p.distanceTo(proj);
        }

        // Apply rotation to the whole train + stagger each coach so they look articulated through curves
        function applyTrainRotation(angle, segIdx, segs) {
          if (!window.flyingMarker) return;
          var el = window.flyingMarker.getElement();
          if (!el) return;
          
          // Whole train wrapper rotates
          var container = el.querySelector('.train-container');
          if (container) {
            container.style.transform = 'rotate(' + angle + 'deg)';
          }
          
          // Previous segment angle (for tail/mid coach articulation)
          var prevAngle = angle;
          if (segIdx > 0 && segs[segIdx - 1]) {
            var pDy = segs[segIdx - 1].p2[0] - segs[segIdx - 1].p1[0];
            var pDx = segs[segIdx - 1].p2[1] - segs[segIdx - 1].p1[1];
            prevAngle = Math.atan2(-pDy, pDx) * 180 / Math.PI;
            var d = prevAngle - angle;
            if (d > 180) d -= 360;
            if (d < -180) d += 360;
            prevAngle = angle + d;
          }
          
          // Individual coach articulation via SVG <g> groups
          var tailG = el.querySelector('#coach-tail');
          var midG  = el.querySelector('#coach-mid');
          if (tailG && midG) {
            var midOffset  = (prevAngle - angle) * 0.3;
            var tailOffset = (prevAngle - angle) * 0.6;
            tailG.style.transform = 'rotate(' + (-tailOffset) + 'deg)';
            midG.style.transform  = 'rotate(' + (-midOffset)  + 'deg)';
          }
        }

        function animateFly(timestamp) {
          // If GPS is active and user is near route, snap to it. 
          // Otherwise, dead reckon using baseTime extrapolation.
          var hasRecentGps = window.lastLocationTime && (Date.now() - window.lastLocationTime < 10000);
          var snapped = false;

          // Determine if user is mathematically standing on the tracks
          var isUserNearRoute = false;
          if (window.latestUserLatLng && window.orderedCoords && window.orderedCoords.length > 0) {
            var minRouteDist = Infinity;
            var uLatLng = L.latLng(window.latestUserLatLng.lat, window.latestUserLatLng.lng);
            for (var i = 0; i < window.orderedCoords.length - 1; i++) {
              var p1 = L.latLng(window.orderedCoords[i][0], window.orderedCoords[i][1]);
              var p2 = L.latLng(window.orderedCoords[i+1][0], window.orderedCoords[i+1][1]);
              var d = distanceToSegment(uLatLng, p1, p2);
              if (d < minRouteDist) minRouteDist = d;
            }
            if (minRouteDist < 50) { // Must be within 50 meters of the tracks
              isUserNearRoute = true;
            }
          }

          if (hasRecentGps && isUserNearRoute) {
            snapped = true;
            window.flyingMarker.setLatLng(window.latestUserLatLng);
            
            if (segments[currentSegmentIndex]) {
              var dy = segments[currentSegmentIndex].p2[0] - segments[currentSegmentIndex].p1[0];
              var dx = segments[currentSegmentIndex].p2[1] - segments[currentSegmentIndex].p1[1];
              var angle = Math.atan2(-dy, dx) * 180 / Math.PI;
              
              if (typeof window.lastAngle === 'undefined') window.lastAngle = angle;
              var diff = angle - (window.lastAngle % 360);
              if (diff > 180) diff -= 360;
              if (diff < -180) diff += 360;
              var targetAngle = window.lastAngle + diff;
              window.lastAngle = targetAngle;
              
              applyTrainRotation(targetAngle, currentSegmentIndex, segments);
            }
          }

          if (!start) start = timestamp;
          
          var currentSegmentIndex = 0;
          var segmentProgress = 0;

          if (snapped) {
            // GPS mode: position already set above. Now determine segment index from GPS.
            var minRouteDist2 = Infinity;
            var uLatLng2 = L.latLng(window.latestUserLatLng.lat, window.latestUserLatLng.lng);
            for (var i = 0; i < segments.length; i++) {
              var sp1 = L.latLng(segments[i].p1[0], segments[i].p1[1]);
              var sp2 = L.latLng(segments[i].p2[0], segments[i].p2[1]);
              var sd = distanceToSegment(uLatLng2, sp1, sp2);
              if (sd < minRouteDist2) {
                minRouteDist2 = sd;
                currentSegmentIndex = i;
              }
            }
            var closestSeg2 = segments[currentSegmentIndex];
            var cs2p1 = L.latLng(closestSeg2.p1[0], closestSeg2.p1[1]);
            var cs2p2 = L.latLng(closestSeg2.p2[0], closestSeg2.p2[1]);
            var segLen2 = cs2p1.distanceTo(cs2p2);
            segmentProgress = segLen2 > 0 ? Math.min(cs2p1.distanceTo(uLatLng2) / segLen2, 1) : 0;
          }
          // If not snapped (no GPS / not near route) — train stays frozen at last GPS position.
          // No simulation, no dead-reckoning. Train stays at its GPS position.

          // Calculate remaining journey telemetry
          var remTimeMs = 0;
          if (segments[currentSegmentIndex]) {
            remTimeMs = segments[currentSegmentIndex].timeMs * (1 - segmentProgress);
            for (var k = currentSegmentIndex + 1; k < segments.length; k++) {
              remTimeMs += segments[k].timeMs;
            }
          }
          // Scale back: 3000ms animation = 1 real minute
          window.remainingMinutes = Math.ceil(remTimeMs / 3000);

          // Estimate distance proportional to time for simplicity in the UI
          if (activeRoute.metrics.time > 0) {
            window.remainingDistanceKm = (window.remainingMinutes / activeRoute.metrics.time) * activeRoute.metrics.distance;
          } else {
            window.remainingDistanceKm = 0;
          }

          // Halo Effect for current segment
          if (segments[currentSegmentIndex]) {
            if (!window.haloLine) {
              window.haloLine = L.polyline([], {
                color: '#ffffff',
                weight: 12,
                opacity: 0.5,
                className: 'halo-pulse-line',
                interactive: false
              }).addTo(activeRouteGroup);
            }
            
            var edge = activeRoute.edges[currentSegmentIndex];
            var routeColor = edge.line === 'Skywalk' ? '#a855f7' : (lineColors[edge.line] || '#0072BB');
            
            window.haloLine.setLatLngs([segments[currentSegmentIndex].p1, segments[currentSegmentIndex].p2]);
            window.haloLine.setStyle({ color: routeColor });
            
            var markerEl = window.flyingMarker.getElement();
            if (markerEl) {
              // Update the colored stripe fill in all 3 coach groups
              var stripes = markerEl.querySelectorAll('#coach-tail rect:nth-child(2), #coach-mid rect:nth-child(2), #coach-front rect:nth-child(2)');
              stripes.forEach(function(r) { r.setAttribute('fill', routeColor); });
            }
          }

          var transferStationIds = new Set();
          if (activeRoute && activeRoute.edges) {
            activeRoute.edges.forEach(function(e) {
              if (e.isTransfer) transferStationIds.add(e.source);
            });
          }

          // Trigger Haptic Station Arrival Event BEFORE reaching the upcoming station (at 50% progress)
          // OR if we skipped past it (e.g. GPS jump), we must process the missed station.
          var shouldNotify = false;
          var targetNotifyIndex = lastNotifiedStationIndex;
          
          if (currentSegmentIndex > lastNotifiedStationIndex) {
            // We jumped past the >0.5 mark entirely for the lastNotifiedStationIndex segment!
            // We must notify for it NOW to guarantee we never miss a station.
            shouldNotify = true;
            targetNotifyIndex = lastNotifiedStationIndex;
          } else if (currentSegmentIndex === lastNotifiedStationIndex && segmentProgress > 0.5) {
            // We are naturally reaching the 50% mark of the current segment
            shouldNotify = true;
            targetNotifyIndex = currentSegmentIndex;
          }
          
          if (currentSegmentIndex > lastDepartedStationIndex) {
            lastDepartedStationIndex = currentSegmentIndex;
            if (window.ReactNativeWebView && activeRoute.path[currentSegmentIndex]) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'STATION_DEPARTED',
                stationId: activeRoute.path[currentSegmentIndex].id
              }));
            }
          }

          if (shouldNotify) {
            lastNotifiedStationIndex = targetNotifyIndex + 1; // Mark this one as processed
            
            var upcomingStationNode = activeRoute.path[targetNotifyIndex + 1];
            if (upcomingStationNode) {
              var isArrEnd = upcomingStationNode.id === endStationId;
              var isArrInterchange = transferStationIds.has(upcomingStationNode.id);
              
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'STATION_ARRIVAL',
                  stationId: upcomingStationNode.id,
                  stationName: upcomingStationNode.name,
                  arrivalType: isArrEnd ? 'DESTINATION' : (isArrInterchange ? 'INTERCHANGE' : 'STOP'),
                  isDestination: isArrEnd,
                  isInterchange: isArrInterchange,
                  interchangeLine: isArrInterchange && activeRoute.edges[targetNotifyIndex + 1] ? activeRoute.edges[targetNotifyIndex + 1].line : null
                }));
              }
            }
          }

          // Tooltip tracking: Next / Current Station — runs every frame
          var tEdge = activeRoute.edges[currentSegmentIndex];
          if (tEdge) {
            var tNextStation = stations.find(function(s) { return s.id === tEdge.target; });
            var tCurrentStation = stations.find(function(s) { return s.id === tEdge.source; });
            
            if (segmentProgress >= 0.90) {
              // Nearly arrived at the target station
              if (tNextStation) window.currentStationName = tNextStation.name;
              window.isTrainStopped = true;
            } else {
              // In transit between two stations
              if (tNextStation) window.nextStationName = tNextStation.name;
              if (tCurrentStation) window.currentStationName = tCurrentStation.name;
              window.isTrainStopped = false;
            }

            // Live-update the open popup DOM directly
            if (window.flyingMarker && window.flyingMarker.isPopupOpen()) {
              var popupEl = window.flyingMarker.getPopup().getElement();
              if (popupEl) {
                var contentWrapper = popupEl.querySelector('.popup-dynamic-content');
                if (contentWrapper) {
                  var isAtStation = window.isTrainStopped;
                  var nextOrArrived = isAtStation ? '📍 Arrived at' : '➡️ Arriving at';
                  var stationName = isAtStation ? (window.currentStationName || '') : (window.nextStationName || '');
                  var remMin = window.remainingMinutes || 0;
                  var remKm = window.remainingDistanceKm || 0;

                  var inner = '<div style="color:#8e8e93; font-size:10px; text-transform:uppercase; margin-bottom:2px;">Journey Status</div>';
                  inner += nextOrArrived + '<br/><span style="color:#34c759;font-size:14px;">' + stationName + '</span>';

                  if (!isAtStation) {
                    inner += '<div style="border-top:0.5px solid #eee; margin-top:6px; padding-top:4px; display:flex; justify-content:space-between; gap:10px;">';
                    inner += '<span>⏱ ' + remMin + 'm left</span>';
                    inner += '<span>🏁 ' + remKm.toFixed(1) + ' km</span>';
                    inner += '</div>';
                  }

                  contentWrapper.innerHTML = inner;
                }
              }
            }
          }

          // Station Departed trigger (early in the segment)
          if (segmentProgress < 0.1 && currentSegmentIndex > lastDepartedStationIndex && currentSegmentIndex > 0) {
            var sourceStationId = activeRoute.edges[currentSegmentIndex].source;
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'STATION_DEPARTED',
                stationId: sourceStationId
              }));
            }
            lastDepartedStationIndex = currentSegmentIndex;
          }
          
          window.routeAnimationReq = requestAnimationFrame(animateFly);
        }

        window.routeAnimationReq = requestAnimationFrame(animateFly);
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

      var transferStationIds = new Set();
      if (activeRoute && activeRoute.edges) {
        activeRoute.edges.forEach(function(e) {
          if (e.isTransfer) {
            transferStationIds.add(e.source);
          }
        });
      }
      
      stations.forEach(function(station) {
        var coords = [station.coordinates[0], station.coordinates[1]];
        var isStart = station.id === startStationId;
        var isEnd = station.id === endStationId;
        var isOnActiveRoute = activeStationIds.has(station.id);
        var isInterchange = transferStationIds.has(station.id);
        var isIntermediate = isOnActiveRoute && !isStart && !isEnd && !isInterchange;
        var isActiveInterchange = isOnActiveRoute && isInterchange && !isStart && !isEnd;

        var opacity = hasActiveRoute ? (isOnActiveRoute ? 1.0 : 0.18) : 1.0;

        var iconHtml = '';
        var size = [16, 16];

        var crowdScore = realtimeArrivals && realtimeArrivals.crowdScores ? realtimeArrivals.crowdScores[station.id] : undefined;
        var isClosed = realtimeArrivals && realtimeArrivals.crowdScores && realtimeArrivals.crowdScores['IS_CLOSED'];
        
        var getBgColor = function(defaultBg) {
          if (isClosed) return '#8E8E93';
          if (crowdScore !== undefined) return crowdScore >= 8.5 ? '#FF453A' : (crowdScore >= 6.0 ? '#FF9F0A' : '#30D158');
          return defaultBg;
        };

        if (isStart) {
          iconHtml = '<div class="pin-selected pin-start"><div class="pulse-ring"></div><span style="color: white; font-size: 8px; font-weight: 900; text-shadow: 0 1px 2px rgba(0,0,0,0.6); line-height: 1;">START</span></div>';
          size = [24, 24]; // Reduced size
        } else if (isEnd) {
          iconHtml = '<div class="pin-selected pin-end"><div class="pulse-ring"></div><span style="color: white; font-size: 8px; font-weight: 900; text-shadow: 0 1px 2px rgba(0,0,0,0.6); line-height: 1;">END</span></div>';
          size = [24, 24]; // Reduced size
        } else if (isIntermediate) {
          var bgColor = getBgColor('#ffffff');
          iconHtml = '<div class="pin-intermediate" style="background-color: ' + bgColor + ' !important;"></div>';
          size = [12, 12];
        } else if (isActiveInterchange) {
          var bgColor = getBgColor('#ffffff');
          iconHtml = '<div class="pin-intermediate" style="background-color: ' + bgColor + ' !important; border: 3px dotted #ffffff !important; width: 16px !important; height: 16px !important;"></div>';
          size = [16, 16];
        } else if (isInterchange) {
          var bgColor = getBgColor(isDark ? '#1e1e1e' : '#ffffff');
          iconHtml = '<div class="station-dot-interchange" style="background-color: ' + bgColor + ' !important; display: flex; align-items: center; justify-content: center;"><div style="width: 6px; height: 6px; border-radius: 50%; background: ' + (isDark ? '#ffffff' : '#111111') + ';"></div></div>';
          size = [20, 20];
        } else {
          var lineColor = lineColors[station.lines[0]] || '#888888';
          var bgColor = getBgColor(isDark ? '#1e1e1e' : '#ffffff');
          iconHtml = '<div class="station-dot" style="border-color: ' + lineColor + '; background-color: ' + bgColor + ' !important;"></div>';
          size = [16, 16];
        }


        var customIcon = L.divIcon({
          className: 'station-marker',
          html: iconHtml,
          iconSize: size,
          iconAnchor: [size[0] / 2, size[1] / 2]
        });

        // Build line badges
        var lineBadgesHtml = station.lines.map(function(line) {
          var color = lineColors[line] || '#888888';
          return '<span style="background: ' + color + '; color: white; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; display: inline-block; margin-right: 4px; margin-bottom: 4px;">' + line + '</span>';
        }).join('');

        // Interchange badge & details
        var interchangeHeader = '';
        var transferInfoHtml = '';
        if (isInterchange) {
          interchangeHeader = '<span style="background: ' + (isDark ? 'rgba(168, 85, 247, 0.2)' : '#F3E8FF') + '; color: ' + (isDark ? '#C084FC' : '#7E22CE') + '; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; display: inline-block; margin-left: 6px; border: 0.5px solid ' + (isDark ? 'rgba(168, 85, 247, 0.3)' : '#DDD6FE') + ';">Interchange</span>';

          var transferInfoText = 'Standard interchange concourse walkway.';
          if (station.id === "NS52" || station.id === "NS51") transferInfoText = '🚶 Sector 52-51 Pedestrian Pathway (300m, free e-rickshaws).';
          else if (station.id === "DK" || station.id === "DDS") transferInfoText = '🚶 Covered Skywalk with Travelators (1.2 km).';
          else if (station.id === "RG") transferInfoText = '🚶 Elevated Interchange Bridge Skywalk (400m).';
          else if (station.id === "HK") transferInfoText = '🚶 Deep underground escalators (350m).';
          else if (station.id === "RC") transferInfoText = '🚶 Central Concourse escalators & stairs (200m).';
          else if (station.id === "KG") transferInfoText = '🚶 Multi-level escalator shafts & tunnel (300m).';

          transferInfoHtml = '<div style="margin-bottom: 8px; padding: 6px; background: ' + (isDark ? 'rgba(139, 92, 246, 0.12)' : '#F5F3FF') + '; border: 0.5px solid ' + (isDark ? 'rgba(139, 92, 246, 0.3)' : '#DDD6FE') + '; border-radius: 6px; font-size: 10px; color: ' + (isDark ? '#A855F7' : '#6D28D9') + '; font-weight: 500; line-height: 1.3;">' + transferInfoText + '</div>';
        }

        // Accessibility Features parser
        var hasElevator = false;
        var hasEscalator = false;
        var hasWheelchair = false;
        if (station.exits) {
          station.exits.forEach(function(exit) {
            if (exit.accessibility) {
              exit.accessibility.forEach(function(facility) {
                var facLower = facility.toLowerCase();
                if (facLower.indexOf('elevator') !== -1 || facLower.indexOf('lift') !== -1) hasElevator = true;
                if (facLower.indexOf('escalator') !== -1) hasEscalator = true;
                if (facLower.indexOf('wheelchair') !== -1 || facLower.indexOf('ramp') !== -1) hasWheelchair = true;
              });
            }
          });
        }
        var facilitiesHtml = '';
        if (hasElevator || hasEscalator || hasWheelchair) {
          facilitiesHtml += '<div style="margin-bottom: 8px; font-size: 10px; color: ' + (isDark ? '#aaaaaa' : '#666666') + '; display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">';
          facilitiesHtml += '<span style="font-weight: 700;">Facilities:</span>';
          if (hasElevator) facilitiesHtml += '<span style="background: ' + (isDark ? '#2c2c2e' : '#e5e5ea') + '; padding: 1px 4px; border-radius: 3px;">🛗 Lift</span>';
          if (hasEscalator) facilitiesHtml += '<span style="background: ' + (isDark ? '#2c2c2e' : '#e5e5ea') + '; padding: 1px 4px; border-radius: 3px;">📶 Escalator</span>';
          if (hasWheelchair) facilitiesHtml += '<span style="background: ' + (isDark ? '#2c2c2e' : '#e5e5ea') + '; padding: 1px 4px; border-radius: 3px;">♿ Ramp</span>';
          facilitiesHtml += '</div>';
        }

        // Crowd Estimator
        var finalCrowdVal = crowdScore !== undefined ? crowdScore : (station.baseCrowd || 5);
        var crowdLabel = 'Low';
        var crowdColor = '#34c759'; // Apple Green
        if (isClosed) {
          crowdLabel = 'Closed';
          crowdColor = '#8E8E93';
        } else if (finalCrowdVal >= 8.5) {
          crowdLabel = 'Heavy Rush';
          crowdColor = '#ff3b30'; // Apple Red
        } else if (finalCrowdVal >= 6.0) {
          crowdLabel = 'Moderate';
          crowdColor = '#ff9500'; // Apple Orange
        }
        var crowdHtml = '<div style="margin-bottom: 6px; font-size: 10px; font-weight: 600; color: ' + crowdColor + '; display: flex; align-items: center; gap: 4px;">' +
          '<span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ' + crowdColor + ';"></span>' + crowdLabel + ' Crowd</div>';

        // Build arrivals info
        var arrivalsList = realtimeArrivals[station.id] || [];
        var arrivalsHtml = '';
        if (arrivalsList.length > 0) {
          arrivalsHtml += '<div style="margin-top: 6px; margin-bottom: 8px; padding: 6px; background: ' + (isDark ? 'rgba(0,122,255,0.12)' : '#F0F7FF') + '; border: 0.5px solid ' + (isDark ? 'rgba(0,122,255,0.3)' : '#BFDBFE') + '; border-radius: 6px; font-size: 10px;">';
          arrivalsHtml += '<div style="font-weight: 700; color: ' + (isDark ? '#30D158' : '#0056B3') + '; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">⏱ Live Next Trains</div>';
          arrivalsList.forEach(function(arr) {
            arr.trains.forEach(function(t) {
              arrivalsHtml += '<div style="display: flex; justify-content: space-between; margin-bottom: 2px; color: ' + (isDark ? '#e5e5ea' : '#1f2937') + ';">' +
                '<span>' + t.destination + '</span>' +
                '<span style="font-weight: 700;">' + t.min + ' min</span>' +
                '</div>';
            });
          });
          arrivalsHtml += '</div>';
        }
        arrivalsHtml = '<div id="live-arrivals-' + station.id + '">' + arrivalsHtml + '</div>';

        // Popup HTML with Apple styling
        var popupHtml = '<div style="font-family: inherit; min-width: 180px;">' +
          '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; gap: 4px;">' +
            '<div style="font-weight: 700; font-size: 14px; color: ' + (isDark ? '#ffffff' : '#111827') + ';">' + station.name + '</div>' +
            interchangeHeader +
          '</div>' +
          '<div style="margin-bottom: 6px;">' + lineBadgesHtml + '</div>' +
          crowdHtml +
          facilitiesHtml +
          arrivalsHtml +
          transferInfoHtml +
          '<div style="display: flex; gap: 8px;">' +
            '<button onclick="setStationAsStart(\\\'' + station.id + '\\\')" style="flex: 1; border: none; background: ' + (isDark ? '#30D158' : '#34C759') + '; color: white; padding: 7px 10px; border-radius: 8px; font-weight: 700; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">From Here</button>' +
            '<button onclick="setStationAsEnd(\\\'' + station.id + '\\\')" style="flex: 1; border: none; background: ' + (isDark ? '#FF453A' : '#FF3B30') + '; color: white; padding: 7px 10px; border-radius: 8px; font-weight: 700; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">To Here</button>' +
          '</div>' +
        '</div>';

        var marker = L.marker(coords, {
          icon: customIcon,
          opacity: opacity,
          zIndexOffset: (isStart || isEnd) ? 1000 : transferStationIds.has(station.id) ? 800 : isOnActiveRoute ? 600 : isInterchange ? 500 : 0
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
    function handleMessage(event) {
      var message = event.data;
      if (typeof message === 'string') {
        try {
          message = JSON.parse(message);
        } catch (e) {
          return;
        }
      }
      if (!message || typeof message !== 'object') return;

      if (message.type === 'UPDATE_ROUTE') {
        startStationId = message.startStationId;
        endStationId = message.endStationId;
        activeRoute = message.activeRoute;
        
        drawBaseNetwork();
        drawActiveRoute();
        drawStations();
      } else if (message.type === 'UPDATE_ARRIVALS') {
        realtimeArrivals = message.arrivals || {};
        
        stations.forEach(function(station) {
          // 1. Update in-place popup DOM if it is open
          var arrivalsContainer = document.getElementById('live-arrivals-' + station.id);
          if (arrivalsContainer) {
            var arrivalsList = realtimeArrivals[station.id] || [];
            var arrivalsHtml = '';
            if (arrivalsList.length > 0) {
              arrivalsHtml += '<div style="margin-top: 6px; margin-bottom: 8px; padding: 6px; background: ' + (isDark ? 'rgba(0,122,255,0.12)' : '#F0F7FF') + '; border: 0.5px solid ' + (isDark ? 'rgba(0,122,255,0.3)' : '#BFDBFE') + '; border-radius: 6px; font-size: 10px;">';
              arrivalsHtml += '<div style="font-weight: 700; color: ' + (isDark ? '#30D158' : '#0056B3') + '; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">⏱ Live Next Trains</div>';
              arrivalsList.forEach(function(arr) {
                arr.trains.forEach(function(t) {
                  arrivalsHtml += '<div style="display: flex; justify-content: space-between; margin-bottom: 2px; color: ' + (isDark ? '#e5e5ea' : '#1f2937') + ';">' +
                    '<span>' + t.destination + '</span>' +
                    '<span style="font-weight: 700;">' + t.min + ' min</span>' +
                    '</div>';
                });
              });
              arrivalsHtml += '</div>';
            }
            arrivalsContainer.innerHTML = arrivalsHtml;
          }

          // 2. Update marker dot background color in-place
          var marker = stationMarkers[station.id];
          if (marker) {
            var el = marker.getElement();
            if (el) {
              var dot = el.querySelector('.station-dot') || el.querySelector('.pin-intermediate') || el.querySelector('.station-dot-interchange');
              if (dot) {
                var crowdScore = realtimeArrivals && realtimeArrivals.crowdScores ? realtimeArrivals.crowdScores[station.id] : undefined;
                var isClosed = realtimeArrivals && realtimeArrivals.crowdScores && realtimeArrivals.crowdScores['IS_CLOSED'];
                var getBgColor = function(defaultBg) {
                  if (isClosed) return '#8E8E93';
                  if (crowdScore !== undefined) return crowdScore >= 8.5 ? '#FF453A' : (crowdScore >= 6.0 ? '#FF9F0A' : '#30D158');
                  return defaultBg;
                };
                dot.style.setProperty('background-color', getBgColor(isDark ? '#1e1e1e' : '#ffffff'), 'important');
              }
            }
          }
        });
      } else if (message.type === 'CENTER_ON_DELHI') {
        map.setView([28.6304, 77.2177], 11, { animate: true });
      } else if (message.type === 'ZOOM_IN') {
        map.zoomIn();
      } else if (message.type === 'ZOOM_OUT') {
        map.zoomOut();
        map.zoomOut();
      } else if (message.type === 'LOCATE_USER') {
        if (window.latestUserLatLng && userLocationMarker) {
          if (window.showUserLocationPopup) {
            window.showUserLocationPopup(message.startStationId);
          }
        } else {
          window.forceLocateView = true;
          map.locate({ setView: false, maxZoom: 15 });
        }
      } else if (message.type === 'UPDATE_USER_LOCATION') {
        window.latestUserLatLng = {
          lat: message.latitude,
          lng: message.longitude
        };
        window.lastLocationTime = Date.now();

        map.fireEvent('locationfound', {
          latlng: L.latLng(message.latitude, message.longitude),
          accuracy: message.accuracy || 15
        });
      }
    }

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);

    // Start Initialization
    initMap();
  </script>
</body>
</html>
`;
}
