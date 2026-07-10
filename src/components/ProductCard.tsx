import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { type Product, useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { formatPrice } from '../lib/utils';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();
  
  const wishlisted = isWishlisted(product.id);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };
  
  const hasSale = product.sale_price !== null && product.sale_price !== undefined;
  const originalPrice = parseFloat(product.price as string);
  const displayPrice = hasSale ? parseFloat(product.sale_price as string) : originalPrice;
  const isOutOfStock = product.stock_quantity <= 0;

  // Use the first image or a placeholder
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=600';

  return (
    <div className="group bg-card border border-border relative flex flex-col h-full shadow-card hover:shadow-hover transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-secondary w-full">
        <Link to={`/product/${product.slug}`}>
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Sale Badge */}
        {hasSale && (
          <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-[10px] tracking-wider uppercase font-bold px-2 py-1 z-10">
            Sale
          </span>
        )}

        {/* Favourites Toggle */}
        <button
          onClick={toggleWishlist}
          className="absolute top-3 right-3 bg-card border border-border p-1.5 shadow-card hover:text-accent transition-colors z-10 text-foreground flex items-center justify-center rounded-none"
          aria-label={wishlisted ? 'Remove from Favourites' : 'Add to Favourites'}
        >
          <Heart size={14} className={wishlisted ? 'fill-accent text-accent' : ''} />
        </button>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-wider px-3 py-1.5">
              Out of Stock
            </span>
          </div>
        )}

        {/* Quick Add to Cart Button (Overlay on hover for Desktop, always visible on Mobile) */}
        {!isOutOfStock && (
          <div className="absolute bottom-3 right-3 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10">
            <button
              onClick={() => addItem(product)}
              className="bg-primary hover:bg-accent text-primary-foreground p-2.5 shadow-card transition-colors flex items-center justify-center"
              aria-label="Add to Cart"
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <span className="text-[10px] font-sans tracking-widest text-muted-foreground uppercase">
            {product.category_name || 'Furniture'}
          </span>
          <Link to={`/product/${product.slug}`}>
            <h4 className="font-serif text-base font-bold text-foreground mt-1 line-clamp-1 group-hover:text-accent transition-colors">
              {product.name}
            </h4>
          </Link>
        </div>
        
        {/* Prices */}
        <div className="mt-2 flex items-baseline space-x-2 font-sans font-semibold text-sm">
          {hasSale ? (
            <>
              <span className="text-accent">{formatPrice(displayPrice)}</span>
              <span className="text-muted-foreground line-through text-xs">{formatPrice(originalPrice)}</span>
            </>
          ) : (
            <span className="text-foreground">{formatPrice(displayPrice)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
