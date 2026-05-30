# Metroway - AI Handoff Documentation

This document serves as a comprehensive guide to the **Metroway** (Delhi Metro App) codebase. It is designed to quickly onboard future AI assistants with the tech stack, project structure, and recent architectural changes.

## 🛠 Tech Stack
- **Framework:** React Native (Expo)
- **Language:** TypeScript
- **State Management:** Zustand (`useMetroStore`)
- **Map Engine:** Leaflet (injected via `react-native-webview`) with custom Voyager dark-mode tiles.
- **Animations:** React Native `Animated` & `PanResponder` (for physics-based UI components).
- **Styling:** Custom StyleSheet (No external UI libraries like NativeBase or Paper).
- **Hardware Integration:** Expo Haptics (for tactile feedback), React Native Vibration (for geofenced alerts).

## 📂 Key File Structure
```
mobile/
├── src/
│   ├── app/
│   │   ├── index.tsx       # Home/Planner Screen (Contains the Draggable Bottom Sheet & Timeline)
│   │   ├── map.tsx         # Interactive Map Screen (Contains WebView & Location Logic)
│   │   ├── settings.tsx    # App settings & preferences
│   │   └── _layout.tsx     # Expo Router layout & navigation setup
│   ├── store/
│   │   └── useMetroStore.ts# Central Zustand store (Stations, Edges, Route Calculation)
│   ├── data/
│   │   └── metroData.js    # Graph database (Stations, coordinates, connection edges)
│   ├── utils/
│   │   └── mapHtml.ts      # Generates the Leaflet HTML string injected into the WebView
│   └── constants/
│       └── theme.ts        # Color palettes and dark mode configurations
```

## 🧠 Core Systems & Recent Upgrades

### 1. Interactive Map & Geofencing (`map.tsx`)
- **Architecture:** The map uses a WebView running Leaflet. Native code communicates with the WebView via `postMessage`.
- **Offline Maps:** Map tiles are filtered via CSS (`filter: invert(95%) hue-rotate(180deg)`) to create a high-contrast, premium dark mode without relying on external dark-matter APIs.
- **Nearest Station UI:** The app detects the user's live GPS coordinates. When no route is active, a banner appears showing the nearest station with **"Set Start"** and **"Set End"** action buttons, directly manipulating the `useMetroStore`.
- **Haptic Alerts:** When riding the metro, geofencing triggers a heartbeat vibration pattern 10 seconds before arriving at interchange or destination stations.

### 2. Draggable Bottom Sheet (`index.tsx`)
- **Architecture:** Instead of using heavy dependencies like `@gorhom/bottom-sheet`, the app uses a custom, highly performant `Animated.View` combined with `PanResponder`.
- **Behavior:** The route timeline, fares, and exits are housed within this sheet. Users can swipe up on the pill handle to snap the sheet to full-screen height (`Dimensions.get('window').height`), or swipe down to collapse it back to half-screen.
- **Constraints:** The sheet bypasses flex-crushing by specifically avoiding `flex: 1` on its outermost container, ensuring it renders fully beyond the screen boundaries.

### 3. Transit Graph (`metroData.js`)
- The graph handles routing using a custom shortest-path algorithm.
- **Recent Additions:** Sahibabad RRTS station and the Vaishali Blue Line branch were manually injected into the edge graph to ensure accurate offline routing.

## 🚀 Next Steps for AI
- When modifying the UI, prioritize native `Animated` over adding new dependencies.
- Modifications to the transit network require updating both `stations` and `edges` in `metroData.js`.
- Always check `mapHtml.ts` if Leaflet rendering issues occur.
