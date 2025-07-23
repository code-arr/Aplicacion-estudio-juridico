import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppRoutes from "./routes/AppRoutes.tsx";
import { HashRouter } from "react-router-dom";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <Theme>
        <AppRoutes />
      </Theme>
    </HashRouter>
  </StrictMode>
);
