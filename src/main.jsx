import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// Essential styles for Leaflet map tiles
import "leaflet/dist/leaflet.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register manual custom service worker for PWA offline-first support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log("Service Worker registered successfully with scope: ", registration.scope);
      })
      .catch((error) => {
        console.error("Service Worker registration failed: ", error);
      });
  });
}
