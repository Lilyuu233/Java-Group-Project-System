import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppEntry from "./AppEntry";

const root = createRoot(document.getElementById("root"));
root.render(
    <StrictMode>
        <AppEntry />
    </StrictMode>
);
