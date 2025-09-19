import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";   // 👈 dit is punt 1 — je styles binnenhalen

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
