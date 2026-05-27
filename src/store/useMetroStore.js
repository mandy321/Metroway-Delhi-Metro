import { create } from "zustand";
import { persist } from "zustand/middleware";
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
      useSmartCard: false,
      activeRoute: null,
      searchHistory: [], 
      isOffline: !navigator.onLine,
      accessibilityOnly: false,
      infrastructureStatus: {},

      // Actions
      setStartStationId: (id) => set({ startStationId: id }),
      setEndStationId: (id) => set({ endStationId: id }),
      setMode: (mode) => set({ mode }),
      setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
      setUseSmartCard: (useSmartCard) => set({ useSmartCard }),
      
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
          // Fetch from relative path proxied by Vite in dev, same origin in prod
          const response = await fetch("/api/network-data");
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
        const { stations, edges, startStationId, endStationId, mode, timeOfDay } = get();
        if (!startStationId || !endStationId || !stations || !edges) return;

        const routeResult = calculateRoute(stations, edges, startStationId, endStationId, mode, timeOfDay);
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
      name: "delhi-metro-navigation-store",
      partialize: (state) => ({
        stations: state.stations,
        edges: state.edges,
        startStationId: state.startStationId,
        endStationId: state.endStationId,
        mode: state.mode,
        timeOfDay: state.timeOfDay,
        useSmartCard: state.useSmartCard,
        activeRoute: state.activeRoute,
        searchHistory: state.searchHistory,
        accessibilityOnly: state.accessibilityOnly,
        infrastructureStatus: state.infrastructureStatus
      })
    }
  )
);
