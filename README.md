# Metroway Delhi Metro 🚇 - Premium Navigation App

**Live Webapp URL:** [https://mandy321.github.io/Metroway-Delhi-Metro/](https://mandy321.github.io/Metroway-Delhi-Metro/)

**[📥 Download Latest Android APK](https://github.com/mandy321/Metroway-Delhi-Metro/releases/download/v2.1.0/app-release.apk)**

Metroway is a premium, offline-first transit navigation suite designed for the Delhi Metro network. It combines high-performance routing, interactive mapping, and real-time system intelligence into a sleek, gesture-driven interface.

---

## 🌟 Key Features
- **Smart Path Routing:** Uses a modified Dijkstra's algorithm supporting 4 routing modes (Balanced, Fastest, Least Crowd, Comfortable).
- **Aggressive Offline Mapping:** Custom Leaflet engine with high-speed rendering and dark-mode tiles, fully operational without an internet connection.
- **Floating Journey Panel:** A sleek, floating bottom sheet that snaps to key positions, providing instant access to journey details.
- **Smart Exit Recommender:** Suggests the safest and most convenient exit gates based on lighting levels and accessibility.
- **Live System Alerts:** Real-time tracking of official DMRC alerts, escalator/elevator statuses, and community crowd reporting.

---

## 🗺️ Advanced Map & Interaction
The mobile app offers deep integration with live GPS and interactive elements:
- **Nearest Station Finder:** Instantly identifies the nearest metro station to your current location.
- **Proximity Awareness:** Shows exactly how far you are from your selected starting station with a dedicated distance indicator.
- **Live Train Animation:** Watch your journey come to life with dynamic train icons that move along the tracks in real-time as you transit through stations.
- **Haptic Arrival Buzz:** Never miss your stop! The app triggers a distinct vibration pattern (buzz) at interchange stations and your final destination.

---

## 📱 Android Application Details
Built with React Native and Expo for a high-performance, compact experience:
- **Compact & Modern UI:** Aggressively optimized layout that maximizes screen real estate.
- **Real-Time System Intelligence:** Live crowd density tracking and automated Midnight Closure logic (11 PM - 6 AM).
- **Automatic Time Sync:** Re-calculates metrics upon app resume to match the current wall-clock time.

---

## 🤖 AI Context & Handoff
For developers or AI agents working on this project, please refer to:
- **[AI_HANDOFF.md](./AI_HANDOFF.md)**: A technical guide covering the tech stack, project structure, and core systems.

---

## 🛠️ Tech Stack
- **Framework:** React Native (Expo) & React (Web)
- **Language:** TypeScript / JavaScript
- **State:** Zustand (`useMetroStore`) with AsyncStorage persistence.
- **Map:** Leaflet via `react-native-webview` with optimized dark-matter filters.
- **Animations:** React Native `Animated` API and custom SVG articulation.
- **Haptics:** Expo Haptics & React Native Vibration for geofenced alerts.

---

## 🚀 Building the Release
### Android Release (EAS Build)
1. **Production AAB:** `cd mobile && eas build --platform android --profile production`
2. **Preview APK:** `cd mobile && eas build --platform android --profile preview`

---

## 🛡️ License & Copyright
Copyright © 2026 Metroway (Mandeep). All rights reserved.
