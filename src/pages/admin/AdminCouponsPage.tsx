import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Tag, X, Loader2, BarChart2 } from 'lucide-react';
import client from '../../api/client';
import { formatPrice, formatDate } from '../../lib/utils';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: string | number;
  min_order_amount: string | number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await client.get('/content/coupons');
      setCoupons(res.data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await client.put(`/content/coupons/${id}`, { is_active: !currentStatus });
      toast.success('Coupon status updated');
      setCoupons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: !currentStatus } : c))
      );
    } catch (e) {
      toast.error('Failed to update coupon status');
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code}"?`)) return;

    try {
      await client.delete(`/content/coupons/${id}`);
      toast.success('Coupon deleted');
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) {
      toast.error('Code and discount value are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        description: description || null,
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        min_order_amount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
        max_uses: maxUses ? parseInt(maxUses, 10) : null,
        expires_at: expiresAt || null,
      };

      const res = await client.post('/content/coupons', payload);
      setCoupons((prev) => [res.data, ...prev]);
      toast.success(`Coupon ${payload.code} created!`);
      
      // Reset form
      setModalOpen(false);
      setCode('');
      setDescription('');
      setDiscountValue('');
      setMinOrderAmount('');
      setMaxUses('');
      setExpiresAt('');
    } catch (error) {
      console.error(error);
      toast.error('Failed to create coupon');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute local KPI counts
  const totalUses = coupons.reduce((sum, c) => sum + c.used_count, 0);
  const activeCount = coupons.filter((c) => c.is_active && (c.expires_at === null || new Date(c.expires_at) > new Date())).length;
  const expiredCount = coupons.filter((c) => c.expires_at !== null && new Date(c.expires_at) < new Date()).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Coupons Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">Configure promo codes, discount values, and limit usage</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-accent hover:bg-accent/90 text-accent-foreground py-2.5 px-5 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-card"
        >
          <Plus size={16} />
          <span>New Coupon</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="border border-border p-5 bg-card shadow-card flex items-center space-x-4">
          <div className="p-3 bg-accent/10 text-accent">
            <Tag size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Active Codes</span>
            <span className="text-lg font-serif font-bold text-foreground">{activeCount} active</span>
          </div>
        </div>

        <div className="border border-border p-5 bg-card shadow-card flex items-center space-x-4">
          <div className="p-3 bg-accent/10 text-accent">
            <Calendar size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Expired Codes</span>
            <span className="text-lg font-serif font-bold text-foreground">{expiredCount} expired</span>
          </div>
        </div>

        <div className="border border-border p-5 bg-card shadow-card flex items-center space-x-4">
          <div className="p-3 bg-accent/10 text-accent">
            <BarChart2 size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Total Uses Logged</span>
            <span className="text-lg font-serif font-bold text-foreground">{totalUses} redemptions</span>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="animate-spin text-accent" size={32} />
          <span className="text-xs text-muted-foreground">Loading coupons...</span>
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border bg-card text-muted-foreground text-xs">
          No coupons created yet.
        </div>
      ) : (
        <div className="border border-border bg-card shadow-card overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-secondary/40 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                <th className="p-4">Code</th>
                <th className="p-4">Discount Value</th>
                <th className="p-4 text-center">Usage Limit (Progress)</th>
                <th className="p-4">Expires</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.map((c) => {
                const isExpired = c.expires_at !== null && new Date(c.expires_at) < new Date();
                
                // Progress calculations
                const max = c.max_uses;
                const used = c.used_count;
                const pct = max ? (used / max) * 100 : 0;
                
                // Color mapping: green < 50%, amber 50-85%, red > 85%
                const barColor = pct < 50 ? 'bg-success' : pct < 85 ? 'bg-warning' : 'bg-destructive';

                return (
                  <tr key={c.id} className="hover:bg-secondary/10">
                    {/* Code & Description */}
                    <td className="p-4">
                      <span className="font-bold text-foreground block tracking-wider">{c.code}</span>
                      {c.description && <span className="text-[10px] text-muted-foreground block mt-0.5">{c.description}</span>}
                    </td>

                    {/* Discount Value & Min Order */}
                    <td className="p-4 font-bold text-foreground">
                      <span className="block">
                        {c.discount_type === 'percentage' ? `${c.discount_value}% Off` : `${formatPrice(c.discount_value)} Off`}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold block mt-0.5">
                        Min Order: {formatPrice(c.min_order_amount)}
                      </span>
                    </td>

                    {/* Progress Bar */}
                    <td className="p-4 max-w-[150px]">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-sans font-semibold text-muted-foreground">
                          <span>{used} Used</span>
                          <span>{max ? `${max} Max` : 'Unlimited'}</span>
                        </div>
                        {max !== null && (
                          <div className="w-full bg-secondary h-1.5 border border-border">
                            <div className={`${barColor} h-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Expiry date status */}
                    <td className="p-4 text-muted-foreground">
                      {c.expires_at ? (
                        <span className={isExpired ? 'text-destructive font-semibold' : ''}>
                          {formatDate(c.expires_at)} {isExpired && '(Expired)'}
                        </span>
                      ) : (
                        <span>Never</span>
                      )}
                    </td>

                    {/* Status active switch */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleActive(c.id, c.is_active)}
                        className={`font-sans font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 border ${
                          c.is_active && !isExpired
                            ? 'bg-success/15 border-success/20 text-success'
                            : 'bg-destructive/10 border-destructive/20 text-destructive'
                        }`}
                      >
                        {c.is_active && !isExpired ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteCoupon(c.id, c.code)}
                        className="border border-border hover:bg-destructive/10 hover:border-destructive/20 text-muted-foreground hover:text-destructive p-2 flex items-center justify-center transition-colors ml-auto"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Coupon Form Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card border border-border max-w-md w-full p-6 shadow-card relative font-sans space-y-6">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1"
            >
              <X size={20} />
            </button>
            <h3 className="font-serif text-lg font-bold border-b border-border pb-2">Create New Coupon</h3>
            
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Coupon Code *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  placeholder="E.g. ACCRAFIRST"
                  className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent uppercase"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g. Flat GHS 50 off on first orders"
                  className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (GHS)</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Discount Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    required
                    placeholder="E.g. 10 or 50"
                    className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Min Order Amount (GHS)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    placeholder="E.g. 100"
                    className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Max Allowed Uses</label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="E.g. 50 (leave blank for unlimited)"
                    className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expiry Date</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-border hover:bg-secondary py-2.5 px-6 text-xs font-bold uppercase tracking-wider text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-accent text-primary-foreground py-2.5 px-6 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-card"
                >
                  {submitting ? <Loader2 className="animate-spin" size={14} /> : null}
                  <span>Create Coupon</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCouponsPage;
