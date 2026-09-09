import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { App } from "./App";

const storedTheme = localStorage.getItem("bis_theme");
document.documentElement.dataset.theme = storedTheme === "orange" || storedTheme === "dark" ? storedTheme : "light";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}