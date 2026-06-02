# Metroway Delhi Metro 🚇 - Premium Navigation App

**Live Webapp URL:** [https://mandy321.github.io/Metroway-Delhi-Metro/](https://mandy321.github.io/Metroway-Delhi-Metro/)

**[📥 Download Latest Android APK](https://github.com/mandy321/Metroway-Delhi-Metro/releases/download/v2.0.0/app-release.apk)**

Metroway is a premium, offline-first transit navigation suite designed for the Delhi Metro network. It combines high-performance routing, interactive mapping, and real-time system intelligence into a sleek, gesture-driven interface.

---

## 🌟 Key Features
- **Smart Path Routing:** Uses a modified Dijkstra's algorithm supporting 4 routing modes (Balanced, Fastest, Least Crowd, Comfortable) with realistic travel estimation.
- **Aggressive Offline Mapping:** Custom Leaflet engine with high-speed rendering and dark-mode tiles, fully operational without an internet connection.
- **Floating Journey Panel:** A gorgeous, floating bottom sheet that snaps to key positions, providing instant access to journey details without obscuring the map.
- **Smart Exit Recommender:** Suggests the safest and most convenient exit gates based on lighting levels and accessibility configurations.
- **Live System Alerts:** Real-time tracking of escalator/elevator statuses and community-driven crowd reporting.

---

## 📱 Android Application Details
The mobile app (`/mobile`) is built with React Native and Expo, offering a high-performance experience:

- **Compact & Modern UI:** Aggressively optimized layout that maximizes screen real estate while maintaining a premium aesthetic.
- **Real-Time System Intelligence:**
  - **Crowd Reporting:** Community-driven live crowd density tracking.
  - **Infrastructure Alerts:** Real-time status of lifts and escalators.
  - **Midnight Closure Logic:** Automatically adjusts to system hours (11 PM - 6 AM).
- **Automatic Time Sync:** Re-calculates metrics upon app resume to ensure crowd and arrival estimates match the current wall-clock time.

---

## 🤖 AI Context & Handoff
For developers or AI agents working on this project, please refer to:
- **[AI_HANDOFF.md](./AI_HANDOFF.md)**: A comprehensive technical guide covering the tech stack, project structure, and core systems. Use this file to provide complete context to any AI model.

---

## 🛠️ Tech Stack
- **Framework:** React Native (Expo) & React (Web)
- **Language:** TypeScript / JavaScript
- **State:** Zustand (`useMetroStore`) with AsyncStorage persistence.
- **Map:** Leaflet via `react-native-webview` with optimized dark-matter filters.
- **Animations:** React Native `Animated` API (using Native Driver for 60fps performance).
- **Backend Stub:** Cloudflare Workers for scraping and proxying transit data.

---

## 📁 Project Structure
```
├── mobile/                 # React Native / Expo Mobile App Source
│   ├── src/
│   │   ├── app/            # Expo Router screens (index, map, settings)
│   │   ├── store/          # Zustand state management
│   │   ├── data/           # Transit graph & station database
│   │   └── utils/          # Routing engine & map HTML generators
├── src/                    # Web Application Source
├── AI_HANDOFF.md           # Technical handoff for AI/Devs
└── README.md               # Main project documentation
```

---

## 🚀 Building the Release
### Android Release (EAS Build)
To build the production-ready artifacts for the Google Play Store:

1. **Production AAB (App Bundle):**
   ```bash
   cd mobile && eas build --platform android --profile production
   ```
2. **Preview APK:**
   ```bash
   cd mobile && eas build --platform android --profile preview
   ```

---

## 🛡️ License & Copyright
Copyright © 2026 Metroway (Mandeep). All rights reserved.

This project is proprietary and confidential. Unauthorized copying, distribution, or modification of this source code and compiled binaries is strictly prohibited.
