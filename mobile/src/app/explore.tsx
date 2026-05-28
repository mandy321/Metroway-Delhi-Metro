import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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

export default function StationExplorerScreen() {
  const store = useMetroStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // Filter stations based on query
  const filteredStations = store.stations.filter((station) =>
    station.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectStation = (stationId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStationId(stationId);
  };

  const handleToggleFacility = (stationId: string, facilityType: "escalator" | "elevator") => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const currentStatus = store.infrastructureStatus[stationId]?.[facilityType] || "Operational";
    const newStatus = currentStatus === "Operational" ? "Under Maintenance" : "Operational";
    
    store.updateInfrastructureStatus(stationId, {
      [facilityType]: newStatus,
    });
  };

  const getStation = (id: string | null) => {
    if (!id) return null;
    return store.stations.find((s) => s.id === id);
  };

  const selectedStation = getStation(selectedStationId);
  const selectedStatus = selectedStationId ? store.infrastructureStatus[selectedStationId] : null;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#208AEF" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Station Directory</Text>
          <Text style={styles.headerSubtitle}>Explore Facilities & Exits</Text>
        </View>
        <Ionicons name="search-outline" size={26} color="#FFFFFF" />
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.textInput}
          placeholder="Search stations by name..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Station List */}
      <FlatList
        data={filteredStations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.stationItem}
            onPress={() => handleSelectStation(item.id)}
          >
            <View style={styles.stationItemLeft}>
              <View style={styles.subwayIconBg}>
                <Ionicons name="subway" size={20} color="#208AEF" />
              </View>
              <View>
                <Text style={styles.stationName}>{item.name}</Text>
                <View style={styles.badgeRow}>
                  {item.lines.map((line) => (
                    <View
                      key={line}
                      style={[
                        styles.linePill,
                        { backgroundColor: LINE_COLORS[line] || "#888888" },
                      ]}
                    >
                      <Text style={styles.linePillText}>{line}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B0B4BA" />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No stations match "{searchQuery}"</Text>
          </View>
        }
      />

      {/* Station Details Modal */}
      <Modal
        visible={!!selectedStation}
        animationType="slide"
        onRequestClose={() => setSelectedStationId(null)}
      >
        {selectedStation && (
          <SafeAreaView style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setSelectedStationId(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedStation.name}</Text>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Lines segment */}
              <View style={styles.modalCard}>
                <Text style={styles.cardLabel}>Lines Connected</Text>
                <View style={[styles.badgeRow, { marginTop: 8 }]}>
                  {selectedStation.lines.map((line) => (
                    <View
                      key={line}
                      style={[
                        styles.modalLinePill,
                        { backgroundColor: LINE_COLORS[line] || "#888888" },
                      ]}
                    >
                      <Text style={styles.modalLinePillText}>{line} Line</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Infrastructure Facilities */}
              <View style={styles.modalCard}>
                <View style={styles.facilityHeaderRow}>
                  <Text style={styles.cardLabel}>Live Facilities Status</Text>
                  <Text style={styles.lastUpdatedText}>
                    Last Updated: {selectedStatus?.lastUpdated || "Just now"}
                  </Text>
                </View>

                {/* Escalator */}
                <View style={styles.facilityRow}>
                  <View style={styles.facilityInfo}>
                    <MaterialCommunityIcons
                      name="escalator"
                      size={24}
                      color="#208AEF"
                      style={{ marginRight: 12 }}
                    />
                    <View>
                      <Text style={styles.facilityName}>Escalators</Text>
                      <View style={styles.statusBadgeRow}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                selectedStatus?.escalator === "Operational"
                                  ? "#10B981"
                                  : "#EF4444",
                            },
                          ]}
                        />
                        <Text style={styles.statusText}>
                          {selectedStatus?.escalator || "Operational"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.reportBtn}
                    onPress={() => handleToggleFacility(selectedStation.id, "escalator")}
                  >
                    <Text style={styles.reportBtnText}>Toggle Status</Text>
                  </TouchableOpacity>
                </View>

                {/* Elevator */}
                <View style={[styles.facilityRow, styles.borderTop]}>
                  <View style={styles.facilityInfo}>
                    <MaterialCommunityIcons
                      name="elevator"
                      size={24}
                      color="#208AEF"
                      style={{ marginRight: 12 }}
                    />
                    <View>
                      <Text style={styles.facilityName}>Elevators / Lifts</Text>
                      <View style={styles.statusBadgeRow}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                selectedStatus?.elevator === "Operational"
                                  ? "#10B981"
                                  : "#EF4444",
                            },
                          ]}
                        />
                        <Text style={styles.statusText}>
                          {selectedStatus?.elevator || "Operational"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.reportBtn}
                    onPress={() => handleToggleFacility(selectedStation.id, "elevator")}
                  >
                    <Text style={styles.reportBtnText}>Toggle Status</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Station layout & platforms */}
              <View style={styles.modalCard}>
                <Text style={styles.cardLabel}>Platform Information</Text>
                <View style={styles.platformDetails}>
                  <Ionicons name="information-circle-outline" size={20} color="#208AEF" style={{ marginRight: 8 }} />
                  <Text style={styles.platformText}>
                    This is a {selectedStation.lines.length > 1 ? "major interchange" : "standard"} station.{" "}
                    Platform gates are equipped with screen doors for safety.
                  </Text>
                </View>
              </View>

              {/* Gate Exits */}
              <View style={[styles.modalCard, { marginBottom: 32 }]}>
                <Text style={styles.cardLabel}>Exit Gates Directory</Text>
                {selectedStation.exits && selectedStation.exits.length > 0 ? (
                  selectedStation.exits.map((exit, index) => {
                    // Match lighting colors
                    const lightColor =
                      exit.lit === "Dimly-Lit"
                        ? "#EF4444"
                        : exit.lit === "Moderate"
                        ? "#F59E0B"
                        : "#10B981";

                    return (
                      <View key={`exit-${index}`} style={styles.exitItem}>
                        <View style={styles.exitHeading}>
                          <View style={styles.gateBadge}>
                            <Text style={styles.gateBadgeText}>Gate {exit.gate || index + 1}</Text>
                          </View>
                          <View style={[styles.litPill, { borderColor: lightColor }]}>
                            <Text style={[styles.litText, { color: lightColor }]}>
                              {exit.lit || "Bright"}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.exitLandmark}>
                          Nearby: {exit.name || "Immediate exit and local streets"}
                        </Text>
                        {exit.accessibility && exit.accessibility.length > 0 && (
                          <View style={styles.exitAccessibilityRow}>
                            {exit.accessibility.map((feat: string) => (
                              <View key={feat} style={styles.exitAccBadge}>
                                <Ionicons name="accessibility" size={10} color="#4F46E5" style={{ marginRight: 2 }} />
                                <Text style={styles.exitAccText}>{feat}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.noExits}>
                    <Text style={styles.noExitsText}>No detailed exit gates data available.</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#208AEF",
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "#E0E1E6",
    fontSize: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#111827",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  stationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EFF1F5",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  stationItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  subwayIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stationName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  linePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  linePillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCloseBtn: {
    padding: 4,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalScroll: {
    flex: 1,
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalLinePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalLinePillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  facilityHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  lastUpdatedText: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  facilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  facilityInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  facilityName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  statusBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
  },
  reportBtn: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  reportBtnText: {
    fontSize: 11,
    color: "#208AEF",
    fontWeight: "700",
  },
  platformDetails: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2F6",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  platformText: {
    flex: 1,
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
  exitItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  exitHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  gateBadge: {
    backgroundColor: "#374151",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  gateBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  litPill: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  litText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  exitLandmark: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    marginBottom: 4,
  },
  exitAccessibilityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  exitAccBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  exitAccText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#4F46E5",
  },
  noExits: {
    paddingVertical: 12,
    alignItems: "center",
  },
  noExitsText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
});
