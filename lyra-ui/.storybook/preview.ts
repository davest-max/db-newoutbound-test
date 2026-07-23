import type { Preview, Decorator } from "@storybook/react";
import React from "react";
import "../src/storybook.css";

/* ── Global dark mode toggle ──
   Sets data-theme on the preview iframe's <html> element — the same
   mechanism every component in this library (and the templates app) already
   reads via `document.documentElement.getAttribute("data-theme")` /
   `setAttribute("data-theme", ...)`. Also syncs the canvas background to the
   current --lyra-color-bg-surface-shell value so the story canvas itself
   isn't left on a stark white/dark mismatch.

   Note: this runs the DOM mutation directly in the decorator body (not in a
   useEffect). Storybook invokes decorators as plain functions, not as
   properly-mounted React components, so hooks called directly inside a
   decorator aren't guaranteed to fire/re-fire correctly across toolbar
   changes. A synchronous side effect here is the reliable pattern — it reruns
   every time the toolbar global changes and Storybook re-invokes decorators,
   with no dependency on React's effect timing. */
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme ?? "light";

  document.documentElement.setAttribute("data-theme", theme);
  const shellColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--lyra-color-bg-surface-shell")
    .trim();
  if (shellColor) {
    document.body.style.backgroundColor = shellColor;
  }

  return React.createElement(Story);
};

const preview: Preview = {
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global theme for all components",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
  parameters: {
    options: {
      storySort: {
        method: "alphabetical",
        // "Templates" subgroups are listed explicitly because plain
        // alphabetical order would put "Dashboards" *before* "Data
        // Management" ("Das" < "Dat") — the opposite of where it belongs
        // (right below Data Management). Any Templates entry not listed
        // here still falls back to alphabetical, same as before.
        order: [
          "Foundations", ["Colors", "Typography", "Spacing", "Border Radius", "Shadows"],
          "Atoms",
          "UI",
          "Templates", ["Admin UIs", "Agent Next Gen", "Data Management", "Dashboards"],
        ],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "lyra-base",
      values: [
        { name: "lyra-base", value: "#ffffff" },
        { name: "lyra-shell", value: "#f3f5f6" },
        { name: "dark", value: "#1a2733" },
      ],
    },
  },
};

export default preview;
