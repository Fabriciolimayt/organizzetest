import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const reactDiagnosticsEnabled =
  import.meta.env.DEV && import.meta.env.VITE_DISABLE_REACT_DEVTOOLS !== "1";

if (reactDiagnosticsEnabled) {
  void import("react-grab");
  void import("react-scan").then(({ scan }) => scan({ enabled: true }));
}

createRoot(document.getElementById("root")!).render(<App />);
