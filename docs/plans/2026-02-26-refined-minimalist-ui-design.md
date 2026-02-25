# Refined Minimalist UI Design for KeepFit

**Date:** 2026-02-26
**Topic:** Home Record Stream UI Refinement

## 1. Overview
The goal is to transform the "KeepFit" homepage into a professional, premium-feeling health dashboard using a "Refined Minimalist" aesthetic. This design prioritizes clarity, data hierarchy, and a soft, native-app-like experience.

## 2. Visual Architecture
### 2.1 Card System
- **Unified Cards**: All content blocks will transition to a consistent `bg-white`, `rounded-2xl` (16px), and `shadow-xs` / `border-zinc-200/50` style.
- **Section Spacing**: Increased vertical gap (`space-y-6`) between major functional blocks to reduce visual clutter.
- **Background**: Page background will use a dedicated `bg-zinc-50` to provide enough contrast for the white cards to "pop."

### 2.2 Typography & Data Hierarchy
- **Data over Labels**: Actual values (e.g., calories consumed) will be larger and bolder (`text-zinc-900`, `font-semibold`).
- **Muted Supporting Text**: Targets and units (`kcal`, `克`) will use `text-zinc-400` with a smaller font size (`text-xs` or `text-sm`).
- **Standardized Headers**: Section titles (Breakfast, Water, etc.) will use consistent `text-lg` or `text-xl` semi-bold weights with `text-zinc-800`.

### 2.3 Color Refresh
- **Soft Accents**: Use highly saturated but light-background colors for indicators.
- **Macro Progress**:
    - Protein: `bg-sky-400`
    - Fat: `bg-rose-400`
    - Carbs: `bg-amber-400`
- **Action Buttons**: Primary actions (e.g., "Save") use `bg-zinc-900 text-white` for a high-end look, or a specific brand blue (`blue-500`).

## 3. Component Breakdown
### 3.1 Date Selector
- Refine the weekly calendar to look more integrated.
- Active day: Circular background with a soft shadow.
- Today indicator: Small dot or subtle underline.

### 3.2 Calorie & Progress Summary
- Reposition elements to ensure the "Calorie Ring" is the focal point.
- Consumed vs. Burned values will be balanced with clearer labels.

### 3.3 Meal Cards
- Food items will look more like a "listing" within the card.
- Calorie values for individual items will be moved to the right with a more subtle presentation.
- Slide-to-action or hidden edit buttons to keep the default view clean.

### 3.4 Media (Daily Photo)
- The body photo section will have a more premium "frame" and clear status indicators (Uploaded vs. Pending).

## 4. Implementation Strategy
1.  Establish a `Card` component to unify layouts.
2.  Update global Tailwind styles/constants for the new palette.
3.  Refactor `src/app/page.tsx` to use the new components and spacing.
4.  Verify responsiveness on mobile viewports.
