import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface ProductRow {
  Code: string;
  Name: string;
  Category: string;
  Price: string;
  SalePrice: string;
  Description: string;
  StockQuantity: string;
}

function parseCSV(filePath: string): ProductRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      Code: values[0]?.trim() || '',
      Name: values[1]?.trim() || '',
      Category: values[2]?.trim() || '',
      Price: values[3]?.trim() || '0',
      SalePrice: values[4]?.trim() || '',
      Description: values[5]?.trim() || '',
      StockQuantity: values[6]?.trim() || '0',
    };
  }).filter(row => row.Name);
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function ensureCategory(client: any, categoryName: string): Promise<string> {
  const slug = generateSlug(categoryName);
  
  const existing = await client.query(
    'SELECT id FROM public.categories WHERE slug = $1',
    [slug]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const result = await client.query(
    `INSERT INTO public.categories (name, slug, description)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [categoryName, slug, `${categoryName} furniture collection`]
  );

  return result.rows[0].id;
}

async function importProducts() {
  const csvPath = path.join(__dirname, '../../code-name-26.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found:', csvPath);
    process.exit(1);
  }

  const products = parseCSV(csvPath);
  console.log(`Found ${products.length} products to import`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let imported = 0;
    let skipped = 0;

    for (const product of products) {
      try {
        const categoryId = await ensureCategory(client, product.Category);
        const slug = generateSlug(product.Name);

        const existingProduct = await client.query(
          'SELECT id FROM public.products WHERE slug = $1 OR item_code = $2',
          [slug, product.Code]
        );

        if (existingProduct.rows.length > 0) {
          console.log(`Skipping duplicate: ${product.Name} (${product.Code})`);
          skipped++;
          continue;
        }

        const price = parseFloat(product.Price) || 0;
        const salePrice = product.SalePrice ? parseFloat(product.SalePrice) : null;
        const stockQuantity = parseInt(product.StockQuantity) || 0;

        await client.query(
          `INSERT INTO public.products (category_id, name, slug, item_code, description, price, sale_price, stock_quantity, is_active, images)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            categoryId,
            product.Name,
            slug,
            product.Code === '—' ? null : product.Code || null,
            product.Description || null,
            price,
            salePrice,
            stockQuantity,
            true,
            '{}',
          ]
        );

        console.log(`Imported: ${product.Name} (${product.Code}) - Price: ${price}`);
        imported++;
      } catch (error: any) {
        console.error(`Error importing ${product.Name}:`, error.message);
      }
    }

    await client.query('COMMIT');
    console.log(`\nImport complete: ${imported} imported, ${skipped} skipped`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Import failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

importProducts();
