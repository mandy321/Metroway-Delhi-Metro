import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Switch,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMetroStore } from "../store/useMetroStore";
import { Colors } from "../constants/theme";

// Line color mapping helper
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
};

export default function PlannerScreen() {
  const router = useRouter();
  const store = useMetroStore();

  // Local state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState<"start" | "end" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditingRoute, setIsEditingRoute] = useState(true);
  const [expandedTransfers, setExpandedTransfers] = useState<Record<string, boolean>>({});

  // Automatically switch views if an active route is computed
  useEffect(() => {
    if (store.activeRoute) {
      setIsEditingRoute(false);
    }
  }, [store.activeRoute]);

  // List of filtered stations for autocomplete search
  const filteredStations = store.stations.filter((station) =>
    station.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectStation = (stationId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeSearchField === "start") {
      store.setStartStationId(stationId);
    } else if (activeSearchField === "end") {
      store.setEndStationId(stationId);
    }
    setSearchModalOpen(false);
    setSearchQuery("");
    setActiveSearchField(null);
  };

  const handleSwap = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    store.swapStations();
  };

  const handleCalculateRoute = () => {
    if (!store.startStationId || !store.endStationId) {
      alert("Please select both start and destination stations.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    store.calculateActiveRoute();
    setIsEditingRoute(false);
  };

  const handleHistoryItemTap = (startId: string, endId: string, mode: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    store.setStartStationId(startId);
    store.setEndStationId(endId);
    store.setMode(mode);
    store.calculateActiveRoute();
    setIsEditingRoute(false);
  };

  const openSearchModal = (field: "start" | "end") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveSearchField(field);
    setSearchModalOpen(true);
  };

  const getStationName = (id: string) => {
    return store.stations.find((s) => s.id === id)?.name || "";
  };

  const getLineBadges = (stationId: string) => {
    const station = store.stations.find((s) => s.id === stationId);
    if (!station) return null;
    return (
      <View style={styles.badgeRow}>
        {station.lines.map((line) => (
          <View
            key={line}
            style={[
              styles.linePillSmall,
              { backgroundColor: LINE_COLORS[line] || "#888888" },
            ]}
          >
            <Text style={styles.linePillText}>{line}</Text>
          </View>
        ))}
      </View>
    );
  };

  const toggleTransferExpand = (transferIndex: string) => {
    setExpandedTransfers((prev) => ({
      ...prev,
      [transferIndex]: !prev[transferIndex],
    }));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#208AEF" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Metroway</Text>
          <Text style={styles.headerSubtitle}>Delhi Metro Companion</Text>
        </View>
        <Ionicons name="subway-outline" size={28} color="#FFFFFF" />
      </View>

      {isEditingRoute || !store.activeRoute ? (
        /* Planner Input View */
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          {/* Card: Station Inputs */}
          <View style={styles.inputCard}>
            <View style={styles.inputRow}>
              <Ionicons name="radio-button-on" size={22} color="#4CAF50" style={styles.inputIcon} />
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => openSearchModal("start")}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    !store.startStationId && styles.placeholderText,
                  ]}
                >
                  {store.startStationId
                    ? getStationName(store.startStationId)
                    : "Select Boarding Station..."}
                </Text>
              </TouchableOpacity>
              {store.startStationId ? (
                <TouchableOpacity onPress={() => store.setStartStationId("")} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color="#9E9E9E" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Connecting Line Visual */}
            <View style={styles.connectorContainer}>
              <View style={styles.connectorLine} />
              <TouchableOpacity onPress={handleSwap} style={styles.swapButton}>
                <Ionicons name="swap-vertical" size={20} color="#208AEF" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <Ionicons name="location" size={22} color="#F44336" style={styles.inputIcon} />
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => openSearchModal("end")}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    !store.endStationId && styles.placeholderText,
                  ]}
                >
                  {store.endStationId
                    ? getStationName(store.endStationId)
                    : "Select Destination..."}
                </Text>
              </TouchableOpacity>
              {store.endStationId ? (
                <TouchableOpacity onPress={() => store.setEndStationId("")} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color="#9E9E9E" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Preset Chips */}
          <Text style={styles.sectionLabel}>Routing Preference</Text>
          <View style={styles.chipRow}>
            {["Balanced", "Fastest", "Less Crowd", "Comfortable"].map((mode) => {
              const active = store.mode === mode;
              const iconMap: Record<string, string> = {
                Balanced: "scale-balance",
                Fastest: "lightning-bolt",
                "Less Crowd": "account-multiple-remove",
                Comfortable: "sofa",
              };
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.prefChip, active && styles.prefChipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    store.setMode(mode);
                  }}
                >
                  <MaterialCommunityIcons
                    name={iconMap[mode] as any || "compass"}
                    size={16}
                    color={active ? "#FFFFFF" : "#60646C"}
                    style={styles.chipIcon}
                  />
                  <Text style={[styles.prefChipText, active && styles.prefChipTextActive]}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Switch Options */}
          <View style={styles.optionCard}>
            <View style={styles.optionRow}>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Use Smart Card</Text>
                <Text style={styles.optionSubtitle}>Apply 10% discount on fare calculations</Text>
              </View>
              <Switch
                value={store.useSmartCard}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  store.useSmartCard = val;
                  // Force recalc if activeRoute is open
                  if (store.activeRoute) store.calculateActiveRoute();
                }}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={store.useSmartCard ? "#208AEF" : "#F3F4F6"}
              />
            </View>

            <View style={[styles.optionRow, styles.borderTop]}>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Accessibility Mode</Text>
                <Text style={styles.optionSubtitle}>Prioritize lifts & ramps on station routes</Text>
              </View>
              <Switch
                value={store.accessibilityOnly}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  store.toggleAccessibilityOnly();
                  if (store.activeRoute) store.calculateActiveRoute();
                }}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={store.accessibilityOnly ? "#208AEF" : "#F3F4F6"}
              />
            </View>
          </View>

          {/* Search Button */}
          <TouchableOpacity style={styles.calculateBtn} onPress={handleCalculateRoute}>
            <Text style={styles.calculateBtnText}>Calculate Route</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* History Section */}
          {store.searchHistory.length > 0 && (
            <View style={styles.historyContainer}>
              <View style={styles.historyHeader}>
                <Text style={styles.sectionLabel}>Recent Journeys</Text>
                <TouchableOpacity onPress={() => store.clearHistory()}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {store.searchHistory.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.historyItem}
                  onPress={() =>
                    handleHistoryItemTap(item.startStationId, item.endStationId, item.mode)
                  }
                >
                  <View style={styles.historyLeft}>
                    <Ionicons name="time-outline" size={18} color="#9E9E9E" />
                    <View style={styles.historyTextCol}>
                      <Text style={styles.historyRouteText}>
                        {item.startName} ➔ {item.endName}
                      </Text>
                      <Text style={styles.historyMeta}>
                        {item.mode} • {item.timestamp}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#B0B4BA" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Network Metrics Footer */}
          <View style={styles.footerStats}>
            <Text style={styles.footerStatsTitle}>Delhi Metro Network Status</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{store.stations.length}</Text>
                <Text style={styles.statLbl}>Stations</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>12</Text>
                <Text style={styles.statLbl}>Lines</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>Normal</Text>
                <Text style={styles.statLbl}>Service</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* Active Route Timeline View */
        <View style={styles.routeContainer}>
          {/* Top route card header */}
          <View style={styles.routeHeaderCard}>
            <View style={styles.routeHeaderRow}>
              <TouchableOpacity
                style={styles.backToEditBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsEditingRoute(true);
                }}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                <Text style={styles.backToEditText}>Edit Route</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewMapBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/map");
                }}
              >
                <Ionicons name="map" size={18} color="#FFFFFF" />
                <Text style={styles.viewMapBtnText}>Map View</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.routeSummaryRow}>
              <Text style={styles.summaryStationName} numberOfLines={1}>
                {getStationName(store.startStationId)}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#E0E1E6" style={{ marginHorizontal: 8 }} />
              <Text style={styles.summaryStationName} numberOfLines={1}>
                {getStationName(store.endStationId)}
              </Text>
            </View>

            {/* Travel stats */}
            <View style={styles.statsGridRow}>
              <View style={styles.gridStat}>
                <Ionicons name="time" size={16} color="#FFFFFF" />
                <Text style={styles.gridStatValue}>{store.activeRoute.totalTime} mins</Text>
                <Text style={styles.gridStatLabel}>Duration</Text>
              </View>
              <View style={styles.gridStat}>
                <Ionicons name="git-compare" size={16} color="#FFFFFF" />
                <Text style={styles.gridStatValue}>
                  {store.activeRoute.interchanges} {store.activeRoute.interchanges === 1 ? "transfer" : "transfers"}
                </Text>
                <Text style={styles.gridStatLabel}>Interchanges</Text>
              </View>
              <View style={styles.gridStat}>
                <Ionicons name="card" size={16} color="#FFFFFF" />
                <Text style={styles.gridStatValue}>
                  ₹{store.useSmartCard ? store.activeRoute.fare * 0.9 : store.activeRoute.fare}
                </Text>
                <Text style={styles.gridStatLabel}>Fare {store.useSmartCard && "(Discounted)"}</Text>
              </View>
            </View>
          </View>

          {/* Timeline of Steps */}
          <ScrollView style={styles.timelineScroll} contentContainerStyle={styles.timelineContent}>
            {/* Quick Ratings Badges */}
            <View style={styles.journeyRatings}>
              <View style={[styles.ratingPill, styles.ratingBalanced]}>
                <Text style={styles.ratingLabel}>Crowd: </Text>
                <Text style={styles.ratingVal}>{store.activeRoute.crowdScore}/10</Text>
              </View>
              <View style={[styles.ratingPill, styles.ratingComfort]}>
                <Text style={styles.ratingLabel}>Comfort: </Text>
                <Text style={styles.ratingVal}>{store.activeRoute.comfortScore}/10</Text>
              </View>
              <View style={[styles.ratingPill, styles.ratingSafety]}>
                <Text style={styles.ratingLabel}>Safety: </Text>
                <Text style={styles.ratingVal}>{store.activeRoute.safetyScore}/10</Text>
              </View>
            </View>

            {store.activeRoute.path.map((item: any, index: number) => {
              const isFirst = index === 0;
              const isLast = index === store.activeRoute.path.length - 1;
              const isTransfer = item.type === "Transfer";

              if (isTransfer) {
                return (
                  <View key={`transfer-${index}`} style={styles.transferNode}>
                    <View style={styles.timelineSidebar}>
                      <View style={styles.transferIndicator}>
                        <Ionicons name="walk" size={16} color="#E21D24" />
                      </View>
                      <View style={[styles.timelineLine, { borderStyle: "dashed" }]} />
                    </View>
                    <View style={styles.timelineBody}>
                      <Text style={styles.transferTitle}>
                        Transfer to {item.toLine} Line
                      </Text>
                      <Text style={styles.transferSubtitle}>
                        Walk to platform {item.toPlatform || "N/A"} • Approx. {item.transferTime || 3} mins walk
                      </Text>
                    </View>
                  </View>
                );
              }

              // Normal station node
              const nextItem = store.activeRoute.path[index + 1];
              const line = item.line || (nextItem && nextItem.line) || "Blue";
              const lineColor = LINE_COLORS[line] || "#888888";

              // Check if we have subsequent stops on this line segment to render collapsible
              // Usually we want to show intermediate stops. For mobile, displaying them directly is fine
              // but we can make it highly readable.

              return (
                <View key={`station-${item.id}-${index}`} style={styles.stationNode}>
                  <View style={styles.timelineSidebar}>
                    <View style={[styles.stationIndicator, { borderColor: lineColor }]}>
                      <View style={[styles.stationDot, { backgroundColor: isFirst || isLast ? lineColor : "#FFFFFF" }]} />
                    </View>
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: lineColor }]} />}
                  </View>
                  <View style={styles.timelineBody}>
                    <View style={styles.stationHeaderRow}>
                      <Text style={[styles.stationNodeName, (isFirst || isLast) && styles.boldStation]}>
                        {item.name}
                      </Text>
                      {isFirst && <Text style={styles.endpointBadge}>Start</Text>}
                      {isLast && <Text style={styles.endpointBadge}>End</Text>}
                    </View>

                    {isFirst && (
                      <View style={styles.stationSegmentDetails}>
                        <Text style={styles.segmentLineText}>
                          Board <Text style={{ color: lineColor, fontWeight: "bold" }}>{line} Line</Text> towards:{" "}
                          <Text style={{ fontWeight: "bold" }}>{item.direction || "Terminal Station"}</Text>
                        </Text>
                        <Text style={styles.segmentPlatformText}>
                          Platform <Text style={{ fontWeight: "bold" }}>{item.platform || "1"}</Text>
                        </Text>
                      </View>
                    )}

                    {isLast && item.exits && item.exits.length > 0 && (
                      <View style={styles.exitRecommendations}>
                        <View style={styles.exitHeader}>
                          <Ionicons name="exit-outline" size={16} color="#208AEF" style={{ marginRight: 4 }} />
                          <Text style={styles.exitTitle}>Recommended Gate Exits</Text>
                        </View>
                        {item.exits.map((exit: any, exitIdx: number) => (
                          <View key={`exit-${exitIdx}`} style={styles.exitRow}>
                            <View style={styles.exitPill}>
                              <Text style={styles.exitPillText}>Gate {exit.number || exitIdx + 1}</Text>
                            </View>
                            <Text style={styles.exitDesc} numberOfLines={2}>
                              {exit.landmark || "Immediate exit and local streets"} • Light: {exit.lit || "Bright"}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {!isFirst && !isLast && (
                      <Text style={styles.intermediateInfo}>
                        Platform {item.platform || "1"} • Arrives in approx. {index * 2} mins
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Autocomplete Search Modal */}
      <Modal
        visible={searchModalOpen}
        animationType="slide"
        onRequestClose={() => setSearchModalOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSearchModalOpen(false)} style={styles.modalCloseBtn}>
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {activeSearchField === "start" ? "Select Start Station" : "Select Destination"}
            </Text>
          </View>

          {/* Search Input */}
          <View style={styles.modalSearchBox}>
            <Ionicons name="search" size={20} color="#60646C" style={styles.modalSearchIcon} />
            <TextInput
              style={styles.modalTextInput}
              placeholder="Search station name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              clearButtonMode="while-editing"
            />
          </View>

          {/* Station List */}
          <FlatList
            data={filteredStations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalListItem}
                onPress={() => handleSelectStation(item.id)}
              >
                <View style={styles.modalListItemLeft}>
                  <Ionicons name="subway" size={20} color="#208AEF" style={{ marginRight: 12 }} />
                  <View>
                    <Text style={styles.modalStationName}>{item.name}</Text>
                    {getLineBadges(item.id)}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#B0B4BA" />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.modalListContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="warning-outline" size={48} color="#9E9E9E" />
                <Text style={styles.emptyText}>No stations match "{searchQuery}"</Text>
              </View>
            }
          />
        </SafeAreaView>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  inputCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
  },
  inputIcon: {
    marginRight: 10,
  },
  selectButton: {
    flex: 1,
    justifyContent: "center",
    height: "100%",
  },
  selectButtonText: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  placeholderText: {
    color: "#9CA3AF",
    fontWeight: "400",
  },
  clearBtn: {
    padding: 4,
  },
  connectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    paddingLeft: 22,
  },
  connectorLine: {
    width: 2,
    height: "100%",
    backgroundColor: "#208AEF",
  },
  swapButton: {
    marginLeft: "auto",
    marginRight: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  prefChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  prefChipActive: {
    backgroundColor: "#208AEF",
    borderColor: "#208AEF",
  },
  chipIcon: {
    marginRight: 6,
  },
  prefChipText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "600",
  },
  prefChipTextActive: {
    color: "#FFFFFF",
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 24,
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  optionTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  optionSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  calculateBtn: {
    backgroundColor: "#208AEF",
    borderRadius: 14,
    height: 54,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#208AEF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  calculateBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
  },
  historyContainer: {
    marginTop: 24,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clearAllText: {
    color: "#208AEF",
    fontSize: 13,
    fontWeight: "600",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  historyTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  historyRouteText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  historyMeta: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  footerStats: {
    marginTop: 32,
    backgroundColor: "#EEF2F6",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  footerStatsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  statBox: {
    alignItems: "center",
  },
  statVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#208AEF",
  },
  statBoxBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 20,
  },
  statLbl: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  routeContainer: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  routeHeaderCard: {
    backgroundColor: "#208AEF",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  routeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backToEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  backToEditText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 6,
  },
  viewMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  viewMapBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 6,
  },
  routeSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  summaryStationName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    flex: 1,
    textAlign: "center",
  },
  statsGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  gridStat: {
    flex: 1,
    alignItems: "center",
  },
  gridStatValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },
  gridStatLabel: {
    color: "#D2E4FC",
    fontSize: 10,
    marginTop: 2,
    textTransform: "uppercase",
  },
  timelineScroll: {
    flex: 1,
  },
  timelineContent: {
    padding: 16,
    paddingBottom: 40,
  },
  journeyRatings: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  ratingPill: {
    flexDirection: "row",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: "center",
    borderWidth: 1,
  },
  ratingBalanced: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  ratingComfort: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  ratingSafety: {
    backgroundColor: "#FDF2F8",
    borderColor: "#FBCFE8",
  },
  ratingLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
  },
  ratingVal: {
    fontSize: 11,
    fontWeight: "800",
    color: "#111827",
  },
  stationNode: {
    flexDirection: "row",
    minHeight: 80,
  },
  transferNode: {
    flexDirection: "row",
    minHeight: 70,
  },
  timelineSidebar: {
    width: 32,
    alignItems: "center",
  },
  stationIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  stationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  transferIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    borderWidth: 1.5,
    borderColor: "#EF4444",
  },
  timelineLine: {
    width: 3,
    position: "absolute",
    top: 20,
    bottom: 0,
    zIndex: 1,
  },
  timelineBody: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 24,
  },
  stationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  stationNodeName: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  boldStation: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "800",
  },
  endpointBadge: {
    marginLeft: 8,
    backgroundColor: "#E0F2FE",
    color: "#0369A1",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: "uppercase",
  },
  stationSegmentDetails: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  segmentLineText: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 16,
  },
  segmentPlatformText: {
    fontSize: 12,
    color: "#208AEF",
    marginTop: 4,
    fontWeight: "500",
  },
  exitRecommendations: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  exitHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  exitTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0369A1",
    textTransform: "uppercase",
  },
  exitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
  },
  exitPill: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  exitPillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  exitDesc: {
    flex: 1,
    fontSize: 11,
    color: "#0369A1",
    lineHeight: 14,
  },
  intermediateInfo: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  transferTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
  },
  transferSubtitle: {
    fontSize: 12,
    color: "#7F1D1D",
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
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
  modalSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalSearchIcon: {
    marginRight: 8,
  },
  modalTextInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#111827",
  },
  modalListContent: {
    paddingBottom: 24,
  },
  modalListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalListItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalStationName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 4,
  },
  linePillSmall: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
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
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center",
  },
});
