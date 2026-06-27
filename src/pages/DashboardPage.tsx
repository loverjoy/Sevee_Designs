import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, LogOut, Loader2, ArrowRight, Eye, Calendar, MapPin, Tag, Check, AlertCircle } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { formatPrice, formatDate } from '../lib/utils';
import { toast } from 'sonner';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const NIGERIA_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
  'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

const UK_COUNTRIES = ['England', 'Scotland', 'Wales', 'Northern Ireland'];

const UK_ENGLAND_COUNTIES = [
  'Greater London', 'Greater Manchester', 'West Midlands', 'West Yorkshire', 'Merseyside', 'South Yorkshire', 
  'Tyne and Wear', 'Kent', 'Essex', 'Hampshire', 'Lancashire', 'Surrey', 'Hertfordshire', 'Norfolk', 
  'North Yorkshire', 'Other England County'
];

const UK_SCOTLAND_COUNTIES = [
  'Glasgow', 'Edinburgh', 'Fife', 'North Lanarkshire', 'South Lanarkshire', 'Aberdeenshire', 'Highland', 
  'Dundee', 'Aberdeen', 'West Lothian', 'Renfrewshire', 'Other Scotland County'
];

const UK_WALES_COUNTIES = [
  'Cardiff', 'Swansea', 'Rhondda Cynon Taf', 'Carmarthenshire', 'Caerphilly', 'Flintshire', 'Newport', 
  'Bridgend', 'Neath Port Talbot', 'Other Wales County'
];

const UK_NI_COUNTIES = [
  'Antrim', 'Armagh', 'Down', 'Fermanagh', 'Londonderry', 'Tyrone'
];

const CANADA_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia',
  'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Northwest Territories', 'Nunavut', 'Yukon'
];

const GERMANY_STATES = [
  'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse', 'Lower Saxony',
  'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt',
  'Schleswig-Holstein', 'Thuringia'
];

const SOUTH_AFRICA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'
];

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Volta', 'Eastern', 'Western', 'Central', 'Northern', 'Upper East',
  'Upper West', 'Savannah', 'North East', 'Bono', 'Bono East', 'Ahafo', 'Oti', 'Western North'
];

const DashboardPage: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const { addItem, clearCart } = useCart();
  const { wishlist, removeFromWishlist } = useWishlist();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  
  // Profile update form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Shipping location state
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('Ghana');
  const [otherCountry, setOtherCountry] = useState('');
  const [ukCountry, setUkCountry] = useState('England');

  // Expanded order ID state
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedOrderItems, setExpandedOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [ordersSubTab, setOrdersSubTab] = useState<'ongoing' | 'closed'>('ongoing');

  // Clear cart and show toast on payment success redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      clearCart();
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('success');
      setSearchParams(newParams);
      toast.success('Your order was placed successfully!');
    }
  }, [searchParams, clearCart, setSearchParams]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const ordersRes = await client.get('/orders');
        setOrders(ordersRes.data.orders);

         const addressRes = await client.get('/auth/address');
        if (addressRes.data) {
          const addr = addressRes.data;
          setAddressLine1(addr.address_line1 || '');
          setAddressLine2(addr.address_line2 || '');
          setCity(addr.city || '');
          
          if (addr.country === 'United Kingdom' && addr.region && addr.region.includes(' - ')) {
            const parts = addr.region.split(' - ');
            setUkCountry(parts[0]);
            setRegion(parts[1]);
          } else {
            setRegion(addr.region || '');
            setUkCountry('England');
          }
          
          const countriesList = ['Ghana', 'Nigeria', 'United States', 'United Kingdom', 'Canada', 'Germany', 'South Africa'];
          if (countriesList.includes(addr.country)) {
            setCountry(addr.country);
            setOtherCountry('');
          } else {
            setCountry('Other');
            setOtherCountry(addr.country || '');
          }
        }
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
      
      const finalCountry = country === 'Other' ? otherCountry : country;
      const finalRegion = finalCountry === 'United Kingdom' ? `${ukCountry} - ${region}` : region;
      if (addressLine1 || city || finalRegion || finalCountry) {
        await client.put('/auth/address', {
          full_name: fullName || user?.full_name || user?.username || 'Customer',
          phone: phone || '+233244123456',
          address_line1: addressLine1,
          address_line2: addressLine2,
          city,
          region: finalRegion,
          country: finalCountry
        });
      }
      
      toast.success('Profile and location details updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Failed to update profile');
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
          {activeTab === 'orders' && (() => {
            const ongoingOrders = orders.filter((o) =>
              ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status.toLowerCase())
            );
            const closedOrders = orders.filter((o) =>
              ['delivered', 'cancelled', 'refunded'].includes(o.status.toLowerCase())
            );
            const activeList = ordersSubTab === 'ongoing' ? ongoingOrders : closedOrders;

            return (
              <div className="space-y-6">
                <div className="flex justify-between items-baseline border-b border-border pb-3">
                  <h3 className="font-serif text-xl font-bold">Order History</h3>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total: {orders.length} orders</span>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border bg-card text-muted-foreground text-xs">
                    You haven't placed any orders yet.
                  </div>
                ) : (
                  <>
                    {/* Jumia inspired segmented tabs */}
                    <div className="flex border-b border-border mb-6">
                      <button
                        onClick={() => setOrdersSubTab('ongoing')}
                        className={`px-6 py-3 text-xs font-sans font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                          ordersSubTab === 'ongoing'
                            ? 'border-accent text-accent'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Ongoing / In Transit ({ongoingOrders.length})
                      </button>
                      <button
                        onClick={() => setOrdersSubTab('closed')}
                        className={`px-6 py-3 text-xs font-sans font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                          ordersSubTab === 'closed'
                            ? 'border-accent text-accent'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Closed / Past Orders ({closedOrders.length})
                      </button>
                    </div>

                    {activeList.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-border bg-card text-muted-foreground text-xs space-y-4 rounded-none">
                        <p>{ordersSubTab === 'ongoing' ? 'You have no active orders in transit.' : 'No past orders found.'}</p>
                        {ordersSubTab === 'ongoing' && (
                          <Link to="/shop" className="text-accent font-bold uppercase tracking-wider text-[10px] hover:underline block">
                            Continue Shopping
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeList.map((o) => {
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
                                  {/* Cancellation / Refund Alert Banner */}
                                  {['cancelled', 'refunded'].includes(o.status) && (
                                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[11px] p-4 flex items-center space-x-3">
                                      <AlertCircle size={18} />
                                      <div>
                                        <p className="font-bold uppercase tracking-wider">Order {o.status}</p>
                                        <p className="text-[10px] opacity-85 mt-0.5">This transaction has been terminated. Please contact support if you have any questions.</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Visual Tracking Stepper */}
                                  {!['cancelled', 'refunded'].includes(o.status) && (
                                    <div className="border border-border bg-card p-4 shadow-card">
                                      <h4 className="font-serif text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">
                                        Order Tracking Status
                                      </h4>
                                      
                                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                                        {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((stepName, idx, arr) => {
                                          const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
                                          const statusIdx = statusSteps.indexOf(o.status);
                                          const isActive = statusIdx >= idx;
                                          const isCurrent = statusIdx === idx;
                                          return (
                                            <React.Fragment key={stepName}>
                                              <div className="flex items-center space-x-2.5">
                                                <div
                                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-all ${
                                                    isCurrent
                                                      ? 'bg-accent text-accent-foreground ring-4 ring-accent/20'
                                                      : isActive
                                                      ? 'bg-primary text-primary-foreground'
                                                      : 'bg-secondary text-muted-foreground border border-border'
                                                  }`}
                                                >
                                                  {isActive && !isCurrent ? <Check size={10} /> : idx + 1}
                                                </div>
                                                <div>
                                                  <span
                                                    className={`block text-[9px] uppercase tracking-wider font-bold ${
                                                      isCurrent ? 'text-accent' : isActive ? 'text-foreground' : 'text-muted-foreground'
                                                    }`}
                                                  >
                                                    {stepName}
                                                  </span>
                                                  <span className="block text-[8px] text-muted-foreground capitalize">
                                                    {isCurrent ? 'Current Status' : isActive ? 'Completed' : 'Upcoming'}
                                                  </span>
                                                </div>
                                              </div>
                                              {idx < arr.length - 1 && (
                                                <div className={`hidden md:block flex-grow h-0.5 mx-2 ${statusIdx > idx ? 'bg-primary' : 'bg-border'}`}></div>
                                              )}
                                            </React.Fragment>
                                          );
                                        })}
                                      </div>
                                      
                                      {o.tracking_number && (
                                        <div className="border-t border-border mt-4 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10px]">
                                          <span className="text-muted-foreground">Carrier Tracking Number: <strong className="text-foreground">{o.tracking_number}</strong></span>
                                          <a
                                            href={`https://track.seveedesigns.com/${o.tracking_number}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-accent hover:underline font-bold uppercase tracking-wider"
                                          >
                                            Track Package Details
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  )}

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
                  </>
                )}
              </div>
            );
          })()}

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

                {/* Shipping Location Header */}
                <h4 className="font-serif text-sm font-bold border-b border-border pt-4 pb-2">Default Shipping Location</h4>

                {/* Country & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                    >
                      <option value="Ghana">Ghana</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Germany">Germany</option>
                      <option value="South Africa">South Africa</option>
                      <option value="Other">Other (International)</option>
                    </select>
                  </div>
                  {country === 'United Kingdom' && (
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">UK Country</label>
                      <select
                        value={ukCountry}
                        onChange={(e) => {
                          setUkCountry(e.target.value);
                          setRegion(''); // reset region/county when UK country changes
                        }}
                        className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                      >
                        {UK_COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {country === 'Other' && (
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Specify Country</label>
                      <input
                        type="text"
                        value={otherCountry}
                        onChange={(e) => setOtherCountry(e.target.value)}
                        required
                        placeholder="Specify country name"
                        className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                      />
                    </div>
                  )}
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="E.g. Accra"
                      className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                    />
                  </div>
                </div>

                {/* Region & Address Line 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Region / State</label>
                    {(() => {
                      let options: string[] = [];
                      let placeholder = "Select Region / State";

                      if (country === 'Ghana') {
                        options = GHANA_REGIONS;
                        placeholder = "Select Region";
                      } else if (country === 'United States') {
                        options = US_STATES;
                        placeholder = "Select State";
                      } else if (country === 'Nigeria') {
                        options = NIGERIA_STATES;
                        placeholder = "Select State";
                      } else if (country === 'United Kingdom') {
                        placeholder = "Select County";
                        if (ukCountry === 'England') {
                          options = UK_ENGLAND_COUNTIES;
                        } else if (ukCountry === 'Scotland') {
                          options = UK_SCOTLAND_COUNTIES;
                        } else if (ukCountry === 'Wales') {
                          options = UK_WALES_COUNTIES;
                        } else if (ukCountry === 'Northern Ireland') {
                          options = UK_NI_COUNTIES;
                        }
                      } else if (country === 'Canada') {
                        options = CANADA_PROVINCES;
                        placeholder = "Select Province";
                      } else if (country === 'Germany') {
                        options = GERMANY_STATES;
                        placeholder = "Select State";
                      } else if (country === 'South Africa') {
                        options = SOUTH_AFRICA_PROVINCES;
                        placeholder = "Select Province";
                      }

                      if (options.length > 0) {
                        return (
                          <select
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                          >
                            <option value="">{placeholder}</option>
                            {options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        );
                      }

                      return (
                        <input
                          type="text"
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          placeholder="E.g. California, Lagos, Ontario"
                          className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                        />
                      );
                    })()}
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Address Line 1</label>
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="E.g. Street name, House number"
                      className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                    />
                  </div>
                </div>

                {/* Address Line 2 */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Address Line 2 (Optional / GPS)</label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="E.g. Apartment or GPS Address"
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
