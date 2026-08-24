import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'product-images';

const MAPPING_FILE = path.join(__dirname, '../image-mapping.json');

async function uploadNewImages() {
  // Load existing mapping if it exists
  let existingMapping: Record<string, string> = {};
  if (fs.existsSync(MAPPING_FILE)) {
    existingMapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
  }

  // Get all images from images_website folder
  const imagesDir = path.join(__dirname, '../../images_website');
  if (!fs.existsSync(imagesDir)) {
    console.error('images_website directory not found');
    return;
  }

  const imageFiles = fs.readdirSync(imagesDir)
    .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));

  console.log(`Found ${imageFiles.length} images in images_website/`);

  // Filter out already-uploaded images
  const newFiles = imageFiles.filter(f => !existingMapping[f]);
  console.log(`${newFiles.length} new images to upload (${imageFiles.length - newFiles.length} already uploaded)`);

  if (newFiles.length === 0) {
    console.log('Nothing to upload.');
    return;
  }

  // Upload each new image
  const newMapping: Record<string, string> = {};

  for (const file of newFiles) {
    const filePath = path.join(imagesDir, file);
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(file);
    const fileName = `${uuidv4()}${ext}`;

    const { error } = await supabase.storage
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

    newMapping[file] = urlData.publicUrl;
    console.log(`Uploaded: ${file} -> ${urlData.publicUrl}`);
  }

  // Merge and save mapping
  const fullMapping = { ...existingMapping, ...newMapping };
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(fullMapping, null, 2));

  console.log(`\nDone! ${Object.keys(newMapping).length} images uploaded.`);
  console.log(`Mapping saved to: ${MAPPING_FILE}`);
  console.log('\nNext step: Tell me which image goes to which product.');
  console.log('Format: "filename.jpg" -> "Product Name"');
}

uploadNewImages();
