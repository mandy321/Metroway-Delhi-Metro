import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
  useColorScheme,
  PermissionsAndroid,
  Vibration,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useMetroStore } from "../store/useMetroStore";
import { Colors } from "../constants/theme";
import { getMapHtml } from "../utils/mapHtml";

// Write HTML to a temp file to avoid Android WebView base64 URI size limits
// (base64 data URIs >300KB cause blank/grey screens on Android WebView)
const MAP_TEMP_FILE = (FileSystem.cacheDirectory || '') + 'metroway_map.html';

const DELHI_CENTER = {
  latitude: 28.6304,
  longitude: 77.2177,
};

export default function MapScreen() {
  const router = useRouter();
  const store = useMetroStore();
  const scheme = useColorScheme() || 'light';
  const systemTheme = scheme === 'unspecified' ? 'light' : scheme;
  const activeTheme = store.themeMode === 'system' ? systemTheme : store.themeMode;
  const colors = Colors[activeTheme];
  
  const webViewRef = useRef<WebView | null>(null);
  
  // Geolocation & GPS tracking state
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  // Helper to calculate distance in meters using simple Euclidean/spherical projection
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // distance in meters
  };

  // Find nearest station globally (if not on-train/no active route)
  const nearestStationInfo = React.useMemo(() => {
    if (!userLocation) return null;
    let minDistance = Infinity;
    let nearest: any = null;
    store.stations.forEach(station => {
      if (station.coordinates && station.coordinates.length === 2) {
        const dist = getDistance(userLocation.latitude, userLocation.longitude, station.coordinates[0], station.coordinates[1]);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = station;
        }
      }
    });
    return nearest ? { station: nearest, distance: Math.round(minDistance) } : null;
  }, [userLocation, store.stations]);

  // Find nearest station along active route (if riding)
  const nearestActiveRouteStation = React.useMemo(() => {
    if (!userLocation || !store.activeRoute || !store.activeRoute.path) return null;
    let minDistance = Infinity;
    let nearest: any = null;
    let index = -1;
    store.activeRoute.path.forEach((station, idx) => {
      if (station.coordinates && station.coordinates.length === 2) {
        const dist = getDistance(userLocation.latitude, userLocation.longitude, station.coordinates[0], station.coordinates[1]);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = station;
          index = idx;
        }
      }
    });
    return nearest ? { station: nearest, distance: Math.round(minDistance), index } : null;
  }, [userLocation, store.activeRoute]);

  // Lifecycle & Loading State
  const [mapLoading, setMapLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);   // True only after successful JS init
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapVersion, setMapVersion] = useState(0); // Used to force reload/retry
  const [mapFileUri, setMapFileUri] = useState<string | null>(null);
  const [locationPermissionDone, setLocationPermissionDone] = useState(
    Platform.OS === 'ios' // iOS doesn't need runtime FINE_LOCATION permission here
  );

  // Haptic Arrival Alert State
  const [arrivalAlert, setArrivalAlert] = useState<{stationName: string, arrivalType: string} | null>(null);
  const vibrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissArrivalAlert = useCallback(() => {
    Vibration.cancel();
    if (vibrationTimeoutRef.current) clearTimeout(vibrationTimeoutRef.current);
    setArrivalAlert(null);
  }, []);

  // Rebuild and write the map HTML to a cache file whenever core data changes.
  // NOTE: realtimeArrivals is intentionally EXCLUDED — it is pushed via postMessage
  // to avoid a full WebView reload every time live data refreshes.
  const buildAndWriteMapFile = useCallback(async () => {
    try {
      const html = getMapHtml(
        store.stations,
        store.edges,
        store.activeRoute, // It will capture the initial state
        store.startStationId,
        store.endStationId,
        activeTheme,
        {} // arrivals injected via postMessage after load
      );
      await FileSystem.writeAsStringAsync(MAP_TEMP_FILE, html, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      // Add cache-bust query so WebView actually reloads the updated file
      setMapFileUri(`${MAP_TEMP_FILE}?v=${Date.now()}`);
    } catch (e) {
      console.error('[MapScreen] Failed to write map HTML file:', e);
      setMapError('Failed to prepare map file. Please retry.');
      setMapLoading(false);
    }
  }, [store.stations, store.edges, activeTheme, mapVersion]);

  // Re-build map file when core data or theme changes
  useEffect(() => {
    buildAndWriteMapFile();
  }, [buildAndWriteMapFile]);

  // Request Location Permissions at Runtime for Android
  // We resolve permission BEFORE allowing WebView to render so Leaflet's
  // map.locate() fires after the host app already holds the permission grant.
  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message:
                'Metroway needs access to your location to show where you are on the map and find the nearest stations.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('[MapScreen] GPS Location permission granted');
          } else {
            console.log('[MapScreen] GPS Location permission denied — map will load without geolocation');
          }
        } catch (err) {
          console.warn('[MapScreen] Permission request error:', err);
        } finally {
          // Always unblock WebView render regardless of permission outcome
          setLocationPermissionDone(true);
        }
      }
    };
    requestLocationPermission();
    store.fetchRealtimeTransitData();
  }, []);

  // Push live arrivals into WebView via postMessage whenever they update
  // — avoids a full HTML rebuild + WebView reload on every data refresh
  useEffect(() => {
    if (mapReady && webViewRef.current && store.realtimeArrivals) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'UPDATE_ARRIVALS',
        arrivals: store.realtimeArrivals,
      }));
    }
  }, [mapReady, store.realtimeArrivals]);

  // Keep route synced with WebView when activeRoute/stations change
  // Uses mapReady (not !mapLoading) to ensure JS context is actually alive
  useEffect(() => {
    if (mapReady && webViewRef.current) {
      const message = {
        type: 'UPDATE_ROUTE',
        startStationId: store.startStationId,
        endStationId: store.endStationId,
        activeRoute: store.activeRoute,
      };
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  }, [mapReady, store.startStationId, store.endStationId, store.activeRoute]);

  // Handle Messages from WebView Leaflet Map
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'MAP_READY':
          console.log('[MapScreen] Leaflet map initialised successfully');
          setMapLoading(false);
          setMapReady(true);
          setMapError(null);
          // Now that map is ready, send location signal if permission granted
          webViewRef.current?.postMessage(JSON.stringify({ type: 'LOCATE_USER' }));
          break;
        case 'MAP_ERROR':
          console.error('[MapScreen] Leaflet init error:', data.message);
          setMapLoading(false);
          setMapReady(false);
          setMapError(data.message || 'Map failed to initialise');
          break;
        case 'USER_LOCATION':
          setUserLocation({
            latitude: data.latitude,
            longitude: data.longitude,
          });
          break;
        case 'SET_START':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          store.setStartStationId(data.stationId);
          if (store.endStationId) store.calculateActiveRoute();
          break;
        case 'SET_END':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          store.setEndStationId(data.stationId);
          if (store.startStationId) store.calculateActiveRoute();
          break;
        case 'STATION_ARRIVAL':
          console.log('[MapScreen] Reached station:', data.stationName, data.arrivalType);
          setArrivalAlert({ stationName: data.stationName, arrivalType: data.arrivalType });
          
          // Trigger 10-second repeating beating pattern
          // Pattern: [delay, vibrate, delay, vibrate...]
          Vibration.vibrate([0, 400, 200, 400, 800], true);
          
          if (vibrationTimeoutRef.current) clearTimeout(vibrationTimeoutRef.current);
          vibrationTimeoutRef.current = setTimeout(() => {
             dismissArrivalAlert();
          }, 10000);
          break;
        case 'STATION_CLICK':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        default:
          break;
      }
    } catch (e) {
      console.warn('[MapScreen] Error parsing WebView message:', e);
    }
  };

  const handleZoomIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    webViewRef.current?.postMessage(JSON.stringify({ type: "ZOOM_IN" }));
  };

  const handleZoomOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    webViewRef.current?.postMessage(JSON.stringify({ type: "ZOOM_OUT" }));
  };

  const handleCenterMap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    webViewRef.current?.postMessage(JSON.stringify({ type: "LOCATE_USER" }));
  };

  const handleRetry = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMapLoading(true);
    setMapReady(false);
    setMapError(null);
    setMapVersion((prev) => prev + 1);
  };

  const getStationName = (id: string) => {
    return store.stations.find((s) => s.id === id)?.name || "";
  };

  const handleGetDirections = (station: any) => {
    if (!station || !station.coordinates) return;
    const originPart = userLocation ? `&origin=${userLocation.latitude},${userLocation.longitude}` : "";
    const url = `https://www.google.com/maps/dir/?api=1${originPart}&destination=${station.coordinates[0]},${station.coordinates[1]}&travelmode=walking`;
    Linking.openURL(url).catch(err => console.error("Couldn't open Google Maps", err));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={activeTheme === 'dark' ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      {/* Interactive Map WebView — only renders after:
           1. Location permission resolved (Android)
           2. Map HTML temp file written to disk */}
      {!mapError && mapFileUri && locationPermissionDone && (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ uri: mapFileUri }}
          style={styles.mapWebView}
          onMessage={handleWebViewMessage}
          onError={(e) => {
            const msg = e.nativeEvent.description || 'WebView failed to load';
            console.error('[MapScreen] WebView error:', msg);
            setMapError(msg);
            setMapLoading(false);
            setMapReady(false);
          }}
          onHttpError={(e) => {
            const msg = `HTTP ${e.nativeEvent.statusCode}: ${e.nativeEvent.url}`;
            console.error('[MapScreen] WebView HTTP error:', msg);
            setMapError(msg);
            setMapLoading(false);
            setMapReady(false);
          }}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          geolocationEnabled={true}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          allowFileAccessFromFileURLs={true}
          mixedContentMode="always"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        />
      )}

      {/* Loading Skeleton State */}
      {(mapLoading || !locationPermissionDone || !mapFileUri) && !mapError && (
        <View style={[styles.overlayContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={[styles.overlayText, { color: colors.textSecondary }]}>Loading Metro Network...</Text>
        </View>
      )}

      {/* Error / Retry Fallback State */}
      {mapError && (
        <View style={[styles.overlayContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="cloud-offline-outline" size={48} color="#ff3b30" />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Map Failed to Load</Text>
          <Text style={[styles.errorSub, { color: colors.textSecondary }]}>
            {mapError}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active In-Metro Tracker HUD (overlay at the top) */}
      {!mapLoading && !mapError && store.activeRoute && nearestActiveRouteStation && (
        <View style={[styles.topLiveTracker, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.trackerHeader}>
            <View style={[styles.liveIndicatorRing, { backgroundColor: 'rgba(52,199,89,0.2)' }]}>
              <View style={[styles.liveIndicatorDot, { backgroundColor: '#34c759' }]} />
            </View>
            <Text style={[styles.trackerHeaderText, { color: colors.textSecondary }]}>IN-TRANSIT LIVE TRACKER</Text>
          </View>
          <View style={styles.trackerContent}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.trackerStationName, { color: colors.text }]} numberOfLines={1}>
                📍 Near {nearestActiveRouteStation.station.name}
              </Text>
              {nearestActiveRouteStation.index < store.activeRoute.path.length - 1 ? (
                <Text style={[styles.trackerNextStation, { color: colors.textSecondary }]} numberOfLines={1}>
                  Next stop: {store.activeRoute.path[nearestActiveRouteStation.index + 1].name}
                </Text>
              ) : (
                <Text style={[styles.trackerNextStation, { color: '#34c759' }]}>
                  Arriving at Destination!
                </Text>
              )}
            </View>
            <Ionicons name="subway-outline" size={24} color="#007aff" />
          </View>
        </View>
      )}

      {/* Floating Apple-Style Control Stack */}
      {!mapLoading && !mapError && (
        <View style={[
          styles.floatingControls,
          store.activeRoute && nearestActiveRouteStation && { top: Platform.OS === "ios" ? 160 : 140 }
        ]}>
          {/* Zoom Stack */}
          <View style={[styles.controlGroup, { backgroundColor: colors.backgroundElement }]}>
            <TouchableOpacity style={styles.groupButton} onPress={handleZoomIn}>
              <Ionicons name="add" size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: activeTheme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)" }]} />
            <TouchableOpacity style={styles.groupButton} onPress={handleZoomOut}>
              <Ionicons name="remove" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Locate Center Button */}
          <TouchableOpacity
            style={[styles.roundButton, { backgroundColor: colors.backgroundElement }]}
            onPress={handleCenterMap}
          >
            <Ionicons name="navigate-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Nearest Station Banner (when no route active) */}
      {!mapLoading && !mapError && !store.activeRoute && nearestStationInfo && (
        <View style={[styles.bottomCard, { backgroundColor: colors.backgroundElement }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.bottomRouteText, { color: colors.text }]} numberOfLines={1}>
                📍 Nearest Station
              </Text>
              <Text style={[styles.bottomRouteMeta, { color: colors.textSecondary }]}>
                {nearestStationInfo.station.name} • {nearestStationInfo.distance >= 1000 ? `${(nearestStationInfo.distance/1000).toFixed(1)} km` : `${nearestStationInfo.distance}m`} away
              </Text>
              {(() => {
                const cVal = store.getStationCrowd(nearestStationInfo.station.id);
                const cColor = cVal === 0 ? "#8E8E93" : cVal > 7 ? "#FF453A" : cVal > 4 ? "#FF9F0A" : "#34C759";
                const cText = cVal === 0 ? "Closed" : cVal > 7 ? "Very Packed" : cVal > 4 ? "Standing Only" : "Seats Available";
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                    <Ionicons name="people" size={12} color={cColor} />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: cColor }}>{cText}</Text>
                  </View>
                );
              })()}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.closeRouteBtn, { backgroundColor: '#34c759' }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  store.setStartStationId(nearestStationInfo.station.id);
                  if (store.endStationId) store.calculateActiveRoute();
                  else router.push("/");
                }}
              >
                <Text style={styles.editBtnText}>Set Start</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.closeRouteBtn, { backgroundColor: '#ff3b30' }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  store.setEndStationId(nearestStationInfo.station.id);
                  if (store.startStationId) store.calculateActiveRoute();
                  else router.push("/");
                }}
              >
                <Text style={styles.editBtnText}>Set End</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Premium Apple-Style Active Route Summary Bottom Card */}
      {!mapLoading && !mapError && store.activeRoute && (
        <View style={[styles.bottomCard, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.bottomCardHeader}>
            <View style={styles.bottomCardRoute}>
              <Text style={[styles.bottomRouteText, { color: colors.text }]} numberOfLines={1}>
                {getStationName(store.startStationId)} ➔ {getStationName(store.endStationId)}
              </Text>
              <Text style={[styles.bottomRouteMeta, { color: colors.textSecondary }]}>
                Fastest Route • {store.mode} Mode
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeRouteBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/");
              }}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomStatsGrid}>
            <View style={styles.bottomStatItem}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(0,122,255,0.1)' }]}>
                <Ionicons name="time" size={18} color="#007aff" />
              </View>
              <Text style={[styles.bottomStatVal, { color: colors.text }]}>{store.activeRoute.metrics.time}m</Text>
              <Text style={[styles.bottomStatLbl, { color: colors.textSecondary }]}>Time</Text>
            </View>
            <View style={styles.bottomStatItem}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(88,86,214,0.1)' }]}>
                <Ionicons name="git-compare" size={18} color="#5856d6" />
              </View>
              <Text style={[styles.bottomStatVal, { color: colors.text }]}>{store.activeRoute.metrics.transfers}</Text>
              <Text style={[styles.bottomStatLbl, { color: colors.textSecondary }]}>Transfers</Text>
            </View>
            <View style={styles.bottomStatItem}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(52,199,89,0.1)' }]}>
                <Ionicons name="card" size={18} color="#34c759" />
              </View>
              <Text style={[styles.bottomStatVal, { color: colors.text }]}>
                ₹{store.useSmartCard ? Math.round(store.activeRoute.metrics.fare * 0.9) : store.activeRoute.metrics.fare}
              </Text>
              <Text style={[styles.bottomStatLbl, { color: colors.textSecondary }]}>Fare</Text>
            </View>
          </View>
        </View>
      )}

      {/* Premium Haptic Arrival Overlay */}
      {arrivalAlert && (
        <View style={styles.arrivalOverlay}>
          <View style={[styles.arrivalCard, { backgroundColor: activeTheme === 'dark' ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)' }]}>
            <View style={[styles.arrivalIconWrap, { backgroundColor: arrivalAlert.arrivalType === 'DESTINATION' ? 'rgba(255,59,48,0.1)' : 'rgba(88,86,214,0.1)' }]}>
              <Ionicons name={arrivalAlert.arrivalType === 'DESTINATION' ? "flag" : "git-compare"} size={28} color={arrivalAlert.arrivalType === 'DESTINATION' ? "#ff3b30" : "#5856d6"} />
            </View>
            <View style={styles.arrivalTextCol}>
              <Text style={[styles.arrivalTitle, { color: colors.text }]}>
                {arrivalAlert.arrivalType === 'DESTINATION' ? 'Destination Reached' : 'Interchange on this Station'}
              </Text>
              <Text style={[styles.arrivalSub, { color: colors.textSecondary }]}>
                {arrivalAlert.stationName}
              </Text>
            </View>
            <TouchableOpacity style={styles.arrivalDismissBtn} onPress={dismissArrivalAlert}>
              <Text style={styles.arrivalDismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapWebView: {
    flex: 1,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    zIndex: 10,
  },
  overlayText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: "500",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  retryButton: {
    backgroundColor: "#007aff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#007aff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  floatingControls: {
    position: "absolute",
    right: 16,
    top: Platform.OS === "ios" ? 64 : 48,
    gap: 12,
    zIndex: 5,
  },
  controlGroup: {
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  groupButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: "70%",
    alignSelf: "center",
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  bottomCard: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 80,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    zIndex: 5,
  },
  bottomCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(142,142,147,0.2)",
    paddingBottom: 8,
    marginBottom: 8,
  },
  bottomCardRoute: {
    flex: 1,
    paddingRight: 10,
  },
  bottomRouteText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  bottomRouteMeta: {
    fontSize: 10,
    marginTop: 2,
  },
  closeRouteBtn: {
    backgroundColor: "#007aff",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  editBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  bottomStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  bottomStatItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  bottomStatVal: {
    fontSize: 13,
    fontWeight: "700",
  },
  bottomStatLbl: {
    fontSize: 8,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginTop: 1,
  },
  topLiveTracker: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 36,
    left: 16,
    right: 16,
    borderRadius: 20,
    padding: 14,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    zIndex: 100,
  },
  trackerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  liveIndicatorRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trackerHeaderText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  trackerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trackerStationName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  trackerNextStation: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  arrivalOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    zIndex: 200,
    alignItems: 'center',
  },
  arrivalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
    width: '100%',
  },
  arrivalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  arrivalTextCol: {
    flex: 1,
  },
  arrivalTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  arrivalSub: {
    fontSize: 16,
    fontWeight: '700',
  },
  arrivalDismissBtn: {
    backgroundColor: '#007aff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginLeft: 8,
  },
  arrivalDismissText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  }
});
