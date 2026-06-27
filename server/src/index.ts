import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { query } from './db';
import { generateAiArticle } from './utils/ai';

import authRouter from './routes/auth';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import contentRouter from './routes/content';
import chatRouter from './routes/chat';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const clientUrl = process.env.CLIENT_URL;
if (clientUrl) {
  allowedOrigins.push(clientUrl.replace(/\/$/, ''));
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    
    // Normalize requested origin (strip trailing slash)
    const normalizedOrigin = origin.replace(/\/$/, '');
    
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded static files
app.use('/uploads', express.static(uploadDir));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/content', contentRouter);
app.use('/api/chat', chatRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Daily AI Blog post generation (The Journal)
// Scheduled to run every day at 6:00 AM (0 6 * * *)
cron.schedule('0 6 * * *', async () => {
  console.log('[CRON] Starting daily AI blog post generation...');
  try {
    const article = await generateAiArticle();
    await query(
      `INSERT INTO public.blog_posts (title, slug, excerpt, content, image_url, category, author, is_published, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, now())
       ON CONFLICT (slug) DO NOTHING`,
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
    console.log('[CRON] Successfully published daily AI blog article:', article.title);
  } catch (error) {
    console.error('[CRON] Failed to generate daily AI blog article:', error);
  }
});

// Weekly AR Report Cron Job
// Scheduled to run every Monday at 8:00 AM GMT (0 8 * * 1)
cron.schedule('0 8 * * 1', async () => {
  console.log('[CRON] Starting weekly AR engagement report...');
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@seveedesigns.com';
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  try {
    // 1. Get total AR views in the past 7 days
    const totalViewsRes = await query(
      `SELECT COUNT(*) FROM public.ar_view_events 
       WHERE viewed_at > now() - interval '7 days'`
    );
    const totalViews = totalViewsRes.rows[0].count;

    // 2. Get top AR viewed products
    const topArProductsRes = await query(
      `SELECT p.name as product_name, COUNT(e.id) as view_count
       FROM public.ar_view_events e
       JOIN public.products p ON e.product_id = p.id
       WHERE e.viewed_at > now() - interval '7 days'
       GROUP BY p.id, p.name
       ORDER BY view_count DESC
       LIMIT 5`
    );
    const topProducts = topArProductsRes.rows;

    const reportHtml = `
      <div style="background-color: #f9f8f6; padding: 40px; font-family: 'Inter', sans-serif; color: #1c1b1a;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1c1b1a; padding: 25px; color: #f9f8f6; text-align: center;">
          <h2 style="font-family: 'Playfair Display', serif; margin: 0; color: #EDE9E3;">SeVee Designs</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; letter-spacing: 2px;">WEEKLY AR ENGAGEMENT REPORT</p>
        </div>
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 35px; border: 1px solid #ede9e3;">
          <p>Hello Admin,</p>
          <p>Here is the weekly AR (Augmented Reality) engagement summary for the past 7 days.</p>
          
          <div style="background-color: #f9f8f6; padding: 20px; border-left: 4px solid #B87354; margin: 25px 0;">
            <h4 style="margin: 0 0 5px 0; color: #B87354; font-size: 14px; text-transform: uppercase;">Total AR Activations</h4>
            <h1 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 36px; color: #1c1b1a;">${totalViews}</h1>
          </div>
          
          <h3 style="font-family: 'Playfair Display', serif; margin-top: 30px; border-bottom: 1px solid #ede9e3; padding-bottom: 8px;">Top Viewed Products</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="border-bottom: 1px solid #ede9e3; text-align: left; font-size: 13px; color: #6b6661;">
                <th style="padding: 10px 0;">Product Name</th>
                <th style="padding: 10px 0; text-align: right;">AR View Count</th>
              </tr>
            </thead>
            <tbody>
              ${topProducts.length === 0 ? `
                <tr>
                  <td colspan="2" style="padding: 15px 0; text-align: center; color: #6b6661;">No AR views registered this week.</td>
                </tr>
              ` : topProducts.map(p => `
                <tr style="border-bottom: 1px solid #f9f8f6; font-size: 14px;">
                  <td style="padding: 12px 0; font-weight: bold;">${p.product_name}</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #B87354;">${p.view_count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <hr style="border: 0; border-top: 1px solid #ede9e3; margin: 40px 0;" />
          <p style="font-size: 12px; color: #6b6661; text-align: center; margin: 0;">This report is automatically compiled and dispatched by SeVee Cron Service.</p>
        </div>
      </div>
    `;

    if (!RESEND_API_KEY) {
      console.log(`[CRON REPORT MOCK] Resend API key not set. Email report details:\nTotal AR Views: ${totalViews}\nTop Products:`, topProducts);
      return;
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'SeVee Analytics <analytics@seveedesigns.com>',
        to: ADMIN_EMAIL,
        subject: `Weekly AR Engagement Report - ${new Date().toLocaleDateString()}`,
        html: reportHtml,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('[CRON REPORT] Failed to send report email via Resend:', errText);
    } else {
      console.log('[CRON REPORT] Report email dispatched successfully to:', ADMIN_EMAIL);
    }
  } catch (error) {
    console.error('[CRON REPORT] Error compiling weekly report:', error);
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`[SERVER] SeVee Designs Backend running on http://localhost:${PORT}`);
});
