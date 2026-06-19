import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from './AuthContext';
import { type Product } from './CartContext';
import { toast } from 'sonner';

interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync wishlist from backend or local storage
  const syncWishlist = async () => {
    if (user) {
      setLoading(true);
      try {
        const res = await client.get('/products/wishlist');
        setWishlist(res.data);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Guest user local storage cache
      try {
        const local = localStorage.getItem('sevee_wishlist');
        setWishlist(local ? JSON.parse(local) : []);
      } catch (e) {
        setWishlist([]);
      }
    }
  };

  useEffect(() => {
    syncWishlist();
  }, [user]);

  const addToWishlist = async (product: Product) => {
    if (user) {
      try {
        await client.post('/products/wishlist', { product_id: product.id });
        setWishlist((prev) => {
          if (prev.some((p) => p.id === product.id)) return prev;
          return [product, ...prev];
        });
        toast.success(`Added ${product.name} to favourites`);
      } catch (error: any) {
        console.error('Add to wishlist error:', error);
        toast.error(error.response?.data?.error || 'Failed to add to favourites');
      }
    } else {
      // Guest flow
      setWishlist((prev) => {
        if (prev.some((p) => p.id === product.id)) return prev;
        const updated = [product, ...prev];
        localStorage.setItem('sevee_wishlist', JSON.stringify(updated));
        return updated;
      });
      toast.success(`Added ${product.name} to favourites`);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (user) {
      try {
        await client.delete(`/products/wishlist/${productId}`);
        setWishlist((prev) => prev.filter((p) => p.id !== productId));
        toast.info('Removed from favourites');
      } catch (error: any) {
        console.error('Remove from wishlist error:', error);
        toast.error(error.response?.data?.error || 'Failed to remove from favourites');
      }
    } else {
      // Guest flow
      setWishlist((prev) => {
        const updated = prev.filter((p) => p.id !== productId);
        localStorage.setItem('sevee_wishlist', JSON.stringify(updated));
        return updated;
      });
      toast.info('Removed from favourites');
    }
  };

  const isWishlisted = (productId: string) => {
    return wishlist.some((p) => p.id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isWishlisted, loading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
