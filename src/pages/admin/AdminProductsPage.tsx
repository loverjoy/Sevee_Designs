import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit3, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import client from '../../api/client';
import { formatPrice } from '../../lib/utils';
import { toast } from 'sonner';

const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await client.get('/products', {
        params: {
          isAdminView: 'true',
          limit: 100, // retrieve all for admin view
        },
      });
      setProducts(res.data.products);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to retrieve products list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await client.put(`/products/${id}`, { is_active: !currentStatus });
      toast.success('Product status updated');
      
      // Update state locally
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p))
      );
    } catch (e) {
      toast.error('Failed to toggle status');
    }
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      await client.put(`/products/${id}`, { is_featured: !currentStatus });
      toast.success('Product featured status updated');
      
      // Update state locally
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_featured: !currentStatus } : p))
      );
    } catch (e) {
      toast.error('Failed to toggle featured status');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the product "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await client.delete(`/products/${id}`);
      toast.success(`Product "${name}" deleted`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  // Filter products locally by search query
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category_name && p.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Product Catalog</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage products, stock levels, and AR model links</p>
        </div>
        <Link
          to="/admin/products/new"
          className="bg-accent hover:bg-accent/90 text-accent-foreground py-2.5 px-5 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-card"
        >
          <Plus size={16} />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="border border-border p-4 bg-card shadow-card flex items-center gap-4">
        <div className="relative flex-grow max-w-xs flex border border-border bg-background">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalog by name or category..."
            className="w-full bg-transparent border-none outline-none py-2 px-3 text-xs placeholder-muted-foreground text-foreground"
          />
          <div className="px-3 py-2 text-muted-foreground bg-secondary border-l border-border">
            <Search size={14} />
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider ml-auto">
          {filteredProducts.length} items listed
        </span>
      </div>

      {/* Catalog Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="animate-spin text-accent" size={32} />
          <span className="text-xs text-muted-foreground">Loading products list...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border bg-card text-muted-foreground text-xs">
          No products found.
        </div>
      ) : (
        <div className="border border-border bg-card shadow-card overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-secondary/40 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                <th className="p-4">Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4 text-center">Stock</th>
                <th className="p-4 text-center">Featured</th>
                <th className="p-4 text-center">Active</th>
                <th className="p-4 text-center">3D AR</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock_quantity <= 0;
                const isLowStock = p.stock_quantity > 0 && p.stock_quantity < 5;
                const hasSale = p.sale_price !== null && p.sale_price !== undefined;
                return (
                  <tr key={p.id} className="hover:bg-secondary/10">
                    {/* Image & Name */}
                    <td className="p-4 font-bold text-foreground">
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={p.images && p.images.length > 0 ? p.images[0] : ''}
                          alt={p.name}
                          className="w-10 h-10 object-cover bg-secondary border border-border shrink-0"
                        />
                        <span className="truncate">{p.name}</span>
                      </div>
                    </td>
                    
                    {/* Category */}
                    <td className="p-4 text-muted-foreground">{p.category_name || 'Uncategorized'}</td>
                    
                    {/* Price */}
                    <td className="p-4 font-bold text-foreground">
                      {hasSale ? (
                        <div className="space-y-0.5">
                          <span className="text-accent block">{formatPrice(p.sale_price)}</span>
                          <span className="text-[10px] text-muted-foreground line-through block">{formatPrice(p.price)}</span>
                        </div>
                      ) : (
                        <span>{formatPrice(p.price)}</span>
                      )}
                    </td>
                    
                    {/* Stock */}
                    <td className="p-4 text-center">
                      <span
                        className={`font-semibold inline-block px-2 py-0.5 ${
                          isOutOfStock
                            ? 'bg-destructive/10 text-destructive'
                            : isLowStock
                            ? 'bg-warning/15 text-warning'
                            : 'bg-success/15 text-success'
                        }`}
                      >
                        {p.stock_quantity} units
                      </span>
                    </td>
                    
                    {/* Featured toggle */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleFeatured(p.id, p.is_featured)}
                        className="text-foreground hover:text-accent p-1 transition-colors"
                        aria-label="Toggle Featured"
                      >
                        {p.is_featured ? <ToggleRight size={22} className="text-accent" /> : <ToggleLeft size={22} className="text-muted-foreground" />}
                      </button>
                    </td>
                    
                    {/* Active toggle */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleActive(p.id, p.is_active)}
                        className="text-foreground hover:text-accent p-1 transition-colors"
                        aria-label="Toggle Active"
                      >
                        {p.is_active ? <ToggleRight size={22} className="text-accent" /> : <ToggleLeft size={22} className="text-muted-foreground" />}
                      </button>
                    </td>

                    {/* 3D AR Model Icon check */}
                    <td className="p-4 text-center text-muted-foreground">
                      {p.model_url ? (
                        <span className="text-success font-bold text-[10px] uppercase tracking-wider bg-success/10 px-2 py-0.5">
                          Yes
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">
                          No
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <Link
                          to={`/admin/products/${p.id}/edit`}
                          className="border border-border hover:bg-secondary text-foreground p-2 flex items-center justify-center transition-colors"
                          aria-label="Edit"
                        >
                          <Edit3 size={14} />
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="border border-border hover:bg-destructive/10 hover:border-destructive/20 text-muted-foreground hover:text-destructive p-2 flex items-center justify-center transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
