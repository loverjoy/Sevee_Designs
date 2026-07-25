import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Brand colors
const COLORS = {
  primary: '#1C1B1A',
  accent: '#B87354',
  gold: '#D4973E',
  background: '#F9F8F6',
  secondary: '#EDE9E3',
  muted: '#615E5B',
  border: '#CFC8C0',
  white: '#FFFFFF',
  success: '#2BB54A',
  info: '#3385F0',
};

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 60, right: 60 },
  info: {
    Title: 'SeVee Designs - System Walkthrough',
    Author: 'SeVee Designs',
    Subject: 'E-Commerce Platform Documentation',
  },
});

const outputPath = path.join(__dirname, '../SeVee_Designs_System_Walkthrough.pdf');
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Helper functions
function addCoverPage() {
  // Dark background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.primary);

  // Logo
  const logoPath = path.join(__dirname, '../../public/logo.jpg');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, doc.page.width / 2 - 60, 80, { width: 120, height: 120 });
  }

  // Title
  doc.moveDown(6);
  doc.fontSize(36).font('Helvetica-Bold').fillColor(COLORS.white)
    .text('SeVee Designs', { align: 'center' });

  doc.moveDown(0.5);
  doc.fontSize(14).font('Helvetica').fillColor(COLORS.accent)
    .text('Premium Furniture & Interior Design', { align: 'center' });

  doc.moveDown(2);
  doc.fontSize(24).font('Helvetica-Bold').fillColor(COLORS.gold)
    .text('System Walkthrough', { align: 'center' });

  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica').fillColor(COLORS.border)
    .text('E-Commerce Platform Documentation', { align: 'center' });

  doc.moveDown(4);
  doc.fontSize(10).fillColor(COLORS.muted)
    .text('www.seveedesigns.com', { align: 'center' })
    .text('Prepared for Client Review', { align: 'center' })
    .text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

  doc.addPage();
}

function addSectionTitle(title: string, subtitle?: string) {
  // Accent bar
  doc.rect(60, doc.y, 4, 28).fill(COLORS.accent);
  doc.fontSize(20).font('Helvetica-Bold').fillColor(COLORS.primary)
    .text(title, 75, doc.y - 4);
  if (subtitle) {
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor(COLORS.muted)
      .text(subtitle, 75);
  }
  doc.moveDown(1);
}

function addSubSection(title: string) {
  doc.moveDown(0.5);
  doc.fontSize(13).font('Helvetica-Bold').fillColor(COLORS.accent)
    .text(title);
  doc.moveDown(0.3);
}

function addParagraph(text: string) {
  doc.fontSize(10).font('Helvetica').fillColor(COLORS.primary)
    .text(text, { lineGap: 4 });
  doc.moveDown(0.5);
}

function addBullet(text: string) {
  doc.fontSize(10).font('Helvetica').fillColor(COLORS.primary)
    .text(`  •  ${text}`, { indent: 10, lineGap: 3 });
}

function addNumberedItem(num: number, text: string) {
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.accent)
    .text(`${num}.`, 75, doc.y, { continued: true })
    .font('Helvetica').fillColor(COLORS.primary)
    .text(` ${text}`, { lineGap: 3 });
}

function addSeparator() {
  doc.moveDown(0.3);
  doc.strokeColor(COLORS.border).lineWidth(0.5)
    .moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).stroke();
  doc.moveDown(0.5);
}

function addScreenshotPlaceholder(label: string, description: string) {
  doc.save();
  const y = doc.y;
  doc.rect(80, y, doc.page.width - 160, 120)
    .fill(COLORS.secondary)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .rect(80, y, doc.page.width - 160, 120)
    .stroke();

  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.muted)
    .text(`[ ${label} ]`, 80, y + 45, { width: doc.page.width - 160, align: 'center' });
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.muted)
    .text(description, 80, y + 62, { width: doc.page.width - 160, align: 'center' });
  doc.y = y + 130;
  doc.restore();
}

function addFeatureBox(title: string, items: string[]) {
  const y = doc.y;
  doc.rect(70, y, doc.page.width - 140, items.length * 18 + 30)
    .fill('#FAFAF8')
    .strokeColor(COLORS.accent)
    .lineWidth(1)
    .rect(70, y, doc.page.width - 140, items.length * 18 + 30)
    .stroke();

  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.accent)
    .text(title, 80, y + 10);
  doc.y = y + 26;
  items.forEach(item => {
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.primary)
      .text(`  ✓  ${item}`, 85, doc.y, { lineGap: 2 });
  });
  doc.y = y + items.length * 18 + 35;
}

// ===========================
// PAGE 1: Cover
// ===========================
addCoverPage();

// ===========================
// PAGE 2: Table of Contents
// ===========================
addSectionTitle('Table of Contents');
doc.moveDown(1);

const toc = [
  ['1.', 'Executive Summary', '3'],
  ['2.', 'Platform Overview', '3'],
  ['3.', 'Technology Stack', '4'],
  ['4.', 'Customer-Facing Features', '5'],
  ['5.', 'Admin Panel', '7'],
  ['6.', 'Augmented Reality (AR)', '8'],
  ['7.', 'Payment & Order Flow', '9'],
  ['8.', 'Architecture & Infrastructure', '10'],
  ['9.', 'Security & Authentication', '11'],
  ['10.', 'Support & Contact', '12'],
];

toc.forEach(([num, title, page]) => {
  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary)
    .text(`${num}  ${title}`, 80, doc.y, { continued: true })
    .font('Helvetica').fillColor(COLORS.muted)
    .text(`  ${'.'.repeat(60)}  ${page}`, { lineGap: 6 });
});

doc.addPage();

// ===========================
// PAGE 3: Executive Summary
// ===========================
addSectionTitle('1. Executive Summary');
addParagraph(
  'SeVee Designs is a premium Ghanaian furniture and interior design brand offering handcrafted ' +
  'Executive, Office, and Student furniture collections. The platform combines modern e-commerce ' +
  'capabilities with Augmented Reality (AR) technology, allowing customers to visualize furniture ' +
  'in their own spaces before purchasing.'
);
addParagraph(
  'This document provides a comprehensive walkthrough of the SeVee Designs digital platform — ' +
  'covering customer-facing features, the admin management panel, AR technology, payment processing, ' +
  'and the underlying architecture.'
);

addSeparator();

// ===========================
// Platform Overview
// ===========================
addSectionTitle('2. Platform Overview');
addSubSection('What is SeVee Designs?');
addParagraph(
  'SeVee Designs is a full-stack e-commerce platform built for a Ghanaian furniture brand. ' +
  'It enables customers to browse products, view them in AR, and purchase online via Paystack ' +
  '(mobile money, card, bank transfer). The platform includes:'
);
addBullet('Customer-facing storefront with product catalog');
addBullet('Augmented Reality (AR) product viewer');
addBullet('AI-powered chatbot for furniture recommendations');
addBullet('Admin panel for product, order, and staff management');
addBullet('Sales reporting and analytics dashboard');
addBullet('Coupon and promotional tools');
addBullet('Blog and content management');

addSubSection('Key Differentiators');
addBullet('AR Preview — Customers can see 3D furniture models in their real space');
addBullet('AI Chatbot — Smart assistant helps customers find the right furniture');
addBullet('Ghana-Focused — Paystack integration for Mobile Money and local payments');
addBullet('Handcrafted Quality — Each piece is custom-made with premium materials');

doc.addPage();

// ===========================
// PAGE 4: Technology Stack
// ===========================
addSectionTitle('3. Technology Stack');

addSubSection('Frontend');
addBullet('React 18 with TypeScript for type-safe development');
addBullet('Vite for fast builds and hot module replacement');
addBullet('Tailwind CSS v4 for responsive, utility-first styling');
addBullet('React Router for client-side navigation');
addBullet('Axios for API communication');
addBullet('Recharts for admin analytics charts');

addSubSection('Backend');
addBullet('Express.js (Node.js) RESTful API server');
addBullet('TypeScript for type safety across the stack');
addBullet('PostgreSQL database (hosted on Supabase)');
addBullet('JWT authentication with role-based access control');
addBullet('Multer for file upload handling');
addBullet('Google Gemini AI for chatbot intelligence');

addSubSection('Infrastructure');
addBullet('Frontend: Vercel (automatic deployments from GitHub)');
addBullet('Backend: Render (Node.js hosting with auto-deploy)');
addBullet('Database: Supabase (PostgreSQL + real-time subscriptions)');
addBullet('Storage: Supabase Storage (product images CDN)');
addBullet('Domain: seveedesigns.com');

addFeatureBox('Development Workflow', [
  'Code pushed to GitHub → Auto-deploys to Vercel (frontend) and Render (backend)',
  'Database migrations run via SQL scripts on Supabase dashboard',
  'Environment variables managed per-service on hosting platforms',
]);

doc.addPage();

// ===========================
// PAGE 5: Customer Features
// ===========================
addSectionTitle('4. Customer-Facing Features');

addSubSection('4.1 Homepage');
addParagraph('The homepage serves as the brand\'s digital storefront, featuring:');
addBullet('Hero section with brand imagery and call-to-action');
addBullet('Featured products carousel highlighting top items');
addBullet('AR showcase section demonstrating the 3D preview capability');
addBullet('Category navigation (Executive, Office, Student)');
addBullet('Brand story section');
addBullet('Footer with contact info, social links, and newsletter signup');

addScreenshotPlaceholder('Homepage Screenshot', 'Hero section with featured products and AR showcase');

addSubSection('4.2 Product Catalog (Shop Page)');
addParagraph('The shop page provides a full browsing experience:');
addBullet('Grid layout showing product cards with images, names, and prices');
addBullet('Category filtering (Executive, Office, Student collections)');
addBullet('Search functionality (search by product name or description)');
addBullet('Sorting options: Price (low/high), Name (A-Z), Newest first');
addBullet('Pagination for large catalogs');
addBullet('Wishlist heart icon on each product card');

addScreenshotPlaceholder('Shop Page Screenshot', 'Product grid with category filters and search bar');

doc.addPage();

// ===========================
// PAGE 6: Product Detail & Cart
// ===========================
addSectionTitle('4.3 Product Detail Page');
addParagraph('Each product has a dedicated detail page showing:');
addBullet('Product image gallery (multiple images, thumbnail navigation)');
addBullet('Product name, item code (SKU), and price');
addBullet('Sale price with original price strikethrough (if on sale)');
addBullet('Stock availability indicator');
addBullet('Product specifications (Material, Dimensions, Weight, etc.)');
addBullet('AR "View in Your Space" button (for products with 3D models)');
addBullet('Add to Cart button with quantity selector');
addBullet('Wishlist toggle button');
addBullet('Related/similar products section');

addScreenshotPlaceholder('Product Detail Screenshot', 'Image gallery, specs, AR button, and add-to-cart');

addSubSection('4.4 Shopping Cart');
addParagraph('The cart page manages selected items:');
addBullet('List of items with images, names, quantities, and prices');
addBullet('Quantity adjustment (+ / - buttons)');
addBullet('Remove item from cart');
addBullet('Subtotal and total calculation');
addBullet('Checkout button to proceed to payment');
addBullet('Empty cart state with link back to shop');

addScreenshotPlaceholder('Cart Page Screenshot', 'Item list with quantities, prices, and checkout button');

doc.addPage();

// ===========================
// PAGE 7: Checkout & Account
// ===========================
addSectionTitle('4.5 Checkout & Payment');
addParagraph('The checkout process handles order completion:');
addBullet('Delivery information form (name, phone, email, address)');
addBullet('Order summary with itemized costs');
addBullet('Payment via Paystack (supports Mobile Money, Card, Bank Transfer)');
addBullet('Secure payment processing (PCI-compliant via Paystack)');
addBullet('Order confirmation page with order number');
addBullet('Email confirmation sent after successful payment');

addScreenshotPlaceholder('Checkout Page Screenshot', 'Delivery form, order summary, and Paystack payment button');

addSubSection('4.6 User Account & Dashboard');
addParagraph('Registered users have access to:');
addBullet('Personal profile management (name, email, phone)');
addBullet('Order history with status tracking');
addBullet('Wishlist management (save products for later)');
addBullet('Google OAuth social login (one-click sign-in)');
addBullet('Secure JWT-based session management');

addSubSection('4.7 AI Chatbot');
addParagraph('An intelligent assistant available on every page:');
addBullet('Answers questions about products, materials, and pricing');
addBullet('Recommends furniture based on customer needs');
addBullet('Redirects student/school queries to the Student collection');
addBullet('Powered by Google Gemini AI');
addBullet('Chat history within session');
addBullet('Minimized/maximized toggle for non-intrusive browsing');

addScreenshotPlaceholder('Chatbot Screenshot', 'Chat interface with AI furniture recommendations');

doc.addPage();

// ===========================
// PAGE 8: Admin Panel
// ===========================
addSectionTitle('5. Admin Panel');
addParagraph(
  'The admin panel provides full management capabilities for store owners and staff. ' +
  'Access is restricted to users with "admin" or "superadmin" roles.'
);

addSubSection('5.1 Admin Dashboard');
addBullet('KPI cards: Total Revenue, Orders, Products, Customers');
addBullet('Recent orders table with quick status overview');
addBullet('AI Journal console for business insights');
addBullet('AR click analytics (how many times AR was used per product)');

addScreenshotPlaceholder('Admin Dashboard Screenshot', 'KPI cards, recent orders, and analytics');

addSubSection('5.2 Product Management');
addBullet('Product catalog table with search, sort, and filter');
addBullet('Create new products with name, price, stock, category, description');
addBullet('Upload product images (multiple images per product)');
addBullet('Upload 3D models (.glb/.usdz) for AR viewing');
addBullet('Build product specifications (key-value pairs)');
addBullet('Toggle product visibility (active/inactive) and featured status');
addBullet('Edit and delete products');

addScreenshotPlaceholder('Admin Products Screenshot', 'Product catalog table with edit/delete actions');

doc.addPage();

// ===========================
// PAGE 9: Admin continued & AR
// ===========================
addSubSection('5.3 Order Management');
addBullet('View all orders with customer details and items');
addBullet('Update order status (Pending → Processing → Shipped → Delivered)');
addBullet('Expandable order details view');
addBullet('Filter and search orders');

addSubSection('5.4 Sales Reports');
addBullet('Revenue charts (daily, weekly, monthly)');
addBullet('Product volume analysis');
addBullet('Regional customer distribution');
addBullet('Export-ready data views');

addSubSection('5.5 Coupon Management');
addBullet('Create discount coupons (percentage or fixed amount)');
addBullet('Set expiry dates and usage limits');
addBullet('Toggle coupon active/inactive status');

addSubSection('5.6 Staff Management (Superadmin Only)');
addBullet('Add new staff accounts with role assignment');
addBullet('Roles: Admin, Superadmin, Salesperson');
addBullet('Edit staff profiles and permissions');
addBullet('Remove staff access');

addSeparator();

addSectionTitle('6. Augmented Reality (AR)');
addParagraph(
  'The AR feature allows customers to view 3D furniture models in their real-world environment ' +
  'using their smartphone camera. This is a key differentiator for SeVee Designs.'
);

addSubSection('How It Works');
addNumberedItem(1, 'Admin uploads a 3D model file (.glb or .usdz) when creating/editing a product');
addNumberedItem(2, 'The 3D model is stored alongside the product in the database');
addNumberedItem(3, 'Customer opens the product page and taps "View in Your Space"');
addNumberedItem(4, 'The AR viewer loads the 3D model using the device camera');
addNumberedItem(5, 'Customer can walk around, resize, and position the furniture in their space');
addNumberedItem(6, 'Customer can take a screenshot or proceed to purchase');

addSubSection('Device Compatibility');
addBullet('iOS: Safari on iPhone/iPad (uses Quick Look for .usdz files)');
addBullet('Android: Chrome browser (uses model-viewer for .glb files)');
addBullet('Desktop: 3D model preview (no AR, but rotatable view)');

doc.addPage();

// ===========================
// PAGE 10: Payment & Architecture
// ===========================
addSectionTitle('7. Payment & Order Flow');

addSubSection('Payment Gateway: Paystack');
addParagraph(
  'SeVee Designs uses Paystack as the payment processor, which is the leading payment ' +
  'gateway in Africa. It supports:'
);
addBullet('Mobile Money (MTN, Vodafone, AirtelTigo)');
addBullet('Debit/Credit Cards (Visa, Mastercard)');
addBullet('Bank Transfer');
addBullet('USSD payments');

addSubSection('Order Lifecycle');
addNumberedItem(1, 'Customer adds products to cart');
addNumberedItem(2, 'Customer fills delivery information at checkout');
addNumberedItem(3, 'Paystack payment is initiated');
addNumberedItem(4, 'Payment confirmed → Order created in database');
addNumberedItem(5, 'Admin receives notification and processes the order');
addNumberedItem(6, 'Admin updates status: Processing → Shipped → Delivered');
addNumberedItem(7, 'Customer sees status updates in their dashboard');

addScreenshotPlaceholder('Order Flow Diagram', 'Visual flow: Cart → Checkout → Payment → Confirmation → Fulfillment');

addSeparator();

addSectionTitle('8. Architecture & Infrastructure');

addSubSection('System Architecture');
addParagraph('The platform follows a modern three-tier architecture:');

addFeatureBox('Architecture Diagram', [
  'Client (Browser) ←→ Vercel CDN (React SPA)',
  '      ↕',
  'API Server (Express.js on Render)',
  '      ↕',
  'Database (PostgreSQL on Supabase)',
  '      ↕',
  'Storage (Supabase Storage — Product Images)',
]);

doc.addPage();

// ===========================
// PAGE 11: Architecture continued & Security
// ===========================
addSubSection('Deployment Pipeline');
addBullet('Code is pushed to GitHub repository');
addBullet('Vercel automatically builds and deploys the frontend');
addBullet('Render automatically builds and deploys the backend');
addBullet('Database changes are applied via Supabase SQL editor');
addBullet('No manual deployment needed — fully automated CI/CD');

addSubSection('Data Flow');
addNumberedItem(1, 'User visits seveedesigns.com → Vercel serves the React app');
addNumberedItem(2, 'React app makes API calls to sevee-designs1.onrender.com/api');
addNumberedItem(3, 'Express server processes requests and queries PostgreSQL');
addNumberedItem(4, 'Product images are served from Supabase Storage CDN');
addNumberedItem(5, 'Payments are processed via Paystack API');
addNumberedItem(6, 'Chatbot queries are sent to Google Gemini AI API');

addSeparator();

addSectionTitle('9. Security & Authentication');

addSubSection('Authentication');
addBullet('JWT (JSON Web Tokens) for session management');
addBullet('Password hashing with bcrypt');
addBullet('Google OAuth for social login');
addBullet('Role-based access control (Customer, Salesperson, Admin, Superadmin)');

addSubSection('API Security');
addBullet('CORS configured for allowed origins only');
addBullet('Rate limiting to prevent abuse');
addBullet('Helmet.js for HTTP header security');
addBullet('Input validation on all endpoints');
addBullet('Admin-only routes protected with middleware');

addSubSection('Data Security');
addBullet('Environment variables for all secrets (never committed to code)');
addBullet('Supabase Row Level Security (RLS) policies');
addBullet('HTTPS enforced on all connections');
addBullet('Paystack handles PCI-compliant card processing');

doc.addPage();

// ===========================
// PAGE 12: Support & Contact
// ===========================
addSectionTitle('10. Support & Contact');

addSubSection('Platform URLs');
addBullet('Customer Site: https://seveedesigns.com');
addBullet('Admin Panel: https://seveedesigns.com/admin');
addBullet('API Server: https://sevee-designs1.onrender.com/api');

addSubSection('Key Contacts');
addBullet('Technical Support: Available via the platform');
addBullet('GitHub Repository: https://github.com/loverjoy/Sevee_Designs');

addSubSection('Maintenance & Updates');
addBullet('Platform auto-deploys on every GitHub push');
addBullet('Database backups managed by Supabase');
addBullet('Server logs available on Render dashboard');
addBullet('Monitoring via Render built-in metrics');

addSeparator();

doc.moveDown(2);
doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.accent)
  .text('Thank you for choosing SeVee Designs', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(10).font('Helvetica').fillColor(COLORS.muted)
  .text('Premium Furniture. Crafted with Excellence.', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(9).fillColor(COLORS.border)
  .text('www.seveedesigns.com | info@seveedesigns.com', { align: 'center' });

// Add page numbers after all content is generated
// Note: pdfkit page numbers are added in the finalization step

doc.end();

stream.on('finish', () => {
  console.log(`PDF generated: ${outputPath}`);
  console.log(`Size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
});

stream.on('error', (err) => {
  console.error('PDF generation failed:', err);
});
