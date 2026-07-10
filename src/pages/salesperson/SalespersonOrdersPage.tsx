import React, { useState, useEffect } from 'react';
import { Loader2, Search, SlidersHorizontal, ArrowRight, Check, MapPin, Tag, Calendar, Eye } from 'lucide-react';
import client from '../../api/client';
import { formatPrice, formatDate } from '../../lib/utils';
import { toast } from 'sonner';

// Status sequence for salesperson progression
const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const SalespersonOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Expanded order detail state
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedOrderItems, setExpandedOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await client.get('/orders', {
        params: {
          limit: 100,
          status: statusFilter || undefined,
        },
      });
      setOrders(res.data.orders);
    } catch (e) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleAdvanceStatus = async (orderId: string, currentStatus: string) => {
    const currentIndex = STATUS_STEPS.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === STATUS_STEPS.length - 1) {
      return; // Can't advance beyond 'delivered'
    }

    const nextStatus = STATUS_STEPS[currentIndex + 1];

    try {
      await client.put(`/orders/${orderId}/status`, { status: nextStatus });
      toast.success(`Order advanced to: ${nextStatus.toUpperCase()}`);
      
      // Update state locally
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
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

  const filteredOrders = orders.filter((o) =>
    o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.customer_name && o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold">Salesperson Order Flow</h1>
        <p className="text-xs text-muted-foreground mt-1">Advance orders sequentially through delivery steps and trigger notifications</p>
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
            <option value="">All Flow Statuses</option>
            {STATUS_STEPS.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="animate-spin text-accent" size={32} />
          <span className="text-xs text-muted-foreground">Loading orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border bg-card text-muted-foreground text-xs">
          No orders active in status flow.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((o) => {
            const isExpanded = expandedOrderId === o.id;
            const address = typeof o.delivery_address === 'string' ? JSON.parse(o.delivery_address) : o.delivery_address;
            const statusIdx = STATUS_STEPS.indexOf(o.status);
            const canAdvance = statusIdx !== -1 && statusIdx < STATUS_STEPS.length - 1;

            return (
              <div key={o.id} className="border border-border bg-card shadow-card">
                {/* Header Grid */}
                <div
                  onClick={() => handleToggleOrder(o.id)}
                  className="p-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 cursor-pointer hover:bg-secondary/20 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-foreground">#{o.order_number}</span>
                      <span className="text-[10px] text-muted-foreground">| {o.customer_name || 'Guest'} ({formatPrice(o.total)})</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center space-x-1.5">
                      <Calendar size={12} />
                      <span>{formatDate(o.created_at)}</span>
                    </p>
                  </div>

                  {/* Flow Steps Indicator (visual progress stepper) */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto w-full xl:w-auto scrollbar-none py-1">
                    {STATUS_STEPS.map((stepName, idx) => {
                      const isActive = statusIdx >= idx;
                      const isCurrent = statusIdx === idx;
                      return (
                        <React.Fragment key={stepName}>
                          <div className="flex items-center space-x-1 shrink-0">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                                isCurrent
                                  ? 'bg-accent text-accent-foreground ring-2 ring-accent/30'
                                  : isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-muted-foreground border border-border'
                              }`}
                            >
                              {isActive && !isCurrent ? <Check size={8} /> : idx + 1}
                            </div>
                            <span
                              className={`text-[9px] uppercase tracking-wider font-bold ${
                                isCurrent ? 'text-accent' : isActive ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              {stepName}
                            </span>
                          </div>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div className={`w-4 h-0.5 shrink-0 ${statusIdx > idx ? 'bg-primary' : 'bg-border'}`}></div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Advance Button Action */}
                  <div className="flex items-center gap-4 w-full xl:w-auto justify-end shrink-0" onClick={(e) => e.stopPropagation()}>
                    {canAdvance ? (
                      <button
                        onClick={() => handleAdvanceStatus(o.id, o.status)}
                        className="bg-primary hover:bg-accent text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 shadow-card transition-colors flex items-center space-x-1.5"
                      >
                        <span>Advance to {STATUS_STEPS[statusIdx + 1]}</span>
                        <ArrowRight size={10} />
                      </button>
                    ) : (
                      <span className="text-[9px] uppercase tracking-wider font-bold bg-success/10 text-success border border-success/20 px-2.5 py-1">
                        Flow Complete
                      </span>
                    )}
                    <Eye size={16} className="text-muted-foreground hidden xl:block cursor-pointer" onClick={() => handleToggleOrder(o.id)} />
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border p-6 bg-background/50 space-y-6 text-xs leading-relaxed">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Shipping info */}
                      <div className="space-y-2">
                        <h4 className="font-serif text-sm font-bold flex items-center space-x-1">
                          <MapPin size={14} className="text-accent" />
                          <span>Delivery Address Details</span>
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

export default SalespersonOrdersPage;
