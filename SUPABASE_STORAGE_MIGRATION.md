# Supabase Storage Migration Guide

This guide migrates product image uploads from the local server filesystem to **Supabase Storage** — a CDN-backed cloud storage service included free with your existing Supabase account.

---

## Why Migrate?

| Before (Local Storage) | After (Supabase Storage) |
|------------------------|--------------------------|
| Images stored on Render server disk | Images stored in Supabase cloud CDN |
| Lost on server restart/deploy | Persistent, never lost |
| Slow for distant users | Fast worldwide (CDN) |
| Limited by Render disk space | 1GB free, expandable |
| No image optimization | Automatic optimization |

---

## Step 1: Create Supabase Storage Bucket

### 1.1 Go to Supabase Dashboard

- Open https://supabase.com/dashboard
- Select your project (`xpeyqmbedczzgnanlnvq`)

### 1.2 Create the Bucket

1. Click **Storage** in the left sidebar
2. Click **"New bucket"** button
3. Fill in:
   - **Name:** `product-images`
   - **Public bucket:** ✅ Toggle ON (so images are accessible without auth)
4. Click **Create bucket**

### 1.3 Get Your API Credentials

1. Click **Settings** (gear icon) in the left sidebar
2. Click **API** under "Configuration"
3. Copy these two values:
   - **Project URL** — looks like: `https://xyzproject.supabase.co`
   - **anon public key** — looks like: `eyJhbGciOiJIUzI1NiIs...`

### 1.4 Set Bucket Policy (Important!)

1. Click on the `product-images` bucket
2. Click **Policies** tab
3. Click **"New policy"** → Choose **"Enable public access"**
4. This allows anyone to view images but only authenticated users to upload

---

## Step 2: Add Environment Variables

### 2.1 Update server/.env

Add these two lines to your `server/.env` file:

```
SUPABASE_URL=https://xyzproject.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

Replace with your actual values from Step 1.3.

### 2.2 Update Render Environment Variables

1. Go to https://dashboard.render.com
2. Select your backend service (`sevee-designs1`)
3. Go to **Environment** tab
4. Add these two variables:
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Save** — this triggers a redeploy

---

## Step 3: Install Dependencies

Run this from the project root:

```bash
cd server
npm install @supabase/supabase-js
```

---

## Step 4: Code Changes (Already Done)

The following files have been updated:

### 4.1 server/src/routes/products.ts

**Before:** Used multer to save files to `server/uploads/`

**After:** Uploads to Supabase Storage, returns CDN URL

- Removed multer import and middleware
- Added Supabase client initialization
- Upload endpoint now streams file to Supabase Storage
- Returns full CDN URL (e.g., `https://project.supabase.co/storage/v1/object/public/product-images/file.jpg`)

### 4.2 server/scripts/migrate-images-supabase.ts

**New migration script** that:
1. Reads all images from `images_website/`
2. Uploads each to Supabase Storage
3. Updates database records to point to new URLs
4. Prints progress and results

---

## Step 5: Run Migration Script

### 5.1 Make sure your server/.env has the new Supabase vars

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
DATABASE_URL=postgresql://...
```

### 5.2 Run the script

```bash
cd server
npx tsx scripts/migrate-images-supabase.ts
```

### 5.3 Expected Output

```
Connected to Supabase Storage: product-images bucket
Found 58 images in images_website/
Uploading 026003c9-e0d7-4b76-b2cb-29b732f118c7.JPG...
Uploaded: https://project.supabase.co/storage/v1/object/public/product-images/026003c9-e0d7-4b76-b2cb-29b732f118c7.JPG
...
Found 34 products with images to migrate
Updated "EXTRA": 2 images migrated
Updated "EXPECT": 2 images migrated
...
Done: 34 products updated with Supabase URLs
```

---

## Step 6: Verify

### 6.1 Check Supabase Storage

1. Go to Supabase Dashboard → Storage → `product-images`
2. You should see all 58 images uploaded

### 6.2 Check the Website

1. Go to https://seveedesigns.com/shop
2. Products should show images (now served from Supabase CDN)
3. Images should load faster than before

### 6.3 Test Upload via Admin

1. Go to https://seveedesigns.com/admin/products/new
2. Upload a test image
3. Save the product
4. Verify the image appears on the shop page

---

## Step 7: Cleanup (After Verification)

### 7.1 Remove Old Local Images

Once you confirm everything works:

```bash
# Delete old uploads from server (optional, frees space)
rm -rf server/uploads/*
```

### 7.2 Remove Multer Dependency

```bash
cd server
npm uninstall multer @types/multer
```

### 7.3 Update .gitignore

Add to `server/.gitignore`:

```
uploads/
```

---

## Troubleshooting

### "Bucket not found" error

- Make sure you created the `product-images` bucket in Supabase
- Make sure the bucket is set to **Public**
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct in `.env`

### "Permission denied" error

- Make sure the bucket policy allows public read access
- Go to Storage → `product-images` → Policies → Enable public access

### Images upload but don't show on site

- Check browser console (F12) for CORS errors
- Make sure the image URLs in the database start with `https://` (Supabase URL)
- Run the migration script to update old relative URLs

### Migration script fails

- Make sure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are in `server/.env`
- Make sure `DATABASE_URL` is correct
- Check your internet connection

### Upload endpoint returns 401

- You must be logged in as admin
- The JWT token must be valid
- Check that the Authorization header is being sent

---

## Architecture After Migration

```
Admin uploads image
  → POST /api/products/upload
  → Server streams to Supabase Storage
  → Returns CDN URL
  → Saved to database (products.images)

Customer views product
  → Frontend reads product.images array
  → resolveImageUrl() returns CDN URL as-is
  → Browser loads from Supabase CDN (fast!)
```

---

## Quick Reference

| Task | Command/Action |
|------|----------------|
| Create bucket | Supabase Dashboard → Storage → New bucket |
| Get credentials | Supabase Dashboard → Settings → API |
| Add env vars | Render → Environment → Add variable |
| Install deps | `npm install @supabase/supabase-js` |
| Run migration | `npx tsx scripts/migrate-images-supabase.ts` |
| Test upload | Admin → Products → Add Product → Upload image |
| Cleanup | `rm -rf server/uploads/*` |
