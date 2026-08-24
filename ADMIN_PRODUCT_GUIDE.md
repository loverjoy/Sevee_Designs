# Admin Guide: Adding & Managing Products

This guide walks admins through adding, editing, and managing products with images on the SeVee Designs admin panel.

---

## Accessing the Admin Panel

1. Go to **https://seveedesigns.com/admin**
2. Log in with your admin credentials
3. You'll land on the **Admin Dashboard** showing KPIs (revenue, orders, products, customers)

---

## Adding a New Product

### Step 1: Navigate to Products

- Click **"Products Catalog"** in the left sidebar
- Click the **"+ Add Product"** button (top right)

### Step 2: Fill in Basic Information

| Field | Required | Notes |
|-------|----------|-------|
| Product Name | ✅ | e.g., "Executive Oak Desk" |
| Category | ✅ | Select from dropdown (e.g., Executive, Office, Student) |
| Item Code | ❌ | Auto-generated as `SV-{PREFIX}-{####}` if left blank |
| Description | ❌ | Product details shown on the product page |
| Price (GHS) | ✅ | Selling price in Ghana Cedis |
| Sale Price | ❌ | If set, shows a crossed-out original price |
| Stock Quantity | ✅ | Number of units available |
| Featured Product | ❌ | Check to show on homepage |
| Active in Catalog | ✅ | Uncheck to hide from the shop |

### Step 3: Upload Product Images

1. Click the **dashed upload area** under "Product Photos"
2. Select an image from your computer (JPG, PNG, WebP, or GIF)
3. Wait for the upload to complete — a thumbnail preview will appear
4. **Repeat** for each image (one at a time)
5. To remove an image, click the **X** on its thumbnail

**Tips:**
- The **first image** uploaded is the "hero" image shown in product grids and carts
- Upload your best photo first
- Recommended size: 1200x1200px or similar square ratio
- Max file size: 50MB per image

### Step 4: Upload 3D Model (Optional)

If you have a 3D model file (`.glb` or `.usdz`):
1. Click the upload area under "3D Model"
2. Select the file
3. This enables the AR viewer on the product page

### Step 5: Add Specifications (Optional)

Add product specs as key-value pairs:
1. Click **"+ Add Specification"**
2. Enter the key (e.g., "Material") and value (e.g., "Mahogany Wood")
3. Add as many rows as needed
4. Click **X** on a row to remove it

Common specs:
- Material
- Dimensions (e.g., 180cm x 90cm x 75cm)
- Weight
- Color
- Assembly Required (Yes/No)

### Step 6: Save the Product

Click **"Save Product"** at the bottom. You'll be redirected to the Products Catalog where you can see your new product listed.

---

## Editing an Existing Product

1. Go to **Products Catalog** in the sidebar
2. Find the product in the table (use the search bar to filter)
3. Click the **pencil/edit icon** in the Actions column
4. Make your changes
5. Click **"Save Product"**

**To add more images:**
- Click the upload area and select new files
- Existing images remain — new ones are appended

**To remove an image:**
- Click the **X** on the image thumbnail
- This removes it from the product (the file stays on the server)

---

## Toggling Product Visibility

**Quick toggle from the catalog table:**
- Click the **toggle switch** in the "Active" column to show/hide a product
- Click the **toggle switch** in the "Featured" column to feature/unfeature a product

No need to open the edit form for these changes.

---

## Deleting a Product

1. Go to **Products Catalog**
2. Find the product
3. Click the **trash/delete icon** in the Actions column
4. Confirm the deletion

**⚠️ Warning:** This permanently deletes the product. Images remain on the server.

---

## Viewing Product Images on the Site

After saving, your product images appear:
- **Shop page** (`/shop`): Hero image in the product grid
- **Product page** (`/product/:slug`): Main image + all thumbnails
- **Cart & Checkout**: Hero image next to item name
- **Order History**: Hero image in past orders

---

## Troubleshooting

### Images not uploading

- Check file size (must be under 50MB)
- Check file type (only JPG, PNG, WebP, GIF, GLB, USDZ allowed)
- Make sure you're logged in as admin
- Check browser console for errors (F12 → Console)

### Images show as broken on the site

- The image URL is stored as a relative path (e.g., `/uploads/file-123.jpg`)
- The frontend resolves this to the full backend URL automatically
- If broken, the file may not have uploaded successfully — try re-uploading

### Product not appearing on the shop page

- Check that **"Active in Catalog"** is checked
- Check that a **category** is selected
- Check that **stock quantity** is greater than 0
- Hard refresh the site (Ctrl+Shift+R)

### Can't access admin panel

- You must be logged in with an `admin` or `superadmin` role
- Contact the superadmin if you need admin access

---

## Image Best Practices

| Do | Don't |
|----|-------|
| Use high-quality photos (1200px+) | Upload blurry or pixelated images |
| Use consistent lighting | Mix different backgrounds/styles |
| Show the product clearly | Use text-heavy promotional graphics |
| Upload the best image first | Upload 20+ images per product |
| Use JPG for photos, PNG for transparent | Use BMP or TIFF (too large) |

---

## Quick Reference

| Task | Where |
|------|-------|
| Add product | Admin → Products Catalog → + Add Product |
| Edit product | Admin → Products Catalog → Click edit icon |
| Upload images | Product form → Media & Assets → Upload area |
| Toggle active | Products Catalog → Toggle switch in Active column |
| Toggle featured | Products Catalog → Toggle switch in Featured column |
| Delete product | Products Catalog → Click delete icon |
| View as customer | Visit https://seveedesigns.com/shop |
