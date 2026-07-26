
# Fix Broken Images — Push Local Images to Supabase Storage

## Why Images Are Broken

Your product images are stored locally on the Render server's disk (`server/uploads/`). Render uses **ephemeral disk storage**, which means:

- Every time the server redeploys (code push, restart, crash), all uploaded images are **permanently deleted**
- The `server/uploads/` folder is in `.gitignore`, so images are never committed to git
- The database still references old paths like `/uploads/abc123.jpg`, but those files no longer exist on the server

**The fix:** Move all images to **Supabase Storage** (a CDN-backed cloud storage service included free with your existing Supabase account). Images will then be served from `https://your-project.supabase.co/storage/v1/object/public/product-images/filename.jpg` — persistent, fast, and never lost.

---

## Prerequisites

- Access to your Supabase dashboard: <https://supabase.com/dashboard>
- Your Supabase project ID: `xpeyqmbedczzgnanlnvq`
- Access to Render dashboard: <https://dashboard.render.com>
- Node.js installed locally
- The `images_website/` folder with all 58 product images (already in your repo)

---

## Step 1: Create the Supabase Storage Bucket

1. Go to <https://supabase.com/dashboard>
2. Select your project (`xpeyqmbedczzgnanlnvq`)
3. Click **Storage** in the left sidebar
4. Click **"New bucket"** button
5. Fill in:
   - **Name:** `product-images`
   - **Public bucket:** Toggle **ON** (so images are accessible without auth)
6. Click **Create bucket**
7. Click on the `product-images` bucket → **Policies** tab → **"New policy"** → Choose **"Enable public access"**

---

## Step 2: Get Your Supabase API Credentials

1. In Supabase Dashboard, click **Settings** (gear icon) in the left sidebar
2. Click **API** under "Configuration"
3. Copy these two values:
   - **Project URL** — looks like: `https://xyzproject.supabase.co`
   - **anon public key** — looks like: `eyJhbGciOiJIUzI1NiIs...`

---

## Step 3: Update Environment Variables

### 3.1 Update `server/.env` (local)

Replace the placeholder values in `server/.env`:

```env
# BEFORE (broken placeholders):
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# AFTER (your real values):
SUPABASE_URL=https://xpeyqmbedczzgnanlnvq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...your-real-anon-key...
```

### 3.2 Update Render Environment Variables (production)

1. Go to <https://dashboard.render.com>
2. Select your backend service (`sevee-designs1`)
3. Go to **Environment** tab
4. Add or update these two variables:
   - `SUPABASE_URL` = `https://xpeyqmbedczzgnanlnvq.supabase.co`
   - `SUPABASE_ANON_KEY` = your real anon key
5. Click **Save** — this triggers a redeploy

---

## Step 4: Install Dependencies

```bash
cd server
npm install @supabase/supabase-js
```

---

## Step 5: Run the Migration Script

This script will:

1. Read all 58 images from `images_website/`
2. Upload each to Supabase Storage
3. Update all database records to point to the new Supabase CDN URLs

```bash
cd server
npx tsx scripts/migrate-images-supabase.ts
```

### Expected Output

```
Connected to Supabase Storage: product-images bucket
Found 58 images in images_website/
Uploaded: 026003c9-e0d7-4b76-b2cb-29b732f118c7.JPG -> https://xpeyqmbedczzgnanlnvq.supabase.co/storage/v1/object/public/product-images/026003c9-e0d7-4b76-b2cb-29b732f118c7.JPG
Uploaded: ...
Found 34 products with images to migrate
Updated "EXTRA": 2 images migrated
Updated "EXPECT": 2 images migrated
...
Migration complete:
  - 34 products updated with Supabase URLs
  - 0 products skipped
```

### If the Script Fails

- **"Bucket not found"** → Make sure you created the `product-images` bucket in Step 1
- **"Permission denied"** → Make sure the bucket policy allows public read access (Step 1, item 7)
- **"Failed to connect"** → Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct in `server/.env`
- **"DATABASE_URL is not set"** → Make sure `DATABASE_URL` is in `server/.env`

---

## Step 6: Verify Everything Works

### 6.1 Check Supabase Storage

1. Go to Supabase Dashboard → Storage → `product-images`
2. You should see all 58 images uploaded

### 6.2 Check the Database

Run this SQL in Supabase SQL Editor to verify URLs are updated:

```sql
SELECT name, images FROM public.products WHERE images != '{}'::text[] LIMIT 5;
```

All image values should start with `https://` (Supabase CDN URLs), not `/uploads/`.

### 6.3 Test the Website

1. Go to <https://seveedesigns.com/shop>
2. Product images should now load correctly
3. Images should load faster (served from Supabase CDN)

### 6.4 Test New Uploads via Admin

1. Go to <https://seveedesigns.com/admin/products/new>
2. Upload a test image
3. Save the product
4. Verify the image appears on the shop page

---

## Step 7: Cleanup (After Verification)

Once you confirm images are working:

### 7.1 Remove Old Local Images (optional, frees space)

```bash
rm -rf server/uploads/*
```

### 7.2 Update `.gitignore`

Add to `server/.gitignore` (if not already there):

```
uploads/
```

---

## How It Works After Migration

```
Admin uploads image
  → POST /api/products/upload
  → Server streams to Supabase Storage (not local disk)
  → Returns CDN URL: https://xpeyqmbedczzgnanlnvq.supabase.co/storage/v1/object/public/product-images/xxx.jpg
  → Saved to database (products.images column)

Customer views product
  → Frontend reads product.images array
  → resolveImageUrl() returns CDN URL as-is (starts with https://)
  → Browser loads from Supabase CDN (fast worldwide)
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Images still broken after migration | Check browser console (F12) — are URLs starting with `https://`? If not, re-run the migration script |
| "Failed to upload" errors | Check your internet connection and Supabase Storage quota (1GB free) |
| New uploads go to local disk | Make sure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Render environment |
| Site shows 503 | Render may be restarting — wait 1-2 minutes, or check Render logs |
| Images load slowly | Supabase CDN should be fast — check if the images are large (no compression configured) |

---

## Quick Reference

| Task | Command/Action |
|------|----------------|
| Create bucket | Supabase Dashboard → Storage → New bucket (`product-images`, Public) |
| Get credentials | Supabase Dashboard → Settings → API |
| Add env vars (local) | Edit `server/.env` with real `SUPABASE_URL` and `SUPABASE_ANON_KEY` |
| Add env vars (Render) | Render Dashboard → Service → Environment → Add variables |
| Install deps | `cd server && npm install @supabase/supabase-js` |
| Run migration | `cd server && npx tsx scripts/migrate-images-supabase.ts` |
| Test upload | Admin → Products → Add Product → Upload image |
| Verify DB | SQL Editor: `SELECT name, images FROM public.products LIMIT 5;` |
