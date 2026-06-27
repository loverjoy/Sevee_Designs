import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// Regular expressions to detect order numbers
// SeVee order numbers look like: SD-YYYYMMDD-NNNNNN (e.g., SD-20260620-001001)
const orderNumRegex = /\bSD-\d{8}-\d{6}\b/i;

// Keyword mappings for fallback search
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  table: ['table', 'desk', 'dining', 'console', 'coffee table'],
  chair: ['chair', 'stool', 'bench', 'seating'],
  bed: ['bed', 'headboard', 'bedroom', 'platform bed'],
  decor: ['decor', 'mirror', 'tray', 'accessory', 'accessories', 'box'],
};

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Helper to search products by keyword
const searchProductsInDb = async (searchTerm: string) => {
  try {
    const res = await query(
      `SELECT p.id, p.name, p.slug, p.price, p.sale_price, p.images, p.item_code, c.name as category_name
       FROM public.products p
       LEFT JOIN public.categories c ON p.category_id = c.id
       WHERE p.is_active = true AND (p.name ILIKE $1 OR p.description ILIKE $1 OR p.item_code ILIKE $1 OR c.name ILIKE $1)
       LIMIT 4`,
      [`%${searchTerm}%`]
    );
    return res.rows;
  } catch (err) {
    console.error('Chat db product search error:', err);
    return [];
  }
};

// Helper to find order details
const findOrderInDb = async (orderNum: string) => {
  try {
    const res = await query(
      `SELECT o.order_number, o.status, o.created_at, o.total, o.currency, o.tracking_number,
              p.full_name as customer_name
       FROM public.orders o
       LEFT JOIN public.profiles p ON o.user_id = p.id
       WHERE o.order_number = $1 OR o.tracking_number = $1`,
      [orderNum.toUpperCase()]
    );
    if (res.rows.length === 0) return null;
    
    const order = res.rows[0];
    const itemsRes = await query(
      `SELECT product_name, quantity FROM public.order_items WHERE order_id = (
        SELECT id FROM public.orders WHERE order_number = $1 LIMIT 1
      )`,
      [order.order_number]
    );

    return {
      ...order,
      items: itemsRes.rows,
    };
  } catch (err) {
    console.error('Chat db order find error:', err);
    return null;
  }
};

// Route: POST /api/chat
router.post('/', async (req: Request, res: Response) => {
  const { message, history = [] } = req.body as { message: string; history: ChatMessage[] };

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // 1. Gather context from database
  let dbContext = '';
  let foundOrder: any = null;
  let foundProducts: any[] = [];

  // Check for item code in message (e.g. SV-OAK-1001)
  const itemCodeRegex = /\b(SV-[A-Z0-9]+-\d+)\b/i;
  const itemCodeMatch = message.match(itemCodeRegex);
  if (itemCodeMatch) {
    const matchedCode = itemCodeMatch[1].toUpperCase();
    try {
      const productByCode = await query(
        `SELECT p.id, p.name, p.slug, p.price, p.sale_price, p.stock_quantity, p.item_code, c.name as category_name
         FROM public.products p
         LEFT JOIN public.categories c ON p.category_id = c.id
         WHERE p.item_code = $1 AND p.is_active = true`,
        [matchedCode]
      );
      if (productByCode.rows.length > 0) {
        const prod = productByCode.rows[0];
        dbContext += `\n[DATABASE CONTEXT: Genuine item verified! Item code "${matchedCode}" corresponds to "${prod.name}" in category "${prod.category_name}". Current price is GHS ${prod.sale_price || prod.price}. Stock: ${prod.stock_quantity} units available. Confirm to the user that this is a genuine SeVee Designs product.]`;
        foundProducts.push(prod);
      } else {
        dbContext += `\n[DATABASE CONTEXT: The user queried item code "${matchedCode}", but no active product with this code was found in the database. Tell them this code could not be verified in our registry.]`;
      }
    } catch (err) {
      console.error('Chat db item code search error:', err);
    }
  }

  // Check for order number in message
  const orderMatch = message.match(orderNumRegex);
  if (orderMatch) {
    const orderNum = orderMatch[0];
    foundOrder = await findOrderInDb(orderNum);
    if (foundOrder) {
      dbContext += `\n[DATABASE CONTEXT: Order ${foundOrder.order_number} belongs to ${foundOrder.customer_name || 'Customer'}. Its current status is "${foundOrder.status}". It was placed on ${new Date(foundOrder.created_at).toLocaleDateString()}. Total amount is ${foundOrder.currency} ${parseFloat(foundOrder.total).toFixed(2)}. Tracking number: ${foundOrder.tracking_number || 'N/A'}. Items: ${foundOrder.items.map((i: any) => `${i.quantity}x ${i.product_name}`).join(', ')}.]`;
    } else {
      dbContext += `\n[DATABASE CONTEXT: The user queried order number "${orderNum}", but no matching order was found in the database. Ask them to double check the code.]`;
    }
  }

  // Check for product search keywords
  let searchWord = '';
  const lowercaseMsg = message.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const word of keywords) {
      if (lowercaseMsg.includes(word)) {
        searchWord = word;
        break;
      }
    }
    if (searchWord) break;
  }

  if (searchWord) {
    foundProducts = await searchProductsInDb(searchWord);
    if (foundProducts.length > 0) {
      dbContext += `\n[DATABASE CONTEXT: Found these matching products in our database: ${foundProducts.map(p => `"${p.name}" (Slug: ${p.slug}, Price: GHS ${p.sale_price || p.price})`).join(', ')}. Recommend these items to the user and tell them they can view details or add them to the cart.]`;
    }
  }

  // 2. Route to Gemini or Fallback
  if (GEMINI_API_KEY) {
    try {
      const systemInstruction = `You are SeVee, the refined digital assistant for SeVee Designs, a luxury woodwork and custom furniture studio based in East Legon, Accra, Ghana.
We craft bespoke, heirloom-quality solid wood furniture utilizing sustainable Volta and Ashanti Teak, and rich Mahogany hardwoods.
Key brand details to use:
- Joinery: Traditional Mortise & Tenon joinery (wood-to-wood interlocking connections). We strictly avoid metal nails, screws, or brackets for structural joints.
- Styling: Sharp geometric angles, clean minimalist forms, premium oil-rubbed finishes.
- Delivery: Greater Accra (1-3 days, GHS 50), Kumasi/Tamale (3-5 days, GHS 120), International (base fee GHS 450).
- Bespoke Designs: Customers can contact us via our Contact Page to submit custom dimensional requests.
- Response guidelines: Keep responses concise, elegant, and professional (1-3 sentences per turn). Use database context injections if provided to answer order queries or product recommendations directly. If no database context is provided but you need to reference orders or products, explain that you can query them if they provide the order number or search terms.`;

      // Build contents array for Gemini API (User & Model history, ending with new prompt + context)
      const contents = [];
      
      // Add history
      for (const h of history) {
        contents.push({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }]
        });
      }

      // Add current message with dbContext injected to system instruction / prompt
      const finalPrompt = dbContext 
        ? `${dbContext}\n\nUser Message: ${message}`
        : message;

      contents.push({
        role: 'user',
        parts: [{ text: finalPrompt }]
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            },
            generationConfig: {
              maxOutputTokens: 250,
              temperature: 0.7
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${await response.text()}`);
      }

      const data: any = await response.json();
      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return res.json({
        response: botText.trim(),
        products: foundProducts,
        order: foundOrder
      });

    } catch (err) {
      console.error('Gemini chatbot failed, using fallback:', err);
    }
  }

  // 3. Fallback Smart Rule-Based Engine
  let responseText = '';
  
  if (foundOrder) {
    responseText = `Hello! I found your order **${foundOrder.order_number}**. The current status is **${foundOrder.status.toUpperCase()}**. It was placed on ${new Date(foundOrder.created_at).toLocaleDateString()} and contains: ${foundOrder.items.map((i: any) => `${i.quantity}x ${i.product_name}`).join(', ')}. Total: ${foundOrder.currency} ${parseFloat(foundOrder.total).toFixed(2)}. ${foundOrder.tracking_number ? `Tracking number: ${foundOrder.tracking_number}` : ''}`;
  } else if (message.match(orderNumRegex)) {
    responseText = `I searched for the order number you provided, but could not find a matching order in our database. Please double-check the order number (it should look like SD-YYYYMMDD-NNNNNN) and try again.`;
  } else if (lowercaseMsg.includes('order') || lowercaseMsg.includes('track') || lowercaseMsg.includes('where is my')) {
    responseText = `I can help you track your order! Please provide your order number (e.g., SD-20260620-001001) or your delivery tracking code, and I will check the database instantly.`;
  } else if (foundProducts.length > 0) {
    responseText = `We have some beautiful handcrafted options in our catalog! Here are a few pieces that match your search. You can click on them to view details or add them directly to your cart:`;
  } else if (lowercaseMsg.includes('wood') || lowercaseMsg.includes('material') || lowercaseMsg.includes('teak') || lowercaseMsg.includes('mahogany') || lowercaseMsg.includes('joinery') || lowercaseMsg.includes('mortise')) {
    responseText = `At SeVee Designs, we pride ourselves on utilizing premium, sustainably-sourced Volta and Ashanti Teak, and rich Mahogany hardwoods. Our pieces feature traditional Mortise & Tenon joinery, which relies on interlocking wood connections instead of metal screws or nails, ensuring longevity in West Africa's climate.`;
  } else if (lowercaseMsg.includes('shipping') || lowercaseMsg.includes('delivery') || lowercaseMsg.includes('zone') || lowercaseMsg.includes('accra')) {
    responseText = `We deliver across Ghana and internationally! Delivery in Greater Accra takes 1-3 business days (GHS 50), regional hubs like Kumasi/Tamale take 3-5 business days (GHS 120), and international shipments start at a base fee of GHS 450.`;
  } else if (lowercaseMsg.includes('custom') || lowercaseMsg.includes('bespoke') || lowercaseMsg.includes('dimension') || lowercaseMsg.includes('size')) {
    responseText = `We love creating bespoke designs tailored to your specific space! To submit a custom request with your dimensions and wood preference, please head to our Contact Page and fill out the details. Our design consultants will get back to you with a sketch and quotation.`;
  } else if (lowercaseMsg.includes('hello') || lowercaseMsg.includes('hi') || lowercaseMsg.includes('hey')) {
    responseText = `Hello! Welcome to SeVee Designs. I am SeVee, your digital woodwork assistant. How can I assist you with your space today? You can ask me to track an order, search products, or explain our materials and delivery.`;
  } else {
    responseText = `Thank you for reaching out. I'm here to assist you with SeVee Designs. Could you tell me more about what you're looking for? You can ask about our sustainable wood materials, delivery rates, product availability, or track an order by typing your order number.`;
  }

  return res.json({
    response: responseText,
    products: foundProducts,
    order: foundOrder
  });
});

export default router;
