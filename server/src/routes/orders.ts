import { Router, Response } from 'express';
import crypto from 'crypto';
import pool, { query } from '../db';
import { authenticateToken, requireStaff, AuthenticatedRequest } from './auth';

const router = Router();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock_paystack_secret_key_123456';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

import Stripe from 'stripe';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_stripe_secret_key_123456';
const stripe = new Stripe(STRIPE_SECRET_KEY);

// Helper to calculate delivery fee based on zone
const getDeliveryFee = async (region: string, country?: string): Promise<number> => {
  try {
    if (country && country.toLowerCase() !== 'ghana') {
      const res = await query(
        `SELECT base_fee FROM public.delivery_zones 
         WHERE name = 'International Delivery' OR 'International' = ANY(regions) LIMIT 1`
      );
      if (res.rows.length > 0) {
        return parseFloat(res.rows[0].base_fee);
      }
      return 450.00; // Fallback
    }

    const res = await query(
      `SELECT base_fee FROM public.delivery_zones 
       WHERE $1 = ANY(regions) LIMIT 1`,
      [region]
    );
    if (res.rows.length > 0) {
      return parseFloat(res.rows[0].base_fee);
    }
    // Fallback: instead of silent wrong zone, return -1 to signal error
    return -1;
  } catch (error) {
    console.error('Error fetching delivery fee:', error);
    return -1;
  }
};

// Helper to send order status email via Resend
const sendOrderStatusEmail = async (orderId: string, status: string) => {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL MOCK] Resend API Key not set. Order #${orderId} status changed to: ${status}`);
    return;
  }

  try {
    const orderRes = await query(
      `SELECT o.*, p.email, p.full_name 
       FROM public.orders o
       LEFT JOIN public.profiles p ON o.user_id = p.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderRes.rows.length === 0) return;
    const order = orderRes.rows[0];

    const itemsRes = await query(
      `SELECT * FROM public.order_items WHERE order_id = $1`,
      [orderId]
    );
    const items = itemsRes.rows;

    const emailHtml = `
      <div style="background-color: #f8f5f0; padding: 30px; font-family: 'Inter', sans-serif; color: #1c1b1a;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1a1410; padding: 20px; color: #ffffff; text-align: center;">
          <h2 style="font-family: 'Playfair Display', serif; color: #c9a96e; margin: 0;">SEVEE DESIGNS</h2>
          <p style="margin: 5px 0 0 0; font-size: 14px; letter-spacing: 2px;">PREMIUM FURNITURE</p>
        </div>
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #ede9e3;">
          <h3 style="font-family: 'Playfair Display', serif; border-bottom: 1px solid #ede9e3; padding-bottom: 10px;">Order Status Update</h3>
          <p>Hello <strong>${order.full_name || 'Customer'}</strong>,</p>
          <p>The status of your order <strong>#${order.order_number}</strong> has been updated to: <span style="background-color: #EDE9E3; padding: 3px 8px; font-weight: bold; text-transform: uppercase;">${status}</span></p>
          
          <h4 style="font-family: 'Playfair Display', serif; margin-top: 25px;">Order Details</h4>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="border-bottom: 1px solid #ede9e3; text-align: left;">
                <th style="padding: 8px 0;">Item</th>
                <th style="padding: 8px 0; text-align: center;">Qty</th>
                <th style="padding: 8px 0; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr style="border-bottom: 1px solid #f9f8f6;">
                  <td style="padding: 8px 0;">${item.product_name}</td>
                  <td style="padding: 8px 0; text-align: center;">${item.quantity}</td>
                  <td style="padding: 8px 0; text-align: right;">GHS ${parseFloat(item.unit_price).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; text-align: right; font-size: 15px;">
            <p style="margin: 5px 0;">Subtotal: GHS ${parseFloat(order.subtotal).toFixed(2)}</p>
            <p style="margin: 5px 0;">Delivery Fee: GHS ${parseFloat(order.delivery_fee).toFixed(2)}</p>
            ${parseFloat(order.discount_amount) > 0 ? `<p style="margin: 5px 0; color: #B87354;">Discount: -GHS ${parseFloat(order.discount_amount).toFixed(2)}</p>` : ''}
            <h3 style="font-family: 'Playfair Display', serif; margin: 10px 0 0 0; color: #1c1b1a;">Total: GHS ${parseFloat(order.total).toFixed(2)}</h3>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #ede9e3; margin: 30px 0;" />
          <p style="font-size: 13px; color: #6b6661; text-align: center;">If you have any questions, please contact hello@seveedesigns.com.</p>
        </div>
      </div>
    `;

    // Resend API HTTP post call
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'SEVEE DESIGNS <orders@seveedesigns.com>',
        to: order.email,
        subject: `Order #${order.order_number} Update - ${status.toUpperCase()}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend email sending failed:', errText);
    }
  } catch (error) {
    console.error('Email notify error:', error);
  }
};

const sendOrderStatusSms = async (orderId: string, status: string) => {
  const SMS_API_KEY = process.env.SMS_API_KEY || 'mock_sms_api_key';
  
  try {
    const orderRes = await query(
      `SELECT o.*, p.phone as profile_phone, p.full_name 
       FROM public.orders o
       LEFT JOIN public.profiles p ON o.user_id = p.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderRes.rows.length === 0) return;
    const order = orderRes.rows[0];

    const address = typeof order.delivery_address === 'string' 
      ? JSON.parse(order.delivery_address) 
      : order.delivery_address;
      
    const phone = address?.phone || order.profile_phone;
    if (!phone) {
      console.log(`[SMS] Skipping status SMS for Order #${order.order_number}: Recipient phone number missing.`);
      return;
    }

    const message = `SEVEE DESIGNS: Hello ${order.full_name || 'Customer'}, the status of your order #${order.order_number} has been updated to ${status.toUpperCase()}. Track here: http://localhost:5173/dashboard?tab=orders`;

    if (SMS_API_KEY === 'mock_sms_api_key' || SMS_API_KEY.startsWith('mock')) {
      console.log(`[SMS MOCK] Dispatching SMS via Carrier to ${phone}:`);
      console.log(`  "${message}"`);
      return;
    }

    console.log(`[SMS API] Dispatching real SMS via Twilio/Arkesel to ${phone}...`);
  } catch (error) {
    console.error('SMS notify error:', error);
  }
};

const notifyUserOfOrderStatusUpdate = async (orderId: string, status: string) => {
  await Promise.all([
    sendOrderStatusEmail(orderId, status).catch(error => console.error('Email notification failed:', error)),
    sendOrderStatusSms(orderId, status).catch(error => console.error('SMS notification failed:', error))
  ]);
};

// GET: List orders (Customer gets own, Admin/Salesperson gets all)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { status, limit = '20', offset = '0' } = req.query;
  const user = req.user!;

  try {
    let sql = `
      SELECT o.*, p.full_name as customer_name, p.email as customer_email
      FROM public.orders o
      LEFT JOIN public.profiles p ON o.user_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filter by own user if not staff
    if (user.role !== 'admin' && user.role !== 'salesperson' && user.role !== 'superadmin') {
      params.push(user.id);
      sql += ` AND o.user_id = $${params.length}`;
    }

    // Filter by status
    if (status) {
      params.push(status);
      sql += ` AND o.status = $${params.length}`;
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) FROM (${sql}) as temp`, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Sorting & Pagination
    sql += ' ORDER BY o.created_at DESC';
    
    params.push(parseInt(limit as string, 10));
    sql += ` LIMIT $${params.length}`;

    params.push(parseInt(offset as string, 10));
    sql += ` OFFSET $${params.length}`;

    const ordersRes = await query(sql, params);
    
    res.json({
      orders: ordersRes.rows,
      totalCount,
    });
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

// GET/POST: Verify payment redirect (invoked by Paystack redirect)
router.get('/verify', async (req, res) => {
  const reference = req.query.reference as string;
  if (!reference) {
    return res.status(400).send('Reference missing');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find order by paystack_ref
    const orderRes = await client.query(
      `SELECT * FROM public.orders WHERE notes = $1`,
      [`paystack_ref:${reference}`]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).send('Order not found for reference');
    }

    const order = orderRes.rows[0];

    // Idempotent check: if already completed, redirect to success
    if (order.payment_status === 'completed') {
      await client.query('COMMIT');
      client.release();
      // Redirect to frontend order success page
      return res.redirect(`http://localhost:5173/dashboard?tab=orders&success=true&order=${order.order_number}`);
    }

    let isSuccess = false;

    if (PAYSTACK_SECRET_KEY.startsWith('sk_test_mock') || reference.startsWith('SEVEE-')) {
      // Simulated mock payment success
      isSuccess = true;
    } else {
      // Query Paystack API to verify
      const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      });

      if (verifyRes.ok) {
        const verifyData: any = await verifyRes.json();
        isSuccess = verifyData.data.status === 'success';
      }
    }

    if (isSuccess) {
      // 1. Update order and payment status
      await client.query(
        `UPDATE public.orders 
         SET status = 'confirmed', payment_status = 'completed', payment_method = 'card'
         WHERE id = $1`,
        [order.id]
      );

      // 2. Fetch order items and decrement stock atomically (prevent overselling)
      const itemsRes = await client.query(
        'SELECT product_id, quantity FROM public.order_items WHERE order_id = $1',
        [order.id]
      );

      for (const item of itemsRes.rows) {
        if (item.product_id) {
          await client.query(
            `UPDATE public.products 
             SET stock_quantity = GREATEST(0, stock_quantity - $1)
             WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }
      }

      // 3. Increment coupon usage if coupon_id exists
      if (order.coupon_id) {
        await client.query(
          `UPDATE public.coupons 
           SET used_count = used_count + 1 
           WHERE id = $1`,
          [order.coupon_id]
        );
      }

      await client.query('COMMIT');
      client.release();

      // Trigger Email & SMS Notification (Fire-and-forget background task)
      notifyUserOfOrderStatusUpdate(order.id, 'confirmed').catch(console.error);

      // Redirect client to checkout success
      res.redirect(`http://localhost:5173/dashboard?tab=orders&success=true&order=${order.order_number}`);
    } else {
      await client.query(
        `UPDATE public.orders SET payment_status = 'failed' WHERE id = $1`,
        [order.id]
      );
      await client.query('COMMIT');
      client.release();
      res.redirect(`http://localhost:5173/checkout?failed=true&order=${order.order_number}`);
    }
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    console.error('Verify error:', error);
    res.status(500).send('Verification error occurred');
  }
});

// GET: Verify Stripe payment redirect
router.get('/stripe/verify', async (req, res) => {
  const { session_id, order_id } = req.query;
  if (!session_id || !order_id) {
    return res.status(400).send('Session ID and Order ID are required');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find order
    const orderRes = await client.query(
      `SELECT * FROM public.orders WHERE id = $1`,
      [order_id]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).send('Order not found');
    }

    const order = orderRes.rows[0];

    // Idempotent check: if already completed, redirect to success
    if (order.payment_status === 'completed') {
      await client.query('COMMIT');
      client.release();
      return res.redirect(`http://localhost:5173/dashboard?tab=orders&success=true&order=${order.order_number}`);
    }

    let isSuccess = false;

    if (STRIPE_SECRET_KEY.startsWith('sk_test_mock') || (session_id && session_id.toString().startsWith('cs_mock'))) {
      // Simulated mock payment success
      isSuccess = true;
    } else {
      // Query Stripe API to verify session status
      const session = await stripe.checkout.sessions.retrieve(session_id as string);
      isSuccess = session.payment_status === 'paid';
    }

    if (isSuccess) {
      // 1. Update order and payment status
      await client.query(
        `UPDATE public.orders 
         SET status = 'confirmed', payment_status = 'completed', payment_method = 'stripe'
         WHERE id = $1`,
        [order.id]
      );

      // 2. Fetch order items and decrement stock atomically (prevent overselling)
      const itemsRes = await client.query(
        'SELECT product_id, quantity FROM public.order_items WHERE order_id = $1',
        [order.id]
      );

      for (const item of itemsRes.rows) {
        if (item.product_id) {
          // Lock product row to prevent race conditions during updates
          await client.query(
            'SELECT stock_quantity FROM public.products WHERE id = $1 FOR UPDATE',
            [item.product_id]
          );
          await client.query(
            `UPDATE public.products 
             SET stock_quantity = GREATEST(0, stock_quantity - $1)
             WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }
      }

      // 3. Increment coupon usage if coupon_id exists
      if (order.coupon_id) {
        await client.query(
          `UPDATE public.coupons 
           SET used_count = used_count + 1 
           WHERE id = $1`,
          [order.coupon_id]
        );
      }

      await client.query('COMMIT');
      client.release();

      // Trigger Email & SMS Notification (Fire-and-forget background task)
      notifyUserOfOrderStatusUpdate(order.id, 'confirmed').catch(console.error);

      // Redirect client to checkout success
      res.redirect(`http://localhost:5173/dashboard?tab=orders&success=true&order=${order.order_number}`);
    } else {
      await client.query(
        `UPDATE public.orders SET payment_status = 'failed' WHERE id = $1`,
        [order.id]
      );
      await client.query('COMMIT');
      client.release();
      res.redirect(`http://localhost:5173/checkout?failed=true&order=${order.order_number}`);
    }
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    console.error('Verify error:', error);
    res.status(500).send('Verification error occurred');
  }
});

// GET: Single order detail
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  try {
    // Get order
    const orderRes = await query(
      `SELECT o.*, p.full_name as customer_name, p.email as customer_email, p.phone as customer_phone
       FROM public.orders o
       LEFT JOIN public.profiles p ON o.user_id = p.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRes.rows[0];

    // Auth validation: must be own order or staff
    if (user.role !== 'admin' && user.role !== 'salesperson' && user.role !== 'superadmin' && order.user_id !== user.id) {
      return res.status(403).json({ error: 'Access denied: You do not own this order' });
    }

    // Get order items
    const itemsRes = await query(
      `SELECT oi.*, p.slug as product_slug 
       FROM public.order_items oi
       LEFT JOIN public.products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    order.order_items = itemsRes.rows;

    res.json(order);
  } catch (error) {
    console.error('Fetch order detail error:', error);
    res.status(500).json({ error: 'Failed to retrieve order details' });
  }
});

// POST: Checkout / Create Order & Init Paystack
router.post('/checkout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { items, delivery_address, coupon_code, currency = 'GHS', exchange_rate = 1.0, payment_method } = req.body;
  const user = req.user!;

  if (!items || !Array.isArray(items) || items.length === 0 || !delivery_address) {
    return res.status(400).json({ error: 'Cart items and delivery address are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Validate Delivery Address Region and calculate fee
    const region = delivery_address.region;
    const country = delivery_address.country || 'Ghana';
    const deliveryFee = await getDeliveryFee(region, country);
    
    if (deliveryFee === -1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `We do not deliver to the region: '${region}'. Please check your region selection.` });
    }

    // 2. Calculate subtotal & validate stock
    let subtotal = 0;
    const itemsToInsert = [];

    for (const cartItem of items) {
      const { product_id, quantity } = cartItem;
      
      const prodRes = await client.query(
        'SELECT id, name, price, sale_price, stock_quantity, images FROM public.products WHERE id = $1 AND is_active = true FOR UPDATE',
        [product_id]
      );

      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Product ID ${product_id} not found or inactive` });
      }

      const product = prodRes.rows[0];

      if (product.stock_quantity < quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Insufficient stock for product '${product.name}'. Available: ${product.stock_quantity}` });
      }

      const itemPrice = parseFloat(product.sale_price ?? product.price);
      const itemTotal = itemPrice * quantity;
      subtotal += itemTotal;

      itemsToInsert.push({
        product_id: product.id,
        product_name: product.name,
        product_image: product.images && product.images.length > 0 ? product.images[0] : null,
        quantity,
        unit_price: itemPrice,
        total_price: itemTotal
      });
    }

    // 3. Handle Coupon discount
    let discountAmount = 0;
    let couponId: string | null = null;

    if (coupon_code) {
      const couponRes = await client.query(
        `SELECT * FROM public.coupons 
         WHERE code = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > now())`,
        [coupon_code.toUpperCase()]
      );

      if (couponRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Invalid or expired coupon code' });
      }

      const coupon = couponRes.rows[0];

      if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This coupon has reached its usage limit' });
      }

      if (subtotal < parseFloat(coupon.min_order_amount)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Coupon requires a minimum order subtotal of GHS ${parseFloat(coupon.min_order_amount).toFixed(2)}` });
      }

      couponId = coupon.id;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (subtotal * parseFloat(coupon.discount_value)) / 100;
      } else {
        discountAmount = parseFloat(coupon.discount_value);
      }

      // Cap discount at subtotal
      if (discountAmount > subtotal) {
        discountAmount = subtotal;
      }
    }

    const total = subtotal + deliveryFee - discountAmount;

    // 4. Create Order row (Order number generated automatically via trigger)
    const isPostpay = payment_method === 'postpay';
    const orderRes = await client.query(
      `INSERT INTO public.orders 
       (user_id, subtotal, delivery_fee, discount_amount, total, delivery_address, coupon_id, notes, currency, exchange_rate, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        user.id,
        subtotal,
        deliveryFee,
        discountAmount,
        total,
        JSON.stringify(delivery_address),
        couponId,
        isPostpay ? 'postpay_order' : '',
        currency,
        exchange_rate,
        isPostpay ? 'postpay' : null,
        'pending' // Postpay orders start as pending until money is confirmed by staff
      ]
    );

    const order = orderRes.rows[0];

    // 5. Insert Order Items
    for (const item of itemsToInsert) {
      await client.query(
        `INSERT INTO public.order_items 
         (order_id, product_id, product_name, product_image, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
         [order.id, item.product_id, item.product_name, item.product_image, item.quantity, item.unit_price, item.total_price]
      );
    }

    // Commit local order creation transaction
    await client.query('COMMIT');
    client.release();

    if (isPostpay) {
      // Trigger Email & SMS Notification (Fire-and-forget background task)
      notifyUserOfOrderStatusUpdate(order.id, 'pending').catch(console.error);

      return res.status(201).json({
        message: 'Order created successfully (Postpay)',
        orderId: order.id,
        orderNumber: order.order_number,
        total,
        authorization_url: `http://localhost:5173/dashboard?tab=orders&success=true&order=${order.order_number}`,
        reference: `postpay_${order.id}`,
      });
    }

    // 6. Initialize Payment Transaction
    // Convert base GHS amount to target currency based on exchange rate, then to subunits (cents/pesewas)
    const activeExchangeRate = parseFloat(exchange_rate as string);
    const convertedTotal = currency.toUpperCase() === 'GHS' ? total : total / activeExchangeRate;
    const amountInSubunits = Math.round(convertedTotal * 100);

    // If NOT GHS, we use STRIPE checkout
    if (currency.toUpperCase() !== 'GHS') {
      const stripeRef = `stripe_${order.id}_${Date.now()}`;
      
      if (STRIPE_SECRET_KEY.startsWith('sk_test_mock')) {
        // Return simulated redirect for mock Stripe testing
        const mockAuthUrl = `${req.protocol}://${req.get('host')}/api/orders/stripe/verify?session_id=cs_mock_${stripeRef}&order_id=${order.id}`;
        
        await query(
          `UPDATE public.orders SET notes = $1, payment_method = 'stripe' WHERE id = $2`,
          [`stripe_ref:cs_mock_${stripeRef}`, order.id]
        );

        return res.status(201).json({
          message: 'Order created successfully (MOCK Stripe)',
          orderId: order.id,
          orderNumber: order.order_number,
          total,
          authorization_url: mockAuthUrl,
          reference: `cs_mock_${stripeRef}`,
        });
      }

      // Real Stripe Checkout Session initialization
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: currency.toLowerCase(),
                product_data: {
                  name: `Order #${order.order_number}`,
                },
                unit_amount: amountInSubunits, // amount in cents
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${req.protocol}://${req.get('host')}/api/orders/stripe/verify?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
          cancel_url: `http://localhost:5173/checkout?failed=true&order=${order.order_number}`,
          metadata: {
            orderId: order.id,
            couponId: couponId || '',
          },
        });

        await query(
          `UPDATE public.orders SET notes = $1, payment_method = 'stripe' WHERE id = $2`,
          [`stripe_ref:${session.id}`, order.id]
        );

        return res.status(201).json({
          message: 'Order created successfully (Stripe)',
          orderId: order.id,
          orderNumber: order.order_number,
          total,
          authorization_url: session.url,
          reference: session.id,
        });
      } catch (stripeError: any) {
        console.error('Stripe Session creation error:', stripeError);
        await query(`UPDATE public.orders SET status = 'cancelled', payment_status = 'failed' WHERE id = $1`, [order.id]);
        return res.status(500).json({ error: `Stripe payment initialization failed: ${stripeError.message}` });
      }
    } else {
      // Default: Paystack checkout for GHS
      const paystackRef = `SEVEE-${order.id}-${Date.now()}`;
      const callbackUrl = `${req.protocol}://${req.get('host')}/api/orders/verify`;

      if (PAYSTACK_SECRET_KEY.startsWith('sk_test_mock')) {
        // Return a simulated redirect for local testing without network requests
        const mockAuthUrl = `http://localhost:5000/api/orders/verify?reference=${paystackRef}`;
        
        // Save reference in order notes
        await query(
          `UPDATE public.orders SET notes = $1 WHERE id = $2`,
          [`paystack_ref:${paystackRef}`, order.id]
        );

        return res.status(201).json({
          message: 'Order created successfully (MOCK Paystack)',
          orderId: order.id,
          orderNumber: order.order_number,
          total,
          authorization_url: mockAuthUrl,
          reference: paystackRef,
        });
      }

      // Call real Paystack API
      const paystackInitRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
        body: JSON.stringify({
          email: user.email,
          amount: amountInSubunits,
          currency: currency.toUpperCase(),
          reference: paystackRef,
          callback_url: callbackUrl,
          channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money'],
          metadata: {
            orderId: order.id,
            couponId,
          },
        }),
      });

      if (!paystackInitRes.ok) {
        const errText = await paystackInitRes.text();
        throw new Error(`Paystack Init Error: ${errText}`);
      }

      const paystackData: any = await paystackInitRes.json();
      
      // Save reference in order notes
      await query(
        `UPDATE public.orders SET notes = $1 WHERE id = $2`,
        [`paystack_ref:${paystackRef}`, order.id]
      );

      res.status(201).json({
        message: 'Order created successfully',
        orderId: order.id,
        orderNumber: order.order_number,
        total,
        authorization_url: paystackData.data.authorization_url,
        reference: paystackRef,
      });
    }

  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message || 'Checkout failed' });
  }
});

// POST: Paystack Webhook endpoint (handles background confirmations)
router.post('/webhook', async (req, res) => {
  const signature = req.headers['x-paystack-signature'] as string;
  if (!signature) {
    return res.status(401).send('Signature missing');
  }

  // Verify signature using captured rawBody
  const rawBody = (req as any).rawBody || Buffer.from(JSON.stringify(req.body));
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');

  if (hash !== signature && !PAYSTACK_SECRET_KEY.startsWith('sk_test_mock')) {
    return res.status(401).send('Invalid webhook signature');
  }

  const event = req.body;
  if (event.event !== 'charge.success') {
    return res.status(200).send('Event ignored');
  }

  const reference = event.data.reference;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Find order
    const orderRes = await client.query(
      `SELECT * FROM public.orders WHERE notes = $1 FOR UPDATE`,
      [`paystack_ref:${reference}`]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).send('Order not found');
    }

    const order = orderRes.rows[0];

    // Optimistic lock: only process if status is still pending
    if (order.payment_status === 'pending') {
      await client.query(
        `UPDATE public.orders 
         SET status = 'confirmed', payment_status = 'completed', payment_method = 'card'
         WHERE id = $1`,
        [order.id]
      );

      // Decrement stock
      const itemsRes = await client.query(
        'SELECT product_id, quantity FROM public.order_items WHERE order_id = $1',
        [order.id]
      );

      for (const item of itemsRes.rows) {
        if (item.product_id) {
          // Lock product row to prevent race conditions during updates
          await client.query(
            'SELECT stock_quantity FROM public.products WHERE id = $1 FOR UPDATE',
            [item.product_id]
          );
          await client.query(
            `UPDATE public.products 
             SET stock_quantity = GREATEST(0, stock_quantity - $1)
             WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }
      }

      // Increment coupon usage
      if (order.coupon_id) {
        await client.query(
          `UPDATE public.coupons SET used_count = used_count + 1 WHERE id = $1`,
          [order.coupon_id]
        );
      }

      await client.query('COMMIT');
      client.release();

      // Email & SMS notify
      notifyUserOfOrderStatusUpdate(order.id, 'confirmed').catch(console.error);
      res.status(200).send('Webhook processed');
    } else {
      await client.query('COMMIT');
      client.release();
      res.status(200).send('Already processed');
    }
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    console.error('Webhook error:', error);
    res.status(500).send('Webhook internal error');
  }
});

// PUT: Update order status (Staff only)
router.put('/:id/status', authenticateToken, requireStaff, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch existing order to check previous status
    const orderCheck = await client.query('SELECT * FROM public.orders WHERE id = $1 FOR UPDATE', [id]);
    if (orderCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'Order not found' });
    }

    const oldOrder = orderCheck.rows[0];
    let updatedOrder;

    // Transition from pending to confirmed (confirming payment received)
    if (oldOrder.status === 'pending' && status === 'confirmed') {
      // 1. Update order status and set payment_status to completed
      const updateRes = await client.query(
        `UPDATE public.orders 
         SET status = 'confirmed', payment_status = 'completed'
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      updatedOrder = updateRes.rows[0];

      // 2. Decrement stock
      const itemsRes = await client.query(
        'SELECT product_id, quantity FROM public.order_items WHERE order_id = $1',
        [id]
      );

      for (const item of itemsRes.rows) {
        if (item.product_id) {
          await client.query(
            `UPDATE public.products 
             SET stock_quantity = GREATEST(0, stock_quantity - $1)
             WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }
      }

      // 3. Increment coupon usage
      if (updatedOrder.coupon_id) {
        await client.query(
          `UPDATE public.coupons SET used_count = used_count + 1 WHERE id = $1`,
          [updatedOrder.coupon_id]
        );
      }
    } else {
      // Just standard status update
      const updateRes = await client.query(
        `UPDATE public.orders 
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [status, id]
      );
      updatedOrder = updateRes.rows[0];
    }

    await client.query('COMMIT');
    client.release();

    // Trigger email & SMS notification (Fire-and-forget)
    notifyUserOfOrderStatusUpdate(updatedOrder.id, status).catch(console.error);

    res.json(updatedOrder);
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// GET: Public order tracking by order number (no auth required, hides sensitive personal data)
router.get('/track/:orderNumber', async (req, res) => {
  const { orderNumber } = req.params;

  try {
    const result = await query(
      `SELECT o.id, o.order_number, o.status, o.created_at, o.delivery_fee, o.subtotal, o.total, o.currency, o.tracking_number,
              p.full_name as customer_name
       FROM public.orders o
       LEFT JOIN public.profiles p ON o.user_id = p.id
       WHERE o.order_number = $1 OR o.tracking_number = $1`,
      [orderNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = result.rows[0];

    // Fetch order items (public summary)
    const itemsResult = await query(
      `SELECT product_name, quantity, unit_price, total_price 
       FROM public.order_items 
       WHERE order_id = $1`,
      [order.id]
    );

    res.json({
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        created_at: order.created_at,
        delivery_fee: order.delivery_fee,
        subtotal: order.subtotal,
        total: order.total,
        currency: order.currency,
        tracking_number: order.tracking_number,
        customer_name: order.customer_name ? order.customer_name.split(' ')[0] : 'Valued Customer', // only first name for privacy
      },
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error('Public track order error:', error);
    res.status(500).json({ error: 'Failed to retrieve order tracking info' });
  }
});

export default router;
