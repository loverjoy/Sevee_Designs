import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface Product {
  id: string;
  category_id: string | null;
  category_name?: string;
  category_slug?: string;
  name: string;
  slug: string;
  description: string | null;
  price: string | number;
  sale_price: string | number | null;
  stock_quantity: number;
  images: string[];
  specifications: Record<string, string>;
  is_featured: boolean;
  is_active: boolean;
  model_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  currency: string;
  setCurrency: (c: string) => void;
  exchangeRate: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const EXCHANGE_RATES: Record<string, number> = {
  GHS: 1.0,
  USD: 15.0,
  EUR: 16.0,
  GBP: 19.0,
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currency, setCurrencyState] = useState<string>(() => {
    try {
      return localStorage.getItem('sevee_currency') || 'GHS';
    } catch (e) {
      return 'GHS';
    }
  });

  const exchangeRate = EXCHANGE_RATES[currency] || 1.0;

  const setCurrency = (c: string) => {
    const rate = EXCHANGE_RATES[c] || 1.0;
    setCurrencyState(c);
    try {
      localStorage.setItem('sevee_currency', c);
      localStorage.setItem('sevee_rate', rate.toString());
    } catch (e) {
      // Fallback
    }
  };

  // Load cart on initialization
  useEffect(() => {
    const storedCart = localStorage.getItem('sevee_cart');
    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart));
      } catch (error) {
        console.error('Failed to parse cart items:', error);
      }
    }
  }, []);

  // Save cart changes to localStorage
  const saveCart = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem('sevee_cart', JSON.stringify(newItems));
  };

  const addItem = (product: Product, quantity = 1) => {
    const existingIndex = items.findIndex((item) => item.product.id === product.id);

    if (existingIndex > -1) {
      const currentQty = items[existingIndex].quantity;
      const newQty = currentQty + quantity;

      if (newQty > product.stock_quantity) {
        toast.warning(`Cannot add more. Only ${product.stock_quantity} units available in stock.`);
        // Cap at stock quantity
        const updatedItems = [...items];
        updatedItems[existingIndex].quantity = product.stock_quantity;
        saveCart(updatedItems);
      } else {
        const updatedItems = [...items];
        updatedItems[existingIndex].quantity = newQty;
        saveCart(updatedItems);
        toast.success(`Updated ${product.name} quantity to ${newQty} in cart`);
      }
    } else {
      if (quantity > product.stock_quantity) {
        toast.warning(`Only ${product.stock_quantity} units available. Adding maximum available.`);
        saveCart([...items, { product, quantity: product.stock_quantity }]);
      } else {
        saveCart([...items, { product, quantity }]);
        toast.success(`Added ${product.name} to cart`);
      }
    }
  };

  const removeItem = (productId: string) => {
    const updated = items.filter((item) => item.product.id !== productId);
    saveCart(updated);
    toast.info('Item removed from cart');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    const index = items.findIndex((item) => item.product.id === productId);
    if (index === -1) return;

    const product = items[index].product;
    if (quantity > product.stock_quantity) {
      toast.warning(`Only ${product.stock_quantity} units available in stock.`);
      const updated = [...items];
      updated[index].quantity = product.stock_quantity;
      saveCart(updated);
    } else {
      const updated = [...items];
      updated[index].quantity = quantity;
      saveCart(updated);
    }
  };

  const clearCart = () => {
    saveCart([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    const price = item.product.sale_price !== null 
      ? parseFloat(item.product.sale_price as string) 
      : parseFloat(item.product.price as string);
    return sum + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal, currency, setCurrency, exchangeRate }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
