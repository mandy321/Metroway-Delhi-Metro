import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calculateRoute } from "../utils/router";
import { STATIONS } from "../data/metroData";

export const useMetroStore = create(
  persist(
    (set, get) => ({
      // State variables
      startStationId: "",
      endStationId: "",
      mode: "Balanced",
      timeOfDay: "Off-Peak", // "Off-Peak" | "Peak"
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

      calculateActiveRoute: () => {
        const { startStationId, endStationId, mode, timeOfDay } = get();
        if (!startStationId || !endStationId) return;

        const routeResult = calculateRoute(startStationId, endStationId, mode, timeOfDay);
        if (routeResult) {
          const startName = STATIONS.find(s => s.id === startStationId)?.name || "";
          const endName = STATIONS.find(s => s.id === endStationId)?.name || "";
          
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
        const initialStatus = {};
        STATIONS.forEach(station => {
          initialStatus[station.id] = {
            escalator: Math.random() > 0.1 ? "Operational" : "Under Maintenance",
            elevator: Math.random() > 0.15 ? "Operational" : "Under Maintenance",
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
