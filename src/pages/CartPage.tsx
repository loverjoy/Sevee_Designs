import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../lib/utils';
import useSEO from '../hooks/useSEO';

const CartPage: React.FC = () => {
  useSEO({
    title: 'Your Shopping Cart',
    description: 'Review your selected premium furniture items before proceeding to checkout.',
    keywords: 'cart, checkout, buy premium furniture, SeVee Designs'
  });

  const { items, updateQuantity, removeItem, subtotal, totalItems } = useCart();
  const navigate = useNavigate();

  const handleCheckoutRedirect = () => {
    if (items.length > 0) {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="pt-40 text-center min-h-[70vh] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-secondary p-6 inline-block shadow-card">
          <ShoppingCart className="text-muted-foreground" size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold">Your Cart is Empty</h2>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            You haven't added any products to your shopping cart yet. Explore our premium furniture collection.
          </p>
        </div>
        <Link
          to="/shop"
          className="bg-primary hover:bg-accent text-primary-foreground px-8 py-3 text-xs font-bold uppercase tracking-wider inline-flex items-center space-x-2 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Start Shopping</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-32 max-w-7xl mx-auto px-6 space-y-10 min-h-[80vh] font-sans">
      {/* Header */}
      <h1 className="text-3xl font-serif font-bold text-foreground">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Left Column: Items List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border bg-card shadow-card divider-y divider-border">
            {items.map((item) => {
              const hasSale = item.product.sale_price !== null && item.product.sale_price !== undefined;
              const unitPrice = parseFloat((hasSale ? item.product.sale_price : item.product.price) as string);
              const imageUrl = item.product.images && item.product.images.length > 0 ? item.product.images[0] : 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=300';

              return (
                <div key={item.product.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-border last:border-b-0 gap-6">
                  {/* Image & Title */}
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-secondary border border-border shrink-0 overflow-hidden shadow-card">
                      <img src={imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
                        {item.product.category_name || 'Furniture'}
                      </span>
                      <Link to={`/product/${item.product.slug}`} className="hover:text-accent transition-colors">
                        <h4 className="font-serif text-sm font-bold line-clamp-1">{item.product.name}</h4>
                      </Link>
                      <span className="text-xs font-semibold text-accent block sm:hidden">
                        {formatPrice(unitPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-8">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-border bg-background">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="px-2.5 py-1.5 hover:bg-secondary font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="px-3 py-1.5 text-xs font-bold text-center w-8">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="px-2.5 py-1.5 hover:bg-secondary font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    {/* Unit Price (Desktop only) */}
                    <div className="hidden sm:block text-right w-24">
                      <span className="text-xs font-semibold">{formatPrice(unitPrice)}</span>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continue Shopping Link */}
          <Link to="/shop" className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-accent hover:text-foreground transition-colors">
            <ArrowLeft size={14} />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Right Column: Summary Panel */}
        <div className="border border-border bg-card p-6 shadow-card space-y-6">
          <h3 className="font-serif text-lg font-bold border-b border-border pb-3">Summary</h3>
          
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="font-bold text-foreground">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Cart Items:</span>
              <span className="font-bold text-foreground">{totalItems} units</span>
            </div>
            <div className="flex justify-between border-t border-border pt-4 text-sm font-semibold">
              <span className="text-foreground">Estimated Subtotal:</span>
              <span className="text-foreground">{formatPrice(subtotal)}</span>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            * Delivery fees and coupon discounts are calculated at the next checkout step. All transactions are processed securely via Paystack.
          </p>

          <button
            onClick={handleCheckoutRedirect}
            className="w-full bg-primary hover:bg-accent text-primary-foreground py-3.5 px-8 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors shadow-card"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
