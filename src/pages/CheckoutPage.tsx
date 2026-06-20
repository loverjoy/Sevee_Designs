import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Loader2, ArrowLeft, ArrowRight, Ticket, Check, AlertCircle } from 'lucide-react';
import client from '../api/client';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../lib/utils';
import { toast } from 'sonner';
import useSEO from '../hooks/useSEO';

// Standard regions of Ghana
const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Central',
  'Eastern',
  'Volta',
  'Western',
  'Western North',
  'Northern',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Savannah',
  'North East',
  'Oti'
];

const CheckoutPage: React.FC = () => {
  useSEO({
    title: 'Secure Checkout',
    description: 'Complete your purchase of handcrafted premium furniture via secure payment options.',
    keywords: 'checkout, billing address Ghana, secure checkout, paystack furniture'
  });

  const { items, subtotal, totalItems, currency, exchangeRate } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if unauthenticated (Checkout Guard)
  useEffect(() => {
    if (!user) {
      toast.warning('Please log in to proceed to checkout');
      navigate('/login?redirect=checkout');
    }
  }, [user, navigate]);

  // Step state
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('Ghana');
  
  // Totals & fees states
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [feeError, setFeeError] = useState<string | null>(null);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'postpay'>('online');

  // Fetch delivery fee when country or region changes
  useEffect(() => {
    const fetchDeliveryFee = async () => {
      // If Ghana is selected but no region, clear fee
      if (country.toLowerCase() === 'ghana' && !region) {
        setDeliveryFee(null);
        setFeeError(null);
        return;
      }

      setLoading(true);
      setFeeError(null);
      try {
        const res = await client.get('/content/delivery-zones');
        const zones = res.data;
        
        if (country.toLowerCase() !== 'ghana') {
          // Find international zone
          const matchedZone = zones.find((z: any) => 
            z.name === 'International Delivery' || z.regions.includes('International')
          );
          if (matchedZone) {
            setDeliveryFee(parseFloat(matchedZone.base_fee));
          } else {
            // Fallback base fee if database zone missing
            setDeliveryFee(450.00);
          }
        } else {
          // Find zone that contains selected region
          const matchedZone = zones.find((z: any) => z.regions.includes(region));
          if (matchedZone) {
            setDeliveryFee(parseFloat(matchedZone.base_fee));
          } else {
            setDeliveryFee(null);
            setFeeError(`We do not support deliveries to the ${region} region at the moment.`);
          }
        }
      } catch (error) {
        console.error('Error fetching delivery zones:', error);
        setFeeError('Could not calculate delivery fee. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryFee();
  }, [country, region]);

  // Handle Step 1 Submit
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !addressLine1 || !city || !region) {
      toast.error('All address fields are required');
      return;
    }
    if (feeError || deliveryFee === null) {
      toast.error('Please select a valid delivery destination');
      return;
    }
    setStep(2);
  };

  // Handle Coupon Application
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    try {
      const res = await client.get('/content/coupons/validate', {
        params: {
          code: couponCode.trim(),
          subtotal,
        },
      });
      setAppliedCoupon(res.data);
      toast.success(`Coupon '${res.data.code}' applied successfully!`);
    } catch (error: any) {
      console.error('Coupon validation failed:', error);
      setAppliedCoupon(null);
      toast.error(error.response?.data?.error || 'Invalid or expired coupon code');
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Handle Order Submit & Paystack Redirect
  const handlePaymentSubmit = async () => {
    setLoading(true);

    const deliveryAddress = {
      full_name: fullName,
      phone,
      address_line1: addressLine1,
      address_line2: addressLine2,
      city,
      region,
      country,
    };

    try {
      const orderPayload = {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        delivery_address: deliveryAddress,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        currency,
        exchange_rate: exchangeRate,
        payment_method: paymentMethod === 'postpay' ? 'postpay' : null
      };

      // Create order and retrieve Paystack URL
      const res = await client.post('/orders/checkout', orderPayload);
      const { authorization_url } = res.data;

      // Note: BUG-05 Fix. We DO NOT call clearCart() here. 
      // The cart is only cleared on the payment verify redirect page on success.
      toast.success('Redirecting to Paystack Secure Checkout...');
      window.location.href = authorization_url;
    } catch (error: any) {
      console.error('Order creation failed:', error);
      toast.error(error.response?.data?.error || 'Failed to place order. Please check stock levels.');
      setLoading(false);
    }
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const currentDeliveryFee = deliveryFee || 0;
  const grandTotal = subtotal + currentDeliveryFee - discountAmount;

  if (items.length === 0) {
    return (
      <div className="pt-40 text-center min-h-[70vh] flex flex-col items-center justify-center font-sans space-y-4">
        <h2 className="font-serif text-2xl font-bold">Your Cart is Empty</h2>
        <Link to="/shop" className="bg-primary text-primary-foreground px-6 py-2.5 text-xs font-bold uppercase tracking-wider">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-32 max-w-7xl mx-auto px-6 space-y-10 min-h-screen font-sans">
      {/* Checkout Progress Stepper */}
      <div className="flex items-center justify-center space-x-4 max-w-md mx-auto text-xs uppercase tracking-wider font-semibold">
        <span className={`${step === 1 ? 'text-accent border-b-2 border-accent' : 'text-muted-foreground'}`}>
          1. Delivery Address
        </span>
        <span className="text-muted-foreground">/</span>
        <span className={`${step === 2 ? 'text-accent border-b-2 border-accent' : 'text-muted-foreground'}`}>
          2. Payment Review
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Left Column: Form steps */}
        <div className="lg:col-span-2 space-y-6">
          {step === 1 ? (
            /* STEP 1: ADDRESS FORM */
            <div className="border border-border bg-card p-6 shadow-card space-y-6">
              <h2 className="font-serif text-xl font-bold border-b border-border pb-3">Delivery Information</h2>
              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recipient Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="E.g. Kofi Mensah"
                      className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="E.g. +233244123456"
                      className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Address Line 1</label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    required
                    placeholder="E.g. House No. 24, boundary road"
                    className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="E.g. Near the East Legon police station"
                    className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Country</label>
                    <select
                      value={country}
                      onChange={(e) => {
                        const nextCountry = e.target.value;
                        setCountry(nextCountry);
                        setRegion(''); // reset region selection/input
                      }}
                      required
                      className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                    >
                      {['Ghana', 'United States', 'United Kingdom', 'Canada', 'Nigeria', 'Germany', 'Other'].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      placeholder="E.g. Accra or London"
                      className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {country.toLowerCase() === 'ghana' ? 'Region (Ghana)' : 'State / Province / Region'}
                  </label>
                  {country.toLowerCase() === 'ghana' ? (
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      required
                      className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                    >
                      <option value="">Select Region</option>
                      {GHANA_REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      required
                      placeholder="E.g. New York, London, Ontario"
                      className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                    />
                  )}
                </div>

                {/* Delivery fee status alerts */}
                {feeError && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3.5 flex items-center space-x-2">
                    <AlertCircle size={16} />
                    <span>{feeError}</span>
                  </div>
                )}

                {deliveryFee !== null && !feeError && (
                  <div className="bg-success/10 border border-success/20 text-success text-xs p-3.5 flex items-center space-x-2">
                    <Check size={16} />
                    <span>Region eligible for delivery! Fee calculated: {formatPrice(deliveryFee)}</span>
                  </div>
                )}

                <div className="pt-4 flex justify-between items-center">
                  <Link to="/cart" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center space-x-1">
                    <ArrowLeft size={14} />
                    <span>Return to Cart</span>
                  </Link>
                  <button
                    type="submit"
                    className="bg-primary hover:bg-accent text-primary-foreground py-3 px-6 text-xs font-bold uppercase tracking-wider inline-flex items-center space-x-2"
                  >
                    <span>Continue to Payment</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* STEP 2: PAYMENT REVIEW */
            <div className="space-y-6">
              {/* Delivery Address Summary */}
              <div className="border border-border bg-card p-6 shadow-card space-y-3">
                <div className="flex justify-between items-baseline border-b border-border pb-2">
                  <h3 className="font-serif text-lg font-bold">Shipping Destination</h3>
                  <button onClick={() => setStep(1)} className="text-xs text-accent font-bold uppercase tracking-wider">
                    Change
                  </button>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <p className="font-bold text-foreground">{fullName}</p>
                  <p>{phone}</p>
                  <p>{addressLine1}</p>
                  {addressLine2 && <p>{addressLine2}</p>}
                  <p>{city}, {region} ({country})</p>
                </div>
              </div>

              {/* Choose Payment Method */}
              <div className="border border-border bg-card p-6 shadow-card space-y-4">
                <h3 className="font-serif text-lg font-bold">Choose Payment Method</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('online')}
                    className={`p-4 border text-left text-xs uppercase tracking-wider font-bold transition-all flex flex-col justify-between ${
                      paymentMethod === 'online'
                        ? 'border-accent bg-accent/5 text-foreground'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="font-bold text-foreground">Secure Card / Momo</span>
                    <span className="text-[10px] text-muted-foreground font-normal normal-case mt-1">Pay online securely via Paystack/Stripe.</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('postpay')}
                    className={`p-4 border text-left text-xs uppercase tracking-wider font-bold transition-all flex flex-col justify-between ${
                      paymentMethod === 'postpay'
                        ? 'border-accent bg-accent/5 text-foreground'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="font-bold text-foreground">Postpay (Pay on Delivery)</span>
                    <span className="text-[10px] text-muted-foreground font-normal normal-case mt-1">Place order now, pay in cash or MOMO on arrival.</span>
                  </button>
                </div>
              </div>

              {/* Coupon Form */}
              <div className="border border-border bg-card p-6 shadow-card space-y-4">
                <h3 className="font-serif text-lg font-bold">Promotions</h3>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-grow flex border border-border bg-background">
                    <Ticket className="absolute left-3 top-3 text-muted-foreground" size={14} />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="ENTER COUPON CODE"
                      disabled={appliedCoupon}
                      className="w-full bg-transparent border-none outline-none py-2.5 pl-9 pr-3 text-xs font-sans placeholder-muted-foreground uppercase text-foreground"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={validatingCoupon || appliedCoupon || !couponCode}
                    className="bg-secondary hover:bg-accent hover:text-accent-foreground text-foreground px-6 text-xs font-bold uppercase tracking-wider border border-border disabled:opacity-50"
                  >
                    {validatingCoupon ? <Loader2 className="animate-spin" size={14} /> : <span>Apply</span>}
                  </button>
                </form>

                {appliedCoupon && (
                  <div className="bg-success/15 border border-success/20 text-success text-xs p-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Check size={16} />
                      <span>Coupon <strong>{appliedCoupon.code}</strong> applied!</span>
                    </div>
                    <button
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode('');
                      }}
                      className="text-xs underline hover:text-foreground uppercase tracking-wider font-bold"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Final Place Order Actions */}
              <div className="border border-border bg-card p-6 shadow-card text-center space-y-6">
                <ShieldCheck className="text-accent mx-auto" size={40} />
                <div className="space-y-2">
                  <h3 className="font-serif text-lg font-bold">
                    {paymentMethod === 'postpay' ? 'Confirm Postpay Order' : 'Secure Online Payment'}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    {paymentMethod === 'postpay'
                      ? 'Your order will be created immediately. You will pay on delivery using Cash or Mobile Money.'
                      : (currency === 'GHS'
                        ? 'You will be securely redirected to Paystack to complete your purchase using Mobile Money, Card, or Bank transfer.'
                        : 'You will be securely redirected to Paystack to complete your purchase using your international Card.')
                    }
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-border pt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center space-x-1"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Delivery</span>
                  </button>
                  
                  <button
                    onClick={handlePaymentSubmit}
                    disabled={loading}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground py-3.5 px-8 text-xs font-bold uppercase tracking-wider inline-flex items-center space-x-2 shadow-card disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>Initializing...</span>
                      </>
                    ) : (
                      <>
                        <span>{paymentMethod === 'postpay' ? 'Place Postpay Order' : `Pay ${formatPrice(grandTotal)} Now`}</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Review Panel */}
        <div className="border border-border bg-card p-6 shadow-card space-y-6">
          <h3 className="font-serif text-lg font-bold border-b border-border pb-3">Order Items ({totalItems})</h3>
          
          {/* Scrollable list of items in cart */}
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border">
            {items.map((item) => {
              const hasSale = item.product.sale_price !== null && item.product.sale_price !== undefined;
              const unitPrice = parseFloat((hasSale ? item.product.sale_price : item.product.price) as string);
              return (
                <div key={item.product.id} className="flex justify-between items-center gap-4 text-xs font-sans">
                  <div className="flex items-center space-x-3 truncate">
                    <img
                      src={item.product.images && item.product.images.length > 0 ? item.product.images[0] : ''}
                      alt={item.product.name}
                      className="w-10 h-10 object-cover bg-secondary border border-border shrink-0"
                    />
                    <div className="truncate">
                      <p className="font-semibold text-foreground truncate">{item.product.name}</p>
                      <p className="text-[10px] text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-foreground">{formatPrice(unitPrice * item.quantity)}</span>
                </div>
              );
            })}
          </div>

          <hr className="border-border" />

          {/* Pricing summary */}
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span className="font-semibold text-foreground">
                {deliveryFee !== null ? formatPrice(deliveryFee) : '---'}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-success font-semibold">
                <span>Discount Applied:</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-4 text-sm font-bold text-foreground">
              <span>Order Total:</span>
              <span className="text-accent">{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
