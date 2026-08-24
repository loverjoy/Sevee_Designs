# Critical Analysis: SeVee Designs

**Date:** July 19, 2026
**Overall Score:** NEEDS WORK — Several critical issues before production readiness

---

## CRITICAL (Fix Immediately)

| # | Issue | Location |
|---|-------|----------|
| 1 | **Stripe env var mismatch** — `STRIPE_KEY` in `Sevee_Designs1.env` but code reads `STRIPE_SECRET_KEY`. Stripe payments are **broken in production**. | `server/Sevee_Designs1.env` |
| 2 | **Secrets file committed to git** — `server/Sevee_Designs1.env` contains real production keys (Paystack, Resend, JWT, DB password) and is NOT in `.gitignore`. | `server/Sevee_Designs1.env` |
| 3 | **Hardcoded fallback JWT secret** — If env var is missing, JWTs are signed with `sevee_secret_key_2026`. Any attacker can forge admin tokens. | `server/src/routes/auth.ts:8` |
| 4 | **Webhook signature bypass** — When mock Paystack key is used, webhook verification is skipped entirely. Orders can be confirmed for free. | `server/src/routes/orders.ts:825` |
| 5 | **Exposed Google Maps API key** in frontend bundle (`.env.local` → `VITE_GOOGLE_MAPS_KEY`). | `src/pages/ContactPage.tsx:47` |

---

## HIGH (Fix Soon)

| # | Issue | Location |
|---|-------|----------|
| 6 | **No rate limiting** on login, register, checkout, or contact endpoints. Only chat has rate limiting. | `server/src/routes/auth.ts`, `orders.ts` |
| 7 | **Admin product bypass** — Anyone can append `?isAdminView=true` to see inactive/hidden products without auth. | `server/src/routes/products.ts:61` |
| 8 | **No code splitting** — All admin/salesperson pages are bundled with the storefront. Users download ~200KB+ of unused code. | `src/App.tsx:18-43` |
| 9 | **DB connection pool max: 1** — Only one database connection at a time. Severe bottleneck under load. | `server/src/db.ts:8` |
| 10 | **Missing `GOOGLE_CLIENT_ID`** in production env. Google OAuth returns 500. | `server/Sevee_Designs1.env` |
| 11 | **No input validation library** — No email format, password strength, or type checking on any endpoint. | All routes |
| 12 | **Public order tracking leaks data** — No auth required. Customer names, totals, addresses exposed. | `server/src/routes/orders.ts:1002` |
| 13 | **JWT has no revocation** — Demoted admin keeps admin access for up to 7 days. | `server/src/routes/auth.ts:101-104` |

---

## MEDIUM

| # | Issue | Location |
|---|-------|----------|
| 14 | **Stored XSS in emails** — User-controlled names interpolated into HTML email templates without escaping. | `server/src/routes/orders.ts:69-111` |
| 15 | **Error messages leak internals** — SQL errors, stack traces returned to clients. | `server/src/routes/auth.ts:113-116` |
| 16 | **No `helmet` middleware** — Missing HSTS, X-Frame-Options, CSP headers on backend. | `server/src/index.ts` |
| 17 | **Stale exchange rates** — Currency rates hardcoded, never fetched from API. | `src/contexts/CartContext.tsx:45-50` |
| 18 | **Mock data in reports** — Charts show `Math.random()` data on every page load. | `src/pages/admin/AdminReportsPage.tsx:52-63` |
| 19 | **Address constants duplicated** — Same 200-line arrays in CheckoutPage and DashboardPage. | `CheckoutPage.tsx:12-66`, `DashboardPage.tsx:11-66` |
| 20 | **Render `ADMIN_EMAIL` missing** from `render.yaml` declaration. | `render.yaml` |
| 21 | **`server/.env.example` wrong port** — Shows 6543, should be 5432 per docs. | `server/.env.example` |

---

## LOW

| # | Issue | Location |
|---|-------|----------|
| 22 | AuthContext provider value not memoized (unnecessary re-renders) | `src/contexts/AuthContext.tsx:155` |
| 23 | ProductCard not wrapped in `React.memo` | `src/components/ProductCard.tsx` |
| 24 | Google Fonts loaded via CSS `@import` (render-blocking) | `src/index.css:1` |
| 25 | No `prefers-reduced-motion` support | `src/index.css:194-221` |
| 26 | `tsconfig.app.json` missing `strict: true` | `tsconfig.app.json` |
| 27 | Chatbot rate limiter `Map` grows unboundedly (memory leak) | `server/src/routes/chat.ts:8` |
| 28 | No focus trap or Escape key in modals | Admin pages |
| 29 | `README.md` still has Vite boilerplate text | `README.md` |

---

## Top 5 Recommended Fixes (Priority Order)

1. **Rotate all exposed secrets** — `Sevee_Designs1.env` is committed with real keys. Remove from git history, regenerate all keys.

2. **Fix Stripe env var** — Rename `STRIPE_KEY` → `STRIPE_SECRET_KEY` in Render dashboard or the env file. Stripe is broken right now.

3. **Remove hardcoded fallback secrets** — Throw errors at startup if `JWT_SECRET`, `PAYSTACK_SECRET_KEY` are missing. Never fall back to guessable defaults.

4. **Add global rate limiting** — Install `express-rate-limit` and protect auth, checkout, and contact endpoints.

5. **Add code splitting** — Use `React.lazy()` for admin/salesperson routes to reduce storefront bundle size by ~60%.

---

## Environment Variable Checklist

### Render (Backend)

| Variable | Status | Notes |
|----------|--------|-------|
| `DATABASE_URL` | Required | Supabase PostgreSQL connection string |
| `JWT_SECRET` | Required | Generate a strong random string |
| `NODE_ENV` | Required | Set to `production` |
| `PAYSTACK_SECRET_KEY` | Required | From Paystack dashboard |
| `STRIPE_SECRET_KEY` | Required | Must be `STRIPE_SECRET_KEY`, not `STRIPE_KEY` |
| `RESEND_API_KEY` | Required | From Resend dashboard |
| `GEMINI_API_KEY` | Optional | From Google AI Studio |
| `GOOGLE_CLIENT_ID` | Required | From Google Cloud Console |
| `CLIENT_URL` | Required | Comma-separated: `https://seveedesigns.com,https://sevee-designs.vercel.app` |
| `ADMIN_EMAIL` | Optional | Defaults to `admin@seveedesigns.com` |
| `SMS_API_KEY` | Optional | Falls back to mock SMS |

### Vercel (Frontend)

| Variable | Status | Notes |
|----------|--------|-------|
| `VITE_API_URL` | Required | e.g. `https://api.seveedesigns.com/api` |
| `VITE_GOOGLE_CLIENT_ID` | Required | For Google OAuth login button |
| `VITE_GOOGLE_MAPS_KEY` | Required | For Contact page map |

---

## Deployment Architecture

```
User → Cloudflare (DNS, WAF, DDoS)
         ├── seveedesigns.com → Vercel (React SPA)
         └── api.seveedesigns.com → Render (Express API) → Supabase (PostgreSQL)
```

---

*Report generated by automated code analysis.*
