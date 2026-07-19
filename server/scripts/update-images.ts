import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface ImageMapping {
  productName: string;
  images: string[];
}

function getImageFiles(): string[] {
  const imagesDir = path.join(__dirname, '../../public/images/products');
  
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    return [];
  }

  return fs.readdirSync(imagesDir)
    .filter(file => /\.(jpg|jpeg|png|webp|gif)$/i.test(file))
    .map(file => `/images/products/${file}`);
}

function matchImagesToProducts(productName: string, availableImages: string[]): string[] {
  const normalizedName = productName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  return availableImages.filter(image => {
    const imageBaseName = path.basename(image, path.extname(image))
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    return imageBaseName.includes(normalizedName) || normalizedName.includes(imageBaseName);
  });
}

async function updateProductImages() {
  const client = await pool.connect();

  try {
    const availableImages = getImageFiles();
    console.log(`Found ${availableImages.length} images in products directory`);

    const result = await client.query(
      'SELECT id, name FROM public.products WHERE images = $1 OR images IS NULL',
      ['{}']
    );

    console.log(`Found ${result.rows.length} products without images`);

    let updated = 0;

    for (const product of result.rows) {
      const matchedImages = matchImagesToProducts(product.name, availableImages);

      if (matchedImages.length > 0) {
        await client.query(
          'UPDATE public.products SET images = $1 WHERE id = $2',
          [matchedImages, product.id]
        );
        console.log(`Updated: ${product.name} with ${matchedImages.length} images`);
        updated++;
      }
    }

    console.log(`\nUpdate complete: ${updated} products updated with images`);
  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateProductImages();
