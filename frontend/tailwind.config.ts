import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface": "#F5F7FA",
        "surface-dim": "#dadada",
        "surface-bright": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f4f3f3",
        "surface-container": "#eeeeee",
        "surface-container-high": "#e8e8e8",
        "surface-container-highest": "#e2e2e2",
        "on-surface": "#1E1E1E",
        "on-surface-variant": "#444748",
        "inverse-surface": "#2f3131",
        "inverse-on-surface": "#f1f1f1",
        "outline": "#747878",
        "outline-variant": "#E0E0E0",
        "surface-tint": "#5f5e5e",
        "primary": "#1E1E1E",
        "on-primary": "#ffffff",
        "primary-container": "#1E1E1E",
        "on-primary-container": "#E0E0E0",
        "inverse-primary": "#c8c6c5",
        "secondary": "#4A90E2",
        "on-secondary": "#ffffff",
        "secondary-container": "#e8f1fa",
        "on-secondary-container": "#4A90E2",
        "tertiary": "#030607",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#1b1f21",
        "on-tertiary-container": "#838689",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "background": "#F5F7FA",
        "on-background": "#1E1E1E",
        "primary-fixed": "#e5e2e1",
        "primary-fixed-dim": "#c8c6c5",
        "on-primary-fixed": "#1b1b1c",
        "on-primary-fixed-variant": "#474746",
        "secondary-fixed": "#d4e3ff",
        "secondary-fixed-dim": "#a4c9ff",
        "on-secondary-fixed": "#001c39",
        "on-secondary-fixed-variant": "#004883",
        "tertiary-fixed": "#e0e3e6",
        "tertiary-fixed-dim": "#c4c7ca",
        "on-tertiary-fixed": "#191c1e",
        "on-tertiary-fixed-variant": "#44474a"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "sidebar-width": "280px",
        "stack-md": "16px",
        "stack-lg": "24px",
        "container-padding": "32px",
        "toolbar-width": "64px",
        "gutter": "24px",
        "stack-sm": "8px",
        "toolbar-height": "64px"
      },
      fontFamily: {
        "body-md": ["IBM Plex Sans", "sans-serif"],
        "label-md": ["IBM Plex Sans", "sans-serif"],
        "label-sm": ["IBM Plex Sans", "sans-serif"],
        "body-lg": ["IBM Plex Sans", "sans-serif"],
        "headline-md": ["IBM Plex Sans", "sans-serif"],
        "headline-lg": ["IBM Plex Sans", "sans-serif"],
        "display-lg": ["IBM Plex Sans", "sans-serif"]
      },
      fontSize: {
        "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
        "label-md": ["14px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "500"}],
        "label-sm": ["12px", {"lineHeight": "1.2", "fontWeight": "600"}],
        "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}],
        "headline-md": ["24px", {"lineHeight": "1.4", "fontWeight": "500"}],
        "headline-lg": ["32px", {"lineHeight": "1.3", "fontWeight": "600"}],
        "display-lg": ["48px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600"}]
      }
    },
  },
  plugins: [
    forms,
    containerQueries
  ],
};
export default config;
