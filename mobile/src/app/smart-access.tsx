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
  useColorScheme,
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

export default function SmartAccessScreen() {
  const store = useMetroStore();
  const scheme = useColorScheme() || "light";
  const systemTheme = scheme === "unspecified" ? "light" : scheme;
  const activeTheme = store.themeMode === "system" ? systemTheme : store.themeMode;
  const colors = Colors[activeTheme];

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <StatusBar barStyle={activeTheme === "dark" ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      {/* Apple-style Premium Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Safe & Accessible Transit</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Smart Access</Text>
        </View>
        <Ionicons name="accessibility-outline" size={28} color="#007aff" />
      </View>

      {/* iOS-style Search Bar */}
      <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.textInput, { color: colors.text }]}
          placeholder="Search station or exit landmarks..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Station List */}
      <FlatList
        data={filteredStations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          // Check if station has accessibility features
          const hasBrokenFacilities = 
            store.infrastructureStatus[item.id]?.escalator === "Under Maintenance" ||
            store.infrastructureStatus[item.id]?.elevator === "Under Maintenance";

          return (
            <TouchableOpacity
              style={[styles.stationItem, { backgroundColor: colors.backgroundElement }]}
              onPress={() => handleSelectStation(item.id)}
            >
              <View style={styles.stationItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(0,122,255,0.08)' }]}>
                  <Ionicons name="subway-outline" size={20} color="#007aff" />
                </View>
                <View style={styles.stationInfoWrap}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.stationName, { color: colors.text }]}>{item.name}</Text>
                    {hasBrokenFacilities && (
                      <Ionicons name="warning" size={14} color="#ff9500" style={{ marginLeft: 6 }} />
                    )}
                  </View>
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
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={44} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No stations match "{searchQuery}"</Text>
          </View>
        }
      />

      {/* iOS Modal View */}
      <Modal
        visible={!!selectedStation}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedStationId(null)}
      >
        {selectedStation && (
          <View style={[styles.modalContainer, { backgroundColor: scheme === 'dark' ? '#1c1c1e' : '#f2f2f7' }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: scheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedStation.name}</Text>
              <TouchableOpacity
                onPress={() => setSelectedStationId(null)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.backgroundElement }]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Lines tag */}
              <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Connected Lines</Text>
                <View style={styles.modalBadgeRow}>
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

              {/* Infrastructure status card */}
              <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
                <View style={styles.facilityHeaderRow}>
                  <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Accessibility Status</Text>
                  <Text style={styles.lastUpdatedText}>
                    Live Status
                  </Text>
                </View>

                {/* Escalator */}
                <View style={styles.facilityRow}>
                  <View style={styles.facilityInfo}>
                    <View style={[styles.facilityIconWrap, { backgroundColor: 'rgba(0,122,255,0.08)' }]}>
                      <MaterialCommunityIcons name="escalator" size={22} color="#007aff" />
                    </View>
                    <View>
                      <Text style={[styles.facilityName, { color: colors.text }]}>Escalators</Text>
                      <View style={styles.statusBadgeRow}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                selectedStatus?.escalator === "Operational" || !selectedStatus?.escalator
                                  ? "#34c759"
                                  : "#ff3b30",
                            },
                          ]}
                        />
                        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                          {selectedStatus?.escalator || "Operational"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.reportBtn, { backgroundColor: colors.backgroundElement }]}
                    onPress={() => handleToggleFacility(selectedStation.id, "escalator")}
                  >
                    <Text style={styles.reportBtnText}>Report Change</Text>
                  </TouchableOpacity>
                </View>

                {/* Elevator */}
                <View style={[styles.facilityRow, styles.borderTop, { borderTopColor: colors.backgroundElement }]}>
                  <View style={styles.facilityInfo}>
                    <View style={[styles.facilityIconWrap, { backgroundColor: 'rgba(0,122,255,0.08)' }]}>
                      <MaterialCommunityIcons name="elevator" size={22} color="#007aff" />
                    </View>
                    <View>
                      <Text style={[styles.facilityName, { color: colors.text }]}>Elevators / Lifts</Text>
                      <View style={styles.statusBadgeRow}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                selectedStatus?.elevator === "Operational" || !selectedStatus?.elevator
                                  ? "#34c759"
                                  : "#ff3b30",
                            },
                          ]}
                        />
                        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                          {selectedStatus?.elevator || "Operational"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.reportBtn, { backgroundColor: colors.backgroundElement }]}
                    onPress={() => handleToggleFacility(selectedStation.id, "elevator")}
                  >
                    <Text style={styles.reportBtnText}>Report Change</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Station layout & safety notes */}
              <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Station Information</Text>
                <View style={[styles.platformDetails, { backgroundColor: colors.backgroundElement }]}>
                  <Ionicons name="shield-checkmark" size={18} color="#34c759" style={{ marginRight: 10 }} />
                  <Text style={[styles.platformText, { color: colors.text }]}>
                    Equipped with 24/7 CCTV surveillance, tactile paths for visually impaired commuters, and emergency help points on all platforms.
                  </Text>
                </View>
              </View>

              {/* Exit directory with safety parameters */}
              <View style={[styles.modalCard, { backgroundColor: colors.background, marginBottom: 40 }]}>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Exits & Gate Safety Directory</Text>
                {selectedStation.exits && selectedStation.exits.length > 0 ? (
                  selectedStation.exits.map((exit, index) => {
                    const lightColor =
                      exit.lit === "Dimly-Lit"
                        ? "#ff3b30"
                        : exit.lit === "Moderate"
                        ? "#ff9500"
                        : "#34c759";

                    return (
                      <View key={`exit-${index}`} style={[styles.exitItem, { borderBottomColor: colors.backgroundElement }]}>
                        <View style={styles.exitHeading}>
                          <View style={[styles.gateBadge, { backgroundColor: colors.backgroundSelected }]}>
                            <Text style={[styles.gateBadgeText, { color: colors.text }]}>Gate {exit.gate || index + 1}</Text>
                          </View>
                          <View style={[styles.litPill, { borderColor: lightColor }]}>
                            <Text style={[styles.litText, { color: lightColor }]}>
                              {exit.lit || "Brightly-Lit"}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.exitLandmark, { color: colors.text }]}>
                          Nearby: {exit.name || "Immediate exit / Main roadway"}
                        </Text>
                        {exit.accessibility && exit.accessibility.length > 0 && (
                          <View style={styles.exitAccessibilityRow}>
                            {exit.accessibility.map((feat: string) => (
                              <View key={feat} style={[styles.exitAccBadge, { backgroundColor: 'rgba(88,86,214,0.08)' }]}>
                                <Ionicons name="checkmark-circle-outline" size={10} color="#5856d6" style={{ marginRight: 2 }} />
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
                    <Text style={[styles.noExitsText, { color: colors.textSecondary }]}>No detailed exit gates data available.</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 14,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  stationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  stationItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stationInfoWrap: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stationName: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
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
    marginTop: 60,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 12,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  modalScroll: {
    flex: 1,
    padding: 16,
  },
  modalCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
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
    fontSize: 11,
    fontWeight: "600",
    color: "#34c759",
  },
  facilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  borderTop: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  facilityInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  facilityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  facilityName: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  reportBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  reportBtnText: {
    fontSize: 11,
    color: "#007aff",
    fontWeight: "600",
  },
  platformDetails: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
  platformText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  exitItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  exitHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  gateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gateBadgeText: {
    fontSize: 11,
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
    lineHeight: 18,
    fontWeight: "500",
  },
  exitAccessibilityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 6,
  },
  exitAccBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  exitAccText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#5856d6",
  },
  noExits: {
    paddingVertical: 12,
    alignItems: "center",
  },
  noExitsText: {
    fontSize: 13,
  },
});
