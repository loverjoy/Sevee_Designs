import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Mail, Lock, User as UserIcon, Phone, Shield, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import client from '../api/client';

const AdminSetupPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useSearchParams();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();

  const setupToken = searchParams.get('key') || '';

  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'superadmin') {
        nav('/admin');
      } else {
        nav('/dashboard');
      }
    }
  }, [user, nav]);

  useEffect(() => {
    if (!setupToken) {
      toast.error('Access denied: Missing setup key');
    }
  }, [setupToken]);

  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'superadmin'>('admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupToken) {
      toast.error('Invalid setup link');
      return;
    }
    if (!email || !username || !password) {
      toast.error('Email, Username, and Password are required');
      return;
    }

    setLoading(true);
    try {
      const res = await client.post('/auth/register-admin', {
        email,
        username,
        full_name: fullName || undefined,
        phone: phone || undefined,
        password,
        role,
        setup_token: setupToken,
      });

      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('sevee_token', receivedToken);
      toast.success(`Account created! Welcome, ${receivedUser.username}`);
      window.location.href = '/admin';
    } catch (error: any) {
      const serverError = error.response?.data;
      toast.error(serverError?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (!setupToken) {
    return (
      <div className="pt-36 max-w-md mx-auto px-6 min-h-[80vh] flex flex-col justify-center font-sans">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-3xl font-bold">Access Denied</h2>
          <p className="text-xs text-muted-foreground">Invalid or missing setup token.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-36 max-w-md mx-auto px-6 min-h-[80vh] flex flex-col justify-center space-y-8 font-sans">
      <div className="text-center space-y-2">
        <h2 className="font-serif text-3xl font-bold">Staff Registration</h2>
        <p className="text-xs text-muted-foreground">Create an admin or superadmin account.</p>
      </div>

      <div className="border border-border bg-card shadow-card">
        <div className="flex items-center justify-center border-b border-border py-4">
          <ShieldCheck size={16} className="mr-2 text-primary" />
          <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Secure Registration</span>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Role</label>
              <div className="relative flex border border-border bg-background">
                <Shield className="absolute left-3 top-3 text-muted-foreground" size={14} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'superadmin')}
                  className="w-full bg-transparent border-none outline-none py-2.5 pl-9 pr-3 text-xs text-foreground appearance-none cursor-pointer"
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
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
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
              <div className="relative flex border border-border bg-background">
                <Mail className="absolute left-3 top-3 text-muted-foreground" size={14} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@seveedesigns.com"
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
              disabled={loading || !setupToken}
              className="w-full bg-primary hover:bg-accent text-primary-foreground py-3 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : <span>Create Account</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSetupPage;
