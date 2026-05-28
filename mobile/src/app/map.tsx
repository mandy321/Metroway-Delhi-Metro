import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline, Callout } from "react-native-maps";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useMetroStore } from "../store/useMetroStore";
import { Colors } from "../constants/theme";

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

// Center of Delhi Metro network (Rajiv Chowk coordinates)
const DELHI_CENTER = {
  latitude: 28.6304,
  longitude: 77.2177,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export default function MapScreen() {
  const router = useRouter();
  const store = useMetroStore();
  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Center map on active route coordinates when computed
  useEffect(() => {
    if (mapReady && store.activeRoute && store.activeRoute.path && mapRef.current) {
      const routeStations = store.activeRoute.path;
      if (routeStations.length > 0) {
        const coords = routeStations
          .filter((node: any) => node && node.coordinates)
          .map((node: any) => ({
            latitude: node.coordinates[0],
            longitude: node.coordinates[1],
          }));

        if (coords.length > 0) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(coords, {
              edgePadding: { top: 80, right: 80, bottom: 200, left: 80 },
              animated: true,
            });
          }, 300);
        }
      }
    }
  }, [mapReady, store.activeRoute]);

  const handleCenterMap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    mapRef.current?.animateToRegion(DELHI_CENTER, 600);
  };

  const handleMarkerPress = (stationId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSetStart = (stationId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    store.setStartStationId(stationId);
    if (store.endStationId) {
      store.calculateActiveRoute();
    }
  };

  const handleSetEnd = (stationId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    store.setEndStationId(stationId);
    if (store.startStationId) {
      store.calculateActiveRoute();
    }
  };

  const getStationName = (id: string) => {
    return store.stations.find((s) => s.id === id)?.name || "";
  };

  // Convert array coordinate [lat, lng] to object
  const getLatLng = (station: any) => {
    if (!station || !station.coordinates) return null;
    return {
      latitude: station.coordinates[0],
      longitude: station.coordinates[1],
    };
  };

  // Helper to draw connection edges
  const renderTrackEdges = () => {
    return store.edges.map((edge) => {
      const source = store.stations.find((s) => s.id === edge.source);
      const target = store.stations.find((s) => s.id === edge.target);
      if (!source || !target) return null;

      const sourceCoords = getLatLng(source);
      const targetCoords = getLatLng(target);
      if (!sourceCoords || !targetCoords) return null;

      // Color from edge lines
      const line = edge.line || "Blue";
      const lineColor = LINE_COLORS[line] || "#888888";

      return (
        <Polyline
          key={`${edge.source}-${edge.target}-${line}`}
          coordinates={[sourceCoords, targetCoords]}
          strokeColor={lineColor}
          strokeWidth={3}
          lineDashPattern={line === "Orange" ? [6, 4] : undefined} // Airport Express dashed
        />
      );
    });
  };

  // Helper to draw highlighted active route
  const renderActiveRouteHighlight = () => {
    if (!store.activeRoute || !store.activeRoute.edges) return null;

    const polylines: React.ReactNode[] = [];

    store.activeRoute.edges.forEach((edge: any, idx: number) => {
      const sourceStation = store.stations.find((s) => s.id === edge.source);
      const targetStation = store.stations.find((s) => s.id === edge.target);

      if (!sourceStation || !targetStation) return;

      const sourceCoords = {
        latitude: sourceStation.coordinates[0],
        longitude: sourceStation.coordinates[1],
      };
      const targetCoords = {
        latitude: targetStation.coordinates[0],
        longitude: targetStation.coordinates[1],
      };

      const routeColor = edge.isTransfer ? "#A855F7" : (LINE_COLORS[edge.line] || "#0072BB");

      polylines.push(
        <Polyline
          key={`active-route-bg-${idx}`}
          coordinates={[sourceCoords, targetCoords]}
          strokeColor="#1F2937"
          strokeWidth={8}
          zIndex={5}
        />
      );
      polylines.push(
        <Polyline
          key={`active-route-fg-${idx}`}
          coordinates={[sourceCoords, targetCoords]}
          strokeColor={routeColor}
          strokeWidth={4}
          lineDashPattern={edge.isTransfer ? [6, 6] : undefined}
          zIndex={6}
        />
      );
    });

    return polylines;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Main Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DELHI_CENTER}
        onMapReady={() => setMapReady(true)}
        showsCompass
      >
        {/* Render Track Connections */}
        {renderTrackEdges()}

        {/* Highlight Route */}
        {renderActiveRouteHighlight()}

        {/* Render Station Markers */}
        {store.stations.map((station) => {
          const coords = getLatLng(station);
          if (!coords) return null;

          // Determine marker color
          const primaryLine = station.lines[0];
          const markerColor = LINE_COLORS[primaryLine] || "#888888";
          
          // Check if station is start or end
          const isStart = station.id === store.startStationId;
          const isEnd = station.id === store.endStationId;
          const isInterchange = station.lines.length > 1;

          return (
            <Marker
              key={station.id}
              coordinate={coords}
              onPress={() => handleMarkerPress(station.id)}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={isStart || isEnd ? 20 : isInterchange ? 10 : 1}
            >
              {/* Custom Marker Pin */}
              <View
                style={[
                  styles.markerContainer,
                  isStart && styles.startMarker,
                  isEnd && styles.endMarker,
                  isInterchange && !isStart && !isEnd && styles.interchangeMarker,
                ]}
              >
                <View
                  style={[
                    styles.markerInner,
                    {
                      backgroundColor: isStart
                        ? "#10B981"
                        : isEnd
                        ? "#EF4444"
                        : markerColor,
                    },
                  ]}
                />
              </View>

              {/* Callout Dialog */}
              <Callout tooltip style={styles.calloutContainer}>
                <View style={styles.calloutCard}>
                  <Text style={styles.calloutTitle}>{station.name}</Text>
                  <Text style={styles.calloutSubtitle}>
                    {station.lines.join(" • ")} Line{station.lines.length > 1 ? "s" : ""}
                  </Text>
                  <View style={styles.calloutActionRow}>
                    <TouchableOpacity
                      style={[styles.calloutBtn, styles.calloutStartBtn]}
                      onPress={() => handleSetStart(station.id)}
                    >
                      <Text style={styles.calloutBtnText}>From Here</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.calloutBtn, styles.calloutEndBtn]}
                      onPress={() => handleSetEnd(station.id)}
                    >
                      <Text style={styles.calloutBtnText}>To Here</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Floating Control Buttons */}
      <View style={styles.floatingControls}>
        <TouchableOpacity style={styles.roundButton} onPress={handleCenterMap}>
          <Ionicons name="locate" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Active Route Summary Bottom Card */}
      {store.activeRoute && (
        <View style={styles.bottomCard}>
          <View style={styles.bottomCardHeader}>
            <View style={styles.bottomCardRoute}>
              <Text style={styles.bottomRouteText} numberOfLines={1}>
                {getStationName(store.startStationId)} ➔ {getStationName(store.endStationId)}
              </Text>
              <Text style={styles.bottomRouteMeta}>
                {store.mode} Mode
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeRouteBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Navigate back to Planner index
                router.push("/");
              }}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomStatsGrid}>
            <View style={styles.bottomStatItem}>
              <Ionicons name="time-outline" size={18} color="#208AEF" />
              <Text style={styles.bottomStatVal}>{store.activeRoute.totalTime}m</Text>
              <Text style={styles.bottomStatLbl}>Time</Text>
            </View>
            <View style={styles.bottomStatItem}>
              <Ionicons name="git-compare-outline" size={18} color="#10B981" />
              <Text style={styles.bottomStatVal}>{store.activeRoute.interchanges}</Text>
              <Text style={styles.bottomStatLbl}>Transfers</Text>
            </View>
            <View style={styles.bottomStatItem}>
              <Ionicons name="cash-outline" size={18} color="#F59E0B" />
              <Text style={styles.bottomStatVal}>
                ₹{store.useSmartCard ? store.activeRoute.fare * 0.9 : store.activeRoute.fare}
              </Text>
              <Text style={styles.bottomStatLbl}>Fare</Text>
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
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  markerContainer: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#4B5563",
    elevation: 2,
  },
  markerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  startMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#10B981",
    elevation: 4,
  },
  endMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#EF4444",
    elevation: 4,
  },
  interchangeMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#111827",
    backgroundColor: "#FFFFFF",
  },
  calloutContainer: {
    width: 180,
    borderRadius: 12,
  },
  calloutCard: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
  },
  calloutSubtitle: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
    textAlign: "center",
  },
  calloutActionRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 6,
  },
  calloutBtn: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  calloutStartBtn: {
    backgroundColor: "#10B981",
  },
  calloutEndBtn: {
    backgroundColor: "#EF4444",
  },
  calloutBtnText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  floatingControls: {
    position: "absolute",
    right: 16,
    top: Platform.OS === "ios" ? 60 : 40,
    gap: 12,
  },
  roundButton: {
    backgroundColor: "#FFFFFF",
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  bottomCard: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 80,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  bottomCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 10,
    marginBottom: 10,
  },
  bottomCardRoute: {
    flex: 1,
    paddingRight: 10,
  },
  bottomRouteText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  bottomRouteMeta: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  closeRouteBtn: {
    backgroundColor: "#208AEF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  editBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  bottomStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  bottomStatItem: {
    alignItems: "center",
  },
  bottomStatVal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 2,
  },
  bottomStatLbl: {
    fontSize: 10,
    color: "#9CA3AF",
    textTransform: "uppercase",
  },
});
