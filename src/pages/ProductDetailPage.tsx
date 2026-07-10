import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, ArrowLeft, Rotate3d, QrCode, X, Check } from 'lucide-react';
import client from '../api/client';
import { useCart, type Product } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { formatPrice } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import useSEO from '../hooks/useSEO';

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();
  
  const [product, setProduct] = useState<Product | null>(null);

  useSEO({
    title: product ? `${product.name} | Premium Hardwood` : 'Loading Product...',
    description: product ? product.description : 'Explore premium architectural hardwood furniture at SeVee Designs.',
    keywords: product ? `${product.name}, premium hardwood, SeVee Designs, Accra furniture` : 'premium furniture'
  });
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  
  const [arModalOpen, setArModalOpen] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const res = await client.get(`/products/slug/${slug}`);
        const prod = res.data;
        setProduct(prod);
        setActiveImage(prod.images && prod.images.length > 0 ? prod.images[0] : 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=800');

        // No local wishlist status check needed - handled reactively by useWishlist context
      } catch (error) {
        console.error('Failed to load product details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProductDetails();
    }
  }, [slug, user]);

  const wishlisted = product ? isWishlisted(product.id) : false;

  const handleWishlistToggle = async () => {
    if (!product) return;
    if (wishlisted) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  const trackArClick = async () => {
    if (!product) return;
    try {
      await client.post(`/products/${product.id}/ar-click`);
    } catch (e) {
      console.error('Failed to track AR view', e);
    }
  };

  const handleOpenAR = () => {
    trackArClick();
    // Desktop QR fallback: check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) {
      setArModalOpen(true);
    } else {
      // Direct WebXR redirect if supported on mobile
      if (product?.model_url) {
        window.location.href = product.model_url;
      }
    }
  };

  if (loading) {
    return (
      <div className="pt-40 text-center min-h-[70vh] flex flex-col items-center justify-center font-sans">
        <Loader2 className="animate-spin text-accent mb-4" size={32} />
        <p className="text-xs text-muted-foreground">Loading details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-40 text-center min-h-[70vh] flex flex-col items-center justify-center space-y-4 font-sans">
        <h2 className="font-serif text-2xl font-bold">Product Not Found</h2>
        <p className="text-xs text-muted-foreground">The item you are trying to view does not exist.</p>
        <Link to="/shop" className="bg-primary text-primary-foreground px-6 py-2.5 text-xs font-bold uppercase tracking-wider">
          Back to Shop
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity < 5;
  const originalPrice = parseFloat(product.price as string);
  const salePrice = product.sale_price ? parseFloat(product.sale_price as string) : null;

  return (
    <div className="pt-32 max-w-7xl mx-auto px-6 space-y-16 min-h-screen">
      {/* Back Button */}
      <Link to="/shop" className="inline-flex items-center space-x-2 text-xs font-sans text-muted-foreground hover:text-foreground font-semibold uppercase tracking-wider">
        <ArrowLeft size={14} />
        <span>Back to catalog</span>
      </Link>

      {/* Main product info layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-secondary border border-border overflow-hidden relative shadow-card">
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {salePrice && (
              <span className="absolute top-4 left-4 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 uppercase tracking-wider">
                Sale
              </span>
            )}
          </div>

          {/* Thumbnail row */}
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 bg-secondary border shrink-0 overflow-hidden shadow-card transition-all ${
                    activeImage === img ? 'border-accent ring-1 ring-accent' : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <img src={img} alt={`${product.name} thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Configuration */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-sans tracking-widest text-muted-foreground uppercase flex items-center flex-wrap gap-2">
              <span>{product.category_name || 'Furniture'}</span>
              {product.item_code && (
                <>
                  <span className="text-border">|</span>
                  <span className="font-bold tracking-wider text-accent">Item Code: {product.item_code}</span>
                </>
              )}
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">{product.name}</h1>
          </div>

          {/* Price Tag */}
          <div className="flex items-baseline space-x-3 font-sans">
            {salePrice ? (
              <>
                <span className="text-2xl font-bold text-accent">{formatPrice(salePrice)}</span>
                <span className="text-base text-muted-foreground line-through">{formatPrice(originalPrice)}</span>
              </>
            ) : (
              <span className="text-2xl font-bold text-foreground">{formatPrice(originalPrice)}</span>
            )}
          </div>

          {/* Stock Indicator */}
          <div className="flex items-center space-x-2 text-xs font-sans">
            {isOutOfStock ? (
              <span className="bg-destructive/10 text-destructive font-bold uppercase tracking-wider px-2.5 py-1">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="bg-warning/15 text-warning font-bold uppercase tracking-wider px-2.5 py-1">
                Low Stock (Only {product.stock_quantity} left)
              </span>
            ) : (
              <span className="bg-success/15 text-success font-bold uppercase tracking-wider px-2.5 py-1 flex items-center space-x-1">
                <Check size={12} />
                <span>In Stock ({product.stock_quantity} available)</span>
              </span>
            )}
          </div>

          {/* Description */}
          <p className="font-sans text-xs md:text-sm text-muted-foreground leading-relaxed">
            {product.description || 'No description available for this handcrafted hardwood furniture piece.'}
          </p>

          {/* AR Activation Poster Option */}
          {product.model_url && (
            <div className="border border-accent/20 bg-accent/5 p-4 flex items-center justify-between shadow-card">
              <div className="flex items-center space-x-3">
                <Rotate3d className="text-accent shrink-0" size={24} />
                <div>
                  <h4 className="font-serif text-sm font-bold">Augmented Reality Enabled</h4>
                  <p className="text-[10px] text-muted-foreground font-sans">Project this furniture directly onto your floor.</p>
                </div>
              </div>
              <button
                onClick={handleOpenAR}
                className="bg-accent hover:bg-accent/90 text-accent-foreground text-[10px] font-sans font-bold uppercase px-4 py-2 tracking-wider inline-flex items-center space-x-1"
              >
                <QrCode size={12} />
                <span>View in AR</span>
              </button>
            </div>
          )}

          {/* Purchase Actions */}
          <div className="pt-4 border-t border-border space-y-4">
            {!isOutOfStock && (
              <div className="flex items-center space-x-4 font-sans">
                <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Quantity:</label>
                <div className="flex items-center border border-border bg-background">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-foreground hover:bg-secondary font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-xs font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                    className="px-3 py-2 text-foreground hover:bg-secondary font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 font-sans">
              <button
                disabled={isOutOfStock}
                onClick={() => addItem(product, quantity)}
                className="bg-primary hover:bg-accent disabled:bg-muted disabled:text-muted-foreground text-primary-foreground py-3.5 px-8 text-xs font-bold uppercase tracking-wider text-center flex-grow flex items-center justify-center space-x-2 transition-colors"
              >
                <ShoppingCart size={16} />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleWishlistToggle}
                className={`border border-border py-3.5 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all rounded-none ${
                  wishlisted ? 'bg-accent/10 text-accent border-accent/20' : 'hover:bg-secondary text-foreground'
                }`}
              >
                <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} className={wishlisted ? 'text-accent' : ''} />
                <span>{wishlisted ? 'Favourited' : 'Save to Favourites'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Table (JSONB columns) */}
      <section className="border-t border-border pt-12">
        <h2 className="text-2xl font-serif font-bold mb-6">Specifications</h2>
        {product.specifications && Object.keys(product.specifications).length > 0 ? (
          <div className="border border-border bg-card shadow-card max-w-2xl font-sans">
            {Object.entries(product.specifications).map(([key, value], idx) => (
              <div key={idx} className={`grid grid-cols-3 text-xs p-3.5 ${idx % 2 === 0 ? 'bg-secondary/40' : 'bg-card'} border-b border-border last:border-b-0`}>
                <span className="font-bold text-foreground col-span-1">{key}</span>
                <span className="text-muted-foreground col-span-2">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground font-sans">No additional specifications configured for this item.</p>
        )}
      </section>

      {/* Desktop AR QR Code Overlay Modal */}
      {arModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card border border-border max-w-sm w-full p-8 shadow-card relative text-center space-y-6 font-sans">
            <button
              onClick={() => setArModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1"
            >
              <X size={20} />
            </button>
            <Rotate3d className="text-accent mx-auto" size={36} />
            <div>
              <h3 className="font-serif text-lg font-bold">Scan to View in AR</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Scan the QR code with your mobile camera to project this item onto your floor.
              </p>
            </div>
            <div className="bg-white p-4 border border-border inline-block mx-auto shadow-card">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`}
                alt="AR QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Works on WebXR-compatible Android devices and iOS 12+ Safari.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Loader component fallback
const Loader2: React.FC<{ className?: string; size?: number }> = ({ className, size = 20 }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={size}
    height={size}
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export default ProductDetailPage;
