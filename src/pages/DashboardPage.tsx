import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoppingCart, Heart, LogOut, Loader2, ArrowRight, Eye, Calendar, MapPin, Tag } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { formatPrice, formatDate } from '../lib/utils';
import { toast } from 'sonner';

const DashboardPage: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const { addItem } = useCart();
  const { wishlist, removeFromWishlist } = useWishlist();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  
  // Profile update form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Expanded order ID state
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedOrderItems, setExpandedOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const ordersRes = await client.get('/orders');
        setOrders(ordersRes.data.orders);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await updateProfile({ full_name: fullName, phone, avatar_url: user?.avatar_url || '' });
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleToggleOrder = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    setExpandedOrderId(orderId);
    setLoadingItems(true);
    try {
      const res = await client.get(`/orders/${orderId}`);
      setExpandedOrderItems(res.data.order_items || []);
    } catch (error) {
      toast.error('Failed to load order items');
    } finally {
      setLoadingItems(false);
    }
  };

  const changeTab = (tab: string) => {
    setSearchParams({ tab });
  };

  if (loading) {
    return (
      <div className="pt-40 text-center min-h-[70vh] flex flex-col items-center justify-center font-sans">
        <Loader2 className="animate-spin text-accent mb-4" size={32} />
        <p className="text-xs text-muted-foreground">Loading account details...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 max-w-7xl mx-auto px-6 space-y-10 min-h-screen font-sans">
      {/* Account Welcoming Grid */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">My Account</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Hello, <span className="font-bold text-foreground">{user?.full_name || user?.username}</span> (Role: <span className="capitalize">{user?.role}</span>)
          </p>
        </div>
        <button
          onClick={logout}
          className="border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 text-muted-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Navigation Sidebar (Scrollable row on mobile, sidebar list on desktop) */}
        <div className="lg:col-span-1 overflow-x-auto lg:overflow-visible flex lg:flex-col border border-border bg-card shadow-card p-2 gap-1 shrink-0 scrollbar-none">
          <button
            onClick={() => changeTab('overview')}
            className={`px-4 py-3 text-left text-xs uppercase tracking-wider font-bold shrink-0 transition-colors w-full ${
              activeTab === 'overview' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => changeTab('orders')}
            className={`px-4 py-3 text-left text-xs uppercase tracking-wider font-bold shrink-0 transition-colors w-full ${
              activeTab === 'orders' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-foreground'
            }`}
          >
            My Orders ({orders.length})
          </button>
          <button
            onClick={() => changeTab('wishlist')}
            className={`px-4 py-3 text-left text-xs uppercase tracking-wider font-bold shrink-0 transition-colors w-full ${
              activeTab === 'wishlist' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-foreground'
            }`}
          >
            Wishlist ({wishlist.length})
          </button>
          <button
            onClick={() => changeTab('profile')}
            className={`px-4 py-3 text-left text-xs uppercase tracking-wider font-bold shrink-0 transition-colors w-full ${
              activeTab === 'profile' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-foreground'
            }`}
          >
            Profile Settings
          </button>
        </div>

        {/* Dynamic Content Columns */}
        <div className="lg:col-span-3">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Statistic Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="border border-border p-6 bg-card shadow-card flex items-center space-x-4">
                  <div className="p-3 bg-accent/10 text-accent">
                    <ShoppingCart size={24} />
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Orders placed</span>
                    <span className="text-2xl font-serif font-bold text-foreground">{orders.length} orders</span>
                  </div>
                </div>

                <div className="border border-border p-6 bg-card shadow-card flex items-center space-x-4">
                  <div className="p-3 bg-accent/10 text-accent">
                    <Heart size={24} />
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Saved Items</span>
                    <span className="text-2xl font-serif font-bold text-foreground">{wishlist.length} products</span>
                  </div>
                </div>
              </div>

              {/* Recent Orders teaser */}
              <div className="border border-border bg-card p-6 shadow-card space-y-4">
                <div className="flex justify-between items-baseline border-b border-border pb-3">
                  <h3 className="font-serif text-lg font-bold">Recent Orders</h3>
                  <button onClick={() => changeTab('orders')} className="text-xs text-accent font-bold uppercase tracking-wider flex items-center space-x-1">
                    <span>View All</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
                {orders.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No orders placed yet.</p>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((o) => (
                      <div key={o.id} className="flex justify-between items-center p-3.5 border border-border bg-background">
                        <div>
                          <p className="text-xs font-bold text-foreground">#{o.order_number}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(o.created_at)}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 status-${o.status}`}>
                            {o.status}
                          </span>
                          <span className="text-xs font-bold text-foreground">{formatPrice(o.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h3 className="font-serif text-xl font-bold border-b border-border pb-3">Order History</h3>
              {orders.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border bg-card text-muted-foreground text-xs">
                  You haven't placed any orders yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((o) => {
                    const isExpanded = expandedOrderId === o.id;
                    const address = typeof o.delivery_address === 'string' ? JSON.parse(o.delivery_address) : o.delivery_address;
                    return (
                      <div key={o.id} className="border border-border bg-card shadow-card">
                        {/* Order Header Grid */}
                        <div
                          onClick={() => handleToggleOrder(o.id)}
                          className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-secondary/20 transition-colors"
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-foreground">#{o.order_number}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center space-x-1.5">
                              <Calendar size={12} />
                              <span>{formatDate(o.created_at)}</span>
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 status-${o.status}`}>
                              {o.status}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 pay-${o.payment_status}`}>
                              {o.payment_status}
                            </span>
                            <span className="text-sm font-bold text-foreground">{formatPrice(o.total)}</span>
                            <Eye size={16} className="text-muted-foreground hidden sm:block" />
                          </div>
                        </div>

                        {/* Order Expanded Details Panel */}
                        {isExpanded && (
                          <div className="border-t border-border p-6 bg-background/50 space-y-6 text-xs leading-relaxed">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Shipping address info */}
                              <div className="space-y-2">
                                <h4 className="font-serif text-sm font-bold flex items-center space-x-1">
                                  <MapPin size={14} className="text-accent" />
                                  <span>Shipping Destination</span>
                                </h4>
                                <div className="text-muted-foreground">
                                  <p className="font-bold text-foreground">{address.full_name}</p>
                                  <p>{address.phone}</p>
                                  <p>{address.address_line1}</p>
                                  {address.address_line2 && <p>{address.address_line2}</p>}
                                  <p>{address.city}, {address.region} Region, {address.country}</p>
                                </div>
                              </div>

                              {/* Price breakdown */}
                              <div className="space-y-2">
                                <h4 className="font-serif text-sm font-bold flex items-center space-x-1">
                                  <Tag size={14} className="text-accent" />
                                  <span>Payment Summary</span>
                                </h4>
                                <div className="space-y-1 text-muted-foreground">
                                  <div className="flex justify-between">
                                    <span>Items Subtotal:</span>
                                    <span>{formatPrice(o.subtotal)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Delivery Fee:</span>
                                    <span>{formatPrice(o.delivery_fee)}</span>
                                  </div>
                                  {parseFloat(o.discount_amount) > 0 && (
                                    <div className="flex justify-between text-accent font-semibold">
                                      <span>Promo Discount:</span>
                                      <span>-{formatPrice(o.discount_amount)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground text-sm">
                                    <span>Grand Total:</span>
                                    <span>{formatPrice(o.total)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Order Items list */}
                            <div className="space-y-3">
                              <h4 className="font-serif text-sm font-bold">Items Purchased</h4>
                              {loadingItems ? (
                                <div className="flex items-center space-x-2 text-muted-foreground">
                                  <Loader2 className="animate-spin" size={14} />
                                  <span>Loading items...</span>
                                </div>
                              ) : (
                                <div className="border border-border bg-card shadow-card">
                                  {expandedOrderItems.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center p-3 border-b border-border last:border-b-0 gap-4">
                                      <div className="flex items-center space-x-3 min-w-0">
                                        <img src={item.product_image || ''} alt={item.product_name} className="w-8 h-8 object-cover bg-secondary border border-border shrink-0" />
                                        <div className="min-w-0">
                                          <p className="font-bold truncate">{item.product_name}</p>
                                          <p className="text-[10px] text-muted-foreground">Quantity: {item.quantity} x {formatPrice(item.unit_price)}</p>
                                        </div>
                                      </div>
                                      <span className="font-bold shrink-0">{formatPrice(item.total_price)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <h3 className="font-serif text-xl font-bold border-b border-border pb-3">My Favourites</h3>
              {wishlist.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border bg-card text-muted-foreground text-xs">
                  No products saved to your favourites yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {wishlist.map((prod) => {
                    if (!prod) return null;
                    const displayPrice = prod.sale_price !== null ? parseFloat(prod.sale_price as string) : parseFloat(prod.price as string);
                    return (
                      <div key={prod.id} className="border border-border bg-card p-4 shadow-card flex flex-col h-full space-y-3">
                        <div className="aspect-square bg-secondary border border-border relative overflow-hidden">
                          <img src={prod.images && prod.images.length > 0 ? prod.images[0] : ''} alt={prod.name} className="w-full h-full object-cover shadow-card" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-serif text-sm font-bold truncate">{prod.name}</h4>
                          <span className="text-xs text-accent font-sans mt-0.5 block">{formatPrice(displayPrice)}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border">
                          <button
                            onClick={() => addItem(prod)}
                            disabled={prod.stock_quantity <= 0}
                            className="bg-primary hover:bg-accent disabled:bg-muted disabled:text-muted-foreground text-primary-foreground py-2 text-[10px] font-sans font-bold uppercase tracking-wider text-center w-full transition-colors rounded-none"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => removeFromWishlist(prod.id)}
                            className="border border-border hover:bg-secondary text-muted-foreground py-2 text-[10px] font-sans font-bold uppercase tracking-wider text-center w-full transition-colors rounded-none"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="border border-border bg-card p-6 shadow-card space-y-6 max-w-xl">
              <h3 className="font-serif text-xl font-bold border-b border-border pb-3">Profile Details</h3>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email (Disabled)</label>
                    <input
                      type="email"
                      value={user?.email}
                      disabled
                      className="border border-border bg-secondary p-2.5 text-xs outline-none text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Username (Disabled)</label>
                    <input
                      type="text"
                      value={user?.username}
                      disabled
                      className="border border-border bg-secondary p-2.5 text-xs outline-none text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
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
                    placeholder="E.g. +233244123456"
                    className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="bg-primary hover:bg-accent text-primary-foreground py-2.5 px-6 text-xs font-bold uppercase tracking-wider inline-flex items-center space-x-2"
                >
                  {updatingProfile ? <Loader2 className="animate-spin" size={14} /> : <span>Save Changes</span>}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
