import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../db';
import { authenticateToken, requireAdmin, requireStaff } from './auth';

const router = Router();

// Configure Multer for local uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit (for 3D models)
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif|glb|usdz/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype) || file.originalname.endsWith('.glb') || file.originalname.endsWith('.usdz');
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (.jpg, .png, .webp, .gif) and 3D models (.glb, .usdz) are allowed!'));
  },
});

// Helper to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

// GET: All Categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM public.categories ORDER BY sort_order ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

// GET: Shop Products (with filter, search, sort, pagination)
router.get('/', async (req: Request, res: Response) => {
  const { category, q, sort, limit = '24', offset = '0', isAdminView = 'false' } = req.query;

  try {
    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM public.products p
      LEFT JOIN public.categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filter by active unless in admin view
    if (isAdminView !== 'true') {
      sql += ' AND p.is_active = true';
    }

    // Filter by category slug
    if (category) {
      params.push(category);
      sql += ` AND c.slug = $${params.length}`;
    }

    // Search query
    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }

    // Sorting
    if (sort === 'price_asc') {
      sql += ' ORDER BY COALESCE(p.sale_price, p.price) ASC';
    } else if (sort === 'price_desc') {
      sql += ' ORDER BY COALESCE(p.sale_price, p.price) DESC';
    } else if (sort === 'name_asc') {
      sql += ' ORDER BY p.name ASC';
    } else {
      sql += ' ORDER BY p.created_at DESC'; // default: newest
    }

    // Get total count for pagination metadata
    const countSql = `SELECT COUNT(*) FROM (${sql}) as temp`;
    const countResult = await query(countSql, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Apply pagination
    params.push(parseInt(limit as string, 10));
    sql += ` LIMIT $${params.length}`;

    params.push(parseInt(offset as string, 10));
    sql += ` OFFSET $${params.length}`;

    const result = await query(sql, params);

    res.json({
      products: result.rows,
      totalCount,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// GET: Featured products
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT p.*, c.name as category_name 
       FROM public.products p
       LEFT JOIN public.categories c ON p.category_id = c.id
       WHERE p.is_featured = true AND p.is_active = true
       ORDER BY p.created_at DESC LIMIT 8`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch featured error:', error);
    res.status(500).json({ error: 'Failed to retrieve featured products' });
  }
});

// GET: AR products (products with 3D model)
router.get('/ar-enabled', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT p.*, c.name as category_name
       FROM public.products p
       LEFT JOIN public.categories c ON p.category_id = c.id
       WHERE p.model_url IS NOT NULL AND p.is_active = true
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch AR products error:', error);
    res.status(500).json({ error: 'Failed to retrieve AR-enabled products' });
  }
});

// GET: Single product by slug
router.get('/slug/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const result = await query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM public.products p
       LEFT JOIN public.categories c ON p.category_id = c.id
       WHERE p.slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch product by slug error:', error);
    res.status(500).json({ error: 'Failed to retrieve product' });
  }
});

// GET: Single product by ID
router.get('/id/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM public.products p
       LEFT JOIN public.categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch product by id error:', error);
    res.status(500).json({ error: 'Failed to retrieve product' });
  }
});

// POST: Create product (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { category_id, name, description, price, sale_price, stock_quantity, images, specifications, is_featured, is_active, model_url, item_code } = req.body;

  if (!name || !price || stock_quantity === undefined) {
    return res.status(400).json({ error: 'Name, price, and stock quantity are required' });
  }

  const slug = generateSlug(name);
  let finalItemCode = item_code;
  if (!finalItemCode) {
    let prefix = name ? name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') : 'PRD';
    if (!prefix || prefix.length < 2) prefix = 'PRD';
    const num = Math.floor(1000 + Math.random() * 9000);
    finalItemCode = `SV-${prefix}-${num}`;
  } else {
    finalItemCode = finalItemCode.trim().toUpperCase();
  }

  try {
    const result = await query(
      `INSERT INTO public.products 
       (category_id, name, slug, item_code, description, price, sale_price, stock_quantity, images, specifications, is_featured, is_active, model_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        category_id || null,
        name,
        slug,
        finalItemCode,
        description || null,
        price,
        sale_price || null,
        stock_quantity,
        images || '{}',
        specifications || '{}',
        is_featured || false,
        is_active !== false,
        model_url || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Create product error:', error);
    if (error.code === '23505') {
      if (error.constraint === 'products_item_code_key') {
        return res.status(409).json({ error: 'A product with this item code already exists' });
      }
      return res.status(409).json({ error: 'A product with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// GET: Fetch authenticated user's wishlist
router.get('/wishlist', authenticateToken, async (req: any, res: Response) => {
  const userId = req.user.id;
  try {
    const result = await query(
      `SELECT p.*, c.name as category_name
       FROM public.wishlists w
       JOIN public.products p ON w.product_id = p.id
       LEFT JOIN public.categories c ON p.category_id = c.id
       WHERE w.user_id = $1 AND p.is_active = true
       ORDER BY w.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch wishlist error:', error);
    res.status(500).json({ error: 'Failed to retrieve wishlist' });
  }
});

// POST: Add product to wishlist
router.post('/wishlist', authenticateToken, async (req: any, res: Response) => {
  const userId = req.user.id;
  const { product_id } = req.body;
  if (!product_id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }
  try {
    const result = await query(
      `INSERT INTO public.wishlists (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING *`,
      [userId, product_id]
    );
    res.status(201).json({ message: 'Product added to wishlist', row: result.rows[0] });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: 'Failed to add product to wishlist' });
  }
});

// DELETE: Remove product from wishlist
router.delete('/wishlist/:productId', authenticateToken, async (req: any, res: Response) => {
  const userId = req.user.id;
  const { productId } = req.params;
  try {
    const result = await query(
      `DELETE FROM public.wishlists
       WHERE user_id = $1 AND product_id = $2
       RETURNING *`,
      [userId, productId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found in wishlist' });
    }
    res.json({ message: 'Product removed from wishlist', product_id: productId });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ error: 'Failed to remove product from wishlist' });
  }
});

// PUT: Update product (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { category_id, name, description, price, sale_price, stock_quantity, images, specifications, is_featured, is_active, model_url, item_code } = req.body;

  try {
    const fieldsToUpdate: string[] = [];
    const params: any[] = [id]; // $1

    if (category_id !== undefined) {
      params.push(category_id || null);
      fieldsToUpdate.push(`category_id = $${params.length}`);
    }
    if (name !== undefined) {
      params.push(name || null);
      fieldsToUpdate.push(`name = $${params.length}`);
      
      const slug = generateSlug(name);
      params.push(slug);
      fieldsToUpdate.push(`slug = $${params.length}`);
    }
    if (item_code !== undefined) {
      params.push(item_code ? item_code.trim().toUpperCase() : null);
      fieldsToUpdate.push(`item_code = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description || null);
      fieldsToUpdate.push(`description = $${params.length}`);
    }
    if (price !== undefined) {
      params.push(price);
      fieldsToUpdate.push(`price = $${params.length}`);
    }
    if (sale_price !== undefined) {
      params.push(sale_price);
      fieldsToUpdate.push(`sale_price = $${params.length}`);
    }
    if (stock_quantity !== undefined) {
      params.push(stock_quantity);
      fieldsToUpdate.push(`stock_quantity = $${params.length}`);
    }
    if (images !== undefined) {
      params.push(images || null);
      fieldsToUpdate.push(`images = $${params.length}`);
    }
    if (specifications !== undefined) {
      params.push(specifications || null);
      fieldsToUpdate.push(`specifications = $${params.length}`);
    }
    if (is_featured !== undefined) {
      params.push(is_featured);
      fieldsToUpdate.push(`is_featured = $${params.length}`);
    }
    if (is_active !== undefined) {
      params.push(is_active);
      fieldsToUpdate.push(`is_active = $${params.length}`);
    }
    if (model_url !== undefined) {
      params.push(model_url || null);
      fieldsToUpdate.push(`model_url = $${params.length}`);
    }

    if (fieldsToUpdate.length === 0) {
      const currentRes = await query('SELECT * FROM public.products WHERE id = $1', [id]);
      if (currentRes.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.json(currentRes.rows[0]);
    }

    const sql = `
      UPDATE public.products
      SET ${fieldsToUpdate.join(', ')}, updated_at = now()
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Update product error:', error);
    if (error.code === '23505') {
      if (error.constraint === 'products_item_code_key') {
        return res.status(409).json({ error: 'A product with this item code already exists' });
      }
      return res.status(409).json({ error: 'A product with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE: Delete product (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM public.products WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully', id });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// POST: Upload file (Admin only)
router.post('/upload', authenticateToken, requireAdmin, upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return static URL format
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      message: 'File uploaded successfully',
      url: fileUrl,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
});

export default router;
