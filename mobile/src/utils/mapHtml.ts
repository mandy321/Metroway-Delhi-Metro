import { LEAFLET_CSS, LEAFLET_JS } from "./leafletAssets";

export function getMapHtml(stations: any[], edges: any[], initialRoute: any, startStationId: string, endStationId: string, theme: 'light' | 'dark' = 'dark', realtimeArrivals: Record<string, any> = {}) {
  const isDark = theme === 'dark';
  const tileUrl = isDark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

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

          sendToReactNative({
            type: 'USER_LOCATION',
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
          });
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

        // Start locating immediately on launch
        map.locate({ setView: false, maxZoom: 15, watch: true, enableHighAccuracy: true });

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

        // Add midpoint skywalk walking indicator
        if (isSkywalk) {
          var midLat = (sourceCoords[0] + targetCoords[0]) / 2;
          var midLng = (sourceCoords[1] + targetCoords[1]) / 2;
          var walkIcon = L.divIcon({
            className: 'station-marker',
            html: '<div style="background: ' + (isDark ? '#1e1e1e' : '#ffffff') + '; border: 1.5px solid #a855f7; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,0.3); font-size: 11px;">🚶</div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });
          L.marker([midLat, midLng], { icon: walkIcon, zIndexOffset: 900 })
            .bindPopup('<div style="font-family: inherit; font-size: 11px; font-weight: 700; color: ' + (isDark ? '#ffffff' : '#000000') + '; text-align: center;">🚶 Skywalk Pathway<br/><span style="font-weight: 500; font-size: 10px; color: #8e8e93;">(' + edge.baseTime + ' min walk)</span></div>', { closeButton: false })
            .addTo(edgesGroup);
        }
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
        var isInterchange = station.lines.length > 1;
        var isOnActiveRoute = activeStationIds.has(station.id);
        var opacity = hasActiveRoute ? (isOnActiveRoute || isStart || isEnd ? 1.0 : 0.18) : 1.0;

        var iconHtml = '';
        var size = [16, 16];

        if (isStart) {
          iconHtml = '<div class="pin-selected pin-start"><div class="pulse-ring"></div><span style="color: white; font-size: 8px; font-weight: 900; text-shadow: 0 1px 2px rgba(0,0,0,0.6); line-height: 1;">START</span></div>';
          size = [38, 38];
        } else if (isEnd) {
          iconHtml = '<div class="pin-selected pin-end"><div class="pulse-ring"></div><span style="color: white; font-size: 9px; font-weight: 900; text-shadow: 0 1px 2px rgba(0,0,0,0.6); line-height: 1;">END</span></div>';
          size = [38, 38];
        } else if (transferStationIds.has(station.id)) {
          iconHtml = '<div class="pin-transfer"></div>';
          size = [20, 20];
        } else if (isInterchange) {
          iconHtml = '<div class="station-dot-interchange" style="display: flex; align-items: center; justify-content: center;"><div style="width: 6px; height: 6px; border-radius: 50%; background: ' + (isDark ? '#ffffff' : '#111111') + ';"></div></div>';
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
        var crowdVal = station.baseCrowd || 5;
        var crowdLabel = 'Low';
        var crowdColor = '#34c759'; // Apple Green
        if (crowdVal > 7) {
          crowdLabel = 'Heavy Rush';
          crowdColor = '#ff3b30'; // Apple Red
        } else if (crowdVal > 4) {
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
      } else if (message.type === 'CENTER_ON_DELHI') {
        map.setView([28.6304, 77.2177], 11, { animate: true });
      } else if (message.type === 'ZOOM_IN') {
        map.zoomIn();
      } else if (message.type === 'ZOOM_OUT') {
        map.zoomOut();
      } else if (message.type === 'LOCATE_USER') {
        map.locate({ setView: true, maxZoom: 15 });
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
