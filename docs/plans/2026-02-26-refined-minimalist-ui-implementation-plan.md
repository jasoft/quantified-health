# Refined Minimalist UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the KeepFit homepage into a premium, professional health dashboard with a clean visual hierarchy.

**Architecture:** We will implement a unified `Card` component for consistency and refactor the homepage (`src/app/page.tsx`) to use a more sophisticated typography and spacing system. We'll leverage Tailwind 4's modern features for subtle depth and high-end aesthetics.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Lucide React.

---

### Task 1: Setup Shared UI Components

**Files:**
- Create: `src/components/ui/Card.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create the unified Card component**
Create a reusable card that implements our "Refined Minimalist" style.

**Step 2: Create a Typography helper or constants**
Define the font size and color hierarchy to ensure consistent values across the app.

**Step 3: Commit**
`git add src/components/ui/Card.tsx`
`git commit -m "style: add unified Card component for minimalist UI"`

---

### Task 2: Header and Date Selector Refinement

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Refactor the Weekly Calendar**
Change the date buttons to use a more subtle "iOS-style" selection indicator (soft circular highlight with a tiny dot for today).

**Step 2: Update Header Spacing**
Increase the vertical padding and refine the chevron icons for a lighter touch.

**Step 3: Commit**
`git commit -am "style: refine header and weekly date selector"`

---

### Task 3: Summary Section & Calorie Ring

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/dashboard/CalorieRing.tsx`

**Step 1: Update CalorieRing aesthetics**
Soften the ring colors and adjust the center text to follow our new typography hierarchy (large bold value, small muted label).

**Step 2: Refine Macro Bars**
Use the new "Soft Accent" palette (Sky Blue, Rose, Amber) and ensure the labels are muted while the grams are clear.

**Step 3: Commit**
`git commit -am "style: update calorie ring and macro progress bars"`

---

### Task 4: Meal Record "Stream" Refactoring

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Refactor Meal Cards**
Apply the new `Card` component to each meal section. Move the "Consumed X / Y kcal" text to a separate line or a more integrated position in the header.

**Step 2: Sub-item Styling**
Standardize the layout of food items: `Name` (bold), `Amount` (muted) on the left; `Calories` (bold) on the right. Remove heavy borders between items, using whitespace instead.

**Step 3: Commit**
`git commit -am "style: refactor meal record sections into minimalist cards"`

---

### Task 5: Media & Water Sections

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/dashboard/WaterTracker.tsx`

**Step 1: Body Photo Card**
Update the photo frame to match the card style and refine the "Upload/Remove" buttons to be less intrusive.

**Step 2: Water Tracker Finishing touches**
Ensure the water intake UI matches the rest of the minimalist aesthetic.

**Step 3: Final Verification**
Run Playwright tests to ensure no UI breaks occurred during refactoring.
Run: `npx playwright test tests/mvp-docs.spec.ts`

**Step 4: Final Commit**
`git commit -am "style: complete homepage UI refinement"`
