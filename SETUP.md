# SeVee Designs - Complete Setup Guide

This guide walks you through deploying the backend to **Render** and connecting everything.

---

## Table of Contents

1. [Get Supabase Database URL](#1-get-supabase-database-url)
2. [Get Paystack API Key](#2-get-paystack-api-key)
3. [Get Resend API Key](#3-get-resend-api-key)
4. [Get Gemini API Key (Optional)](#4-get-gemini-api-key-optional)
5. [Deploy Backend to Render](#5-deploy-backend-to-render)
6. [Set Vercel Environment Variable](#6-set-vercel-environment-variable)
7. [Configure Cloudflare DNS](#7-configure-cloudflare-dns)
8. [Verify Everything Works](#8-verify-everything-works)

---

## 1. Get Supabase Database URL

The `DATABASE_URL` connects your backend to the PostgreSQL database.

### Steps:

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click on your project (or create a new one if you haven't)
3. In the left sidebar, click **Settings** (gear icon)
4. Click **Database**
5. Scroll down to **Connection string**
6. Click the **URI** tab
7. Select **Session pooler** (not Transaction)
8. You'll see something like:
   ```
   postgresql://postgres.xxxxx:your-password@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
   ```
9. **Copy this entire URL**
10. Replace `[YOUR-PASSWORD]` with your actual database password
    - Your database password was set when you created the Supabase project
    - If you forgot it, go to **Settings** → **Database** → **Database password** → **Reset**

### Final format:
```
postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```

> **Important:** Use port `5432` for Session pooler. The `.env.example` shows `6543` but that's for Transaction pooler.

---

## 2. Get Paystack API Key

The `PAYSTACK_SECRET_KEY` processes payments.

### Steps:

1. Go to [https://dashboard.paystack.com](https://dashboard.paystack.com) and sign in
2. In the left sidebar, click **Settings**
3. Click **API Keys & Webhooks**
4. You'll see two keys:
   - **Test Secret Key** (starts with `sk_test_`) — for testing
   - **Live Secret Key** (starts with `sk_live_`) — for real payments
5. **Copy the Secret Key** (click the copy icon)
6. For initial setup, use the **Test key** first

> **Note:** Switch to Live key when you're ready to accept real payments.

---

## 3. Get Resend API Key

The `RESEND_API_KEY` sends transactional emails (order confirmations, etc.).

### Steps:

1. Go to [https://resend.com](https://resend.com) and sign in (or create account)
2. In the left sidebar, click **API Keys**
3. Click **Create API Key**
4. Give it a name like `SeVee Production`
5. Click **Add**
6. **Copy the key immediately** (starts with `re_`)
   - You won't be able to see it again after closing the dialog

> **Free tier:** Resend gives you 100 emails/day free. Plenty for starting out.

---

## 4. Get Gemini API Key (Optional)

The `GEMINI_API_KEY` powers the AI blog generation feature.

### Steps:

1. Go to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Select a Google Cloud project (or create new)
5. Click **Create**
6. **Copy the key** (starts with `AIzaSy`)

> **Note:** This is optional. Without it, the AI blog cron job will skip gracefully.

---

## 5. Deploy Backend to Render

### Step 5a: Create Render Account

1. Go to [https://render.com](https://render.com)
2. Click **Get Started** or **Sign Up**
3. Sign up with your **GitHub account** (recommended)

### Step 5b: Create Web Service

1. From the Render dashboard, click **New +** (top right)
2. Select **Web Service**
3. You'll be asked to connect a repository:
   - Click **Connect GitHub** if not already connected
   - Authorize Render to access your repos
4. Find and select your `Sevee_Designs-main` repository
5. Click **Connect**

### Step 5c: Configure Service Settings

On the setup page, fill in these fields:

| Field | Value |
|-------|-------|
| **Name** | `sevee-api` |
| **Region** | `Oregon (US West)` or closest to your users |
| **Branch** | `main` (or your default branch) |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | `Starter` ($7/month) |

> **Important:** The **Root Directory** must be `server` — not `/` or `server/`. Just `server`.

### Step 5d: Set Environment Variables

Scroll down to **Environment Variables** section. Add each one by clicking **Add Environment Variable**:

**Variable 1: DATABASE_URL**
- Key: `DATABASE_URL`
- Value: (paste your Supabase URL from Step 1)

**Variable 2: JWT_SECRET**
- Key: `JWT_SECRET`
- Value: Click **Generate** button (Render creates a secure random string)

**Variable 3: NODE_ENV**
- Key: `NODE_ENV`
- Value: `production`

**Variable 4: PAYSTACK_SECRET_KEY**
- Key: `PAYSTACK_SECRET_KEY`
- Value: (paste your Paystack key from Step 2)

**Variable 5: RESEND_API_KEY**
- Key: `RESEND_API_KEY`
- Value: (paste your Resend key from Step 3)

**Variable 6: ADMIN_EMAIL**
- Key: `ADMIN_EMAIL`
- Value: `admin@seveedesigns.com` (or your actual email)

**Variable 7: CLIENT_URL**
- Key: `CLIENT_URL`
- Value: `https://seveedesigns.com,https://sevee-designs.vercel.app`
- **Note:** Comma-separated, no spaces after the comma

**Variable 8: GEMINI_API_KEY** (optional)
- Key: `GEMINI_API_KEY`
- Value: (paste your Gemini key from Step 4)

**Variable 9: STRIPE_SECRET_KEY** (optional)
- Key: `STRIPE_SECRET_KEY`
- Value: (your Stripe test/live key)

### Step 5e: Deploy

1. Scroll to the bottom and click **Create Web Service**
2. Render will start building your backend
3. Watch the **Build Logs** — you should see:
   - `npm install` completing
   - `tsc` (TypeScript compilation) succeeding
   - `npm start` launching the server
4. Wait for the status to change from **Building** to **Live**
5. Note your service URL at the top, e.g.:
   ```
   https://sevee-api.onrender.com
   ```

### Step 5f: Fix Build Errors (If Any)

If the build fails, check:

1. **Wrong root directory** — Make sure it's `server` not `/`
2. **Missing dependencies** — Check `server/package.json` has all required packages
3. **TypeScript errors** — Run `npm run build` locally in the `server/` folder to test

---

## 6. Set Vercel Environment Variable

### Steps:

1. Go to [https://vercel.com](https://vercel.com) and sign in
2. Click on your **SeVee Designs** project
3. Click **Settings** (top tab)
4. Click **Environment Variables** (left sidebar)
5. Click **Add**:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://api.seveedesigns.com/api`
   - **Environment:** Check all (Production, Preview, Development)
6. Click **Save**
7. Go to **Deployments** tab and click **Redeploy** on the latest deployment

> **Important:** Use `https://api.seveedesigns.com/api` — not the raw Render URL. This is the Cloudflare-proxied domain.

---

## 7. Configure Cloudflare DNS

This routes traffic through Cloudflare for security.

### Step 7a: Add Domain to Cloudflare

1. Go to [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Add a Site**
3. Enter your domain: `seveedesigns.com`
4. Select a plan (Free is fine to start)
5. Cloudflare will scan existing DNS records
6. Update your domain's nameservers at your registrar to the Cloudflare-assigned ones

### Step 7b: Create DNS Records

Go to **DNS** → **Records** and add:

**Record 1 — Frontend (Vercel):**

| Field | Value |
|-------|-------|
| Type | `CNAME` |
| Name | `@` |
| Target | `cname.vercel-dns.com` |
| Proxy status | **Proxied** (orange cloud ON) |
| TTL | Auto |

**Record 2 — Backend (Render):**

| Field | Value |
|-------|-------|
| Type | `CNAME` |
| Name | `api` |
| Target | `sevee-api.onrender.com` |
| Proxy status | **Proxied** (orange cloud ON) |
| TTL | Auto |

> **Important:** Both must have the **orange cloud enabled** for Cloudflare's security features to work.

### Step 7c: SSL/TLS Settings

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full (strict)**
3. Enable **Always Use HTTPS** (toggle at top)
4. Enable **Automatic HTTPS Rewrites** (toggle at top)

### Step 7d: Security (Optional but Recommended)

1. Go to **Security** → **WAF**
2. Enable **Cloudflare Managed Ruleset**
3. Go to **Security** → **Bots**
4. Enable **Bot Fight Mode**

---

## 8. Verify Everything Works

### Test 1: Backend Health Check

Open your browser or run in terminal:
```
curl https://sevee-api.onrender.com/health
```

Expected response:
```json
{"status":"OK","timestamp":"2026-07-17T..."}
```

Or visit in browser: [https://sevee-api.onrender.com/health](https://sevee-api.onrender.com/health)

### Test 2: API via Cloudflare

```
curl https://api.seveedesigns.com/health
```

Should return the same response.

### Test 3: Frontend

Visit [https://seveedesigns.com](https://seveedesigns.com)
- The site should load
- Open browser DevTools (F12) → **Console**
- Check for any CORS errors (there should be none)

### Test 4: Login

1. Go to the login page
2. Enter test credentials (from seed.sql)
3. You should be able to log in without CORS errors

### Test 5: Full Flow

1. Browse products on the shop page
2. Add an item to cart
3. Proceed to checkout
4. Verify payment flow works (Paystack test mode)

---

## Troubleshooting

### "CORS Error" in Browser Console

- Check `CLIENT_URL` in Render includes both URLs:
  ```
  https://seveedesigns.com,https://sevee-designs.vercel.app
  ```
- Make sure there are **no spaces** after the comma
- Redeploy Render service after changing env vars

### Backend Returns 502 or 503

- Check Render **Logs** tab for errors
- Common cause: `DATABASE_URL` is wrong or Supabase is paused
- Go to Supabase → check project is **Active** (not paused)

### Build Fails on Render

- Check the **Build Logs** in Render
- Run `npm install && npm run build` locally in `server/` to reproduce
- Fix any TypeScript errors

### Payment Not Working

- Verify `PAYSTACK_SECRET_KEY` is set correctly in Render
- Make sure you're using **Test** key for testing
- Check Paystack dashboard for transaction logs

### AI Blog Not Generating

- Verify `GEMINI_API_KEY` is set in Render
- Check Render logs for `[CRON]` messages
- The cron runs at 6:00 AM UTC daily

---

## Complete Variable Reference

### Render (Backend)

```
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
JWT_SECRET=(auto-generated)
NODE_ENV=production
PAYSTACK_SECRET_KEY=sk_test_xxxxx
RESEND_API_KEY=re_xxxxx
ADMIN_EMAIL=admin@seveedesigns.com
CLIENT_URL=https://seveedesigns.com,https://sevee-designs.vercel.app
GEMINI_API_KEY=AIzaSyxxxxx (optional)
STRIPE_SECRET_KEY=sk_test_xxxxx (optional)
```

### Vercel (Frontend)

```
VITE_API_URL=https://api.seveedesigns.com/api
```

### Cloudflare DNS

```
@    CNAME  cname.vercel-dns.com     Proxied
api  CNAME  sevee-api.onrender.com   Proxied
```

---

## Quick Deploy Checklist

- [ ] Get Supabase DATABASE_URL
- [ ] Get Paystack PAYSTACK_SECRET_KEY
- [ ] Get Resend RESEND_API_KEY
- [ ] (Optional) Get Gemini GEMINI_API_KEY
- [ ] Create Render Web Service (root: `server`)
- [ ] Set all env vars in Render
- [ ] Deploy and wait for "Live" status
- [ ] Verify `https://sevee-api.onrender.com/health` returns OK
- [ ] Set `VITE_API_URL` in Vercel
- [ ] Redeploy Vercel
- [ ] Add DNS records in Cloudflare
- [ ] Set SSL to Full (strict)
- [ ] Test `https://api.seveedesigns.com/health`
- [ ] Test `https://seveedesigns.com` loads
- [ ] Test login and checkout flow
