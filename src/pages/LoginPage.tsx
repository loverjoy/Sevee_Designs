import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Mail, Lock, User as UserIcon, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const LoginPage: React.FC = () => {
  const { login, register, googleLogin, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Redirect if already logged in
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  useEffect(() => {
    if (user) {
      navigate(redirectPath);
    }
  }, [user, navigate, redirectPath]);

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState(''); // can be username or email

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !password) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      await login(loginIdentifier, password);
      toast.success('Successfully logged in!');
      navigate(redirectPath);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password) {
      toast.error('Email, Username, and Password are required');
      return;
    }

    setLoading(true);
    try {
      await register({
        email,
        username,
        full_name: fullName || undefined,
        phone: phone || undefined,
        password,
      });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error || 'Failed to register account');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
        });

        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'rectangular',
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleGoogleCredentialResponse = async (response: { credential: string }) => {
    setLoading(true);
    try {
      await googleLogin(response.credential);
      toast.success('Google sign-in successful!');
      navigate(redirectPath);
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-36 max-w-md mx-auto px-6 min-h-[80vh] flex flex-col justify-center space-y-8 font-sans">
      {/* Brand Logo & Tag */}
      <div className="text-center space-y-2">
        <h2 className="font-serif text-3xl font-bold">Welcome to SeVee</h2>
        <p className="text-xs text-muted-foreground">Architectural joinery & custom handcrafted designs.</p>
      </div>

      {/* Tabs */}
      <div className="border border-border bg-card shadow-card">
        <div className="flex border-b border-border text-center text-xs uppercase tracking-wider font-bold">
          <button
            onClick={() => setActiveTab('login')}
            className={`w-1/2 py-4 transition-all ${
              activeTab === 'login' ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground bg-secondary/50'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`w-1/2 py-4 transition-all ${
              activeTab === 'register' ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground bg-secondary/50'
            }`}
          >
            Register
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'login' ? (
            /* SIGN IN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email or Username</label>
                <div className="relative flex border border-border bg-background">
                  <Mail className="absolute left-3 top-3 text-muted-foreground" size={14} />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    required
                    placeholder="Enter your email or username"
                    className="w-full bg-transparent border-none outline-none py-2.5 pl-9 pr-3 text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Password</label>
                <div className="relative flex border border-border bg-background">
                  <Lock className="absolute left-3 top-3 text-muted-foreground" size={14} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-transparent border-none outline-none py-2.5 pl-9 pr-3 text-xs text-foreground"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-accent text-primary-foreground py-3 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : <span>Sign In</span>}
              </button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                <div className="relative flex border border-border bg-background">
                  <Mail className="absolute left-3 top-3 text-muted-foreground" size={14} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="E.g. customer@example.com"
                    className="w-full bg-transparent border-none outline-none py-2.5 pl-9 pr-3 text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Username</label>
                <div className="relative flex border border-border bg-background">
                  <UserIcon className="absolute left-3 top-3 text-muted-foreground" size={14} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="E.g. kofi_mensah"
                    className="w-full bg-transparent border-none outline-none py-2.5 pl-9 pr-3 text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name (Optional)</label>
                <div className="relative flex border border-border bg-background">
                  <UserIcon className="absolute left-3 top-3 text-muted-foreground" size={14} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="E.g. Kofi Mensah"
                    className="w-full bg-transparent border-none outline-none py-2.5 pl-9 pr-3 text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number (Optional)</label>
                <div className="relative flex border border-border bg-background">
                  <Phone className="absolute left-3 top-3 text-muted-foreground" size={14} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="E.g. +233244123456"
                    className="w-full bg-transparent border-none outline-none py-2.5 pl-9 pr-3 text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Password</label>
                <div className="relative flex border border-border bg-background">
                  <Lock className="absolute left-3 top-3 text-muted-foreground" size={14} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-transparent border-none outline-none py-2.5 pl-9 pr-3 text-xs text-foreground"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-accent text-primary-foreground py-3 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : <span>Create Account</span>}
              </button>
            </form>
          )}

          {/* Google SSO Button */}
          <div className="mt-6 border-t border-border pt-6 space-y-4">
            <div className="relative text-center">
              <span className="bg-card px-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold relative z-10">
                Or Continue With
              </span>
              <div className="border-t border-border absolute w-full top-2 left-0 z-0"></div>
            </div>

            {GOOGLE_CLIENT_ID ? (
              <div ref={googleButtonRef} className="w-full" />
            ) : (
              <div className="w-full bg-secondary text-muted-foreground border border-border py-2.5 text-xs font-bold uppercase tracking-wider text-center">
                Google Sign-In not configured
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
