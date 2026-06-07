import { createRoot } from "react-dom/client";
import App from "./App";
import { configureDesktopApi } from "./lib/desktop-api";
import "./index.css";

// On desktop, route API calls to the configured backend with bearer auth.
configureDesktopApi();

createRoot(document.getElementById("root")!).render(<App />);
