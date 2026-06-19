import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-20 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Brand Info */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-border/20 flex items-center justify-center bg-card-foreground/10 shrink-0 transition-transform group-hover:scale-105 duration-300">
              <img src="/logo.jpg" alt="SeVee Designs Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-tight text-primary-foreground leading-tight">
                SeVee Designs
              </span>
              <span className="font-sans text-[9px] tracking-[0.25em] text-muted-foreground uppercase -mt-0.5">
                Premium Furniture
              </span>
            </div>
          </Link>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed">
            Crafting spaces that inspire. We design and manufacture architectural, high-grade hardwood furniture in Accra, Ghana.
          </p>
          <div className="flex space-x-4 pt-2 text-muted-foreground">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-accent transition-colors">
              <Instagram size={18} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-accent transition-colors">
              <Facebook size={18} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-accent transition-colors">
              <Twitter size={18} />
            </a>
          </div>
        </div>

        {/* Company Links */}
        <div className="space-y-4 font-sans">
          <h4 className="font-serif text-base font-medium text-primary-foreground tracking-wider uppercase">
            Company
          </h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>
              <Link to="/shop" className="hover:text-accent transition-colors">Shop Collection</Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-accent transition-colors">Our Story</Link>
            </li>
            <li>
              <Link to="/blog" className="hover:text-accent transition-colors">Articles & News</Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-accent transition-colors">Frequently Asked Questions</Link>
            </li>
          </ul>
        </div>

        {/* Collections */}
        <div className="space-y-4 font-sans">
          <h4 className="font-serif text-base font-medium text-primary-foreground tracking-wider uppercase">
            Collections
          </h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>
              <Link to="/shop?category=living-room" className="hover:text-accent transition-colors">Living Room</Link>
            </li>
            <li>
              <Link to="/shop?category=bedroom" className="hover:text-accent transition-colors">Bedroom</Link>
            </li>
            <li>
              <Link to="/shop?category=office" className="hover:text-accent transition-colors">Office Study</Link>
            </li>
            <li>
              <Link to="/shop?category=outdoor" className="hover:text-accent transition-colors">Patio & Outdoor</Link>
            </li>
            <li>
              <Link to="/shop?category=accessories" className="hover:text-accent transition-colors">Decor Objects</Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-4 font-sans">
          <h4 className="font-serif text-base font-medium text-primary-foreground tracking-wider uppercase">
            Contact
          </h4>
          <ul className="space-y-3 text-xs text-muted-foreground">
            <li className="flex items-start space-x-2">
              <MapPin size={14} className="mt-0.5 text-accent shrink-0" />
              <span>23 Furniture Lane, East Legon, Accra, Ghana</span>
            </li>
            <li className="flex items-center space-x-2">
              <Phone size={14} className="text-accent shrink-0" />
              <span>+233 24 412 3456</span>
            </li>
            <li className="flex items-center space-x-2">
              <Mail size={14} className="text-accent shrink-0" />
              <span>hello@seveedesigns.com</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-border/10 py-6 text-center font-sans text-[11px] text-muted-foreground">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>&copy; {new Date().getFullYear()} SEVEE DESIGNS. All rights reserved.</span>
          <span>Crafted in Accra, Ghana.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
