# Product Import Guide

## Overview
This guide explains how to import products from CSV to PostgreSQL database.

## Prerequisites
1. PostgreSQL database running
2. `.env` file configured with `DATABASE_URL`
3. Node.js installed

## Steps

### 1. Configure Environment
Ensure `.env` file in server folder has:
```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

### 2. Import Products from CSV
```bash
cd server
npm run import
```

This will:
- Read `code-name-26.csv`
- Create categories if they don't exist
- Insert products with codes, names, categories, prices, and descriptions
- Skip duplicates based on slug or item_code

### 3. Add Product Images
Place product images in:
```
public/images/products/
```

**Image Naming Convention:**
- Use lowercase product name with hyphens
- Examples: `extra.jpg`, `expect.png`, `maxi.webp`
- Match the image filename to the product name in CSV

### 4. Update Products with Images
```bash
cd server
npm run update-images
```

This will:
- Scan `public/images/products/` for images
- Match images to products by name
- Update product records with image paths

## CSV Format
```csv
Code,Name,Category,Price,SalePrice,Description,StockQuantity
T1986,EXTRA,Executive/Office,0,,Executive chair,10
```

## Product Structure
- **Code**: Unique item code (e.g., T1986, OFF1989)
- **Name**: Product display name
- **Category**: Product category (creates if not exists)
- **Price**: Base price in GHS
- **SalePrice**: Discounted price (optional)
- **Description**: Product description
- **StockQuantity**: Available inventory

## Troubleshooting

### Duplicate Errors
If you see "Skipping duplicate", the product already exists in database.

### Connection Errors
Verify `DATABASE_URL` in `.env` is correct.

### Image Not Matching
Ensure image filename matches product name (case-insensitive, ignoring special characters).

## Admin Panel
After import, use admin panel at `/admin/products` to:
- Update prices
- Add detailed descriptions
- Upload additional images
- Mark products as featured
