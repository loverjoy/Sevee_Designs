import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'product-images';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function migrateImages() {
  try {
    // 1. Verify Supabase Storage bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.error('Failed to connect to Supabase Storage:', bucketError.message);
      return;
    }

    let bucket = buckets?.find(b => b.name === BUCKET_NAME);
    if (!bucket) {
      console.log(`Bucket "${BUCKET_NAME}" not found. Creating it...`);
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      });
      if (createError) {
        console.error('Failed to create bucket:', createError.message);
        return;
      }
      console.log(`Created bucket: ${BUCKET_NAME}`);
    } else {
      console.log(`Connected to Supabase Storage: ${BUCKET_NAME} bucket`);
    }

    // 2. Get all images from images_website folder
    const imagesDir = path.join(__dirname, '../../images_website');
    if (!fs.existsSync(imagesDir)) {
      console.error('images_website directory not found');
      return;
    }

    const imageFiles = fs.readdirSync(imagesDir)
      .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));

    console.log(`Found ${imageFiles.length} images in images_website/`);

    // 3. Upload each image to Supabase Storage
    const urlMap = new Map<string, string>();

    for (const file of imageFiles) {
      const filePath = path.join(imagesDir, file);
      const fileBuffer = fs.readFileSync(filePath);
      const ext = path.extname(file);
      const fileName = `${uuidv4()}${ext}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, fileBuffer, {
          contentType: `image/${ext.replace('.', '')}`,
          upsert: false,
        });

      if (error) {
        console.error(`Failed to upload ${file}:`, error.message);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      urlMap.set(file, urlData.publicUrl);
      console.log(`Uploaded: ${file} -> ${urlData.publicUrl}`);
    }

    console.log(`\nUploaded ${urlMap.size} images to Supabase Storage`);

    // 4. Connect to DB only after uploads are done (prevents ECONNRESET)
    const client = await pool.connect();
    try {
      const productsRes = await client.query(
        'SELECT id, name, images FROM public.products ORDER BY created_at ASC'
      );
      const products = productsRes.rows;
      console.log(`\nFound ${products.length} products in database`);

      let updated = 0;
      let skipped = 0;

      for (const product of products) {
        const currentImages: string[] = product.images || [];

        if (currentImages.length === 0 || currentImages[0] === '{}') {
          skipped++;
          continue;
        }

        if (currentImages.some(img => img.startsWith('http'))) {
          console.log(`Skipping "${product.name}" - already has Supabase URLs`);
          skipped++;
          continue;
        }

        const newImages: string[] = [];
        for (const img of currentImages) {
          const fileName = path.basename(img);
          const supabaseUrl = urlMap.get(fileName);

          if (supabaseUrl) {
            newImages.push(supabaseUrl);
          } else {
            console.log(`Warning: ${fileName} not found in images_website, keeping original URL`);
            newImages.push(img);
          }
        }

        if (newImages.length > 0) {
          await client.query(
            'UPDATE public.products SET images = $1 WHERE id = $2',
            [newImages, product.id]
          );
          console.log(`Updated "${product.name}": ${newImages.length} image(s) migrated`);
          updated++;
        }
      }

      console.log(`\nMigration complete:`);
      console.log(`  - ${updated} products updated with Supabase URLs`);
      console.log(`  - ${skipped} products skipped (no images or already migrated)`);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateImages();
