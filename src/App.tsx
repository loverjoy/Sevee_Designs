import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

// Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';

// Layouts
import Header from './components/Header';
import Footer from './components/Footer';
import AdminLayout from './components/layouts/AdminLayout';
import SalespersonLayout from './components/layouts/SalespersonLayout';
import Chatbot from './components/Chatbot';

// Public Pages (eagerly loaded - critical for first paint)
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import BlogPage from './pages/BlogPage';

// Customer Protected Page (lazy loaded)
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

// Admin Portal Pages (lazy loaded)
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminProductFormPage = lazy(() => import('./pages/admin/AdminProductFormPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminCouponsPage = lazy(() => import('./pages/admin/AdminCouponsPage'));
const AdminStaffPage = lazy(() => import('./pages/admin/AdminStaffPage'));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'));

// Salesperson Portal Pages (lazy loaded)
const SalespersonOrdersPage = lazy(() => import('./pages/salesperson/SalespersonOrdersPage'));
const SalespersonReportsPage = lazy(() => import('./pages/salesperson/SalespersonReportsPage'));

// Route Guards
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans text-xs">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect role mismatch to their respective home areas
    if (user.role === 'admin' || user.role === 'superadmin') return <Navigate to="/admin" replace />;
    if (user.role === 'salesperson') return <Navigate to="/salesperson" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans text-xs">
    Loading...
  </div>
);

// Storefront Wrapper to include Header/Footer on public routes
const StorefrontLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <Suspense fallback={<PageLoader />}>
                  <DashboardPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Routes>
              {/* Admin Portal Area */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Suspense fallback={<PageLoader />}><AdminDashboardPage /></Suspense>} />
                <Route path="products" element={<Suspense fallback={<PageLoader />}><AdminProductsPage /></Suspense>} />
                <Route path="products/new" element={<Suspense fallback={<PageLoader />}><AdminProductFormPage /></Suspense>} />
                <Route path="products/:id/edit" element={<Suspense fallback={<PageLoader />}><AdminProductFormPage /></Suspense>} />
                <Route path="orders" element={<Suspense fallback={<PageLoader />}><AdminOrdersPage /></Suspense>} />
                <Route path="reports" element={<Suspense fallback={<PageLoader />}><AdminReportsPage /></Suspense>} />
                <Route path="coupons" element={<Suspense fallback={<PageLoader />}><AdminCouponsPage /></Suspense>} />
                <Route path="staff" element={<Suspense fallback={<PageLoader />}><AdminStaffPage /></Suspense>} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>

              {/* Salesperson Portal Area */}
              <Route
                path="/salesperson/*"
                element={
                  <ProtectedRoute allowedRoles={['salesperson']}>
                    <SalespersonLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Suspense fallback={<PageLoader />}><SalespersonReportsPage /></Suspense>} />
                <Route path="orders" element={<Suspense fallback={<PageLoader />}><SalespersonOrdersPage /></Suspense>} />
                <Route path="reports" element={<Suspense fallback={<PageLoader />}><SalespersonReportsPage /></Suspense>} />
                <Route path="*" element={<Navigate to="/salesperson" replace />} />
              </Route>

              {/* General Storefront Client Area */}
              <Route path="/*" element={<StorefrontLayout />} />
            </Routes>
            <Toaster position="bottom-right" closeButton richColors theme="light" />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
