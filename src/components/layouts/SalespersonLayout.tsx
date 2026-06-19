import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { ShoppingBag, BarChart2, Home, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const SalespersonLayout: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard Reports', path: '/salesperson', icon: <BarChart2 size={16} /> },
    { name: 'Order Steppers', path: '/salesperson/orders', icon: <ShoppingBag size={16} /> },
  ];

  const activeClass = (path: string) => {
    return location.pathname === path
      ? 'bg-primary text-primary-foreground'
      : 'hover:bg-secondary text-foreground';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-card border-b border-border p-4 flex items-center justify-between z-30">
        <Link to="/salesperson" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-border flex items-center justify-center bg-card shrink-0">
            <img src="/logo.jpg" alt="SeVee Designs Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-base font-bold text-foreground leading-tight">SEVEE SALES</span>
            <span className="font-sans text-[8px] tracking-[0.2em] text-muted-foreground uppercase">Sales Area</span>
          </div>
        </Link>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1 hover:text-accent"
          aria-label="Toggle Sidebar"
        >
          {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`bg-card border-r border-border w-64 flex-shrink-0 flex flex-col justify-between p-4 z-40 fixed md:sticky top-0 h-screen transition-transform duration-300 md:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-8">
          {/* Logo Heading */}
          <div className="border-b border-border pb-4 hidden md:block">
            <Link to="/salesperson" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-border flex items-center justify-center bg-card shrink-0 transition-transform group-hover:scale-105 duration-300">
                <img src="/logo.jpg" alt="SeVee Designs Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold text-foreground leading-tight">SEVEE SALES</span>
                <span className="font-sans text-[8px] tracking-[0.2em] text-muted-foreground uppercase -mt-0.5">Sales Area</span>
              </div>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col space-y-1.5 text-xs font-bold uppercase tracking-wider">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 transition-colors ${activeClass(item.path)}`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom utilities */}
        <div className="space-y-1.5 border-t border-border pt-4 text-xs font-bold uppercase tracking-wider">
          <Link
            to="/"
            className="flex items-center space-x-3 px-4 py-3 hover:bg-secondary text-foreground transition-colors"
          >
            <Home size={16} />
            <span>Storefront</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors text-left"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full mt-4 md:mt-0">
        <Outlet />
      </main>

      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/45 md:hidden z-25"
        ></div>
      )}
    </div>
  );
};

export default SalespersonLayout;
