import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import client from '../api/client';
import ProductCard from '../components/ProductCard';
import type { Product } from '../contexts/CartContext';
import { formatPrice } from '../lib/utils';
import useSEO from '../hooks/useSEO';

const HomePage: React.FC = () => {
  useSEO({
    title: 'Architectural Solid Hardwood Furniture',
    description: "Handcrafted premium furniture designed with geometric precision. Sourced from sustainable Ghanaian hardwood. Accra's premier furniture builders.",
    keywords: 'furniture Accra, premium furniture Ghana, custom hardwood furniture, solid wood furniture'
  });

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [arProducts, setArProducts] = useState<Product[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const featuredRes = await client.get('/products/featured');
        setFeaturedProducts(featuredRes.data);

        const arRes = await client.get('/products/ar-enabled');
        setArProducts(arRes.data);

        const blogRes = await client.get('/content/blogs');
        setBlogs(blogRes.data.slice(0, 3));
      } catch (error) {
        console.error('Failed to load home page data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className="pt-24 space-y-24">
      {/* 1. Hero Section */}
      <section className="relative h-[85vh] bg-primary flex items-center overflow-hidden">
        {/* Dark image background overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1600"
            alt="SeVee Designs Luxury Living Room"
            className="w-full h-full object-cover opacity-35"
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10 text-primary-foreground space-y-6">
          <span className="text-accent text-xs font-sans font-bold tracking-[0.3em] uppercase block fade-up">
            Architectural Luxury
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-serif leading-tight max-w-3xl fade-up">
            Crafting spaces that inspire
          </h1>
          <p className="font-sans text-sm md:text-base text-muted-foreground/80 max-w-xl leading-relaxed fade-up">
            Handcrafted solid wood furniture designed with structural precision and finished in natural oils. Elevate your space with Accra’s premier furniture builders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 fade-up">
            <Link
              to="/shop"
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3.5 text-xs font-sans font-bold uppercase tracking-wider text-center"
            >
              Shop Collection
            </Link>
            <Link
              to="/about"
              className="border border-primary-foreground hover:bg-primary-foreground hover:text-primary text-primary-foreground px-8 py-3.5 text-xs font-sans font-bold uppercase tracking-wider text-center transition-all duration-300"
            >
              Our Story
            </Link>
          </div>

          {/* Floating Stat Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-primary-foreground/10 max-w-4xl fade-up">
            <div>
              <span className="font-serif text-3xl font-bold text-accent">500+</span>
              <span className="block text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Products Built</span>
            </div>
            <div>
              <span className="font-serif text-3xl font-bold text-accent">10+ Yrs</span>
              <span className="block text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Design Experience</span>
            </div>
            <div>
              <span className="font-serif text-3xl font-bold text-accent">100%</span>
              <span className="block text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Hardwood Sourced</span>
            </div>
            <div>
              <span className="font-serif text-3xl font-bold text-accent">GHS 0</span>
              <span className="block text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Accra Delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Brand Values Snapshot */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="border border-border p-6 space-y-3 shadow-card">
          <Compass className="text-accent" size={24} />
          <h3 className="font-serif text-lg font-bold">Custom Craftsmanship</h3>
          <p className="text-xs text-muted-foreground font-sans leading-relaxed">
            Tailor-made dimensions and carefully chosen timber to match your room’s unique architectural geometry.
          </p>
        </div>
        <div className="border border-border p-6 space-y-3 shadow-card">
          <Sparkles className="text-accent" size={24} />
          <h3 className="font-serif text-lg font-bold">Natural Matte Oil</h3>
          <p className="text-xs text-muted-foreground font-sans leading-relaxed">
            Finished with biological oils instead of plastic varnish, keeping the wood grain tactile and responsive.
          </p>
        </div>
        <div className="border border-border p-6 space-y-3 shadow-card">
          <ShieldCheck className="text-accent" size={24} />
          <h3 className="font-serif text-lg font-bold">10-Year Warranty</h3>
          <p className="text-xs text-muted-foreground font-sans leading-relaxed">
            We use mortise-and-tenon joinery and kiln-dried timber, allowing us to guarantee durability for a decade.
          </p>
        </div>
        <div className="border border-border p-6 space-y-3 shadow-card">
          <Heart className="text-accent" size={24} />
          <h3 className="font-serif text-lg font-bold">Sustainably Sourced</h3>
          <p className="text-xs text-muted-foreground font-sans leading-relaxed">
            For every mahogany or teak tree felled for our collections, we fund replanting initiatives in local Ghana reserves.
          </p>
        </div>
      </section>

      {/* 3. Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="flex justify-between items-baseline border-b border-border pb-4">
          <h2 className="text-2xl md:text-3xl font-bold font-serif">Featured Collection</h2>
          <Link to="/shop" className="text-xs font-sans font-bold text-accent hover:text-foreground flex items-center space-x-1 uppercase tracking-wider transition-colors">
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse border border-border h-80 bg-secondary"></div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <p className="text-center font-sans text-muted-foreground py-10">No featured products found.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. AR Augmented Reality Highlight Section */}
      <section className="bg-secondary/40 border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-accent text-[10px] font-sans font-bold uppercase tracking-widest">
              Interactive Shopping
            </span>
            <h2 className="text-3xl font-serif font-bold leading-tight">
              Visualize furniture in your room with 3D & AR
            </h2>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              No guesswork required. Using our web-based Augmented Reality tool, project high-fidelity models of our dining tables and beds directly onto your floors. Perfect scaling matches Accra standards.
            </p>
            <div className="pt-2">
              <Link
                to="/shop?ar=true"
                className="bg-primary hover:bg-accent text-primary-foreground px-6 py-3 text-xs font-sans font-bold uppercase tracking-wider inline-block transition-colors"
              >
                Browse AR models
              </Link>
            </div>
          </div>

          {/* AR Products Slider/Scroll */}
          <div className="lg:col-span-2 overflow-x-auto flex space-x-6 pb-4 scrollbar-thin scrollbar-thumb-border">
            {loading ? (
              <div className="w-60 h-72 bg-secondary animate-pulse"></div>
            ) : arProducts.length === 0 ? (
              <p className="text-muted-foreground font-sans text-xs">No AR products configured.</p>
            ) : (
              arProducts.map((product) => (
                <div key={product.id} className="min-w-[240px] max-w-[240px] bg-card border border-border p-4 space-y-3 shadow-card shrink-0 hover:shadow-hover transition-all">
                  <div className="relative aspect-square overflow-hidden bg-secondary">
                    <img
                      src={product.images && product.images.length > 0 ? product.images[0] : ''}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 bg-primary/80 backdrop-blur-md text-primary-foreground text-[8px] font-sans font-bold uppercase px-2 py-0.5 tracking-wider">
                      3D Model
                    </span>
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold truncate">{product.name}</h4>
                    <span className="font-sans text-xs font-semibold text-accent block mt-1">{formatPrice(product.sale_price ?? product.price)}</span>
                  </div>
                  <Link
                    to={`/product/${product.slug}`}
                    className="w-full text-center bg-secondary hover:bg-accent hover:text-accent-foreground text-foreground text-[10px] font-sans font-bold uppercase py-2 tracking-wider block transition-colors border border-border"
                  >
                    View in 3D
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 5. Brand Teaser & Story */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="aspect-[4/3] bg-secondary border border-border overflow-hidden shadow-card">
          <img
            src="https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800"
            alt="SeVee Designs Joinery Studio"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-6">
          <span className="text-accent text-[10px] font-sans font-bold uppercase tracking-widest">
            Made in Ghana
          </span>
          <h2 className="text-3xl font-serif font-bold leading-tight">
            Furniture built for generations
          </h2>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed">
            Founded in Accra, SeVee Designs merges structural architectural geometry with traditional Ghanaian joinery. We believe that furniture should not be disposable. Every piece of mahogany, teak, and oak we select is kiln-dried and handcrafted to withstand changes in tropical moisture, ensuring stability for generations.
          </p>
          <Link
            to="/about"
            className="text-xs font-sans font-bold text-accent hover:text-foreground inline-flex items-center space-x-1 uppercase tracking-wider transition-colors border-b border-accent pb-1"
          >
            <span>Learn About Our Studio</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* 6. Blog Preview Section */}
      <section className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="flex justify-between items-baseline border-b border-border pb-4">
          <h2 className="text-2xl md:text-3xl font-bold font-serif">Journal</h2>
          <Link to="/blog" className="text-xs font-sans font-bold text-accent hover:text-foreground flex items-center space-x-1 uppercase tracking-wider transition-colors">
            <span>Read All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <div key={blog.id} className="group border border-border bg-card shadow-card hover:shadow-hover transition-all flex flex-col h-full">
              <div className="aspect-[16/10] overflow-hidden bg-secondary">
                <img
                  src={blog.image_url || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600'}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-sans tracking-widest text-muted-foreground uppercase">{blog.category}</span>
                  <Link to={`/blog/${blog.slug}`}>
                    <h4 className="font-serif text-lg font-bold line-clamp-2 group-hover:text-accent transition-colors">{blog.title}</h4>
                  </Link>
                  <p className="text-xs text-muted-foreground font-sans line-clamp-3 leading-relaxed">{blog.excerpt}</p>
                </div>
                <Link to={`/blog/${blog.slug}`} className="text-[10px] font-sans font-bold text-foreground hover:text-accent uppercase tracking-wider flex items-center space-x-1 pt-2 transition-colors">
                  <span>Read Article</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
