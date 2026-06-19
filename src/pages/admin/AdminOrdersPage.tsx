import React, { useState, useEffect } from 'react';
import { Loader2, Search, SlidersHorizontal, Eye, Calendar, MapPin, Tag } from 'lucide-react';
import client from '../../api/client';
import { formatPrice, formatDate } from '../../lib/utils';
import { toast } from 'sonner';

const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Expanded order detail state
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedOrderItems, setExpandedOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await client.get('/orders', {
        params: {
          limit: 100, // retrieve all for admin view
          status: statusFilter || undefined,
        },
      });
      setOrders(res.data.orders);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to retrieve orders list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await client.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      
      // Update locally
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (e) {
      toast.error('Failed to update status');
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

  // Filter orders locally by search query
  const filteredOrders = orders.filter((o) =>
    o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.customer_name && o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (o.customer_email && o.customer_email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold">Order Management</h1>
        <p className="text-xs text-muted-foreground mt-1">Track payments, update delivery status, and review addresses</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="border border-border p-4 bg-card shadow-card flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-xs flex border border-border bg-background">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order # or customer..."
            className="w-full bg-transparent border-none outline-none py-2 px-3 text-xs placeholder-muted-foreground text-foreground"
          />
          <div className="px-3 py-2 text-muted-foreground bg-secondary border-l border-border">
            <Search size={14} />
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <SlidersHorizontal size={14} className="text-muted-foreground shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background border border-border text-xs py-2 px-3 outline-none text-foreground w-full sm:w-40"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="animate-spin text-accent" size={32} />
          <span className="text-xs text-muted-foreground">Loading orders list...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border bg-card text-muted-foreground text-xs">
          No orders registered matching filters.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((o) => {
            const isExpanded = expandedOrderId === o.id;
            const address = typeof o.delivery_address === 'string' ? JSON.parse(o.delivery_address) : o.delivery_address;
            return (
              <div key={o.id} className="border border-border bg-card shadow-card">
                {/* Order Header */}
                <div
                  onClick={() => handleToggleOrder(o.id)}
                  className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-secondary/20 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-foreground">#{o.order_number}</span>
                      <span className="text-[10px] text-muted-foreground">| {o.customer_name || 'Guest'} ({o.customer_email || 'No email'})</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center space-x-1.5">
                      <Calendar size={12} />
                      <span>{formatDate(o.created_at)}</span>
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    {/* Status Select dropdown */}
                    <div onClick={(e) => e.stopPropagation()} className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Status:</span>
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
                        className={`text-[10px] font-bold uppercase border border-border bg-background py-1 px-2 outline-none status-${o.status}`}
                      >
                        <option value="pending" className="bg-background text-foreground">Pending</option>
                        <option value="confirmed" className="bg-background text-foreground">Confirmed</option>
                        <option value="processing" className="bg-background text-foreground">Processing</option>
                        <option value="shipped" className="bg-background text-foreground">Shipped</option>
                        <option value="delivered" className="bg-background text-foreground">Delivered</option>
                        <option value="cancelled" className="bg-background text-foreground text-destructive">Cancelled</option>
                        <option value="refunded" className="bg-background text-foreground">Refunded</option>
                      </select>
                    </div>

                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 pay-${o.payment_status}`}>
                      {o.payment_status}
                    </span>
                    
                    <span className="text-xs font-bold text-foreground w-20 text-right">{formatPrice(o.total)}</span>
                    <Eye size={16} className="text-muted-foreground hidden md:block" />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border p-6 bg-background/50 space-y-6 text-xs leading-relaxed">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Shipping Address */}
                      <div className="space-y-2">
                        <h4 className="font-serif text-sm font-bold flex items-center space-x-1">
                          <MapPin size={14} className="text-accent" />
                          <span>Delivery Location Details</span>
                        </h4>
                        <div className="text-muted-foreground">
                          <p className="font-bold text-foreground">{address.full_name}</p>
                          <p>Phone: {address.phone}</p>
                          <p>Address: {address.address_line1}</p>
                          {address.address_line2 && <p>{address.address_line2}</p>}
                          <p>{address.city}, {address.region} Region, {address.country}</p>
                        </div>
                      </div>

                      {/* Payment summary */}
                      <div className="space-y-2">
                        <h4 className="font-serif text-sm font-bold flex items-center space-x-1">
                          <Tag size={14} className="text-accent" />
                          <span>Financial Summary</span>
                        </h4>
                        <div className="space-y-1 text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
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
                          <div className="pt-2 text-[10px] text-muted-foreground">
                            <span>Reference Notes: {o.notes || 'No payment reference logged'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items Purchased */}
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
  );
};

export default AdminOrdersPage;
