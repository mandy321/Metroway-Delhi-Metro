import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculateRoute } from "../utils/router";
import { STATIONS, EDGES } from "../data/metroData";

export const useMetroStore = create(
  persist(
    (set, get) => ({
      // Dynamic Transit Data (fallbacks to local database on startup)
      stations: STATIONS,
      edges: EDGES,

      // UI Selection State
      startStationId: "",
      endStationId: "",
      mode: "Balanced",
      timeOfDay: "Off-Peak", 
      selectedHour: new Date().getHours(),
      activeEvent: "None",
      communityReports: {},
      useSmartCard: false,
      activeRoute: null,
      searchHistory: [], 
      isOffline: false,
      accessibilityOnly: false,
      infrastructureStatus: {},

      // Actions
      setStartStationId: (id) => set({ startStationId: id }),
      setEndStationId: (id) => set({ endStationId: id }),
      setMode: (mode) => set({ mode }),
      setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
      setSelectedHour: (selectedHour) => {
        const isPeak = (selectedHour >= 8 && selectedHour <= 10) || (selectedHour >= 17 && selectedHour <= 19);
        set({ 
          selectedHour,
          timeOfDay: isPeak ? "Peak" : "Off-Peak"
        });
      },
      setActiveEvent: (activeEvent) => set({ activeEvent }),
      submitCrowdReport: (stationId, level) => set((state) => ({
        communityReports: {
          ...state.communityReports,
          [stationId]: level
        }
      })),
      clearReports: () => set({ communityReports: {} }),

      getStationCrowd: (stationId) => {
        const { stations, selectedHour, activeEvent, communityReports } = get();
        const station = stations.find(s => s.id === stationId);
        if (!station) return 0;

        let crowd = station.baseCrowd || 5;

        // DMRC Hourly Rush Multipliers
        const rushMultipliers = [0.27, 0.17, 0.12, 0.11, 0.21, 0.47, 0.68, 0.86, 0.98, 0.90, 0.70, 0.60, 0.63, 0.58, 0.56, 0.63, 0.75, 0.93, 0.98, 0.86, 0.70, 0.58, 0.46, 0.33];
        const hour = selectedHour !== undefined ? selectedHour : 12;
        const rushFactor = rushMultipliers[hour] !== undefined ? rushMultipliers[hour] : 0.6;
        
        crowd = crowd * (rushFactor * 1.5); 

        // Event Simulation boosts
        if (activeEvent && activeEvent !== "None") {
          if (activeEvent === "IPL Match") {
            if (stationId === "DG1") crowd = 9.5; 
            else if (stationId === "JNS") crowd = 8.5; 
            else if (station.lines.includes("Violet") || station.lines.includes("Blue")) {
              crowd += 1.5;
            }
          } else if (activeEvent === "Music Concert") {
            if (stationId === "JNS") crowd = 9.5; 
            else if (stationId === "CES" || stationId === "LN") crowd += 2.0; 
          } else if (activeEvent === "Diwali Shopping Rush") {
            if (["RC", "CC", "KG", "LN", "BG"].includes(stationId)) {
              crowd = 9.8; 
            } else {
              crowd += 1.0;
            }
          }
        }

        // Community Report blend
        const report = communityReports[stationId];
        if (report !== undefined) {
          const reportMap = { "Low": 2, "Moderate": 5, "High": 8, "Heavy Rush": 10 };
          const reportedVal = reportMap[report] || 5;
          crowd = 0.6 * crowd + 0.4 * reportedVal;
        }

        return Math.max(1, Math.min(10, Math.round(crowd * 10) / 10));
      },
      
      toggleAccessibilityOnly: () => set((state) => ({ accessibilityOnly: !state.accessibilityOnly })),
      
      setOffline: (isOffline) => set({ isOffline }),

      swapStations: () => set((state) => {
        const temp = state.startStationId;
        return {
          startStationId: state.endStationId,
          endStationId: temp,
          activeRoute: null
        };
      }),

      // Fetch transit network data dynamically from Cloudflare Worker proxy
      loadDynamicData: async () => {
        try {
          // Note: In React Native, relative URLs do not work.
          // In a production environment, you would replace this with your Cloudflare Worker URL:
          // const response = await fetch("https://metroway-dmrc-proxy.mandy321.workers.dev/api/network-data");
          const response = await fetch("https://metroway-dmrc-proxy.mandy321.workers.dev/api/network-data");
          if (response.ok) {
            const data = await response.json();
            if (data.stations && data.edges) {
              set({
                stations: data.stations,
                edges: data.edges
              });
              // Refresh facility indicators for newly loaded stations
              get().initializeInfrastructureStatus();
              console.log(`Loaded complete dynamic dataset: ${data.stations.length} stations, ${data.edges.length} connections.`);
            }
          }
        } catch (error) {
          console.warn("Worker unavailable or offline. Running on local cached network data.");
        }
      },

      calculateActiveRoute: () => {
        const { stations, edges, startStationId, endStationId, mode, timeOfDay, getStationCrowd } = get();
        if (!startStationId || !endStationId || !stations || !edges) return;

        const routeResult = calculateRoute(stations, edges, startStationId, endStationId, mode, timeOfDay, getStationCrowd);
        if (routeResult) {
          const startName = stations.find(s => s.id === startStationId)?.name || "";
          const endName = stations.find(s => s.id === endStationId)?.name || "";
          
          const newHistoryItem = {
            id: `${startStationId}-${endStationId}-${mode}-${timeOfDay}-${Date.now()}`,
            startStationId,
            endStationId,
            startName,
            endName,
            mode,
            timeOfDay,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          const filteredHistory = get().searchHistory.filter(
            item => !(item.startStationId === startStationId && item.endStationId === endStationId && item.mode === mode && item.timeOfDay === timeOfDay)
          );

          set({
            activeRoute: routeResult,
            searchHistory: [newHistoryItem, ...filteredHistory].slice(0, 10)
          });
        }
      },

      clearHistory: () => set({ searchHistory: [] }),

      initializeInfrastructureStatus: () => {
        const { stations } = get();
        const initialStatus = {};
        stations.forEach(station => {
          initialStatus[station.id] = {
            escalator: Math.random() > 0.08 ? "Operational" : "Under Maintenance",
            elevator: Math.random() > 0.12 ? "Operational" : "Under Maintenance",
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          };
        });
        set({ infrastructureStatus: initialStatus });
      },

      updateInfrastructureStatus: (stationId, updates) => set((state) => ({
        infrastructureStatus: {
          ...state.infrastructureStatus,
          [stationId]: {
            ...state.infrastructureStatus[stationId],
            ...updates,
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        }
      })),

      triggerLiveMockUpdates: () => {
        const { infrastructureStatus, updateInfrastructureStatus } = get();
        const stationKeys = Object.keys(infrastructureStatus);
        if (stationKeys.length === 0) return;

        const randomStationId = stationKeys[Math.floor(Math.random() * stationKeys.length)];
        const statusType = Math.random() > 0.5 ? "escalator" : "elevator";
        const newStatus = Math.random() > 0.88 ? "Under Maintenance" : "Operational";
        
        updateInfrastructureStatus(randomStationId, { [statusType]: newStatus });
      }
    }),
    {
      name: "delhi-metro-navigation-store-v2",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        startStationId: state.startStationId,
        endStationId: state.endStationId,
        mode: state.mode,
        timeOfDay: state.timeOfDay,
        selectedHour: state.selectedHour,
        activeEvent: state.activeEvent,
        communityReports: state.communityReports,
        useSmartCard: state.useSmartCard,
        activeRoute: state.activeRoute,
        searchHistory: state.searchHistory,
        accessibilityOnly: state.accessibilityOnly,
        infrastructureStatus: state.infrastructureStatus
      })
    }
  )
);
