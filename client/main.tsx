import { Meteor } from "meteor/meteor";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "/imports/ui/App";

import "./main.css";

Meteor.startup(() => {
  const container = document.getElementById("react-target");

  if (!container) {
    console.error("❌ Cannot find #react-target in index.html");
    return;
  }

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
