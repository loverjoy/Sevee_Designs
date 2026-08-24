import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function assignImages() {
  const client = await pool.connect();

  try {
    // 1. Get all product images from the images_website folder
    const imagesDir = path.join(__dirname, '../../images_website');
    if (!fs.existsSync(imagesDir)) {
      console.error('images_website directory not found');
      return;
    }

    const imageFiles = fs.readdirSync(imagesDir)
      .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
      .map(f => `/uploads/${f}`);

    console.log(`Found ${imageFiles.length} images in images_website/`);

    // 2. Copy images to server/uploads so they're served by the backend
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    for (const file of fs.readdirSync(imagesDir).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))) {
      const src = path.join(imagesDir, file);
      const dest = path.join(uploadsDir, file);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied: ${file}`);
      }
    }

    // 3. Get all active products
    const productsRes = await client.query(
      'SELECT id, name, images FROM public.products WHERE is_active = true ORDER BY created_at ASC'
    );
    const products = productsRes.rows;
    console.log(`Found ${products.length} active products`);

    // 4. Assign images to products that have empty images
    let updated = 0;
    let imageIdx = 0;

    for (const product of products) {
      const currentImages = product.images;

      // Skip products that already have real images (not empty array)
      if (currentImages && currentImages.length > 0 && currentImages[0] !== '{}') {
        console.log(`Skipping "${product.name}" - already has ${currentImages.length} image(s)`);
        continue;
      }

      // Assign 1-2 images to this product (cycle through available images)
      const assignedImages = [imageFiles[imageIdx % imageFiles.length]];
      if (imageFiles.length > 1) {
        assignedImages.push(imageFiles[(imageIdx + 1) % imageFiles.length]);
      }
      imageIdx += 2;

      await client.query(
        'UPDATE public.products SET images = $1 WHERE id = $2',
        [assignedImages, product.id]
      );
      console.log(`Updated "${product.name}" with images: ${assignedImages.join(', ')}`);
      updated++;
    }

    // 5. Fix existing images with wrong /images/products/ paths -> /uploads/
    const fixRes = await client.query(
      `SELECT id, name, images FROM public.products WHERE images::text LIKE '%/images/products/%'`
    );
    let fixed = 0;
    for (const row of fixRes.rows) {
      const fixedImages = row.images.map((img: string) =>
        img.replace('/images/products/', '/uploads/')
      );
      await client.query(
        'UPDATE public.products SET images = $1 WHERE id = $2',
        [fixedImages, row.id]
      );
      console.log(`Fixed "${row.name}": ${fixedImages.join(', ')}`);
      fixed++;
    }

    console.log(`\nDone: ${updated} products updated, ${fixed} products fixed with correct paths`);
  } catch (error) {
    console.error('Failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

assignImages();
