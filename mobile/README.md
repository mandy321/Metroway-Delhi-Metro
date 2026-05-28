# Metroway Delhi Metro 🚇 (Mobile App)

This is the native mobile version of the Metroway Delhi Metro application. Built using React Native, Expo Router, and TypeScript, it is optimized for mobile performance, touch interactions, gestures, and offline reliability.

---

## 🌟 Key Mobile Features

1. **Native Offline Maps**:
   - Integrated with `react-native-maps` for high-performance vector rendering.
   - Customized map routes using high-contrast thick lines with deep black borders to ensure readability.
   - Dynamic map zoom and bounds framing to automatically scale the active journey.

2. **Tabbed Journey Planner**:
   - **Timeline**: Beautiful vertical list indicating station stops, colored line transitions, platform allocation numbers, transfers, walking times, and exit suggestions.
   - **Fare Breakdown**: Displays Token fares vs. Metro Smart Card discounted pricing, calculating the exact amount saved.
   - **Exit Recommender**: Highlights recommended station exit gates for transfers, accessible routes, and nearby lighting/facilities.
   - **Facility Status / Outages**: Displays lift, escalator, and service statuses. Includes a form to report live crowd congestion updates.

3. **Station Explorer**:
   - Detailed listings of all Metro stations on the network.
   - Direct exit gate guides showing key streets, landmarks, and available accessibility equipment (e.g., Elevators, Escalators, Tactile paths, Wheelchair ramps).

---

## 🛠️ Development & Building

### Prerequisites
Make sure you have Node.js (v18+) and npm installed.

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Expo Development Server
```bash
npx expo start
```
Use the Expo Go application or simulator to test during development.

### 3. Build the Release APK (Android) locally
We compile the release binary directly via Gradle wrapper.

```bash
cd android
chmod +x gradlew
./gradlew assembleRelease
```

The output APK will be generated at:
`android/app/build/outputs/apk/release/app-release.apk`

---

## 🛡️ License & Copyright
Copyright © 2026 Metroway (Mandeep). All rights reserved.

This software, source code, design, icons, and final compiled binaries are proprietary and confidential. Unauthorized duplication, modification, distribution, or uploading to public marketplaces/app stores is strictly prohibited.
