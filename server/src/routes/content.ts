import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticateToken, requireAdmin } from './auth';
import { generateAiArticle } from '../utils/ai';

const router = Router();

// 1. FAQs Router
router.get('/faqs', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM public.faqs ORDER BY category, sort_order ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch FAQs error:', error);
    res.status(500).json({ error: 'Failed to retrieve FAQs' });
  }
});

// 2. Delivery Zones Router
router.get('/delivery-zones', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM public.delivery_zones ORDER BY base_fee ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch delivery zones error:', error);
    res.status(500).json({ error: 'Failed to retrieve delivery zones' });
  }
});

// 3. Blog Router
router.get('/blogs', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, title, slug, excerpt, image_url, category, author, published_at FROM public.blog_posts WHERE is_published = true ORDER BY published_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch blogs error:', error);
    res.status(500).json({ error: 'Failed to retrieve blog posts' });
  }
});

router.get('/blogs/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const result = await query(
      'SELECT * FROM public.blog_posts WHERE slug = $1 AND is_published = true',
      [slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch blog detail error:', error);
    res.status(500).json({ error: 'Failed to retrieve blog post' });
  }
});

// 4. Contact Message Router
router.post('/contact', async (req: Request, res: Response) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Name, email, subject, and message are required' });
  }

  try {
    await query(
      `INSERT INTO public.contact_messages (name, email, phone, subject, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, email, phone || null, subject, message]
    );
    res.status(201).json({ message: 'Contact message submitted successfully' });
  } catch (error) {
    console.error('Submit contact message error:', error);
    res.status(500).json({ error: 'Failed to submit message' });
  }
});

// 5. Coupon validation
router.get('/coupons/validate', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const subtotalStr = req.query.subtotal as string;

  if (!code || !subtotalStr) {
    return res.status(400).json({ error: 'Coupon code and subtotal are required' });
  }

  const subtotal = parseFloat(subtotalStr);

  try {
    const result = await query(
      `SELECT * FROM public.coupons 
       WHERE code = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > now())`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired coupon code' });
    }

    const coupon = result.rows[0];

    // Enforce max uses
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return res.status(400).json({ error: 'This coupon has reached its usage limit' });
    }

    // Check minimum order amount
    if (subtotal < parseFloat(coupon.min_order_amount)) {
      return res.status(400).json({
        error: `Coupon requires a minimum order subtotal of GHS ${parseFloat(coupon.min_order_amount).toFixed(2)}`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (subtotal * parseFloat(coupon.discount_value)) / 100;
    } else {
      discount = parseFloat(coupon.discount_value);
    }

    res.json({
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: parseFloat(coupon.discount_value),
      discount_amount: Math.min(discount, subtotal),
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// 6. Admin Coupons CRUD
router.get('/coupons', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM public.coupons ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch coupons error:', error);
    res.status(500).json({ error: 'Failed to retrieve coupons' });
  }
});

router.post('/coupons', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { code, description, discount_type, discount_value, min_order_amount, max_uses, expires_at } = req.body;

  if (!code || !discount_type || !discount_value) {
    return res.status(400).json({ error: 'Code, type, and value are required' });
  }

  try {
    const result = await query(
      `INSERT INTO public.coupons 
       (code, description, discount_type, discount_value, min_order_amount, max_uses, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        code.toUpperCase(),
        description || null,
        discount_type,
        discount_value,
        min_order_amount || 0,
        max_uses !== undefined ? max_uses : null,
        expires_at || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

router.put('/coupons/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { description, discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active } = req.body;

  try {
    const result = await query(
      `UPDATE public.coupons
       SET description = COALESCE($2, description),
           discount_type = COALESCE($3, discount_type),
           discount_value = COALESCE($4, discount_value),
           min_order_amount = COALESCE($5, min_order_amount),
           max_uses = CASE WHEN $6 = -1 THEN NULL ELSE COALESCE($6, max_uses) END,
           expires_at = CASE WHEN $7 = 'null' THEN NULL ELSE COALESCE($7, expires_at) END,
           is_active = COALESCE($8, is_active)
       WHERE id = $1
       RETURNING *`,
      [
        id,
        description || null,
        discount_type || null,
        discount_value || null,
        min_order_amount || null,
        max_uses !== undefined ? max_uses : null,
        expires_at || null,
        is_active !== undefined ? is_active : null,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

router.delete('/coupons/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM public.coupons WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json({ message: 'Coupon deleted successfully', id });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// POST: AI Generate Blog post (Admin only)
router.post('/blogs/ai-generate', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const article = await generateAiArticle();
    
    const result = await query(
      `INSERT INTO public.blog_posts (title, slug, excerpt, content, image_url, category, author, is_published, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, now())
       RETURNING *`,
      [
        article.title,
        article.slug,
        article.excerpt,
        article.content,
        article.image_url,
        article.category,
        article.author
      ]
    );

    res.status(201).json({
      message: 'AI article published successfully!',
      blog: result.rows[0]
    });
  } catch (error: any) {
    console.error('AI blog generation error:', error);
    res.status(500).json({ error: error.message || 'AI generation failed' });
  }
});

export default router;
