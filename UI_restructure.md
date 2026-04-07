# MessMate UI Restructure Implementation Plan & Super Prompt

*This document serves as our definitive master-plan and "super prompt" to govern the UI regeneration of the MessMate application. Provide the text below to your AI assistant (e.g., Antigravity) along with your visual references when you are ready to begin execution.*

---

## 🤖 SUPER PROMPT FOR AI CODING ASSISTANT

**Act as an expert UX/UI Designer and Senior Next.js/Tailwind Developer.** Your task is to completely restructure and implement the frontend UI for the **MessMate** project (a Next.js 14 App Router application) based on the comprehensive plan defined below and the reference designs I will provide at the end of this prompt.

### 📋 PROJECT CONTEXT & STRICT RULES
- **Tech Stack:** Next.js (App Router), React 19, Tailwind CSS, Framer Motion, Shadcn UI.
- **Rule 1 (ABSOLUTE NO BLUE):** Under no circumstances should the color blue (in any shade, including navy, sky, indigo, or royal) be used for backgrounds, text, borders, buttons, or charts. Search and replace all existing blue hex/hsl/oklch values.
- **Rule 2 (SOFT COLORS ONLY):** Use soft, pastel, and muted tones. Fastidious avoidance of harsh, neon, or hyper-saturated generic colors. The UI must invoke a premium, cohesive, and modern feel using smooth gradients, glassmorphism, and soft shadows.
- **Rule 3 (PRESERVE FUNCTIONALITY):** Do not alter the underlying business logic, API structure, or database integrations. You are strictly updating the presentation layer.

### 🧩 UNIFIED LAYOUT ARCHITECTURE
Currently, the application lacks visual consistency and relies on dull formatting with an outdated Navbar. We will unify the structure across all 3 distinct user roles (Consumer, Owner, Admin) via the following:
1. **Responsive Sidebar Navigation:** Replace all top-level Navbars with a responsive Sidebar layout. 
    - **Desktop:** Fixed left sidebar containing navigation links, user profile snippet, and role-specific branding. Main content area sits to the right.
    - **Mobile/Tablet:** A collapsible bottom-sheet or hidden hamburger-menu (drawer) to ensure perfect usability on smaller devices.
2. **Standardized Page Wrappers:** Every main content area should have a consistent top-header (displaying page title & breadcrumbs) and a soft-card layout for the main data views.
3. **Typography & Spacing:** Use modern sans-serif fonts (e.g., Inter, Outfit) with plenty of whitespace. Ensure interactive elements are touch-friendly (min 44x44px).

### 🎨 ROLE-SPECIFIC THEMES & COLOR COMBINATIONS
The app serves three different actors. Each dashboard must use the exact same layout structure but distinguish itself through its unique, heavily curated soft-color theme that evokes specific psychological traits. 

#### 1. Consumer Side (Goal: "Foody" & Appetizing)
The consumer interface is driven by appetite and excitement. 
* **Vibe:** Warm, inviting, and deliciously modern.
* **Primary Tones:** Soft Oranges, Peaches, and Muted Yellows. 
* **Color Palette (oklch approximations for `globals.css`):**
  * `Primary`: Warm Coral / Soft Tangerine (e.g., `bg-orange-400/90`)
  * `Secondary/Accent`: Muted Amber or Peach
  * `Background`: Warm tinted off-white (e.g., `#FFFBF7`)
  * `Dark Mode`: Deep warm charcoal with vibrant orange accents.

#### 2. Owner Side (Goal: Trustworthy & Reliable)
The mess owner needs to feel secure, as they are managing inventory, bookings, and payments.
* **Vibe:** Professional, stable, and earthy.
* **Primary Tones:** Soft Greens, Sage, and Muted Emerald.
* **Color Palette (oklch approximations for `globals.css`):**
  * `Primary`: Sage Green / Forest Mist (e.g., `bg-teal-600` or `emerald-500` avoiding blue hues)
  * `Secondary/Accent`: Pale Mint or Olive.
  * `Background`: Cool earthy off-white (e.g., `#F4F7F4`)
  * `Dark Mode`: Deep pine/ebony base with serene green accents.

#### 3. Admin Side (Goal: Calm & Central Controller)
The admin handles overarching operations and needs a dashboard that minimizes cognitive load.
* **Vibe:** Neutral, authoritative, and focused.
* **Primary Tones:** Warm Grays, Muted Teal (green-leaning), Slate, and Taupe.
* **Color Palette (oklch approximations for `globals.css`):**
  * `Primary`: Deep Charcoal / Warm Slate (e.g., `bg-stone-700`)
  * `Secondary/Accent`: Soft Greige (Grey-Beige) or muted Teal.
  * `Background`: Neutral light gray (e.g., `#F8F9FA`)
  * `Dark Mode`: True black/dark-slate with muted monochromatic accents.

### 🛠️ EXECUTION STEPS
When I instruct you to execute, follow these steps sequentially:
1. **Refactor `globals.css`:** Update CSS variables to support the 3 different themes using CSS classes (e.g., `.theme-consumer`, `.theme-owner`, `.theme-admin`). Ensure all blue defaults (especially in Shadcn charts and rings) are erased.
2. **Build `SidebarLayout` Component:** Create a universal, responsive layout component (`app/components/layout/SidebarLayout.tsx`) utilizing Framer Motion for slide-out animations on mobile.
3. **Apply Layouts Route by Route:** Wrap `app/consumer/layout.tsx`, `app/admin/layout.tsx`, and `app/owner/layout.tsx` precisely with the new `SidebarLayout` component, passing down the respective role and theme configuration.
4. **Refine Global Components:** Standardize cards, buttons, and inputs across the app to use soft rounded corners (`radius: 0.75rem` or higher) and soft shadows (`shadow-sm` and `shadow-md` with low opacity).



---
