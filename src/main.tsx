import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import App from "./App.tsx";
import "./index.css";
import "./product-edition.css";

const reactDiagnosticsEnabled =
  import.meta.env.DEV && import.meta.env.VITE_DISABLE_REACT_DEVTOOLS !== "1" &&
  new URLSearchParams(window.location.search).has("diagnostics");

if (reactDiagnosticsEnabled) {
  void import("react-grab");
  void import("react-scan").then(({ scan }) => scan({ enabled: true }));
}

createRoot(document.getElementById("root")!).render(<App />);
