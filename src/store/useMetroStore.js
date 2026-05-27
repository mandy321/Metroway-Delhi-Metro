import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calculateRoute } from "../utils/router";
import { STATIONS } from "../data/metroData";

export const useMetroStore = create(
  persist(
    (set, get) => ({
      // State
      startStationId: "",
      endStationId: "",
      mode: "Balanced",
      activeRoute: null,
      searchHistory: [], // Last 10 calculated journeys
      isOffline: !navigator.onLine,
      accessibilityOnly: false, // If true, highlights/filters elevator/escalator gates
      infrastructureStatus: {}, // Station ID -> { escalator: 'Operational' | 'Maintenance', elevator: 'Operational' | 'Maintenance' }

      // Actions
      setStartStationId: (id) => set({ startStationId: id }),
      setEndStationId: (id) => set({ endStationId: id }),
      setMode: (mode) => set({ mode }),
      
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
        const { startStationId, endStationId, mode } = get();
        if (!startStationId || !endStationId) return;

        const routeResult = calculateRoute(startStationId, endStationId, mode);
        if (routeResult) {
          // Add to search history (max 10, no duplicates at the top)
          const startName = STATIONS.find(s => s.id === startStationId)?.name || "";
          const endName = STATIONS.find(s => s.id === endStationId)?.name || "";
          
          const newHistoryItem = {
            id: `${startStationId}-${endStationId}-${mode}-${Date.now()}`,
            startStationId,
            endStationId,
            startName,
            endName,
            mode,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          const filteredHistory = get().searchHistory.filter(
            item => !(item.startStationId === startStationId && item.endStationId === endStationId && item.mode === mode)
          );

          set({
            activeRoute: routeResult,
            searchHistory: [newHistoryItem, ...filteredHistory].slice(0, 10)
          });
        }
      },

      clearHistory: () => set({ searchHistory: [] }),

      initializeInfrastructureStatus: () => {
        // Pre-populate with reasonable statuses
        const initialStatus = {};
        STATIONS.forEach(station => {
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
        // Simulate a Cloudflare Worker/DMRC scraping stream updating status periodically
        const { infrastructureStatus, updateInfrastructureStatus, isOffline } = get();
        
        // Pick a random station to update infrastructure status
        const stationKeys = Object.keys(infrastructureStatus);
        if (stationKeys.length === 0) return;

        const randomStationId = stationKeys[Math.floor(Math.random() * stationKeys.length)];
        
        // If offline, we can still run mock updates locally
        const statusType = Math.random() > 0.5 ? "escalator" : "elevator";
        const newStatus = Math.random() > 0.85 ? "Under Maintenance" : "Operational";
        
        updateInfrastructureStatus(randomStationId, { [statusType]: newStatus });
      }
    }),
    {
      name: "delhi-metro-navigation-store",
      partialize: (state) => ({
        startStationId: state.startStationId,
        endStationId: state.endStationId,
        mode: state.mode,
        activeRoute: state.activeRoute,
        searchHistory: state.searchHistory,
        accessibilityOnly: state.accessibilityOnly,
        infrastructureStatus: state.infrastructureStatus
      })
    }
  )
);
