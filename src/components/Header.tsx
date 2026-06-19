import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User, Menu, X, Sun, Moon, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { totalItems, currency, setCurrency } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle scroll opacity
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize theme from document element
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      setTheme('dark');
    } else {
      root.classList.remove('dark');
      root.removeAttribute('data-theme');
      setTheme('light');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const activeClass = (path: string) => {
    return location.pathname === path
      ? 'text-accent border-b-2 border-accent'
      : 'text-foreground/80 hover:text-foreground transition-colors';
  };

  return (
    <>
      {/* Main Navigation Header */}
      <header
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-background shadow-card border-b border-border'
            : 'bg-background/80 backdrop-blur-md'
        }`}
      >
        {/* Announcement Bar */}
        <div
          className={`w-full bg-primary text-primary-foreground text-center text-xs tracking-wider uppercase font-sans transition-all duration-300 origin-top overflow-hidden ${
            scrolled
              ? 'max-h-0 py-0 opacity-0'
              : 'max-h-12 py-2 px-4 opacity-100'
          }`}
        >
          Free delivery inside Accra on orders above GHS 1,000.00
        </div>

        <div
          className={`max-w-7xl mx-auto px-6 flex items-center justify-between transition-all duration-300 ${
            scrolled ? 'py-4' : 'py-6'
          }`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-border flex items-center justify-center bg-card shrink-0 transition-transform group-hover:scale-105 duration-300">
              <img src="/logo.jpg" alt="SeVee Designs Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-tight text-foreground leading-tight">
                SeVee Designs
              </span>
              <span className="font-sans text-[9px] tracking-[0.25em] text-muted-foreground uppercase -mt-0.5">
                Premium Furniture
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 font-sans font-medium text-sm">
            <Link to="/" className={activeClass('/')}>Home</Link>
            <Link to="/shop" className={activeClass('/shop')}>Shop</Link>
            <Link to="/blog" className={activeClass('/blog')}>Blog</Link>
            <Link to="/faq" className={activeClass('/faq')}>FAQs</Link>
            <Link to="/about" className={activeClass('/about')}>Our Story</Link>
            <Link to="/contact" className={activeClass('/contact')}>Contact</Link>
          </nav>

          {/* Action Icons */}
          <div className="flex items-center space-x-5 text-foreground">
            {/* Search Icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hover:text-accent transition-colors p-1"
              aria-label="Open Search"
            >
              <Search size={20} />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="hover:text-accent transition-colors p-1"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Currency Selector */}
            <div className="relative font-sans text-xs font-semibold flex items-center">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-background text-foreground border border-border px-2 py-1 focus:outline-none cursor-pointer hover:text-accent hover:border-accent transition-colors font-sans text-xs font-semibold uppercase rounded-none"
                aria-label="Change Currency"
              >
                <option value="GHS">GHS (GH₵)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            {/* Wishlist Heart Icon */}
            <Link to="/dashboard?tab=wishlist" className="relative hover:text-accent transition-colors p-1" aria-label="Favourites">
              <Heart size={20} className={wishlist.length > 0 ? 'fill-accent text-accent' : ''} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] w-4 h-4 flex items-center justify-center font-bold font-sans">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link to="/cart" className="relative hover:text-accent transition-colors p-1" aria-label="Cart">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] w-4 h-4 flex items-center justify-center font-bold font-sans">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Dropdown / Login link */}
            {user ? (
              <div className="relative group p-1">
                <Link
                  to={user.role === 'admin' || user.role === 'superadmin' ? '/admin' : user.role === 'salesperson' ? '/salesperson' : '/dashboard'}
                  className="flex items-center space-x-1 hover:text-accent transition-colors"
                >
                  <User size={20} />
                  <span className="hidden lg:inline text-xs font-sans font-medium max-w-[80px] truncate">
                    {user.username}
                  </span>
                </Link>
                <div className="absolute right-0 w-40 bg-card border border-border shadow-card mt-2 hidden group-hover:block transition-all py-1">
                  {(user.role === 'admin' || user.role === 'superadmin') && (
                    <Link to="/admin" className="block px-4 py-2 text-xs font-sans hover:bg-secondary">
                      Admin Portal
                    </Link>
                  )}
                  {user.role === 'salesperson' && (
                    <Link to="/salesperson" className="block px-4 py-2 text-xs font-sans hover:bg-secondary">
                      Sales Dashboard
                    </Link>
                  )}
                  <Link to="/dashboard" className="block px-4 py-2 text-xs font-sans hover:bg-secondary">
                    My Account
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left block px-4 py-2 text-xs font-sans text-destructive hover:bg-secondary"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="hover:text-accent transition-colors p-1" aria-label="Login">
                <User size={20} />
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden hover:text-accent transition-colors p-1"
              aria-label="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border absolute left-0 w-full px-6 py-6 space-y-4 shadow-card">
            <nav className="flex flex-col space-y-4 font-sans font-medium text-base">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-accent">Home</Link>
              <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="hover:text-accent">Shop</Link>
              <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="hover:text-accent">Blog</Link>
              <Link to="/faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-accent">FAQs</Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="hover:text-accent">Our Story</Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-accent">Contact</Link>
              {user && (
                <>
                  <hr className="border-border" />
                  <Link
                    to={user.role === 'admin' || user.role === 'superadmin' ? '/admin' : user.role === 'salesperson' ? '/salesperson' : '/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-accent"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-destructive"
                  >
                    Logout
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Full-screen Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center px-6">
          <button
            onClick={() => setSearchOpen(false)}
            className="absolute top-8 right-8 text-foreground hover:text-accent transition-colors p-2"
            aria-label="Close Search"
          >
            <X size={30} />
          </button>
          <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl text-center">
            <h2 className="font-serif text-3xl mb-6 text-foreground">What are you looking for?</h2>
            <div className="relative border-b-2 border-foreground py-2 flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dining tables, lounge chairs, credenzas..."
                className="w-full bg-transparent border-none outline-none text-xl font-sans py-2 placeholder-muted-foreground text-foreground"
                autoFocus
              />
              <button type="submit" className="text-foreground hover:text-accent p-2">
                <Search size={24} />
              </button>
            </div>
            <p className="text-muted-foreground text-sm font-sans mt-3">Press Enter to search</p>
          </form>
        </div>
      )}
    </>
  );
};

export default Header;
