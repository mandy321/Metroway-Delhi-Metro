# Metroway Delhi Metro 🚇 - Offline-First Metro Navigation App

**Live Webapp URL:** [https://mandy321.github.io/Metroway-Delhi-Metro/](https://mandy321.github.io/Metroway-Delhi-Metro/)

**[📥 Download Latest Android APK](https://github.com/mandy321/Metroway-Delhi-Metro/releases/download/v1.9.6/app-release.apk)

Metroway Delhi Metro is a premium, feature-rich Progressive Web App (PWA) designed to calculate optimal paths across the Delhi Metro network. It operates entirely offline after the initial load, utilizing an aggressive caching strategy for application assets and Leaflet map tiles.


## 🌟 Key Features
- **Smart Path Routing:** Uses a modified Dijkstra's algorithm supporting 4 routing modes (Balanced, Fastest, Least Crowd, Women's Safety) with an added +5 mins line interchange penalty for realistic travel estimation.
- **Aggressive Offline Caching:** Service worker intercepts CartoDB / OpenStreetMap tile requests and caches them dynamically, enabling full offline mapping capabilities.
- **Smart Exit Recommender:** Suggests the safest and most convenient exit gates based on lighting levels and accessibility configurations.
- **Live Outage Feed:** Periodic mock updates (built to sync with a Cloudflare Worker scraper) track real-time escalator/elevator statuses across stations.

---

## 🛠️ Tech Stack & Architecture
- **Frontend:** React 18 + Vite (configured with Tailwind CSS v3)
- **Map:** React-Leaflet + Leaflet.js (CartoDB Dark Matter tile server)
- **State & Storage:** Zustand + LocalStorage Persistence
- **Service Worker:** Custom dynamic worker (`sw.js`)
- **API Stub:** Cloudflare Workers wrangler environment

---

## 📁 File Structure
```
├── public/
│   ├── manifest.json       # PWA Application Manifest
│   └── sw.js               # Service Worker (Caches code & map tiles)
├── src/
│   ├── components/
│   │   ├── Navbar.jsx      # Brand bar & connection status monitors
│   │   ├── SearchPanel.jsx # Fuzzy autocompletes, mode grids, accessibility switches
│   │   ├── MapView.jsx     # Glowing interactive Leaflet Map & legend
│   │   └── RouteDetails.jsx# Journey metrics, timeline, and exit suggestions
│   ├── data/
│   │   └── metroData.js    # 20 real Delhi Metro stations dataset with connections
│   ├── store/
│   │   └── useMetroStore.js# Zustand store with persistence
│   ├── utils/
│   │   └── router.js       # Modified Dijkstra's Algorithm
│   ├── App.jsx             # App layout and state-init hook
│   ├── index.css           # Styling sheet with glassmorphic presets & keyframes
│   └── main.jsx            # Mounting script
├── wrangler.toml           # Cloudflare Worker configuration
├── worker.js               # Cloudflare Worker scraping stub
├── tailwind.config.js      # Tailwind theme adjustments
├── postcss.config.js       # PostCSS config
├── vite.config.js          # Vite config
├── package.json            # Scripts and dependencies
└── README.md               # User documentation
```

---

## 🧮 Custom Routing Engine
The algorithm evaluates edges dynamically based on user preferences. Costs are calculated using:

$$\text{Cost} = (W_{\text{time}} \times \text{time}) + (W_{\text{crowd}} \times \text{crowd}) + (W_{\text{comfort}} \times \text{comfort}) + (W_{\text{safety}} \times (10 - \text{safety}))$$

### Dynamic Mode Weights:
- **Balanced (Default):** Time: 0.4, Crowd: 0.3, Comfort: 0.2, Safety: 0.1
- **Fastest:** Time: 0.8, others: 0.06
- **Least Crowd:** Crowd: 0.8, others: 0.06
- **Women's Safety:** Safety: 0.8, others: 0.06

*An additional transfer penalty (+5 minutes walk, +2 comfort penalty) is calculated whenever the active metro line changes at interchange hubs.*

---

## 🚀 Setup & Installation

### Prerequisites
Make sure you have Node.js (v18+) and npm installed.

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally in Dev Mode
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

### 3. Build for Production
```bash
npm run build
```
This command compiles the project into the `dist/` directory, ready to be hosted on GitHub Pages or static hosting services.

---

## 🔌 Cloudflare Worker Proxy
The project includes a mock DMRC scraper proxy designed to run on Cloudflare Workers.
To run the worker in development:
```bash
npx wrangler dev
```
To deploy the worker to production:
```bash
npx wrangler deploy
```

---

## 📱 Mobile Application (React Native / Expo Router)
The repository contains a fully-fledged native mobile application located in the `mobile/` directory. Built using Expo Router and React Native, it shares the offline routing engine logic with the Web app, but is optimized for handheld devices with a native map view, custom tab navigation, and gesture-driven panels.

### Mobile Features:
- **Native Routing Map**: Utilizes native maps (`react-native-maps`) to draw high-contrast routes with black border backgrounds under colored foreground lines.
- **Auto-Zoom Camera**: Intelligently frames calculated routes on the map.
- **Tabbed Journey Planner**: A gorgeous panel showing:
  - **Timeline**: Color-coded metro route transitions, platform numbers, transfers, and station list.
  - **Fare Breakdown**: Compares Single Journey Tokens vs. Metro Smart Cards with exact savings percentages.
  - **Exit Recommender**: Suggests optimal exit gates based on accessibility and lighting features.
  - **Facility Status & Outages**: Real-time status table of lifts/escalators and custom crowd reporting forms.
- **Station Explorer Directory**: Shows complete list of station exits with dedicated accessibility icon tags (Escalators, Elevators, Wheelchair Ramps, Tactile Paths).

### Building the Mobile App Locally:
1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npx expo start
   ```
4. Build the Production Release APK (Android) locally:
   ```bash
   cd android && chmod +x gradlew && ./gradlew assembleRelease
   ```
   The compiled APK will be generated at `mobile/android/app/build/outputs/apk/release/app-release.apk`.

---

## 🔐 Zero-Key Notice
This application requires **no premium API keys** (like Mapbox or Google Maps). Leaflet / native maps load tiles and routing data from free public servers and local offline configurations, making it lightweight and unrestricted.

---

## 🛡️ License & Copyright
Copyright © 2026 Metroway (Mandeep). All rights reserved.

This project is proprietary and confidential. Unauthorized copying, distribution, modification, reverse engineering, publishing on public marketplaces/app stores, or commercial usage of this source code and compiled binaries is strictly prohibited.
