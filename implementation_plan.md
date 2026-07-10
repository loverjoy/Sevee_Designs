# Implementation Plan - SeVee Designs E-Commerce & Admin Portal

This plan outlines the architecture, styling integration, and component definitions to establish the design system ("staining plan") for SeVee Designs. The goal is to set up a brand-new Vite + React + Tailwind CSS project, establish the typography (Playfair Display & Inter) and color variables (sharp corners, off-white background, deep charcoal primary tones), build the storefront and admin portal layouts, and integrate the component styles.

## User Review Required

> [!IMPORTANT]
> Since we are starting with an empty directory, we will initialize a **Vite + React + TypeScript** project. We will configure Tailwind CSS for utility classes and custom styling rules (fluid container queries) as requested.
> 
> The design system specifies sharp corners (`--radius: 0rem`) and a warm off-white and charcoal aesthetic. All buttons, cards, popovers, and containers will follow these specifications.

## Open Questions

> [!IMPORTANT]
> 1. **Tailwind CSS Version**: Do you have a preferred version of Tailwind CSS? We recommend **Tailwind CSS v4** (using the new CSS-first configuration) or **v3** (with `tailwind.config.js`). We will default to Tailwind CSS v4 as it aligns nicely with CSS variables.
> 2. **Supabase & Paystack API Credentials**: Should we proceed with setting up a mock service provider for Supabase Auth/Database and Paystack payments first so the application runs out-of-the-box locally, or do you want to provide credentials now to write the real integrations?
> 3. **Page Scope**: We plan to implement:
>    - **E-commerce Storefront**: Hero banner, product listing, product detail modal, shopping cart, and a simulated Paystack checkout flow.
>    - **Admin Portal**: Product management catalog (CRUD forms), order tracking list, and a simple dashboard analytics widget (showing mock revenue and PG-cron job reports).
>    Does this scope match your expectations?

---

## Proposed Changes

### 1. Project Initialization & Dependencies
Initialize the project structure using Vite.

#### [NEW] [package.json](file:///d:/antigravity_opencode/SeVee_Design/package.json)
Configure project scripts, React, Tailwind CSS, Lucide icons (for UI elements), and `@tailwindcss/container-queries`.

---

### 2. Styling & Design System (The "Stain")

#### [NEW] [index.css](file:///d:/antigravity_opencode/SeVee_Design/src/index.css)
Inject Playfair Display (headings) and Inter (body) Google Fonts. Define the requested CSS variables in `:root` and optional `[data-theme="dark"]`. Set up base styles:
- Headings (`h1-h6`) using `Playfair Display` with `line-height: 1.25`.
- Body text using `Inter` with `font-size: 16px` and `line-height: 1.6`.
- Button, card, and popover component styles with sharp corners (`border-radius: 0`).

#### [NEW] [tailwind.config.js / vite.config.ts](file:///d:/antigravity_opencode/SeVee_Design/vite.config.ts)
Configure the bundler and tailwind integration, adding `@tailwindcss/container-queries`.

---

### 3. Application Components & Pages

#### [NEW] [App.tsx](file:///d:/antigravity_opencode/SeVee_Design/src/App.tsx)
The main application layout containing the routing/view toggle between the E-commerce Storefront and the Admin Portal.

#### [NEW] [Storefront.tsx](file:///d:/antigravity_opencode/SeVee_Design/src/components/Storefront.tsx)
E-commerce view including:
- Premium Hero section (utilizing Playfair Display and custom images).
- Product Grid displaying mock product cards with sharp borders.
- Shopping Cart drawer with item list and total price.
- Checkout popup integrating Paystack simulator.

#### [NEW] [AdminPortal.tsx](file:///d:/antigravity_opencode/SeVee_Design/src/components/AdminPortal.tsx)
Admin dashboard view including:
- Stats bar (e.g. Total Revenue, Total Orders, Cron Job status).
- Product management catalog list (Create/Edit forms adhering to sharp popover/card design).
- Order list showing customer details, status, and Accra/Ghana transaction indicators.

#### [NEW] [SupabaseMock.ts](file:///d:/antigravity_opencode/SeVee_Design/src/services/SupabaseMock.ts)
A mock client for Supabase database/auth and Paystack to run the demo locally without external credentials. It can be easily replaced with real `@supabase/supabase-js` calls.

---

## Verification Plan

### Automated Tests
We will verify configuration compilation using:
- `npm run build` to ensure TypeScript compilation and bundler assets build cleanly.

### Manual Verification
- Launch local development server (`npm run dev`) and test page layouts.
- Verify fonts are correctly loaded (headings = Playfair Display, body = Inter).
- Verify heading line-height is `1.25` and body line-height is `1.6`.
- Check light mode base styles and toggle dark mode (using `data-theme="dark"`) to verify the dark mode color scheme.
- Verify container queries work dynamically when resizing elements.
