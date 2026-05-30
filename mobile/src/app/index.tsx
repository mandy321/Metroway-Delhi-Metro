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
  PanResponder,
  LayoutAnimation,
  UIManager,
  AppState,
  useColorScheme,
  Dimensions,
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

const getLineContrastColor = (line: string, isDark: boolean) => {
  const baseColor = LINE_COLORS[line] || "#888888";
  if (isDark) {
    return baseColor;
  } else {
    if (line === "Yellow") return "#D97706";
    if (line === "Aqua") return "#0891B2";
    return baseColor;
  }
};

export default function PlannerScreen() {
  const router = useRouter();
  const store = useMetroStore();
  const searchInputRef = React.useRef<TextInput>(null);

  // Local state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState<"start" | "end" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditingRoute, setIsEditingRoute] = useState(true);
  const [expandedTransfers, setExpandedTransfers] = useState<Record<string, boolean>>({});
  const [expandedRuns, setExpandedRuns] = useState<Record<number, boolean>>({});
  const [expandedRunsState, setExpandedRunsState] = useState<Record<number, boolean>>({});
  const [expandedStops, setExpandedStops] = useState<Record<string, boolean>>({});

  const routeEdges = store.activeRoute?.edges || [];
  const path = store.activeRoute?.path || [];

  const isKeyStation = (idx: number) => {
    if (idx === 0 || idx === path.length - 1) return true;
    if (routeEdges[idx - 1]?.isTransfer || routeEdges[idx]?.isTransfer) return true;
    return false;
  };

  const scheme = useColorScheme() || 'light';
  const systemTheme = scheme === 'unspecified' ? 'light' : scheme;
  const activeTheme = store.themeMode === 'system' ? systemTheme : store.themeMode;
  const colors = Colors[activeTheme];
  
  const bottomSheetPanY = React.useRef(new Animated.Value(0)).current;
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.vy) > Math.abs(gestureState.vx);
      },
      onPanResponderGrant: () => {
        bottomSheetPanY.setOffset((bottomSheetPanY as any)._value || 0);
        bottomSheetPanY.setValue(0);
      },
      onPanResponderMove: Animated.event(
        [null, { dy: bottomSheetPanY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        bottomSheetPanY.flattenOffset();
        const currentY = (bottomSheetPanY as any)._value || 0;
        const velocityY = gestureState.vy;

        if (velocityY < -0.5 || currentY < -100) {
          // Snap UP
          Animated.spring(bottomSheetPanY, {
            toValue: -300,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
        } else {
          // Snap DOWN
          Animated.spring(bottomSheetPanY, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
        }
      },
    })
  ).current;

  const [activeTab, setActiveTab] = useState("timeline");
  const tabProgress = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sync current hour to the store on mount and on resume so that crowd levels match actual system time
    const syncTime = () => {
      const currentHour = new Date().getHours();
      store.setSelectedHour(currentHour);
      // Recalculate route to apply new peak/hour adjustments
      if (store.startStationId && store.endStationId) {
        store.calculateActiveRoute();
      }
    };
    
    syncTime();
    
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "active") {
        syncTime();
      }
    });

    // Fetch live DMRC OTD data on mount
    store.fetchRealtimeTransitData();
    
    return () => {
      subscription.remove();
    };
  }, []);

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

      {/* Header (Only show when editing/searching) */}
      {(isEditingRoute || !store.activeRoute) && (
        <View style={[styles.header, { backgroundColor: activeTheme === "dark" ? "#1c1c1e" : "#007aff" }]}>
          <View>
            <Text style={styles.headerTitle}>Metroway</Text>
            <Text style={styles.headerSubtitle}>Delhi Metro Companion</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Ionicons name="subway-outline" size={26} color="#FFFFFF" />
          </View>
        </View>
      )}

      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {store.realtimeAlerts && store.realtimeAlerts.length > 0 && (
          <View style={{ backgroundColor: '#FEF3C7', borderBottomWidth: 1, borderBottomColor: '#F59E0B', paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="warning" size={16} color="#D97706" style={{ marginTop: 1 }} />
            <Text style={{ color: '#92400E', fontSize: 13, fontWeight: '700', flex: 1 }}>
              {store.realtimeAlerts[0].message}
            </Text>
          </View>
        )}
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
                <TouchableOpacity hitSlop={{top: 15, bottom: 15, left: 15, right: 15}} onPress={handleSwap} style={[styles.swapButton, { backgroundColor: activeTheme === 'dark' ? '#2c2c2e' : '#EFF6FF', borderColor: colors.border }]}>
                  <Ionicons name="swap-vertical" size={24} color="#007aff" />
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
                    store.setUseSmartCard(val);
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
            <View style={[styles.routeHeaderCard, { 
              backgroundColor: activeTheme === 'dark' ? '#1e1e24' : '#1e293b',
              borderRadius: 24,
              padding: 16,
              margin: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 6
            }]}>
            <View style={styles.routeHeaderRow}>
              <TouchableOpacity
                style={[styles.backToEditBtn, { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsEditingRoute(true);
                }}
              >
                <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
                <Text style={[styles.backToEditText, { marginLeft: 4, fontWeight: "600" }]}>Edit Route</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewMapBtn, { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/map");
                }}
              >
                <Ionicons name="map" size={16} color="#FFFFFF" />
                <Text style={[styles.viewMapBtnText, { marginLeft: 4, fontWeight: "600" }]}>Map View</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.routeSummaryRow, { marginTop: 12 }]}>
              <Text style={[styles.summaryStationName, { fontSize: 18, fontWeight: "800", color: "#FFFFFF" }]} numberOfLines={1}>
                {getStationName(store.startStationId)}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.6)" style={{ marginHorizontal: 10 }} />
              <Text style={[styles.summaryStationName, { fontSize: 18, fontWeight: "800", color: "#FFFFFF" }]} numberOfLines={1}>
                {getStationName(store.endStationId)}
              </Text>
            </View>

            {/* Travel stats */}
            <View style={[styles.statsGridRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 12, marginTop: 12 }]}>
              <View style={styles.gridStat}>
                <Ionicons name="time" size={16} color="#FFFFFF" />
                <Text style={[styles.gridStatValue, { fontSize: 15, fontWeight: "800" }]}>{activeRoute.metrics.time} mins</Text>
                <Text style={[styles.gridStatLabel, { color: 'rgba(255,255,255,0.6)' }]}>Duration</Text>
              </View>
              <View style={styles.gridStat}>
                <Ionicons name="git-compare" size={16} color="#FFFFFF" />
                <Text style={[styles.gridStatValue, { fontSize: 15, fontWeight: "800" }]}>
                  {activeRoute.metrics.transfers} {activeRoute.metrics.transfers === 1 ? "transfer" : "transfers"}
                </Text>
                <Text style={[styles.gridStatLabel, { color: 'rgba(255,255,255,0.6)' }]}>Interchanges</Text>
              </View>
              <View style={styles.gridStat}>
                <Ionicons name="card" size={16} color="#FFFFFF" />
                <Text style={[styles.gridStatValue, { fontSize: 15, fontWeight: "800" }]}>
                  ₹{store.useSmartCard ? smartCardFare : regularFare}
                </Text>
                <Text style={[styles.gridStatLabel, { color: 'rgba(255,255,255,0.6)' }]}>Fare {store.useSmartCard && "(Disc.)"}</Text>
              </View>
            </View>
          </View>

          {/* Subway Node Flow Map (Horizontal Scrollable Legs) */}
          <View style={[styles.flowMapContainer, { backgroundColor: activeTheme === 'dark' ? '#212225' : '#F3F4F6', borderBottomColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.flowMapContent}>
              {getCondensedLegs().map((leg, idx) => {
                const isLastLeg = idx === getCondensedLegs().length - 1;
                const legColor = LINE_COLORS[leg.line] || "#475569";
                const boarding = getLegBoardingInfo(leg);

                return (
                  <React.Fragment key={idx}>
                    <View style={[styles.flowLegItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <View style={[styles.flowLineDot, { backgroundColor: legColor }]} />
                      <View style={{ marginLeft: 6 }}>
                        <Text style={[styles.flowLegLineText, { color: colors.textSecondary }]}>{leg.line} Line</Text>
                        <Text style={[styles.flowLegStationName, { color: colors.text }]} numberOfLines={1}>{leg.startStation.name}</Text>
                        {boarding && (
                          <Text style={styles.flowLegPlatformText}>
                            Plat {boarding.platNum} • {boarding.termName}
                          </Text>
                        )}
                      </View>
                    </View>

                    {!isLastLeg && (() => {
                      const nextLineColor = LINE_COLORS[getCondensedLegs()[idx + 1].line] || "#8B5CF6";
                      return (
                        <View style={[styles.flowTransferItem, { paddingHorizontal: 2 }]}>
                          <Ionicons name="arrow-forward" size={14} color={nextLineColor} />
                          <Text style={[styles.flowTransferLabel, { color: colors.textSecondary, fontSize: 9 }]}>Transfer</Text>
                        </View>
                      );
                    })()}
                  </React.Fragment>
                );
              })}

              <View style={[
                styles.flowLegItem, 
                { 
                  backgroundColor: activeTheme === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2', 
                  borderColor: activeTheme === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5' 
                }
              ]}>
                <Ionicons name="location" size={14} color={activeTheme === 'dark' ? '#FF453A' : '#EF4444'} style={{ marginRight: 4 }} />
                <View>
                  <Text style={[styles.flowLegLineText, { color: activeTheme === 'dark' ? '#FF453A' : '#EF4444' }]}>Destination</Text>
                  <Text style={[styles.flowLegStationName, { color: colors.text }]} numberOfLines={1}>{getStationName(store.endStationId)}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
          
          {/* Draggable Bottom Sheet */}
          <Animated.View 
            style={[
              { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: "#000", shadowOffset: {width: 0, height: -4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 8, marginTop: 10, height: Dimensions.get('window').height },

              { transform: [{ translateY: bottomSheetPanY }] }
            ]}
          >
            <View 
              {...panResponder.panHandlers} 
              style={{ width: '100%', alignItems: 'center', paddingVertical: 12, backgroundColor: activeTheme === 'dark' ? '#1c1c1e' : '#e3e3e8', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
            >
              <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: activeTheme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }} />
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
            ].map((tab, idx) => {
              const isActive = activeTab === tab.id;
              const isPrevActive = idx > 0 && activeTab === ["timeline", "fare", "exits", "status"][idx - 1];
              return (
                <React.Fragment key={tab.id}>
                  {idx > 0 && !isActive && !isPrevActive && (
                    <View style={{ width: 1, height: 16, backgroundColor: activeTheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)', alignSelf: 'center', marginHorizontal: -0.5 }} />
                  )}
                  <TouchableOpacity
                    style={[styles.tabHeaderButton, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
                    onPress={() => handleTabChange(tab.id)}
                  >
                    <Ionicons 
                      name={tab.icon as any} 
                      size={14} 
                      color={isActive ? (activeTheme === 'dark' ? '#ffffff' : '#000000') : colors.textSecondary} 
                      style={{ marginRight: 4 }} 
                    />
                    <Text style={[
                      styles.tabHeaderButtonText, 
                      { 
                        color: isActive ? (activeTheme === 'dark' ? '#ffffff' : '#000000') : colors.textSecondary,
                        fontWeight: isActive ? "700" : "500",
                        fontSize: 11
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
                </React.Fragment>
              );
            })}
          </View>

          {/* Tab Scroll Content */}
          <ScrollView style={styles.timelineScroll} contentContainerStyle={styles.timelineContent}>
            
            {/* 1. Timeline Tab */}
            {activeTab === "timeline" && (
              <View>
                {/* Premium Metrics Widgets Grid */}
                <View style={styles.journeyMetricsGrid}>
                  {[
                    {
                      label: "Crowd",
                      value: activeRoute.metrics.crowd,
                      icon: "people-outline",
                      color: activeRoute.metrics.crowd > 7 ? "#FF453A" : activeRoute.metrics.crowd > 4 ? "#FF9F0A" : "#34C759",
                      desc: activeRoute.metrics.crowd > 7 ? "Very Packed" : activeRoute.metrics.crowd > 4 ? "Standing Only" : "Seats Available"
                    },
                    {
                      label: "Comfort",
                      value: activeRoute.metrics.comfort,
                      icon: "leaf-outline",
                      color: activeRoute.metrics.comfort < 4 ? "#FF453A" : activeRoute.metrics.comfort < 7 ? "#FF9F0A" : "#34C759",
                      desc: activeRoute.metrics.comfort < 4 ? "Tight Squeeze" : activeRoute.metrics.comfort < 7 ? "Comfy Ride" : "Luxurious"
                    },
                    {
                      label: "Safety",
                      value: activeRoute.metrics.safety,
                      icon: "shield-checkmark-outline",
                      color: activeRoute.metrics.safety < 4 ? "#FF453A" : activeRoute.metrics.safety < 7 ? "#FF9F0A" : "#34C759",
                      desc: activeRoute.metrics.safety < 4 ? "Low Lit Path" : activeRoute.metrics.safety < 7 ? "Secure Path" : "Highly Secure"
                    }
                  ].map((m) => (
                    <View 
                      key={m.label} 
                      style={[
                        styles.metricCard, 
                        { 
                          backgroundColor: colors.backgroundElement,
                          borderColor: colors.border
                        }
                      ]}
                    >
                      <View style={styles.metricHeader}>
                        <Ionicons name={m.icon as any} size={13} color={m.color} />
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{m.label}</Text>
                      </View>
                      <View style={{ marginVertical: 4 }}>
                        <Text style={[styles.metricValue, { color: colors.text }]}>{m.value}<Text style={{ fontSize: 9, fontWeight: "400", color: colors.textSecondary }}>/10</Text></Text>
                        <Text style={[styles.metricDesc, { color: m.color }]} numberOfLines={1}>{m.desc}</Text>
                      </View>
                      <View style={[styles.metricTrack, { backgroundColor: activeTheme === 'dark' ? '#2c2c2e' : '#e5e5ea' }]}>
                        <View style={[styles.metricFill, { width: `${m.value * 10}%`, backgroundColor: m.color }]} />
                      </View>
                    </View>
                  ))}
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

                    const keyStation = isKeyStation(idx);
                    
                    if (!keyStation) {
                      const isStartOfRun = idx > 0 && isKeyStation(idx - 1);
                      if (!isStartOfRun) {
                        return null; // Middle of a collapsed intermediate stops run
                      }

                      // We are at the start of a collapsed intermediate stops run.
                      // Find the next key station index:
                      let nextKeyIdx = idx + 1;
                      while (nextKeyIdx < path.length && !isKeyStation(nextKeyIdx)) {
                        nextKeyIdx++;
                      }
                      
                      const runStations = path.slice(idx, nextKeyIdx);
                      const runEdges = routeEdges.slice(idx - 1, nextKeyIdx - 1);
                      const runDuration = runEdges.reduce((sum, edge) => sum + (edge?.adjustedTime || edge?.baseTime || 2), 0);
                      const runStops = runStations.length;
                      const isExpanded = !!expandedRuns[idx];
                      const runLineColor = routeEdges[idx - 1] ? (LINE_COLORS[routeEdges[idx - 1].line] || "#888888") : "#888888";

                      if (!isExpanded) {
                        return (
                          <View key={`collapsed-run-${idx}`} style={styles.stationNode}>
                            <View style={styles.timelineSidebar}>
                              {/* Dotted indicator inside sidebar */}
                              <View style={[styles.stationIndicator, { borderColor: "#A2A2A7", width: 14, height: 14, borderRadius: 7, borderWidth: 2 }]}>
                                <View style={[styles.stationDot, { backgroundColor: "#A2A2A7", width: 4, height: 4, borderRadius: 2 }]} />
                              </View>
                              <View style={[styles.timelineLine, { backgroundColor: runLineColor, borderStyle: "dotted", borderLeftWidth: 2, borderColor: runLineColor, width: 0 }]} />
                            </View>
                            <View style={styles.timelineBody}>
                              <TouchableOpacity 
                                style={[styles.collapsedRunContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setExpandedRuns(prev => ({ ...prev, [idx]: true }));
                                }}
                              >
                                <Ionicons name="subway-outline" size={14} color={runLineColor} style={{ marginRight: 6 }} />
                                <Text style={[styles.collapsedRunText, { color: colors.textSecondary }]}>
                                  {runStops} stop{runStops > 1 ? 's' : ''} • {runDuration} min{runDuration > 1 ? 's' : ''}
                                </Text>
                                <Ionicons name="chevron-down" size={14} color={colors.textSecondary} style={{ marginLeft: "auto" }} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      } else {
                        // Expanded - render a "Collapse" button first, then render the stations
                        return (
                          <React.Fragment key={`expanded-run-fragment-${idx}`}>
                            <View style={styles.stationNode}>
                              <View style={styles.timelineSidebar}>
                                <View style={[styles.stationIndicator, { borderColor: "#A2A2A7", width: 14, height: 14, borderRadius: 7, borderWidth: 2 }]}>
                                  <View style={[styles.stationDot, { backgroundColor: "#A2A2A7", width: 4, height: 4, borderRadius: 2 }]} />
                                </View>
                                <View style={[styles.timelineLine, { backgroundColor: runLineColor, borderStyle: "solid", borderLeftWidth: 3, borderColor: runLineColor, width: 3 }]} />
                              </View>
                              <View style={styles.timelineBody}>
                                <TouchableOpacity 
                                  style={[styles.collapsedRunContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border, paddingVertical: 4 }]}
                                  onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setExpandedRuns(prev => ({ ...prev, [idx]: false }));
                                  }}
                                >
                                  <Ionicons name="subway-outline" size={12} color={runLineColor} style={{ marginRight: 6 }} />
                                  <Text style={[styles.collapsedRunText, { color: colors.textSecondary, fontSize: 11 }]}>
                                    Hide {runStops} stop{runStops > 1 ? 's' : ''}
                                  </Text>
                                  <Ionicons name="chevron-up" size={12} color={colors.textSecondary} style={{ marginLeft: "auto" }} />
                                </TouchableOpacity>
                              </View>
                            </View>
                            
                            {runStations.map((runStation, runIdx) => {
                              const globalIdx = idx + runIdx;
                              const currentEdge = routeEdges[globalIdx];
                              const currentLineColor = currentEdge ? (LINE_COLORS[currentEdge.line] || "#888888") : "transparent";
                              const stationAlert = store.infrastructureStatus[runStation.id]?.escalator === "Under Maintenance" || 
                                                   store.infrastructureStatus[runStation.id]?.elevator === "Under Maintenance";

                              return (
                                <View key={`${runStation.id}-${globalIdx}`} style={styles.stationNode}>
                                  <View style={styles.timelineSidebar}>
                                    <View style={[styles.stationIndicator, { borderColor: currentLineColor, width: 12, height: 12, borderRadius: 6, borderWidth: 2 }]}>
                                      <View style={[styles.stationDot, { backgroundColor: colors.background, width: 4, height: 4, borderRadius: 2 }]} />
                                    </View>
                                    <View style={[styles.timelineLine, { backgroundColor: currentLineColor, borderStyle: "solid", borderLeftWidth: 3, borderColor: currentLineColor, width: 3 }]} />
                                  </View>
                                  <View style={[styles.timelineBody, { paddingBottom: 12 }]}>
                                    <View style={styles.stationHeaderRow}>
                                      <Text style={[styles.stationNodeName, { color: colors.textSecondary, fontSize: 17, fontWeight: "600" }]}>
                                        {runStation.name}
                                      </Text>
                                      {stationAlert && (
                                        <View style={[styles.timelineAlertBadge, { paddingHorizontal: 4, paddingVertical: 1 }]}>
                                          <Ionicons name="warning" size={8} color="#F59E0B" />
                                          <Text style={[styles.timelineAlertText, { fontSize: 7 }]}>Alert</Text>
                                        </View>
                                      )}
                                    </View>
                                    <Text style={[styles.intermediateText, { color: colors.textSecondary, marginTop: 1, fontSize: 13 }]}>
                                      Ride {currentEdge?.line} Line • Approx. {Math.round(currentEdge?.adjustedTime || currentEdge?.baseTime || 2)} mins
                                    </Text>
                                  </View>
                                </View>
                              );
                            })}
                          </React.Fragment>
                        );
                      }
                    }

                    return (
                      <View key={`${station.id}-${idx}`} style={styles.stationNode}>
                        <View style={styles.timelineSidebar}>
                          <View style={[styles.stationIndicator, { borderColor: isEnd ? "#FF453A" : isStart ? "#34C759" : lineColor }]}>
                            <View style={[styles.stationDot, { backgroundColor: isStart ? "#34C759" : isEnd ? "#FF453A" : lineColor }]} />
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
                            <Text style={[styles.stationNodeName, { color: colors.text }, (isStart || isEnd) && styles.boldStation, (isStart || isEnd) && { color: colors.text }]}>
                              {station.name}
                            </Text>
                            {isStart && <Text style={styles.endpointBadge}>Start</Text>}
                            {isEnd && <Text style={[styles.endpointBadge, { backgroundColor: activeTheme === 'dark' ? '#3a1d1d' : '#FEE2E2', color: activeTheme === 'dark' ? '#ff453a' : '#B91C1C' }]}>End</Text>}
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
                                style={[styles.lineBadgePill, { backgroundColor: LINE_COLORS[l] || "#888888", borderColor: LINE_COLORS[l] || "#888888" }]}
                              >
                                <Text style={[styles.lineBadgeText, { color: "#FFFFFF" }]}>{l}</Text>
                              </View>
                            ))}
                          </View>

                          {isStart && nextEdge && (() => {
                            const termName = getTerminalStationName(station.id, path[1]?.id, nextEdge.line);
                            const platNum = getPlatformNumber(station, nextEdge.line, termName);
                            const activeLineColor = getLineContrastColor(nextEdge.line, activeTheme === 'dark');
                            return (
                              <View style={[
                                styles.navigationStepCard, 
                                { 
                                  backgroundColor: colors.backgroundElement, 
                                  borderLeftWidth: 4, 
                                  borderLeftColor: LINE_COLORS[nextEdge.line] || "#888888",
                                  borderColor: colors.border
                                }
                              ]}>
                                <View style={styles.navCardHeader}>
                                  <Ionicons name="train" size={15} color={LINE_COLORS[nextEdge.line] || "#888888"} />
                                  <Text style={[styles.navCardTitle, { color: colors.text }]}>Board Train</Text>
                                  <View style={[styles.platformPill, { backgroundColor: LINE_COLORS[nextEdge.line] || "#888888" }]}>
                                    <Text style={styles.platformPillText}>Platform {platNum}</Text>
                                  </View>
                                </View>
                                <Text style={[styles.navCardDesc, { color: colors.textSecondary }]}>
                                  Take the <Text style={{ color: activeLineColor, fontWeight: "800" }}>{nextEdge.line} Line</Text> towards <Text style={{ fontWeight: "700", color: colors.text }}>{termName}</Text>.
                                </Text>
                              </View>
                            );
                          })()}

                          {!isStart && nextEdge?.isTransfer && (() => {
                            const termName = getTerminalStationName(station.id, path[idx + 1]?.id, nextEdge.line);
                            const platNum = getPlatformNumber(station, nextEdge.line, termName);
                            const walkInfo = getTransferWalkInfo(station.id, nextEdge.line);
                            const adjustedWalkTime = store.timeOfDay === "Peak" ? walkInfo.time + 3 : walkInfo.time;
                            const activeLineColor = getLineContrastColor(nextEdge.line, activeTheme === 'dark');
                            const targetLineColor = LINE_COLORS[nextEdge.line] || "#8B5CF6";
                            return (
                              <View style={[
                                styles.navigationStepCard, 
                                { 
                                  backgroundColor: colors.backgroundElement, 
                                  borderLeftWidth: 4, 
                                  borderLeftColor: targetLineColor,
                                  borderColor: colors.border,
                                  padding: 10,
                                  marginTop: 6,
                                  marginBottom: 6
                                }
                              ]}>
                                <View style={styles.navCardHeader}>
                                  <Ionicons name="git-compare" size={15} color={targetLineColor} />
                                  <Text style={[styles.navCardTitle, { color: colors.text, fontSize: 14 }]}>Interchange Station</Text>
                                  <View style={[styles.platformPill, { backgroundColor: targetLineColor }]}>
                                    <Text style={styles.platformPillText}>Platform {platNum}</Text>
                                  </View>
                                </View>
                                <Text style={[styles.navCardDesc, { color: colors.textSecondary, fontSize: 13 }]}>
                                  Switch to the <Text style={{ color: activeLineColor, fontWeight: "800" }}>{nextEdge.line} Line</Text> towards <Text style={{ fontWeight: "700", color: colors.text }}>{termName}</Text>.
                                </Text>
                                
                                <View style={[styles.transferDetailRow, { borderTopColor: colors.border }]}>
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                    <Ionicons name="walk" size={15} color="#8B5CF6" />
                                    <Text style={[styles.transferPathTitle, { color: colors.text }]}>
                                      {walkInfo.type}
                                    </Text>
                                  </View>
                                  <View style={{ flexDirection: "row", gap: 6, marginTop: 4, marginBottom: 4 }}>
                                    <View style={styles.walkMetaBadge}>
                                      <Text style={styles.walkMetaText}>{walkInfo.distance}</Text>
                                    </View>
                                    <View style={[styles.walkMetaBadge, { backgroundColor: store.timeOfDay === "Peak" ? "rgba(239, 68, 68, 0.1)" : "rgba(139, 92, 246, 0.08)" }]}>
                                      <Text style={[styles.walkMetaText, store.timeOfDay === "Peak" && { color: "#FF453A" }]}>
                                        🕒 ~{adjustedWalkTime} mins {store.timeOfDay === "Peak" && "(Peak)"}
                                      </Text>
                                    </View>
                                  </View>
                                  <Text style={[styles.transferPathDesc, { color: colors.textSecondary }]}>
                                    {walkInfo.description}
                                  </Text>
                                </View>
                              </View>
                            );
                          })()}

                          {!isStart && !isEnd && !nextEdge?.isTransfer && (
                            <Text style={[styles.intermediateText, { color: colors.textSecondary }]}>
                              Ride <Text style={{ color: getLineContrastColor(nextEdge.line, activeTheme === 'dark'), fontWeight: "700" }}>{nextEdge.line} Line</Text> • Approx. {Math.round(nextEdge?.adjustedTime || nextEdge?.baseTime || 2)} mins
                            </Text>
                          )}

                          {isEnd && (
                            <View style={[styles.destArrivedBox, { backgroundColor: activeTheme === 'dark' ? 'rgba(52, 199, 89, 0.08)' : '#ECFDF5', borderColor: activeTheme === 'dark' ? 'rgba(52, 199, 89, 0.2)' : '#A7F3D0' }]}>
                              <Ionicons name="checkmark-circle" size={14} color="#34c759" style={{ marginRight: 4 }} />
                              <Text style={[styles.destArrivedText, { color: activeTheme === 'dark' ? '#30D158' : '#065F46' }]}>Destination reached</Text>
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
                  {/* Single Token Card */}
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      store.setUseSmartCard(false);
                      store.calculateActiveRoute();
                    }}
                    style={[
                      styles.ticketPassCard, 
                      { 
                        backgroundColor: colors.backgroundElement, 
                        borderColor: !store.useSmartCard ? "#007aff" : colors.border,
                        borderWidth: !store.useSmartCard ? 2 : 1,
                        opacity: !store.useSmartCard ? 1 : 0.65,
                        shadowColor: "#000",
                        shadowOpacity: !store.useSmartCard ? 0.08 : 0.02,
                      }
                    ]}
                  >
                    {/* Left Notch */}
                    <View style={[styles.ticketNotchLeft, { backgroundColor: colors.background }]} />
                    {/* Right Notch */}
                    <View style={[styles.ticketNotchRight, { backgroundColor: colors.background }]} />

                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={[styles.fareCardLabel, { color: colors.textSecondary }]}>Single Token</Text>
                      {!store.useSmartCard ? (
                        <Ionicons name="checkmark-circle" size={16} color="#007aff" />
                      ) : (
                        <Ionicons name="ellipse-outline" size={16} color={colors.textSecondary} />
                      )}
                    </View>
                    <Text style={[styles.fareCardSub, { color: colors.textSecondary, marginTop: 2 }]}>Vending Price</Text>
                    
                    {/* Tear-off Line */}
                    <View style={[styles.ticketTearLine, { borderColor: activeTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]} />
                    
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <Text style={[styles.fareCardValue, { color: colors.text, fontSize: 22, fontWeight: "900" }]}>₹{regularFare}</Text>
                      {/* Barcode representation */}
                      <View style={styles.simulatedBarcode}>
                        {[1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 2].map((w, i) => (
                          <View key={i} style={{ width: w, backgroundColor: colors.text, opacity: 0.6, height: "100%", marginRight: 1 }} />
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Smart Card Card */}
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      store.setUseSmartCard(true);
                      store.calculateActiveRoute();
                    }}
                    style={[
                      styles.ticketPassCard, 
                      { 
                        backgroundColor: store.useSmartCard 
                          ? (activeTheme === 'dark' ? 'rgba(245, 158, 11, 0.12)' : '#FFFDF5') 
                          : colors.backgroundElement, 
                        borderColor: store.useSmartCard ? "#F59E0B" : colors.border,
                        borderWidth: store.useSmartCard ? 2 : 1,
                        opacity: store.useSmartCard ? 1 : 0.65,
                        shadowColor: "#F59E0B",
                        shadowOpacity: store.useSmartCard ? 0.15 : 0.02,
                        shadowRadius: 8,
                        elevation: store.useSmartCard ? 4 : 1,
                      }
                    ]}
                  >
                    {/* Left Notch */}
                    <View style={[styles.ticketNotchLeft, { backgroundColor: colors.background }]} />
                    {/* Right Notch */}
                    <View style={[styles.ticketNotchRight, { backgroundColor: colors.background }]} />

                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={[
                        styles.fareCardLabel, 
                        { color: store.useSmartCard ? (activeTheme === 'dark' ? '#F59E0B' : '#B45309') : colors.textSecondary }
                      ]}>
                        Smart Card
                      </Text>
                      {store.useSmartCard ? (
                        <Ionicons name="checkmark-circle" size={16} color="#F59E0B" />
                      ) : (
                        <Ionicons name="ellipse-outline" size={16} color={colors.textSecondary} />
                      )}
                    </View>
                    <Text style={[
                      styles.fareCardSub, 
                      { color: store.useSmartCard ? (activeTheme === 'dark' ? 'rgba(245, 158, 11, 0.8)' : '#D97706') : colors.textSecondary, marginTop: 2 }
                    ]}>
                      {discountPercent}% Discount
                    </Text>

                    {/* Tear-off Line */}
                    <View style={[styles.ticketTearLine, { borderColor: store.useSmartCard ? (activeTheme === 'dark' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(180, 83, 9, 0.2)') : (activeTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)') }]} />

                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <Text style={[
                        styles.fareCardValue, 
                        { color: store.useSmartCard ? (activeTheme === 'dark' ? '#F59E0B' : '#B45309') : colors.text, fontSize: 22, fontWeight: "900" }
                      ]}>
                        ₹{smartCardFare}
                      </Text>
                      <Ionicons name="barcode-outline" size={22} color={store.useSmartCard ? (activeTheme === 'dark' ? '#F59E0B' : '#B45309') : colors.textSecondary} style={{ opacity: 0.5 }} />
                    </View>
                  </TouchableOpacity>
                </View>

                {store.useSmartCard ? (
                  <View style={[
                    styles.savingsBanner, 
                    { 
                      backgroundColor: activeTheme === 'dark' ? 'rgba(16, 185, 129, 0.12)' : '#D1FAE5',
                      borderColor: activeTheme === 'dark' ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'
                    }
                  ]}>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginRight: 8 }} />
                    <Text style={[styles.savingsBannerText, { color: activeTheme === 'dark' ? '#34D399' : '#065F46' }]}>
                      Smart Card active! Saved <Text style={{ fontWeight: "bold" }}>₹{savings}</Text> ({discountPercent}% discount applied).
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[
                      styles.smartCardPromo, 
                      { 
                        backgroundColor: activeTheme === 'dark' ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB',
                        borderColor: activeTheme === 'dark' ? 'rgba(245, 158, 11, 0.2)' : '#FDE68A'
                      }
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      store.setUseSmartCard(true);
                      store.calculateActiveRoute();
                    }}
                  >
                    <Ionicons name="card" size={20} color="#F59E0B" style={{ marginRight: 10, marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.promoTitle, { color: colors.text }]}>Apply Smart Card Discount</Text>
                      <Text style={[styles.promoDesc, { color: colors.textSecondary }]}>
                        Tap here to apply pricing with a Smart Card. Save 10% during peak and 20% off during off-peak hours.
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                <View style={[styles.breakdownCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <Text style={[styles.breakdownCardTitle, { color: colors.text }]}>Itemized Journey Receipt</Text>
                  <View style={styles.breakdownList}>
                    {routeEdges.some((e: any) => e.line === "Orange") ? (
                      <View style={styles.breakdownRow}>
                        <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Airport Express Flat Fare</Text>
                        <Text style={[styles.breakdownVal, { color: colors.text }]}>₹60.00</Text>
                      </View>
                    ) : (
                      <>
                        <View style={styles.breakdownRow}>
                          <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Base Ticket Fare</Text>
                          <Text style={[styles.breakdownVal, { color: colors.text }]}>₹10.00</Text>
                        </View>
                        <View style={[styles.breakdownRow, styles.borderTopSmall, { borderTopColor: colors.border }]}>
                          <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Distance Charge ({activeRoute.metrics.distance} km @ ₹2.5/km)</Text>
                          <Text style={[styles.breakdownVal, { color: colors.text }]}>₹{Math.round(activeRoute.metrics.distance * 2.5 * 10) / 10}</Text>
                        </View>
                        {activeRoute.metrics.transfers > 0 && (
                          <View style={[styles.breakdownRow, styles.borderTopSmall, { borderTopColor: colors.border }]}>
                            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Interchange Surcharge ({activeRoute.metrics.transfers} @ ₹2.00)</Text>
                            <Text style={[styles.breakdownVal, { color: colors.text }]}>₹{activeRoute.metrics.transfers * 2}.00</Text>
                          </View>
                        )}
                      </>
                    )}
                    
                    {/* Dotted border separator */}
                    <View style={{ borderStyle: 'dashed', borderWidth: 0.5, borderColor: colors.border, marginVertical: 8, height: 1, width: "100%" }} />
                    
                    <View style={[styles.breakdownRow]}>
                      <Text style={[styles.breakdownTotalLabel, { color: colors.text }]}>Subtotal Ticket Price</Text>
                      <Text style={[styles.breakdownTotalVal, { color: colors.text }]}>₹{regularFare}</Text>
                    </View>

                    {store.useSmartCard && (
                      <View style={[styles.breakdownRow]}>
                        <Text style={[styles.breakdownLabel, { color: activeTheme === 'dark' ? '#34D399' : '#065F46', fontWeight: "600" }]}>Smart Card Discount (-{discountPercent}%)</Text>
                        <Text style={[styles.breakdownVal, { color: activeTheme === 'dark' ? '#34D399' : '#065F46', fontWeight: "700" }]}>-₹{savings}</Text>
                      </View>
                    )}
                    
                    <View style={[styles.breakdownRow, { borderTopWidth: 1.5, borderTopColor: colors.text, paddingTop: 10, marginTop: 4 }]}>
                      <Text style={[styles.breakdownTotalLabel, { color: colors.text, fontSize: 14 }]}>Total Charged Fare</Text>
                      <Text style={[styles.breakdownTotalVal, { color: colors.text, fontSize: 16, fontWeight: "900" }]}>
                        ₹{store.useSmartCard ? smartCardFare : regularFare}
                      </Text>
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
                    ? "#FF453A"
                    : recommendedExitObj.lit === "Moderate"
                    ? "#FF9F0A"
                    : "#34C759";

                  return (
                    <View style={[
                      styles.recommendedExitCard,
                      {
                        backgroundColor: colors.backgroundElement,
                        borderColor: colors.border
                      }
                    ]}>
                      <View style={styles.recommendedExitHeader}>
                        <Ionicons name="star" size={15} color="#F59E0B" style={{ marginRight: 6 }} />
                        <Text style={[styles.recommendedExitTitle, { color: activeTheme === 'dark' ? '#F59E0B' : '#B45309' }]}>Recommended Exit Gate</Text>
                      </View>
                      
                      {/* Premium Circular Gate Emblem layout */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 }}>
                        <View style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          backgroundColor: lightColor,
                          justifyContent: "center",
                          alignItems: "center",
                          shadowColor: lightColor,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.25,
                          shadowRadius: 6,
                          elevation: 4
                        }}>
                          <Text style={{ color: "#FFFFFF", fontSize: 8, fontWeight: "800", textTransform: "uppercase" }}>Gate</Text>
                          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "900", marginTop: -2 }}>{recommendedExitObj.gate}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.exitGateName, { color: colors.text, fontSize: 15, fontWeight: "800" }]}>{recommendedExitObj.name}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                            <Ionicons name="shield-checkmark" size={12} color={lightColor} />
                            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Security: <Text style={{ fontWeight: "700", color: lightColor }}>{recommendedExitObj.lit}</Text></Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.exitMetaRow}>
                        {recommendedExitObj.accessibility?.map((acc: string) => (
                          <View key={acc} style={[
                            styles.accIndicator,
                            {
                              backgroundColor: activeTheme === 'dark' ? 'rgba(139, 92, 246, 0.08)' : '#EEF2FF',
                              borderColor: activeTheme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : '#C7D2FE'
                            }
                          ]}>
                            <Ionicons name="accessibility" size={11} color={activeTheme === 'dark' ? '#BF5AF2' : '#4F46E5'} style={{ marginRight: 4 }} />
                            <Text style={[styles.accIndicatorText, { color: activeTheme === 'dark' ? '#BF5AF2' : '#4F46E5' }]}>{acc}</Text>
                          </View>
                        ))}
                      </View>
                      
                      <Text style={[styles.exitSecurityNotice, { color: colors.textSecondary }]}>
                        * Selection prioritized for lighting safety and your accessibility preferences.
                      </Text>
                    </View>
                  );
                })() : (
                  <Text style={[styles.noExitsText, { color: colors.textSecondary }]}>No exit data available for this destination.</Text>
                )}

                <Text style={[styles.exitSectionTitle, { color: colors.text }]}>All Destination Exits</Text>
                <View style={styles.allExitsWrapper}>
                  {(() => {
                    const destStationObj = path[path.length - 1];
                    if (!destStationObj || !destStationObj.exits || destStationObj.exits.length === 0) {
                      return <Text style={[styles.noExitsText, { color: colors.textSecondary }]}>No exit gates cataloged for this station.</Text>;
                    }
                    return destStationObj.exits.map((exit: any, idx: number) => {
                      const lightColor = exit.lit === "Dimly-Lit"
                        ? "#FF453A"
                        : exit.lit === "Moderate"
                        ? "#FF9F0A"
                        : "#34C759";

                      return (
                        <View key={`all-ex-${idx}`} style={[styles.allExitItem, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                            {/* Gate Emblem */}
                            <View style={{
                              width: 38,
                              height: 38,
                              borderRadius: 19,
                              backgroundColor: colors.background,
                              borderColor: lightColor,
                              borderWidth: 2,
                              justifyContent: "center",
                              alignItems: "center"
                            }}>
                              <Text style={{ color: colors.textSecondary, fontSize: 7, fontWeight: "800", textTransform: "uppercase" }}>Gate</Text>
                              <Text style={{ color: colors.text, fontSize: 13, fontWeight: "900", marginTop: -2 }}>{exit.gate}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.allExitName, { color: colors.text, fontSize: 13, fontWeight: "700" }]}>{exit.name}</Text>
                              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                                <View style={[styles.litPill, { borderColor: lightColor, backgroundColor: lightColor + "08", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }]}>
                                  <Text style={[styles.litText, { color: lightColor, fontSize: 9, fontWeight: "800" }]}>{exit.lit}</Text>
                                </View>
                                {exit.accessibility?.map((acc: string) => (
                                  <View key={acc} style={[styles.accIndicator, { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, borderColor: colors.border, backgroundColor: colors.background }]}>
                                    <Text style={[styles.accIndicatorText, { fontSize: 9, color: colors.textSecondary }]}>{acc}</Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          </View>
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
                <View style={[styles.crowdReportCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <Text style={[styles.crowdReportTitle, { color: colors.text }]}>Report Live Crowd Level</Text>
                  
                  <Text style={[styles.reportFormLabel, { color: colors.textSecondary }]}>1. Select Station on your Path</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reportStationsScroll} contentContainerStyle={{ paddingBottom: 6 }}>
                    {path.map(s => {
                      const active = reportingStationId === s.id;
                      const stationLineColor = LINE_COLORS[s.lines[0]] || "#007aff";
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[
                            styles.reportStationChip, 
                            { 
                              backgroundColor: colors.background, 
                              borderColor: active ? '#007aff' : colors.border,
                              borderWidth: active ? 2 : 1,
                              borderLeftColor: stationLineColor,
                              borderLeftWidth: 4,
                            }
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setReportingStationId(s.id);
                          }}
                        >
                          <Text style={[
                            styles.reportStationChipText, 
                            { color: colors.textSecondary },
                            active && { color: '#007aff', fontWeight: "800" }
                          ]}>
                            {s.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <Text style={[styles.reportFormLabel, { color: colors.textSecondary }]}>2. Select Crowd Level</Text>
                  <View style={styles.reportLevelGrid}>
                    {[
                      { level: "Low", icon: "people-outline", color: "#34C759", desc: "Seats Free" },
                      { level: "Moderate", icon: "people", color: "#FF9F0A", desc: "Standing" },
                      { level: "High", icon: "alert-circle-outline", color: "#FF453A", desc: "Very Packed" },
                      { level: "Heavy Rush", icon: "flame-outline", color: "#8E1F1F", desc: "Snags / Delays" }
                    ].map(item => {
                      const active = reportedLevel === item.level;
                      return (
                        <TouchableOpacity
                          key={item.level}
                          activeOpacity={0.8}
                          style={[
                            styles.reportLevelTile, 
                            { 
                              backgroundColor: colors.background, 
                              borderColor: active ? item.color : colors.border,
                              borderWidth: active ? 2 : 1,
                              shadowColor: item.color,
                              shadowOpacity: active ? 0.12 : 0,
                              shadowRadius: 6,
                              elevation: active ? 3 : 0
                            }
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setReportedLevel(item.level);
                          }}
                        >
                          <View style={[styles.tileIconCircle, { backgroundColor: item.color + "12" }]}>
                            <Ionicons name={item.icon as any} size={16} color={item.color} />
                          </View>
                          <Text style={[styles.reportLevelText, { color: colors.text }, active && { color: item.color, fontWeight: "800" }]}>
                            {item.level}
                          </Text>
                          <Text style={[styles.reportLevelDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
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
                      <View 
                        key={`out-${idx}`} 
                        style={[
                          styles.alertItemBox,
                          {
                            backgroundColor: activeTheme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                            borderColor: activeTheme === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5'
                          }
                        ]}
                      >
                        <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 8, marginTop: 1 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.alertItemTitle, { color: activeTheme === 'dark' ? '#FF453A' : '#991B1B' }]}>{alert.stationName}</Text>
                          <Text style={[styles.alertItemDesc, { color: activeTheme === 'dark' ? '#FF453A' : '#B91C1C' }]}>
                            The station's <Text style={{ fontWeight: "bold" }}>{alert.type}</Text> is currently down for maintenance. Alternate stairs are operational.
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={[
                    styles.noAlertsBox,
                    {
                      backgroundColor: activeTheme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
                      borderColor: activeTheme === 'dark' ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'
                    }
                  ]}>
                    <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" style={{ marginBottom: 6 }} />
                    <Text style={[styles.noAlertsTitle, { color: activeTheme === 'dark' ? '#30D158' : '#065F46' }]}>All Systems Operational</Text>
                    <Text style={[styles.noAlertsDesc, { color: activeTheme === 'dark' ? '#30D158' : '#047857' }]}>
                      No lift or escalator outages are currently reported along your calculated route path.
                    </Text>
                  </View>
                )}

                {/* Full path equipment grid */}
                <View style={[styles.outageGridCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <Text style={[styles.outageGridTitle, { color: colors.textSecondary }]}>Equipment Operations Grid</Text>
                  
                  <View style={styles.outageGridBody}>
                    {path.map(s => {
                      const stat = store.infrastructureStatus[s.id] || { escalator: "Operational", elevator: "Operational" };
                      const escalatorOk = stat.escalator === "Operational";
                      const elevatorOk = stat.elevator === "Operational";
                      
                      return (
                        <View key={`grid-row-${s.id}`} style={[styles.outageGridRow, { borderBottomColor: colors.border }]}>
                          <Text style={[styles.gridCellBodyStationName, { color: colors.text }]} numberOfLines={1}>
                            {s.name}
                          </Text>
                          
                          <View style={styles.gridStatusGroup}>
                            {/* Escalators */}
                            <View style={[
                              styles.gridStatusPill, 
                              { 
                                backgroundColor: escalatorOk 
                                  ? (activeTheme === 'dark' ? 'rgba(52, 199, 89, 0.12)' : '#E6F4EA')
                                  : (activeTheme === 'dark' ? 'rgba(255, 69, 58, 0.12)' : '#FCE8E6'),
                              }
                            ]}>
                              <Ionicons name="swap-vertical" size={10} color={escalatorOk ? "#34C759" : "#FF453A"} />
                              <Text style={{ fontSize: 9, fontWeight: "700", color: escalatorOk ? "#34C759" : "#FF453A", marginLeft: 2 }}>Esc</Text>
                              <View style={[styles.statusPulseDot, { backgroundColor: escalatorOk ? "#34C759" : "#FF453A" }]} />
                            </View>

                            {/* Elevators */}
                            <View style={[
                              styles.gridStatusPill, 
                              { 
                                backgroundColor: elevatorOk 
                                  ? (activeTheme === 'dark' ? 'rgba(52, 199, 89, 0.12)' : '#E6F4EA')
                                  : (activeTheme === 'dark' ? 'rgba(255, 69, 58, 0.12)' : '#FCE8E6'),
                              }
                            ]}>
                              <Ionicons name="accessibility" size={10} color={elevatorOk ? "#34C759" : "#FF453A"} />
                              <Text style={{ fontSize: 9, fontWeight: "700", color: elevatorOk ? "#34C759" : "#FF453A", marginLeft: 2 }}>Elev</Text>
                              <View style={[styles.statusPulseDot, { backgroundColor: elevatorOk ? "#34C759" : "#FF453A" }]} />
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

          </ScrollView>
        </Animated.View>
      </View>
    )}
    </View>

      {/* Autocomplete Search Modal */}
      <Modal
        visible={searchModalOpen}
        animationType="slide"
        onRequestClose={() => setSearchModalOpen(false)}
        onShow={() => {
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 150);
        }}
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
              ref={searchInputRef}
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
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  headerThemeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "#E0E1E6",
    fontSize: 11,
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
    borderRadius: 24,
    width: 44,
    height: 44,
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
    padding: 12,
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
    marginBottom: 8,
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
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    marginBottom: 8,
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
    paddingVertical: 8,
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
    paddingBottom: 400,
  },
  journeyMetricsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  metricDesc: {
    fontSize: 9,
    fontWeight: "600",
    marginTop: 1,
  },
  metricTrack: {
    height: 4,
    borderRadius: 2,
    width: "100%",
    marginTop: 6,
    overflow: "hidden",
  },
  metricFill: {
    height: "100%",
    borderRadius: 2,
  },
  stationNode: {
    flexDirection: "row",
    minHeight: 70,
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
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
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
    top: 18,
    bottom: 0,
    zIndex: 1,
  },
  timelineBody: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },
  stationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  stationNodeName: {
    fontSize: 19,
    color: "#374151",
    fontWeight: "700",
  },
  boldStation: {
    fontSize: 22,
    color: "#111827",
    fontWeight: "900",
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
  navigationStepCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  navCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  navCardTitle: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  platformPill: {
    marginLeft: "auto",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  platformPillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  navCardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  transferDetailRow: {
    borderTopWidth: 0.5,
    paddingTop: 8,
    marginTop: 8,
  },
  transferPathTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  transferPathDesc: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
  },
  walkMetaBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  walkMetaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B5CF6",
  },
  intermediateText: {
    fontSize: 14,
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
    fontSize: 13,
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
  ticketPassCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    position: "relative",
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 2,
  },
  ticketNotchLeft: {
    position: "absolute",
    left: -8,
    top: "50%",
    marginTop: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    zIndex: 3,
  },
  ticketNotchRight: {
    position: "absolute",
    right: -8,
    top: "50%",
    marginTop: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    zIndex: 3,
  },
  ticketTearLine: {
    borderStyle: "dashed",
    borderWidth: 0.5,
    marginVertical: 14,
    height: 1,
    width: "100%",
  },
  simulatedBarcode: {
    flexDirection: "row",
    height: 24,
    alignItems: "center",
    opacity: 0.7,
  },
  fareCardLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fareCardSub: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
  fareCardValue: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 10,
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
    fontSize: 11,
    fontWeight: "800",
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
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 20,
  },
  recommendedExitHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  recommendedExitTitle: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  exitGateName: {
    fontSize: 15,
    fontWeight: "800",
  },
  exitMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  accIndicator: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  accIndicatorText: {
    fontSize: 10,
    fontWeight: "700",
  },
  exitSecurityNotice: {
    fontSize: 10,
    color: "#0369A1",
    fontStyle: "italic",
    opacity: 0.8,
  },
  exitSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#374151",
    textTransform: "uppercase",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  allExitsWrapper: {
    gap: 10,
  },
  allExitItem: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  allExitName: {
    fontSize: 13,
    fontWeight: "700",
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
    borderRadius: 6,
  },
  litText: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  crowdReportCard: {
    borderWidth: 1,
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
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  reportStationChipText: {
    fontSize: 12,
  },
  reportLevelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  reportLevelTile: {
    flex: 1,
    minWidth: "45%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  tileIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  reportLevelText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reportLevelDesc: {
    fontSize: 9,
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
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  alertItemTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  alertItemDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  noAlertsBox: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  noAlertsTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  noAlertsDesc: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
    lineHeight: 15,
  },
  outageGridCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
  },
  outageGridTitle: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  outageGridBody: {
    gap: 8,
  },
  outageGridRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    alignItems: "center",
    justifyContent: "space-between",
  },
  gridCellBodyStationName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  gridStatusGroup: {
    flexDirection: "row",
    gap: 6,
  },
  gridStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  collapsedRunContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  collapsedRunText: {
    fontSize: 12,
    fontWeight: "600",
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
  },
  modalSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalSearchIcon: {
    marginRight: 8,
  },
  modalTextInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
  },
  modalListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  modalListItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalStationName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  modalListContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  flowMapContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  flowMapContent: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  flowLegItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: 200,
  },
  flowLineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  flowLegLineText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  flowLegStationName: {
    fontSize: 12,
    fontWeight: "700",
  },
  flowLegPlatformText: {
    fontSize: 9,
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
    fontWeight: "800",
    textTransform: "uppercase",
    marginTop: 1,
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
  tabHeaderContainer: {
    flexDirection: "row",
    position: "relative",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    padding: 3,
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
});

