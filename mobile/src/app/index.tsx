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
  Animated,
  LayoutAnimation,
  UIManager,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMetroStore } from "../store/useMetroStore";
import { Colors } from "../constants/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  Rapid: "#A52A2A",
  RRTS: "#006A4E",
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

  const scheme = useColorScheme() || "light";
  const systemTheme = scheme === "unspecified" ? "light" : scheme;
  const activeTheme = store.themeMode === "system" ? systemTheme : store.themeMode;
  const colors = Colors[activeTheme];
  const [activeTab, setActiveTab] = useState("timeline");
  const tabProgress = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const tabIndex = ["timeline", "fare", "exits", "status"].indexOf(activeTab);
    Animated.spring(tabProgress, {
      toValue: tabIndex,
      useNativeDriver: false,
      tension: 50,
      friction: 9,
    }).start();
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.85,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    setActiveTab(tabId);
  };

  const tabProgressLeft = tabProgress.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: ["0.75%", "25.75%", "50.75%", "75.75%"],
  });

  const [reportingStationId, setReportingStationId] = useState("");
  const [reportedLevel, setReportedLevel] = useState("Moderate");
  const [reportSuccess, setReportSuccess] = useState(false);

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

  const activeRoute = store.activeRoute;
  const path = activeRoute?.path || [];
  const routeEdges = activeRoute?.edges || [];

  // Exit recommendation engine
  const getRecommendedExit = () => {
    const destinationStation = path[path.length - 1];
    if (!destinationStation || !destinationStation.exits) return null;
    let candidates = [...destinationStation.exits];

    if (store.accessibilityOnly) {
      const accessible = candidates.filter(e => e.accessibility?.includes("Elevator") || e.accessibility?.includes("Wheelchair Ramp"));
      if (accessible.length > 0) candidates = accessible;
    }

    const wellLit = candidates.filter(e => e.lit === "Well-Lit");
    if (wellLit.length > 0) return wellLit[0];

    return candidates[0] || null;
  };

  const getTerminalStationName = (startId: string, nextId: string, line: string) => {
    if (!startId || !nextId || !line) return "";
    
    // Find all remaining stations on the active route
    const remainingStationIds = new Set<string>();
    let foundNext = false;
    for (const station of path) {
      if (station.id === nextId) {
        foundNext = true;
      }
      if (foundNext) {
        remainingStationIds.add(station.id);
      }
    }

    const visited = new Set<string>([startId, nextId]);
    let curr = nextId;
    
    while (true) {
      const neighbors = store.edges
        .filter(e => e.line === line && (e.source === curr || e.target === curr))
        .map(e => e.source === curr ? e.target : e.source)
        .filter(nId => !visited.has(nId));
      
      if (neighbors.length === 0) {
        break;
      }
      
      if (neighbors.length === 1) {
        curr = neighbors[0];
        visited.add(curr);
      } else {
        const nextOnPath = neighbors.find(nId => remainingStationIds.has(nId));
        if (nextOnPath) {
          curr = nextOnPath;
        } else {
          curr = neighbors[0];
        }
        visited.add(curr);
      }
    }
    
    const termStation = store.stations.find(s => s.id === curr);
    return termStation ? termStation.name : "";
  };

  const getPlatformNumber = (station: any, line: string, terminalName: string) => {
    if (!station || !line) return 1;
    
    const LINE_ORDER = ["Red", "Yellow", "Blue", "Green", "Violet", "Pink", "Magenta", "Orange", "Grey", "RRTS"];
    const sortedLines = [...station.lines].sort((a, b) => LINE_ORDER.indexOf(a) - LINE_ORDER.indexOf(b));
    const lineIndex = sortedLines.indexOf(line);
    const basePlatform = 2 * (lineIndex >= 0 ? lineIndex : 0);
    
    const terminalStation = store.stations.find(s => s.name === terminalName);
    if (!terminalStation || !station.coordinates || !terminalStation.coordinates) {
      return basePlatform + 1;
    }
    
    const isNorthSouth = ["Yellow", "Violet", "RRTS"].includes(line);
    const coordIndex = isNorthSouth ? 0 : 1; 
    
    const currentVal = station.coordinates[coordIndex];
    const terminalVal = terminalStation.coordinates[coordIndex];
    
    if (terminalVal >= currentVal) {
      return basePlatform + 1;
    } else {
      return basePlatform + 2;
    }
  };

  const getLegBoardingInfo = (leg: any) => {
    if (!leg || !leg.edges || leg.edges.length === 0) return null;
    const edge = leg.edges[0];
    const nextId = edge.source === leg.startStation.id ? edge.target : edge.source;
    const termName = getTerminalStationName(leg.startStation.id, nextId, leg.line);
    const platNum = getPlatformNumber(leg.startStation, leg.line, termName);
    return { termName, platNum };
  };

  const getTransferWalkInfo = (stationId: string, toLine: string) => {
    if (stationId === "NS52" || stationId === "NS51") {
      return {
        type: "Footpath Pathway Walkway",
        distance: "300m",
        time: 8,
        description: "Walk via dedicated pedestrian pathway between Sector 52 & 51 (Free e-rickshaws available)"
      };
    }
    if (stationId === "DK" || stationId === "DDS") {
      return {
        type: "Skywalk with Travelators",
        distance: "1.2 km",
        time: 10,
        description: "Walk via the iconic covered skywalk connecting Orange & Pink platforms"
      };
    }
    if (stationId === "RG") {
      return {
        type: "Interchange Bridge Skywalk",
        distance: "400m",
        time: 6,
        description: "Walk via skywalk bridge connecting elevated Blue Line and Pink Line platforms"
      };
    }
    if (stationId === "HK") {
      return {
        type: "Deep Escalator Walk",
        distance: "350m",
        time: 6,
        description: "Walk via deep underground escalators connecting the Yellow and Magenta platforms"
      };
    }
    if (stationId === "RC") {
      return {
        type: "Concourse Interchange Way",
        distance: "200m",
        time: 4,
        description: "Walk via main central concourse escalators/stairs between Blue and Yellow platforms"
      };
    }
    if (stationId === "KG") {
      return {
        type: "Multi-level Interchange Tunnel",
        distance: "300m",
        time: 5,
        description: "Walk via multi-level escalator shafts connecting Red, Yellow, and Violet lines"
      };
    }
    return {
      type: "Interchange Concourse Walk",
      distance: "150m",
      time: 4,
      description: "Standard interchange walk via station concourse walkway"
    };
  };

  const getCondensedLegs = () => {
    const legs: any[] = [];
    if (path.length === 0) return legs;

    let currentLeg = {
      line: routeEdges[0]?.line || path[0].lines[0],
      startStation: path[0],
      endStation: path[0],
      stopsCount: 0,
      duration: 0,
      edges: [] as any[]
    };

    routeEdges.forEach((edge: any, idx: number) => {
      if (edge.isTransfer) {
        legs.push(currentLeg);
        currentLeg = {
          line: edge.line,
          startStation: path[idx],
          endStation: path[idx + 1],
          stopsCount: 1,
          duration: edge.adjustedTime || edge.baseTime,
          edges: [edge]
        };
      } else {
        currentLeg.endStation = path[idx + 1];
        currentLeg.stopsCount++;
        currentLeg.duration += edge.adjustedTime || edge.baseTime;
        currentLeg.edges.push(edge);
      }
    });
    legs.push(currentLeg);
    return legs;
  };

  const getPathStatusAlerts = () => {
    const alerts: any[] = [];
    path.forEach(station => {
      const infra = store.infrastructureStatus[station.id];
      if (infra) {
        if (infra.escalator === "Under Maintenance") {
          alerts.push({ stationName: station.name, type: "Escalator", status: "Maintenance" });
        }
        if (infra.elevator === "Under Maintenance") {
          alerts.push({ stationName: station.name, type: "Elevator", status: "Maintenance" });
        }
      }
    });
    return alerts;
  };

  const handleReportSubmit = () => {
    if (!reportingStationId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    store.submitCrowdReport(reportingStationId, reportedLevel);
    setReportSuccess(true);
    setTimeout(() => {
      store.calculateActiveRoute();
    }, 50);
    setTimeout(() => {
      setReportSuccess(false);
      setReportingStationId("");
    }, 2000);
  };

  const discountPercent = store.timeOfDay === "Off-Peak" ? 20 : 10;
  const regularFare = activeRoute ? activeRoute.metrics.fare : 0;
  const smartCardFare = activeRoute ? Math.round(regularFare * (1 - discountPercent / 100)) : 0;
  const savings = regularFare - smartCardFare;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeTheme === "dark" ? "#1c1c1e" : "#007aff" }]} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={activeTheme === "dark" ? "#1c1c1e" : "#007aff"} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: activeTheme === "dark" ? "#1c1c1e" : "#007aff" }]}>
        <View>
          <Text style={styles.headerTitle}>Metroway</Text>
          <Text style={styles.headerSubtitle}>Delhi Metro Companion</Text>
        </View>
        <Ionicons name="subway-outline" size={28} color="#FFFFFF" />
      </View>

      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {isEditingRoute || !store.activeRoute ? (
          /* Planner Input View */
          <ScrollView style={[styles.scrollContainer, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
            {/* Card: Station Inputs */}
            <View style={[styles.inputCard, { backgroundColor: colors.backgroundElement, shadowColor: activeTheme === 'dark' ? '#000' : 'rgba(0,0,0,0.05)' }]}>
              <View style={[styles.inputRow, { backgroundColor: colors.backgroundSelected, borderColor: colors.border }]}>
                <Ionicons name="radio-button-on" size={22} color="#4CAF50" style={styles.inputIcon} />
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => openSearchModal("start")}
                >
                  <Text
                    style={[
                      styles.selectButtonText,
                      { color: colors.text },
                      !store.startStationId && styles.placeholderText,
                      !store.startStationId && { color: colors.textSecondary },
                    ]}
                  >
                    {store.startStationId
                      ? getStationName(store.startStationId)
                      : "Select Boarding Station..."}
                  </Text>
                </TouchableOpacity>
                {store.startStationId ? (
                  <TouchableOpacity onPress={() => store.setStartStationId("")} style={styles.clearBtn}>
                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Connecting Line Visual */}
              <View style={styles.connectorContainer}>
                <View style={[styles.connectorLine, { backgroundColor: '#007aff' }]} />
                <TouchableOpacity onPress={handleSwap} style={[styles.swapButton, { backgroundColor: activeTheme === 'dark' ? '#2c2c2e' : '#EFF6FF', borderColor: colors.border }]}>
                  <Ionicons name="swap-vertical" size={20} color="#007aff" />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputRow, { backgroundColor: colors.backgroundSelected, borderColor: colors.border }]}>
                <Ionicons name="location" size={22} color="#F44336" style={styles.inputIcon} />
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => openSearchModal("end")}
                >
                  <Text
                    style={[
                      styles.selectButtonText,
                      { color: colors.text },
                      !store.endStationId && styles.placeholderText,
                      !store.endStationId && { color: colors.textSecondary },
                    ]}
                  >
                    {store.endStationId
                      ? getStationName(store.endStationId)
                      : "Select Destination..."}
                  </Text>
                </TouchableOpacity>
                {store.endStationId ? (
                  <TouchableOpacity onPress={() => store.setEndStationId("")} style={styles.clearBtn}>
                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Preset Chips */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Routing Preference</Text>
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
                    style={[
                      styles.prefChip,
                      { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                      active && styles.prefChipActive,
                      active && { backgroundColor: "#007aff", borderColor: "#007aff" }
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      store.setMode(mode);
                    }}
                  >
                    <MaterialCommunityIcons
                      name={iconMap[mode] as any || "compass"}
                      size={16}
                      color={active ? "#FFFFFF" : colors.textSecondary}
                      style={styles.chipIcon}
                    />
                    <Text style={[
                      styles.prefChipText,
                      { color: colors.textSecondary },
                      active && styles.prefChipTextActive,
                      active && { color: "#FFFFFF" }
                    ]}>
                      {mode}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Switch Options */}
            <View style={[styles.optionCard, { backgroundColor: colors.backgroundElement, shadowColor: activeTheme === 'dark' ? '#000' : 'rgba(0,0,0,0.05)' }]}>
              <View style={styles.optionRow}>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>Use Smart Card</Text>
                  <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>Apply 10% discount on fare calculations</Text>
                </View>
                <Switch
                  value={store.useSmartCard}
                  onValueChange={(val) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    store.useSmartCard = val;
                    // Force recalc if activeRoute is open
                    if (store.activeRoute) store.calculateActiveRoute();
                  }}
                  trackColor={{ false: activeTheme === 'dark' ? '#3a3a3c' : '#D1D5DB', true: "#93C5FD" }}
                  thumbColor={store.useSmartCard ? "#007aff" : (activeTheme === 'dark' ? '#48484a' : "#F3F4F6")}
                />
              </View>

              <View style={[styles.optionRow, styles.borderTop, { borderTopColor: colors.border }]}>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>Accessibility Mode</Text>
                  <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>Prioritize lifts & ramps on station routes</Text>
                </View>
                <Switch
                  value={store.accessibilityOnly}
                  onValueChange={(val) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    store.toggleAccessibilityOnly();
                    if (store.activeRoute) store.calculateActiveRoute();
                  }}
                  trackColor={{ false: activeTheme === 'dark' ? '#3a3a3c' : '#D1D5DB', true: "#93C5FD" }}
                  thumbColor={store.accessibilityOnly ? "#007aff" : (activeTheme === 'dark' ? '#48484a' : "#F3F4F6")}
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
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Recent Journeys</Text>
                  <TouchableOpacity onPress={() => store.clearHistory()}>
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                {store.searchHistory.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.historyItem, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                    onPress={() =>
                      handleHistoryItemTap(item.startStationId, item.endStationId, item.mode)
                    }
                  >
                    <View style={styles.historyLeft}>
                      <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                      <View style={styles.historyTextCol}>
                        <Text style={[styles.historyRouteText, { color: colors.text }]}>
                          {item.startName} ➔ {item.endName}
                        </Text>
                        <Text style={[styles.historyMeta, { color: colors.textSecondary }]}>
                          {item.mode} • {item.timestamp}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Network Metrics Footer */}
            <View style={[styles.footerStats, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.footerStatsTitle, { color: colors.textSecondary }]}>Delhi Metro Network Status</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#007aff' }]}>{store.stations.length}</Text>
                  <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Stations</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#007aff' }]}>12</Text>
                  <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Lines</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#34c759' }]}>Normal</Text>
                  <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Service</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={[styles.routeContainer, { backgroundColor: colors.background }]}>
            {/* Top route card header */}
            <View style={[styles.routeHeaderCard, { backgroundColor: activeTheme === 'dark' ? '#1c1c1e' : '#007aff' }]}>
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
                <Text style={styles.gridStatValue}>{activeRoute.metrics.time} mins</Text>
                <Text style={styles.gridStatLabel}>Duration</Text>
              </View>
              <View style={styles.gridStat}>
                <Ionicons name="git-compare" size={16} color="#FFFFFF" />
                <Text style={styles.gridStatValue}>
                  {activeRoute.metrics.transfers} {activeRoute.metrics.transfers === 1 ? "transfer" : "transfers"}
                </Text>
                <Text style={styles.gridStatLabel}>Interchanges</Text>
              </View>
              <View style={styles.gridStat}>
                <Ionicons name="card" size={16} color="#FFFFFF" />
                <Text style={styles.gridStatValue}>
                  ₹{store.useSmartCard ? smartCardFare : regularFare}
                </Text>
                <Text style={styles.gridStatLabel}>Fare {store.useSmartCard && "(Discounted)"}</Text>
              </View>
            </View>
          </View>

          {/* Subway Node Flow Map (Horizontal Scrollable Legs) */}
          <View style={styles.flowMapContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.flowMapContent}>
              {getCondensedLegs().map((leg, idx) => {
                const isLastLeg = idx === getCondensedLegs().length - 1;
                const legColor = LINE_COLORS[leg.line] || "#475569";
                const boarding = getLegBoardingInfo(leg);

                return (
                  <React.Fragment key={idx}>
                    <View style={styles.flowLegItem}>
                      <View style={[styles.flowLineDot, { backgroundColor: legColor }]} />
                      <View style={{ marginLeft: 6 }}>
                        <Text style={styles.flowLegLineText}>{leg.line} Line</Text>
                        <Text style={styles.flowLegStationName} numberOfLines={1}>{leg.startStation.name}</Text>
                        {boarding && (
                          <Text style={styles.flowLegPlatformText}>
                            Plat {boarding.platNum} • {boarding.termName}
                          </Text>
                        )}
                      </View>
                    </View>

                    {!isLastLeg && (
                      <View style={styles.flowTransferItem}>
                        <Ionicons name="arrow-forward" size={14} color="#8B5CF6" />
                        <Text style={styles.flowTransferLabel}>Transfer</Text>
                      </View>
                    )}
                  </React.Fragment>
                );
              })}

              <View style={[styles.flowLegItem, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" }]}>
                <Ionicons name="location" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                <View>
                  <Text style={[styles.flowLegLineText, { color: "#EF4444" }]}>Destination</Text>
                  <Text style={styles.flowLegStationName} numberOfLines={1}>{getStationName(store.endStationId)}</Text>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Tab Headers */}
          <View style={[styles.tabHeaderContainer, { backgroundColor: activeTheme === 'dark' ? '#1c1c1e' : '#e3e3e8' }]}>
            <Animated.View
              style={[
                styles.activeIndicatorCapsule,
                {
                  left: tabProgressLeft,
                  backgroundColor: activeTheme === 'dark' ? '#2c2c2e' : '#ffffff',
                },
              ]}
            />
            {[
              { id: "timeline", label: "Timeline", icon: "list-outline" },
              { id: "fare", label: "Fare", icon: "card-outline" },
              { id: "exits", label: "Exits", icon: "exit-outline" },
              { id: "status", label: "Outages", icon: "alert-circle-outline", alertCount: getPathStatusAlerts().length }
            ].map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabHeaderButton}
                onPress={() => handleTabChange(tab.id)}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={16} 
                  color={activeTab === tab.id ? (activeTheme === 'dark' ? '#ffffff' : '#000000') : colors.textSecondary} 
                />
                <Text style={[
                  styles.tabHeaderButtonText, 
                  { 
                    color: activeTab === tab.id ? (activeTheme === 'dark' ? '#ffffff' : '#000000') : colors.textSecondary,
                    fontWeight: activeTab === tab.id ? "700" : "500"
                  }
                ]}>
                  {tab.label}
                </Text>
                {tab.alertCount ? (
                  <View style={[styles.tabAlertBadge, { backgroundColor: '#ff3b30' }]}>
                    <Text style={[styles.tabAlertBadgeText, { color: '#ffffff' }]}>{tab.alertCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Scroll Content */}
          <ScrollView style={styles.timelineScroll} contentContainerStyle={styles.timelineContent}>
            
            {/* 1. Timeline Tab */}
            {activeTab === "timeline" && (
              <View>
                {/* Quick Ratings Badges */}
                <View style={styles.journeyRatings}>
                  <View style={[styles.ratingPill, styles.ratingBalanced]}>
                    <Text style={styles.ratingLabel}>Crowd: </Text>
                    <Text style={styles.ratingVal}>{activeRoute.metrics.crowd}/10</Text>
                  </View>
                  <View style={[styles.ratingPill, styles.ratingComfort]}>
                    <Text style={styles.ratingLabel}>Comfort: </Text>
                    <Text style={styles.ratingVal}>{activeRoute.metrics.comfort}/10</Text>
                  </View>
                  <View style={[styles.ratingPill, styles.ratingSafety]}>
                    <Text style={styles.ratingLabel}>Safety: </Text>
                    <Text style={styles.ratingVal}>{activeRoute.metrics.safety}/10</Text>
                  </View>
                </View>

                {/* Vertical Timeline Nodes */}
                <View style={styles.timelineWrapper}>
                  {path.map((station, idx) => {
                    const isStart = idx === 0;
                    const isEnd = idx === path.length - 1;
                    const nextEdge = routeEdges[idx];
                    const hasAlert = store.infrastructureStatus[station.id]?.escalator === "Under Maintenance" || 
                                      store.infrastructureStatus[station.id]?.elevator === "Under Maintenance";
                    const lineColor = nextEdge ? (LINE_COLORS[nextEdge.line] || "#888888") : "transparent";

                    return (
                      <View key={`${station.id}-${idx}`} style={styles.stationNode}>
                        <View style={styles.timelineSidebar}>
                          <View style={[styles.stationIndicator, { borderColor: isEnd ? "#EF4444" : isStart ? "#10B981" : lineColor }]}>
                            <View style={[styles.stationDot, { backgroundColor: isStart ? "#10B981" : isEnd ? "#EF4444" : "#FFFFFF" }]} />
                          </View>
                          {!isEnd && (
                            <View 
                              style={[
                                styles.timelineLine, 
                                { 
                                  backgroundColor: lineColor,
                                  borderStyle: nextEdge?.isTransfer ? "dashed" : "solid",
                                  borderLeftWidth: nextEdge?.isTransfer ? 2 : 3,
                                  borderColor: lineColor,
                                  width: nextEdge?.isTransfer ? 0 : 3
                                }
                              ]} 
                            />
                          )}
                        </View>
                        <View style={styles.timelineBody}>
                          <View style={styles.stationHeaderRow}>
                            <Text style={[styles.stationNodeName, (isStart || isEnd) && styles.boldStation]}>
                              {station.name}
                            </Text>
                            {isStart && <Text style={styles.endpointBadge}>Start</Text>}
                            {isEnd && <Text style={[styles.endpointBadge, { backgroundColor: "#FEE2E2", color: "#B91C1C" }]}>End</Text>}
                            {hasAlert && (
                              <View style={styles.timelineAlertBadge}>
                                <Ionicons name="warning" size={10} color="#F59E0B" />
                                <Text style={styles.timelineAlertText}>Alert</Text>
                              </View>
                            )}
                          </View>

                          {/* Connected Lines Badges */}
                          <View style={styles.stationLinesRow}>
                            {station.lines.map(l => (
                              <View 
                                key={l} 
                                style={[styles.lineBadgePill, { backgroundColor: (LINE_COLORS[l] || "#888888") + "15", borderColor: (LINE_COLORS[l] || "#888888") + "25" }]}
                              >
                                <Text style={[styles.lineBadgeText, { color: LINE_COLORS[l] || "#888888" }]}>{l}</Text>
                              </View>
                            ))}
                          </View>

                          {isStart && nextEdge && (() => {
                            const termName = getTerminalStationName(station.id, path[1]?.id, nextEdge.line);
                            const platNum = getPlatformNumber(station, nextEdge.line, termName);
                            return (
                              <View style={styles.boardingBox}>
                                <Text style={styles.boardingText}>
                                  Board <Text style={{ color: lineColor, fontWeight: "bold" }}>{nextEdge.line} Line</Text> towards <Text style={{ fontWeight: "bold", color: "#1F2937" }}>{termName}</Text> (Platform {platNum})
                                </Text>
                              </View>
                            );
                          })()}

                          {!isStart && nextEdge?.isTransfer && (() => {
                            const termName = getTerminalStationName(station.id, path[idx + 1]?.id, nextEdge.line);
                            const platNum = getPlatformNumber(station, nextEdge.line, termName);
                            const walkInfo = getTransferWalkInfo(station.id, nextEdge.line);
                            const adjustedWalkTime = store.timeOfDay === "Peak" ? walkInfo.time + 3 : walkInfo.time;
                            return (
                              <View style={styles.transferBox}>
                                <View style={styles.transferHeaderRow}>
                                  <Ionicons name="swap-horizontal" size={14} color="#8B5CF6" style={{ marginRight: 4 }} />
                                  <Text style={styles.transferTitleText}>
                                    Transfer to <Text style={{ color: lineColor, fontWeight: "bold" }}>{nextEdge.line} Line</Text> (Platform {platNum})
                                  </Text>
                                </View>
                                <View style={styles.transferWalkBox}>
                                  <Text style={styles.transferWalkTitle}>
                                    🚶 {walkInfo.type}: ~{adjustedWalkTime} mins walk ({walkInfo.distance})
                                  </Text>
                                  <Text style={styles.transferWalkDesc}>
                                    {walkInfo.description} {store.timeOfDay === "Peak" && "(+3m peak delay)"}
                                  </Text>
                                </View>
                              </View>
                            );
                          })()}

                          {!isStart && !isEnd && !nextEdge?.isTransfer && (
                            <Text style={styles.intermediateText}>
                              Ride {nextEdge?.line} Line • Approx. {Math.round(nextEdge?.adjustedTime || nextEdge?.baseTime || 2)} mins
                            </Text>
                          )}

                          {isEnd && (
                            <View style={styles.destArrivedBox}>
                              <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
                              <Text style={styles.destArrivedText}>Destination reached</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 2. Fare Breakdown Tab */}
            {activeTab === "fare" && (
              <View style={styles.tabContentContainer}>
                <View style={styles.fareCardsRow}>
                  <View style={styles.fareCard}>
                    <Text style={styles.fareCardLabel}>Single Token</Text>
                    <Text style={styles.fareCardSub}>Vending Price</Text>
                    <Text style={styles.fareCardValue}>₹{regularFare}</Text>
                  </View>

                  <View style={[styles.fareCard, store.useSmartCard && styles.fareCardActive]}>
                    <Text style={[styles.fareCardLabel, store.useSmartCard && styles.fareCardLabelActive]}>
                      {store.useSmartCard && <Ionicons name="sparkles" size={12} color="#F59E0B" />} Smart Card
                    </Text>
                    <Text style={[styles.fareCardSub, store.useSmartCard && styles.fareCardSubActive]}>
                      Includes {discountPercent}% off
                    </Text>
                    <Text style={[styles.fareCardValue, store.useSmartCard && styles.fareCardValueActive]}>
                      ₹{smartCardFare}
                    </Text>
                  </View>
                </View>

                {store.useSmartCard ? (
                  <View style={styles.savingsBanner}>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginRight: 8 }} />
                    <Text style={styles.savingsBannerText}>
                      Smart Card active! You saved <Text style={{ fontWeight: "bold" }}>₹{savings}</Text> ({discountPercent}% discount applied).
                    </Text>
                  </View>
                ) : (
                  <View style={styles.smartCardPromo}>
                    <Ionicons name="card" size={20} color="#F59E0B" style={{ marginRight: 10, marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.promoTitle}>Recommendation: Use a Smart Card</Text>
                      <Text style={styles.promoDesc}>
                        Save 10% during peak hours, and 20% off during off-peak hours by paying with a smart card. Turn it on in the options above to apply the pricing.
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.breakdownCard}>
                  <Text style={styles.breakdownCardTitle}>Fare Calculation Breakdown</Text>
                  <View style={styles.breakdownList}>
                    {routeEdges.some((e: any) => e.line === "Orange") ? (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Airport Express Premium Flat Fare:</Text>
                        <Text style={styles.breakdownVal}>₹60.00</Text>
                      </View>
                    ) : (
                      <>
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>Base Ticket Fare:</Text>
                          <Text style={styles.breakdownVal}>₹10.00</Text>
                        </View>
                        <View style={[styles.breakdownRow, styles.borderTopSmall]}>
                          <Text style={styles.breakdownLabel}>Distance Charge ({activeRoute.metrics.distance} km @ ₹2.5/km):</Text>
                          <Text style={styles.breakdownVal}>₹{Math.round(activeRoute.metrics.distance * 2.5 * 10) / 10}</Text>
                        </View>
                        {activeRoute.metrics.transfers > 0 && (
                          <View style={[styles.breakdownRow, styles.borderTopSmall]}>
                            <Text style={styles.breakdownLabel}>Interchange Surcharge (₹2/transfer):</Text>
                            <Text style={styles.breakdownVal}>₹{activeRoute.metrics.transfers * 2}.00</Text>
                          </View>
                        )}
                      </>
                    )}
                    <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
                      <Text style={styles.breakdownTotalLabel}>Subtotal Ticket Price:</Text>
                      <Text style={styles.breakdownTotalVal}>₹{regularFare}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* 3. Exit Recommender Tab */}
            {activeTab === "exits" && (
              <View style={styles.tabContentContainer}>
                {getRecommendedExit() ? (() => {
                  const recommendedExitObj = getRecommendedExit();
                  const lightColor = recommendedExitObj.lit === "Dimly-Lit"
                    ? "#EF4444"
                    : recommendedExitObj.lit === "Moderate"
                    ? "#F59E0B"
                    : "#10B981";

                  return (
                    <View style={styles.recommendedExitCard}>
                      <View style={styles.recommendedExitHeader}>
                        <Ionicons name="checkmark-done-circle" size={20} color="#208AEF" style={{ marginRight: 6 }} />
                        <Text style={styles.recommendedExitTitle}>Recommended Exit Gate</Text>
                      </View>
                      
                      <View style={styles.exitGateHeadingRow}>
                        <View style={styles.exitGateBadge}>
                          <Text style={styles.exitGateBadgeText}>Gate {recommendedExitObj.gate}</Text>
                        </View>
                        <Text style={styles.exitGateName}>{recommendedExitObj.name}</Text>
                      </View>

                      <View style={styles.exitMetaRow}>
                        <View style={[styles.litIndicator, { borderColor: lightColor + "40", backgroundColor: lightColor + "10" }]}>
                          <Text style={[styles.litIndicatorText, { color: lightColor }]}>{recommendedExitObj.lit}</Text>
                        </View>
                        {recommendedExitObj.accessibility?.map((acc: string) => (
                          <View key={acc} style={styles.accIndicator}>
                            <Ionicons name="accessibility" size={10} color="#4F46E5" style={{ marginRight: 2 }} />
                            <Text style={styles.accIndicatorText}>{acc}</Text>
                          </View>
                        ))}
                      </View>
                      
                      <Text style={styles.exitSecurityNotice}>
                        * Recommended based on security lighting levels and your {store.accessibilityOnly ? "accessibility settings" : "comfort settings"}.
                      </Text>
                    </View>
                  );
                })() : (
                  <Text style={styles.noExitsText}>No exit data available for this destination.</Text>
                )}

                <Text style={styles.exitSectionTitle}>All Destination Exits</Text>
                <View style={styles.allExitsWrapper}>
                  {(() => {
                    const destStationObj = path[path.length - 1];
                    if (!destStationObj || !destStationObj.exits || destStationObj.exits.length === 0) {
                      return <Text style={styles.noExitsText}>No exit gates cataloged for this station.</Text>;
                    }
                    return destStationObj.exits.map((exit: any, idx: number) => {
                      const lightColor = exit.lit === "Dimly-Lit"
                        ? "#EF4444"
                        : exit.lit === "Moderate"
                        ? "#F59E0B"
                        : "#10B981";

                      return (
                        <View key={`all-ex-${idx}`} style={styles.allExitItem}>
                          <View style={styles.allExitHeading}>
                            <View style={styles.allExitGateBadge}>
                              <Text style={styles.allExitGateBadgeText}>Gate {exit.gate}</Text>
                            </View>
                            <View style={[styles.litPill, { borderColor: lightColor }]}>
                              <Text style={[styles.litText, { color: lightColor }]}>{exit.lit}</Text>
                            </View>
                          </View>
                          <Text style={styles.allExitName}>{exit.name}</Text>
                          {exit.accessibility && exit.accessibility.length > 0 && (
                            <View style={styles.allExitAccRow}>
                              {exit.accessibility.map((acc: string) => (
                                <Text key={acc} style={styles.allExitAccText}>• {acc}</Text>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    });
                  })()}
                </View>
              </View>
            )}

            {/* 4. Outages & Crowd Reporting Tab */}
            {activeTab === "status" && (
              <View style={styles.tabContentContainer}>
                {/* Crowd Reporting Form */}
                <View style={styles.crowdReportCard}>
                  <Text style={styles.crowdReportTitle}>Report Live Crowd Level</Text>
                  
                  <Text style={styles.reportFormLabel}>1. Select Station on your Path</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reportStationsScroll}>
                    {path.map(s => {
                      const active = reportingStationId === s.id;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[styles.reportStationChip, active && styles.reportStationChipActive]}
                          onPress={() => setReportingStationId(s.id)}
                        >
                          <Text style={[styles.reportStationChipText, active && styles.reportStationChipTextActive]}>
                            {s.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <Text style={styles.reportFormLabel}>2. Select Crowd Level</Text>
                  <View style={styles.reportLevelGrid}>
                    {[
                      { level: "Low", icon: "ellipse", color: "#10B981", desc: "Empty Seats" },
                      { level: "Moderate", icon: "ellipse", color: "#F59E0B", desc: "Standing Room" },
                      { level: "High", icon: "ellipse", color: "#EF4444", desc: "Very Rush" },
                      { level: "Heavy Rush", icon: "ellipse", color: "#B91C1C", desc: "Snags / Delays" }
                    ].map(item => {
                      const active = reportedLevel === item.level;
                      return (
                        <TouchableOpacity
                          key={item.level}
                          style={[styles.reportLevelBtn, active && { borderColor: item.color, backgroundColor: item.color + "08" }]}
                          onPress={() => setReportedLevel(item.level)}
                        >
                          <Ionicons name={item.icon as any} size={10} color={item.color} style={{ marginRight: 4 }} />
                          <Text style={[styles.reportLevelText, active && { color: item.color, fontWeight: "700" }]}>
                            {item.level}
                          </Text>
                          <Text style={styles.reportLevelDesc}>{item.desc}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[styles.reportSubmitBtn, (!reportingStationId || reportSuccess) && styles.reportSubmitBtnDisabled]}
                    onPress={handleReportSubmit}
                    disabled={!reportingStationId || reportSuccess}
                  >
                    <Text style={styles.reportSubmitBtnText}>
                      {reportSuccess ? "✓ Crowd Report Submitted" : "Submit Crowd Report"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Alerts Box */}
                {getPathStatusAlerts().length > 0 ? (
                  <View style={styles.alertsContainer}>
                    <Text style={styles.alertSectionTitle}>Active Path Outages</Text>
                    {getPathStatusAlerts().map((alert, idx) => (
                      <View key={`out-${idx}`} style={styles.alertItemBox}>
                        <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 8, marginTop: 1 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.alertItemTitle}>{alert.stationName}</Text>
                          <Text style={styles.alertItemDesc}>
                            The station's <Text style={{ fontWeight: "bold" }}>{alert.type}</Text> is currently down for maintenance. Alternate stairs are operational.
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.noAlertsBox}>
                    <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" style={{ marginBottom: 6 }} />
                    <Text style={styles.noAlertsTitle}>All Systems Operational</Text>
                    <Text style={styles.noAlertsDesc}>
                      No lift or escalator outages are currently reported along your calculated route path.
                    </Text>
                  </View>
                )}

                {/* Full path equipment grid */}
                <View style={styles.outageGridCard}>
                  <Text style={styles.outageGridTitle}>Equipment Operations Grid</Text>
                  <View style={styles.outageGridHeader}>
                    <Text style={[styles.gridCellHeader, { flex: 2 }]}>Station</Text>
                    <Text style={styles.gridCellHeader}>Escalators</Text>
                    <Text style={styles.gridCellHeader}>Elevators</Text>
                  </View>
                  <View style={styles.outageGridBody}>
                    {path.map(s => {
                      const stat = store.infrastructureStatus[s.id] || { escalator: "Operational", elevator: "Operational" };
                      return (
                        <View key={`grid-row-${s.id}`} style={styles.outageGridRow}>
                          <Text style={[styles.gridCellBody, { flex: 2, fontWeight: "600" }]} numberOfLines={1}>
                            {s.name}
                          </Text>
                          <Text style={[styles.gridCellBody, { color: stat.escalator === "Operational" ? "#10B981" : "#EF4444", fontWeight: "bold" }]}>
                            {stat.escalator === "Operational" ? "OK" : "Maint"}
                          </Text>
                          <Text style={[styles.gridCellBody, { color: stat.elevator === "Operational" ? "#10B981" : "#EF4444", fontWeight: "bold" }]}>
                            {stat.elevator === "Operational" ? "OK" : "Maint"}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

          </ScrollView>
        </View>
      )}
      </View>

      {/* Autocomplete Search Modal */}
      <Modal
        visible={searchModalOpen}
        animationType="slide"
        onRequestClose={() => setSearchModalOpen(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setSearchModalOpen(false)} style={styles.modalCloseBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {activeSearchField === "start" ? "Select Start Station" : "Select Destination"}
            </Text>
          </View>

          {/* Search Input */}
          <View style={[styles.modalSearchBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.modalSearchIcon} />
            <TextInput
              style={[styles.modalTextInput, { color: colors.text }]}
              placeholder="Search station name..."
              placeholderTextColor={colors.textSecondary}
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
                style={[styles.modalListItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSelectStation(item.id)}
              >
                <View style={styles.modalListItemLeft}>
                  <Ionicons name="subway" size={20} color="#007aff" style={{ marginRight: 12 }} />
                  <View>
                    <Text style={[styles.modalStationName, { color: colors.text }]}>{item.name}</Text>
                    {getLineBadges(item.id)}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.modalListContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="warning-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No stations match "{searchQuery}"</Text>
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
  flowMapContainer: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  flowMapContent: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  flowLegItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: 200,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  flowLineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  flowLegLineText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  flowLegStationName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F2937",
  },
  flowLegPlatformText: {
    fontSize: 9,
    color: "#208AEF",
    fontWeight: "600",
    marginTop: 1,
  },
  flowTransferItem: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  flowTransferLabel: {
    fontSize: 8,
    color: "#8B5CF6",
    fontWeight: "800",
    textTransform: "uppercase",
    marginTop: 1,
  },
  tabHeaderContainer: {
    flexDirection: "row",
    position: "relative",
    marginHorizontal: 16,
    marginVertical: 14,
    borderRadius: 14,
    padding: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  tabHeaderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 11,
    gap: 4,
    zIndex: 2,
  },
  tabHeaderButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  activeIndicatorCapsule: {
    position: "absolute",
    top: 3,
    bottom: 3,
    width: "23.5%",
    borderRadius: 11,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  tabAlertBadge: {
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  tabAlertBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  timelineWrapper: {
    paddingLeft: 10,
    marginTop: 10,
  },
  timelineAlertBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginLeft: 8,
    borderWidth: 0.5,
    borderColor: "#F59E0B",
  },
  timelineAlertText: {
    fontSize: 8,
    color: "#D97706",
    fontWeight: "700",
    marginLeft: 2,
  },
  stationLinesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
    marginBottom: 6,
  },
  lineBadgePill: {
    borderWidth: 0.5,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  lineBadgeText: {
    fontSize: 8,
    fontWeight: "700",
  },
  boardingBox: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  boardingText: {
    fontSize: 12,
    color: "#0369A1",
    lineHeight: 16,
  },
  transferBox: {
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  transferHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  transferTitleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6D28D9",
  },
  transferWalkBox: {
    borderLeftWidth: 2,
    borderLeftColor: "#C4B5FD",
    paddingLeft: 8,
    marginTop: 4,
  },
  transferWalkTitle: {
    fontSize: 11,
    color: "#5B21B6",
    fontWeight: "600",
  },
  transferWalkDesc: {
    fontSize: 10,
    color: "#7C3AED",
    marginTop: 1,
  },
  intermediateText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
    marginBottom: 6,
    fontStyle: "italic",
  },
  destArrivedBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  destArrivedText: {
    fontSize: 11,
    color: "#065F46",
    fontWeight: "700",
  },
  tabContentContainer: {
    padding: 4,
  },
  fareCardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  fareCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  fareCardActive: {
    borderColor: "#FCD34D",
    backgroundColor: "#FFFBEB",
  },
  fareCardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4B5563",
    textTransform: "uppercase",
  },
  fareCardLabelActive: {
    color: "#B45309",
  },
  fareCardSub: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
  fareCardSubActive: {
    color: "#D97706",
  },
  fareCardValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginTop: 10,
  },
  fareCardValueActive: {
    color: "#B45309",
  },
  savingsBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  savingsBannerText: {
    fontSize: 12,
    color: "#065F46",
    flex: 1,
  },
  smartCardPromo: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  promoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  promoDesc: {
    fontSize: 11,
    color: "#4B5563",
    marginTop: 2,
    lineHeight: 15,
  },
  breakdownCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  breakdownCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  breakdownList: {
    gap: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 12,
    color: "#4B5563",
    flex: 1,
    paddingRight: 8,
  },
  breakdownVal: {
    fontSize: 12,
    color: "#1F2937",
    fontWeight: "600",
  },
  borderTopSmall: {
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
  breakdownTotalRow: {
    borderTopWidth: 1.5,
    borderTopColor: "#D1D5DB",
    paddingTop: 10,
    marginTop: 4,
  },
  breakdownTotalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  breakdownTotalVal: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  recommendedExitCard: {
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 20,
    backgroundColor: "#F0F9FF",
  },
  recommendedExitHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  recommendedExitTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0369A1",
    textTransform: "uppercase",
  },
  exitGateHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  exitGateBadge: {
    backgroundColor: "#0284C7",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  exitGateBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  exitGateName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0369A1",
    flex: 1,
  },
  exitMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  litIndicator: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  litIndicatorText: {
    fontSize: 10,
    fontWeight: "700",
  },
  accIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  accIndicatorText: {
    fontSize: 10,
    color: "#4F46E5",
    fontWeight: "700",
  },
  exitSecurityNotice: {
    fontSize: 10,
    color: "#0369A1",
    fontStyle: "italic",
    opacity: 0.8,
  },
  exitSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  allExitsWrapper: {
    gap: 10,
  },
  allExitItem: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 12,
  },
  allExitHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  allExitGateBadge: {
    backgroundColor: "#4B5563",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  allExitGateBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  allExitName: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "600",
  },
  allExitAccRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  allExitAccText: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
  },
  noExitsText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginVertical: 12,
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
  crowdReportCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 16,
  },
  crowdReportTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#374151",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  reportFormLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 6,
  },
  reportStationsScroll: {
    marginBottom: 14,
  },
  reportStationChip: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  reportStationChipActive: {
    backgroundColor: "#E0F2FE",
    borderColor: "#3B82F6",
  },
  reportStationChipText: {
    fontSize: 12,
    color: "#4B5563",
  },
  reportStationChipTextActive: {
    color: "#2563EB",
    fontWeight: "700",
  },
  reportLevelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  reportLevelBtn: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
  },
  reportLevelText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  reportLevelDesc: {
    fontSize: 8,
    color: "#9CA3AF",
    marginTop: 1,
  },
  reportSubmitBtn: {
    backgroundColor: "#208AEF",
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  reportSubmitBtnDisabled: {
    backgroundColor: "#93C5FD",
    opacity: 0.7,
  },
  reportSubmitBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  alertsContainer: {
    marginBottom: 16,
  },
  alertSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  alertItemBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  alertItemTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#991B1B",
  },
  alertItemDesc: {
    fontSize: 11,
    color: "#B91C1C",
    marginTop: 2,
    lineHeight: 14,
  },
  noAlertsBox: {
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  noAlertsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#065F46",
  },
  noAlertsDesc: {
    fontSize: 11,
    color: "#047857",
    textAlign: "center",
    marginTop: 2,
    lineHeight: 15,
  },
  outageGridCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
  },
  outageGridTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4B5563",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  outageGridHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 6,
    marginBottom: 6,
  },
  gridCellHeader: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    textAlign: "center",
  },
  outageGridBody: {
    gap: 4,
  },
  outageGridRow: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  gridCellBody: {
    flex: 1,
    fontSize: 11,
    color: "#374151",
    textAlign: "center",
  },
});
