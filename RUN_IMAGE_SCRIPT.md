# How to Assign Product Images to Database

This guide assigns your real SeVee product photos from the `images_website/` folder to products in the database.

## Prerequisites

- Node.js installed (v18+)
- Internet connection (to reach the Supabase database)
- The `images_website/` folder with 58 product photos (already in the project root)

## Step-by-Step Instructions

### Step 1: Open a terminal

Open PowerShell, Command Prompt, or your code editor's terminal.

### Step 2: Navigate to the server folder

```bash
cd server
```

### Step 3: Install dependencies (if you haven't already)

```bash
npm install
```

### Step 4: Run the image assignment script

```bash
npx tsx scripts/update-images.ts
```

### Step 5: Wait for it to finish

You should see output like:

```
Found 58 images in images_website/
Copied: 026003c9-e0d7-4b76-b2cb-29b732f118c7.JPG
Copied: 055cca58-d9e1-4908-9af2-cc73fae0133a.JPG
...
Found 34 active products
Updated "EXTRA" with images: /images/products/026003c9-e0d7-4b76-b2cb-29b732f118c7.JPG, /images/products/055cca58-d9e1-4908-9af2-cc73fae0133a.JPG
Updated "EXPECT" with images: /images/products/08a48684-76c2-4fef-8c3b-ef357e0d0909.JPG, /images/products/0a9b224d-d8ea-49ac-8adf-35cc71a08ef3.JPG
...
Done: 34 products updated with images
```

### Step 6: Verify on the site

1. Go to https://seveedesigns.com/shop
2. Products should now show real SeVee photos instead of placeholders

## Troubleshooting

### "images_website directory not found"

Make sure you're running the script from the `server/` folder. The script looks for `../images_website/` relative to the server folder.

### "DATABASE_URL is not set"

Your `server/.env` file should already have the `DATABASE_URL` configured. If not, add it:

```
DATABASE_URL=postgresql://your_connection_string_here
```

### Products still show placeholders after running

- Hard refresh the site (Ctrl+Shift+R or Cmd+Shift+R)
- Check the browser console for errors
- Make sure the script printed "Done: X products updated"

### Script fails with connection error

- Check your internet connection
- The Supabase database might be temporarily unavailable — try again in a minute

## What the Script Does

1. **Copies** all images from `images_website/` to `server/uploads/` (so the backend can serve them)
2. **Finds** all products in the database that have empty images
3. **Assigns** 1-2 images to each product, cycling through the available photos
4. **Skips** products that already have images assigned
