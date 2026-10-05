import { Pool } from 'pg';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Verified working replacement images (HTTP 200)
const replacements: Record<string, string> = {
  'sustainable-woodworking-trends-1784884939885':
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800',
  'crafting-perfect-modern-living-room':
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
  'teak-wood-ultimate-outdoor-material':
    'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=800',
};

const API_BASE = 'https://sevee-designs1.onrender.com';

const resolveUrl = (url: string) =>
  url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`;

const isAlive = async (url: string): Promise<boolean> => {
  try {
    const res = await fetch(resolveUrl(url), { method: 'HEAD', redirect: 'follow' });
    return res.ok;
  } catch {
    return false;
  }
};

async function fixBlogImages() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      'SELECT id, slug, title, image_url FROM public.blog_posts'
    );
    console.log(`Checking ${rows.length} blog posts...`);

    let fixed = 0;
    for (const row of rows) {
      const alive = row.image_url && (await isAlive(row.image_url));
      if (alive) {
        console.log(`OK      ${row.slug}`);
        continue;
      }

      const replacement = replacements[row.slug];
      if (!replacement) {
        console.warn(`DEAD    ${row.slug} (${row.image_url}) - no replacement mapped, skipped`);
        continue;
      }
      if (!(await isAlive(replacement))) {
        console.warn(`DEAD    ${row.slug} - replacement also dead, skipped`);
        continue;
      }

      await client.query('UPDATE public.blog_posts SET image_url = $1 WHERE id = $2', [
        replacement,
        row.id,
      ]);
      console.log(`FIXED   ${row.slug}\n        ${row.image_url}\n     -> ${replacement}`);
      fixed++;
    }

    console.log(`\nDone: ${fixed} image URL(s) repaired.`);
  } finally {
    client.release();
    await pool.end();
  }
}

fixBlogImages().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
