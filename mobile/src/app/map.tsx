import React, { useEffect, useRef, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useMetroStore } from "../store/useMetroStore";
import { Colors } from "../constants/theme";
import { getMapHtml } from "../utils/mapHtml";

// Pure JavaScript UTF-8 Base64 Encoder
function base64Encode(str: string): string {
  const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let encoded = '';
  let i = 0;
  
  const utf8Bytes: number[] = [];
  for (let j = 0; j < str.length; j++) {
    let c = str.charCodeAt(j);
    if (c < 128) {
      utf8Bytes.push(c);
    } else if (c < 2048) {
      utf8Bytes.push((c >> 6) | 192);
      utf8Bytes.push((c & 63) | 128);
    } else {
      utf8Bytes.push((c >> 12) | 224);
      utf8Bytes.push(((c >> 6) & 63) | 128);
      utf8Bytes.push((c & 63) | 128);
    }
  }

  while (i < utf8Bytes.length) {
    const byte1 = utf8Bytes[i++];
    const byte2 = i < utf8Bytes.length ? utf8Bytes[i++] : NaN;
    const byte3 = i < utf8Bytes.length ? utf8Bytes[i++] : NaN;

    const enc1 = byte1 >> 2;
    const enc2 = ((byte1 & 3) << 4) | (isNaN(byte2) ? 0 : byte2 >> 4);
    const enc3 = isNaN(byte2) ? 64 : ((byte2 & 15) << 2) | (isNaN(byte3) ? 0 : byte3 >> 6);
    const enc4 = isNaN(byte3) ? 64 : byte3 & 63;

    encoded += b64chars.charAt(enc1) + b64chars.charAt(enc2) +
               (enc3 === 64 ? '=' : b64chars.charAt(enc3)) +
               (enc4 === 64 ? '=' : b64chars.charAt(enc4));
  }
  return encoded;
}

const DELHI_CENTER = {
  latitude: 28.6304,
  longitude: 77.2177,
};

export default function MapScreen() {
  const router = useRouter();
  const store = useMetroStore();
  const activeTheme = "dark";
  const colors = Colors[activeTheme];
  
  const webViewRef = useRef<WebView | null>(null);
  
  // Lifecycle & Loading State
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [mapVersion, setMapVersion] = useState(0); // Used to force reload/retry

  const mapHtmlSource = React.useMemo(() => {
    return getMapHtml(store.stations, store.edges, store.activeRoute, store.startStationId, store.endStationId, activeTheme);
  }, [store.stations, store.edges, store.activeRoute, store.startStationId, store.endStationId, activeTheme, mapVersion]);

  const mapDataUri = React.useMemo(() => {
    try {
      const base64Content = base64Encode(mapHtmlSource);
      return "data:text/html;base64," + base64Content;
    } catch (e) {
      console.warn("Base64 encoding failed:", e);
      return null;
    }
  }, [mapHtmlSource]);

  // Keep route synced with WebView when activeRoute, startStation, or endStation changes
  useEffect(() => {
    if (!mapLoading && !mapError && webViewRef.current) {
      const message = {
        type: "UPDATE_ROUTE",
        startStationId: store.startStationId,
        endStationId: store.endStationId,
        activeRoute: store.activeRoute,
      };
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  }, [mapLoading, mapError, store.startStationId, store.endStationId, store.activeRoute]);

  // Handle Messages from WebView Leaflet Map
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case "MAP_READY":
          setMapLoading(false);
          setMapError(false);
          break;
        case "SET_START":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          store.setStartStationId(data.stationId);
          if (store.endStationId) {
            store.calculateActiveRoute();
          }
          break;
        case "SET_END":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          store.setEndStationId(data.stationId);
          if (store.startStationId) {
            store.calculateActiveRoute();
          }
          break;
        case "STATION_CLICK":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        default:
          break;
      }
    } catch (e) {
      console.warn("Error parsing WebView message:", e);
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
    setMapError(false);
    setMapVersion((prev) => prev + 1);
  };

  const getStationName = (id: string) => {
    return store.stations.find((s) => s.id === id)?.name || "";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={activeTheme === "dark" ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      {/* Interactive Map WebView */}
      {!mapError && mapDataUri && (
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ uri: mapDataUri }}
          style={styles.mapWebView}
          onMessage={handleWebViewMessage}
          onError={(e) => {
            console.warn("WebView error:", e.nativeEvent);
            setMapError(true);
            setMapLoading(false);
          }}
          onHttpError={(e) => {
            console.warn("WebView HTTP error:", e.nativeEvent);
            setMapError(true);
            setMapLoading(false);
          }}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          geolocationEnabled={true}
          mixedContentMode="always"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        />
      )}

      {/* Loading Skeleton State */}
      {mapLoading && !mapError && (
        <View style={[styles.overlayContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={[styles.overlayText, { color: colors.textSecondary }]}>Loading Metro Network...</Text>
        </View>
      )}

      {/* Error / Retry Fallback State */}
      {mapError && (
        <View style={[styles.overlayContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="cloud-offline-outline" size={48} color="#ff3b30" />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Connection Failed</Text>
          <Text style={[styles.errorSub, { color: colors.textSecondary }]}>
            Unable to load metro map tiles. Please check your internet connection and try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Apple-Style Control Stack */}
      {!mapLoading && !mapError && (
        <View style={styles.floatingControls}>
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
    borderRadius: 24,
    padding: 16,
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
    paddingBottom: 12,
    marginBottom: 14,
  },
  bottomCardRoute: {
    flex: 1,
    paddingRight: 10,
  },
  bottomRouteText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  bottomRouteMeta: {
    fontSize: 11,
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
    fontSize: 15,
    fontWeight: "700",
  },
  bottomStatLbl: {
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginTop: 1,
  },
});
