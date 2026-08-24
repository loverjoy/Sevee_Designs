# SeVee Designs - Deployment Guide

## Architecture

```
User → Cloudflare (Edge: CDN / WAF / SSL / DDoS / Rate Limiting)
         ├── seveedesigns.com → Vercel (React Frontend)
         └── api.seveedesigns.com → Render (Express Backend)
                                        └── Supabase (PostgreSQL)
```

| Layer | Provider | Role |
|-------|----------|------|
| **Edge** | Cloudflare | DNS, SSL, CDN, WAF, DDoS protection, rate limiting |
| **Frontend** | Vercel | React + Vite static site hosting |
| **Backend** | Render.com | Express.js API server |
| **Database** | Supabase | PostgreSQL (Session Pooler) |

---

## Deployment Order

### Step 1: Supabase (Database)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Settings > Database > Connection string > URI** and copy the **Session pooler** URL.
3. Initialize the database:
   ```bash
   psql "YOUR_SUPABASE_CONNECTION_STRING" -f server/schema.sql
   psql "YOUR_SUPABASE_CONNECTION_STRING" -f server/seed.sql
   ```

---

### Step 2: Render (Backend)

1. Go to [render.com](https://render.com) > **New +** > **Web Service**.
2. Connect your GitHub repo and configure:
   - **Name**: `sevee-api`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. Set environment variables:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Supabase Session Pooler URL |
   | `JWT_SECRET` | Secure random string (Render auto-generate) |
   | `NODE_ENV` | `production` |
   | `CLIENT_URL` | `https://seveedesigns.com,https://sevee-designs.vercel.app` |
   | `PAYSTACK_SECRET_KEY` | Your Paystack key |
   | `RESEND_API_KEY` | Your Resend key |
   | `ADMIN_EMAIL` | `admin@seveedesigns.com` |

4. Deploy. Note your backend URL (e.g. `https://sevee-api.onrender.com`).

---

### Step 3: Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com) > **Add New...** > **Project**.
2. Import your GitHub repo. Framework auto-detected as **Vite**.
3. Set environment variable:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://api.seveedesigns.com/api` |

   > The API URL uses the Cloudflare-proxied subdomain, not the raw Render URL.

4. Deploy. Note your Vercel URL (e.g. `https://sevee-designs.vercel.app`).

---

### Step 4: Cloudflare (Edge Proxy)

This is the critical security layer that sits in front of both Vercel and Render.

#### 4a. Add Your Domain
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com).
2. Add your domain (e.g. `seveedesigns.com`) or add it to an existing domain.
3. Update your domain's nameservers to the Cloudflare-assigned ones.

#### 4b. Create DNS Records

**Frontend (apex domain):**
| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `@` | `cname.vercel-dns.com` | **Proxied** (orange cloud) |

**Backend (subdomain):**
| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `api` | `sevee-api.onrender.com` | **Proxied** (orange cloud) |

> Both records must have the **orange cloud enabled** (Proxied) for Cloudflare's edge protection to work.

#### 4c. SSL/TLS Settings
1. Go to **SSL/TLS** > **Overview**.
2. Set encryption mode to **Full (strict)**.
3. Enable **Always Use HTTPS**.
4. Enable **Automatic HTTPS Rewrites**.

#### 4d. Security Hardening
1. Go to **Security** > **WAF**.
2. Enable **Cloudflare Managed Ruleset** (free tier includes basic rules).
3. Go to **Security** > **Bots**.
4. Enable **Bot Fight Mode**.

#### 4e. Caching (Optional)
1. Go to **Caching** > **Configuration**.
2. Set **Browser Cache TTL** to `Respect Existing Headers`.
3. Static assets from Vercel will benefit from Cloudflare's CDN automatically.

#### 4f. Rate Limiting (Optional - Pro Plan)
1. Go to **Security** > **WAF** > **Rate limiting rules**.
2. Create a rule for the API:
   - **Rule name**: `API Rate Limit`
   - **When**: `Hostname equals api.seveedesigns.com`
   - **Then**: `Block` for 60 seconds if > 100 requests/minute

---

## Post-Deployment Verification

1. Visit `https://seveedesigns.com` — should load the frontend via Cloudflare → Vercel.
2. Visit `https://api.seveedesigns.com/health` — should return `{"status":"OK"}` via Cloudflare → Render.
3. Test storefront, login, cart, checkout.
4. Check browser console for CORS errors (none should appear).
5. Verify Cloudflare analytics show traffic in the dashboard.

---

## Environment Variables Reference

### Backend (Render)
```
DATABASE_URL=postgresql://...                    # Supabase Session Pooler
JWT_SECRET=your_secret
NODE_ENV=production
CLIENT_URL=https://seveedesigns.com,https://sevee-designs.vercel.app
PAYSTACK_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_...
ADMIN_EMAIL=admin@seveedesigns.com
```

### Frontend (Vercel)
```
VITE_API_URL=https://api.seveedesigns.com/api
```

### Local Development
```
# server/.env
DATABASE_URL=postgresql://...                    # Same Supabase URL
JWT_SECRET=dev_secret
CLIENT_URL=http://localhost:5173

# .env.local (frontend)
VITE_API_URL=http://localhost:5000/api
```

---

## DNS Record Summary

| Record | Type | Content | Proxy |
|--------|------|---------|-------|
| `@` (apex) | CNAME | `cname.vercel-dns.com` | Proxied |
| `api` | CNAME | `sevee-api.onrender.com` | Proxied |

Both proxied through Cloudflare for edge protection.
