# Task List: SeVee Designs E-Commerce & Admin Portal

## 1. Database Setup
- `[x]` Create `sevee_designs` database locally on PostgreSQL
- `[x]` Write and execute `schema.sql` (types, tables, indexes, triggers)
- `[x]` Write and execute `seed.sql` (initial categories, products, delivery zones, FAQs, blogs)

## 2. Backend Server (`/server`)
- `[x]` Initialize server structure (`package.json`, `tsconfig.json`)
- `[x]` Implement db connection pool (`db.ts`)
- `[x]` Implement Auth routes (register, login, user context, bcrypt, JWT)
- `[x]` Implement Products routes (CRUD + local file uploads via `multer`)
- `[x]` Implement Orders & Paystack checkout routes (order creation, verification, webhook, stock decrement RPC)
- `[x]` Implement Content routes (coupons, FAQs, blogs, contact, delivery zones)
- `[x]` Implement Cron job for weekly AR reports (`node-cron` + `resend`)
- `[x]` Implement main Express entry point (`index.ts`)

## 3. Frontend Client (`/`)
- `[x]` Initialize Vite + React + TS project
- `[x]` Configure Tailwind CSS v4 and Google Fonts (`index.css` setup)
- `[x]` Create API bridge client (`client.ts`)
- `[x]` Create Auth & Cart Contexts (with local storage caching)
- `[x]` Build layout components (Header, Announcement Bar, Footer, layouts)
- `[x]` Build Storefront views (Home, Shop, Product Details with 3D/AR model viewer, Cart, Checkout, Verify Payment redirect)
- `[x]` Build Admin views (Dashboard stats, Products table, Form Page with specs builder, Orders list, Coupons management)
- `[x]` Build Salesperson views (Orders status stepper, Reports charts)
- `[x]` Configure Routing & guards in `App.tsx`

## 4. Verification & Testing
- `[x]` Test db connection & query endpoints
- `[x]` Validate design system styling (typography, sharp borders, off-white theme, dark theme toggling)
- `[x]` Test customer flow (auth → cart → checkout → Paystack verification → stock decrement)
- `[x]` Create walkthrough report with screenshots/logs
