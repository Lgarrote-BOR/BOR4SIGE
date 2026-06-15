---
name: Standardized Enterprise Core
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#191c1e'
  on-tertiary-container: '#818486'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
  max-width: 1440px
---

## Brand & Style

The design system is engineered for high-stakes compliance and enterprise governance. The brand personality is **authoritative, meticulous, and resilient**, designed to instill a sense of absolute control and security for Quality Managers and Compliance Officers.

The visual style is **Corporate Modern with a Functionalist edge**. It prioritizes information density and clarity over decorative elements. By utilizing a "Systematic Clarity" approach, the UI minimizes cognitive load through rigorous alignment, ample negative space within data-heavy views, and a disciplined use of color that reserves high-saturation tones exclusively for semantic signaling (status and urgency). The emotional response should be one of "calm efficiency"—the user should feel that the system is an unbreakable ledger of truth.

## Colors

This design system utilizes a **Hierarchical Blue Palette** to establish professional trust. 
- **Primary (#0F172A):** A deep Slate-Navy used for high-level navigation, headers, and core brand elements to provide a grounded, "stable" foundation.
- **Secondary (#2563EB):** A vivid Corporate Blue used for primary actions, active states, and focus indicators.
- **Surface & Backgrounds:** The system uses a range of cool grays (`#F8FAFC` to `#E2E8F0`) to differentiate content zones without the harshness of pure white.

**Compliance Signaling:**
Semantic colors are strictly regulated. **Success (Green)** indicates full compliance/ISO certification; **Warning (Amber)** indicates upcoming audits or minor non-conformities; **Error (Red)** is reserved for expired certifications, critical security breaches, or ENS non-compliance.

## Typography

The system relies on **Inter** for its exceptional legibility in data-dense environments. The typographic scale is optimized for high information density.

- **Headlines:** Use semi-bold weights with slight negative letter-spacing to maintain a compact, "fixed" look.
- **Body:** The default size is 14px (`body-md`), providing a balance between readability and the need to display complex ISO documentation.
- **Labels:** Uppercase 12px labels are used for metadata, table headers, and section categorizations to provide a clear visual distinction from editable content.
- **Monospaced:** JetBrains Mono is introduced specifically for technical identifiers, such as ENS control IDs or document revision hashes.

## Layout & Spacing

This design system follows a **Fixed-Fluid Hybrid Grid** based on an 8px base unit (with 4px sub-increments for tight UI elements).

- **Desktop:** A 12-column grid with a max-width of 1440px. Use a fixed 240px left-hand navigation rail for multi-tenancy switching and environment selection.
- **Content Areas:** Dashboard widgets (KPIs) should span 3 or 4 columns. Complex document lists should span the full 12 columns to accommodate multiple metadata columns (Owner, Version, Status, Last Audit).
- **Density:** Provide a "Compact" mode for power users, reducing the `md` spacing to 12px to allow more table rows to be visible above the fold.

## Elevation & Depth

To maintain a professional and clean aesthetic, this design system avoids heavy shadows, instead using **Tonal Layering and Low-Contrast Outlines**.

- **Level 0 (Base):** Background color `#F8FAFC`.
- **Level 1 (Cards/Tables):** White background with a 1px solid border in `#E2E8F0`. No shadow. This is the primary container for ISO controls and document lists.
- **Level 2 (Hover/Active):** White background with a very soft, diffused shadow (0px 4px 12px rgba(15, 23, 42, 0.05)).
- **Level 3 (Modals/Popovers):** White background with a more pronounced shadow (0px 10px 25px rgba(15, 23, 42, 0.1)) and a 1px border.

Depth is primarily communicated through the layering of surfaces; as an element "rises," it gains a subtle shadow but maintains its crisp border to ensure it doesn't look "fuzzy" or unprofessional.

## Shapes

The shape language is **Soft (0.25rem)**. This provides a modern touch while maintaining the structural rigidity expected of a management system.

- **Standard Elements:** Inputs, buttons, and checkboxes use `rounded` (4px).
- **Cards & Containers:** Use `rounded-lg` (8px) to define major sections of the interface.
- **Status Badges:** Use a fully rounded pill shape to distinguish them from interactive buttons.
- **Selection States:** Use a vertical 4px "accent bar" on the left side of active navigation items or table rows to denote focus without relying solely on color fills.

## Components

**Buttons:**
- **Primary:** Solid `#2563EB` with white text. 
- **Secondary:** White background with `#E2E8F0` border and `#0F172A` text.
- **States:** Hover states should darken the background by 10%.

**Status Badges:**
Small, high-contrast pills. For example, "Compliant" is a light green background with dark green text. This "Subtle Fill" approach ensures the badge is readable but doesn't distract from the main data.

**Document Lists:**
Use a structured table component with fixed-width columns for "Status" and "ID", and flexible widths for "Document Name". Row striping (Zebra) is encouraged for long lists of ISO controls.

**KPI Cards:**
Top-level metrics (e.g., "% Compliance Progress") should be displayed in cards with a `headline-sm` value and a `label-md` description. Include a small sparkline or progress bar in the secondary color to show trends over time.

**Multi-tenancy Environment Switcher:**
A distinct, high-contrast component located at the top of the sidebar. It must clearly display the current "Environment" (e.g., Production vs. Sandbox) to prevent accidental data entry in the wrong environment. Use a specific color-coded border (e.g., Red for Production) if necessary.