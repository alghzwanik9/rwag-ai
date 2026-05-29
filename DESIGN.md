---
name: Atelier Digital
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#040505'
  on-primary: '#ffffff'
  primary-container: '#1e1e1e'
  on-primary-container: '#878585'
  inverse-primary: '#c8c6c5'
  secondary: '#0060ac'
  on-secondary: '#ffffff'
  secondary-container: '#68abff'
  on-secondary-container: '#003e73'
  tertiary: '#030607'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1f21'
  on-tertiary-container: '#838689'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1b1b1c'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#a4c9ff'
  on-secondary-fixed: '#001c39'
  on-secondary-fixed-variant: '#004883'
  tertiary-fixed: '#e0e3e6'
  tertiary-fixed-dim: '#c4c7ca'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#44474a'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: IBM Plex Sans
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 280px
  toolbar-width: 64px
  container-padding: 32px
  gutter: 24px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

The design system is engineered for a sophisticated Interior Design Assistant dashboard, balancing the gravity of professional architectural tools with the creative fluidity of an interior design studio. The brand personality is authoritative yet assistive, providing a "calm tech" environment that stays out of the way of high-resolution imagery and spatial planning.

The style is **Modern Corporate Minimalism** with a focus on high-contrast structural zones. It utilizes a dual-personality layout: a high-density, dark command center (sidebar) paired with an expansive, light, and airy canvas. The UI evokes a sense of organized precision and premium craftsmanship, utilizing subtle depth and a refined color story to guide the user through complex AI-driven workflows.

## Colors

The palette is bifurcated to define functional zones:

- **Surface Primary (Dark):** #1E1E1E is reserved for the sidebar and global navigation, creating a focused "cockpit" feel.
- **Surface Secondary (Light):** #F5F7FA serves as the main canvas background, mimicking a clean drafting table or a bright engineering office.
- **Action Accent:** #4A90E2 is used sparingly for primary actions, active states, and AI-related highlights to maintain professional composure.
- **Structural Neutral:** #E0E0E0 is used for thin, purposeful borders that define the grid without adding visual weight.
- **Warm Accent (Instructional):** While not a primary token, wood-inspired warm neutrals should be used in specific iconography or status indicators to soften the technical aesthetic.

## Typography

The design system utilizes **IBM Plex Sans** for its structured, technical character and excellent legibility in right-to-left (RTL) Arabic contexts. The typography hierarchy is designed to support data-heavy dashboards while maintaining an editorial feel.

- **Headlines:** Medium to Bold weights are used to anchor sections.
- **Body:** Regular weights with generous line-height (1.6) ensure readability for design descriptions and AI-generated suggestions.
- **Labels:** Used for the dark sidebar and floating toolbar, prioritizing clarity at smaller sizes.
- **RTL Considerations:** Alignment is strictly right-justified. Font weight is slightly increased for Arabic scripts to maintain visual parity with Latin counterparts.

## Layout & Spacing

This design system employs a **Fixed Sidebar/Fluid Canvas** model. The layout is structured around a 12-column grid within the main content area, with significant outer margins to emphasize the "airy" aesthetic.

- **The Sidebar:** A 280px fixed-width container on the right (for Arabic RTL) or left, providing the primary navigational anchor.
- **The Floating Toolbar:** A slim, 64px vertical strip positioned on the opposite side of the sidebar, containing high-frequency design tools.
- **Spacing Philosophy:** We use a base-8 scale. Large 32px paddings around the main workspace prevent the interface from feeling cluttered, even when multiple tool panels are open.
- **AI Prompt Placement:** The prompt input is anchored to the bottom-center of the viewport, styled as a floating island with 100% width up to a max-width of 800px.

## Elevation & Depth

Depth is used functionally rather than decoratively in this design system:

- **Flat Base:** The sidebar and main background are flat to represent the foundation of the application.
- **Tonal Layers:** The floating toolbar and AI prompt input use subtle, low-opacity shadows (6% Black, 12px blur) to appear "lifted" from the drafting canvas.
- **Glassmorphism:** For the floating toolbar only, a subtle backdrop-blur (10px) is applied to maintain a sense of context with the underlying design work while ensuring tool legibility.
- **Borders as Dividers:** We prefer #E0E0E0 thin borders over shadows for internal card structures to maintain the "engineering" aesthetic.

## Shapes

The shape language is **Soft (0.25rem - 0.75rem)**. This provides a professional, geometric look that is slightly modernized.

- **Interactive Elements:** Buttons and input fields use a 4px (0.25rem) radius for a sharp, architectural feel.
- **Containers:** Dashboard cards and the AI prompt input container use an 8px (0.5rem) radius to feel approachable.
- **Specialty Elements:** User avatars and specific circular toggles in the floating toolbar use a 50% (pill) radius to break the grid's rigidity.

## Components

### Sidebar (Dark)
The sidebar uses #1E1E1E with high-contrast white or light grey text. Navigation items feature a 2px vertical accent bar of #4A90E2 on the "leading" edge (right side for Arabic) when active.

### AI Prompt Input
The primary interaction point. It is a large, floating horizontal bar at the bottom of the screen. It features a #FFFFFF background, a #E0E0E0 border, and a prominent "Generate" button using the primary accent color.

### Floating Toolbar
A vertical stack of icon-only buttons. Icons are rendered in Dark Charcoal on a semi-translucent white background. On hover, the background shifts to a very light tint of the primary accent.

### Cards & Workspace
Cards are white with a 1px border (#E0E0E0). They should never use heavy shadows. Content inside cards follows a generous padding rule (24px) to ensure a "breathable" UI.

### Buttons
- **Primary:** Filled #1E1E1E or #4A90E2 with white text.
- **Secondary:** Ghost style with 1px #E0E0E0 border.
- **Tertiary:** Text-only for low-priority navigation.