import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installMockApi } from "./lib/mockApi";

installMockApi();

createRoot(document.getElementById("root")!).render(<App />);
