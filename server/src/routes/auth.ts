import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sevee_secret_key_2026';

// Extend Express Request type to include user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: 'user' | 'admin' | 'salesperson';
  };
}

// Authentication middleware
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

// Admin auth guard middleware
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin role required' });
  }
  next();
};

// Admin or Salesperson auth guard middleware
export const requireStaff = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'salesperson')) {
    return res.status(403).json({ error: 'Access denied: Staff role required' });
  }
  next();
};

// Register
router.post('/register', async (req: Request, res: Response) => {
  const { email, username, full_name, phone, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password are required' });
  }

  try {
    // Check if email or username already exists
    const existingUser = await query(
      'SELECT id FROM public.profiles WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already registered' });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Default role for registration is 'user'
    const role = 'user';

    // Insert new profile
    const result = await query(
      `INSERT INTO public.profiles (email, username, full_name, phone, role, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, username, full_name, phone, role, created_at`,
      [email, username, full_name || null, phone || null, role, passwordHash]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  const { loginIdentifier, password } = req.body; // loginIdentifier can be email or username

  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: 'Login identifier and password are required' });
  }

  try {
    // Check if user exists (by email or username)
    const result = await query(
      'SELECT * FROM public.profiles WHERE email = $1 OR username = $2',
      [loginIdentifier, loginIdentifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Omit password hash from response
    delete user.password_hash;

    res.json({ token, user });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get currently authenticated user profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const result = await query(
      'SELECT id, email, username, full_name, phone, avatar_url, role, created_at, updated_at FROM public.profiles WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { full_name, phone, avatar_url } = req.body;
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const result = await query(
      `UPDATE public.profiles
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           avatar_url = COALESCE($3, avatar_url)
       WHERE id = $4
       RETURNING id, email, username, full_name, phone, avatar_url, role, created_at, updated_at`,
      [full_name, phone, avatar_url, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Admin: Get all customers
router.get('/customers', authenticateToken, requireStaff, async (req: Request, res: Response) => {
  const search = req.query.search as string;
  try {
    let sql = `SELECT id, email, username, full_name, phone, avatar_url, role, created_at 
               FROM public.profiles 
               WHERE role = 'user'`;
    const params: any[] = [];

    if (search) {
      sql += ` AND (full_name ILIKE $1 OR username ILIKE $1 OR email ILIKE $1)`;
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to retrieve customers' });
  }
});

// Admin: Get customer details (with order history)
router.get('/customers/:id', authenticateToken, requireStaff, async (req: Request, res: Response) => {
  const customerId = req.params.id;
  try {
    const profileRes = await query(
      'SELECT id, email, username, full_name, phone, avatar_url, role, created_at FROM public.profiles WHERE id = $1',
      [customerId]
    );

    if (profileRes.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const ordersRes = await query(
      'SELECT id, order_number, status, total, payment_status, created_at FROM public.orders WHERE user_id = $1 ORDER BY created_at DESC',
      [customerId]
    );

    res.json({
      profile: profileRes.rows[0],
      orders: ordersRes.rows,
    });
  } catch (error) {
    console.error('Get customer detail error:', error);
    res.status(500).json({ error: 'Failed to retrieve customer details' });
  }
});

export default router;
