import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import client from '../api/client';
import ProductCard from '../components/ProductCard';
import type { Product } from '../contexts/CartContext';
import useSEO from '../hooks/useSEO';

const ShopPage: React.FC = () => {
  useSEO({
    title: 'Shop Premium Solid Wood Furniture',
    description: 'Browse our architectural furniture catalog of dining tables, lounge chairs, credenzas, and custom hardwood pieces.',
    keywords: 'shop furniture Accra, hardwood tables Ghana, buy custom credenzas, geometric wood design'
  });

  const [searchParams, setSearchParams] = useSearchParams();
  
  // State from URL params or default
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('q') || '';
  const sortParam = searchParams.get('sort') || 'newest';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters state
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [sortBy, setSortBy] = useState(sortParam);
  const [offset, setOffset] = useState(0);
  const limit = 12;

  // Fetch categories on load
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await client.get('/products/categories');
        setCategories(res.data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products when filters, sort or offset change
  useEffect(() => {
    const fetchProducts = async () => {
      if (offset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await client.get('/products', {
          params: {
            category: categoryParam,
            q: searchParam,
            sort: sortParam,
            limit,
            offset,
          },
        });

        if (offset === 0) {
          setProducts(res.data.products);
        } else {
          setProducts((prev) => [...prev, ...res.data.products]);
        }
        setTotalCount(res.data.totalCount);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchProducts();
  }, [categoryParam, searchParam, sortParam, offset]);

  // Synchronize component state with URL params
  useEffect(() => {
    setSelectedCategory(categoryParam);
    setSearchQuery(searchParam);
    setSortBy(sortParam);
  }, [categoryParam, searchParam, sortParam]);

  // Handle filter changes (resets offset to 0)
  const applyFilters = (newCategory: string, newSearch: string, newSort: string) => {
    const params: Record<string, string> = {};
    if (newCategory) params.category = newCategory;
    if (newSearch) params.q = newSearch;
    if (newSort) params.sort = newSort;

    setSearchParams(params);
    setOffset(0); // Reset pagination
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    applyFilters(e.target.value, searchQuery, sortBy);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    applyFilters(selectedCategory, searchQuery, e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(selectedCategory, searchQuery, sortBy);
  };

  const loadMore = () => {
    if (products.length < totalCount) {
      setOffset((prev) => prev + limit);
    }
  };

  return (
    <div className="pt-32 max-w-7xl mx-auto px-6 space-y-10 min-h-screen">
      {/* Page Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="text-4xl font-serif font-bold">Shop Collection</h1>
        <p className="text-xs text-muted-foreground font-sans leading-relaxed">
          Browse our architectural furniture catalog. Sourced sustainably, designed with geometry, and built to last.
        </p>
      </div>

      {/* Filter and Search Bar Container */}
      <div className="border border-border p-4 bg-card shadow-card flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-xs flex border border-border bg-background">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full bg-transparent border-none outline-none py-2 px-3 text-xs font-sans placeholder-muted-foreground text-foreground"
          />
          <button type="submit" className="px-3 text-muted-foreground hover:text-accent border-l border-border bg-secondary">
            <Search size={14} />
          </button>
        </form>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end font-sans">
          {/* Category Dropdown */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <SlidersHorizontal size={14} className="text-muted-foreground shrink-0" />
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="bg-background border border-border text-xs py-2 px-3 outline-none text-foreground w-full sm:w-40"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="bg-background border border-border text-xs py-2 px-3 outline-none text-foreground w-full sm:w-40"
          >
            <option value="newest">Sort by: Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="space-y-12">
        {/* Showing Count */}
        <div className="text-xs text-muted-foreground font-sans border-b border-border pb-3 flex justify-between items-center">
          <span>
            Showing {products.length} of {totalCount} products
          </span>
          {categoryParam && (
            <button
              onClick={() => applyFilters('', searchQuery, sortBy)}
              className="text-accent hover:text-foreground font-semibold uppercase tracking-wider"
            >
              Clear Category Filter
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="animate-spin text-accent" size={32} />
            <span className="text-xs text-muted-foreground font-sans">Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 space-y-3 border border-dashed border-border bg-card">
            <p className="text-sm text-muted-foreground font-sans">No products match your selected filters.</p>
            <button
              onClick={() => applyFilters('', '', 'newest')}
              className="bg-primary hover:bg-accent text-primary-foreground text-[10px] font-sans font-bold uppercase tracking-wider px-4 py-2"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Load More Paginator */}
        {products.length < totalCount && (
          <div className="text-center pt-8">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="border border-primary hover:bg-primary hover:text-primary-foreground text-primary font-sans text-xs font-bold uppercase tracking-wider px-8 py-3.5 inline-flex items-center space-x-2 disabled:opacity-50 transition-colors"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Loading More...</span>
                </>
              ) : (
                <span>Load More</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
