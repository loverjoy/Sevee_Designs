import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Edit3, Loader2, X, ShieldAlert } from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface StaffProfile {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'admin' | 'salesperson' | 'superadmin';
  created_at: string;
}

const AdminStaffPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);

  // Form States
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'salesperson' | 'superadmin'>('salesperson');
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await client.get('/auth/staff');
      setStaff(res.data);
    } catch (error: any) {
      console.error('Failed to load staff list:', error);
      toast.error(error.response?.data?.error || 'Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const resetForm = () => {
    setEmail('');
    setUsername('');
    setFullName('');
    setPhone('');
    setPassword('');
    setRole('salesperson');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password || !role) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await client.post('/auth/staff', {
        email,
        username,
        full_name: fullName || undefined,
        phone: phone || undefined,
        password,
        role,
      });
      toast.success(`Staff member @${res.data.username} created successfully.`);
      setAddModalOpen(false);
      resetForm();
      fetchStaff();
    } catch (error: any) {
      console.error('Failed to add staff:', error);
      toast.error(error.response?.data?.error || 'Failed to add staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (member: StaffProfile) => {
    setSelectedStaff(member);
    setFullName(member.full_name || '');
    setPhone(member.phone || '');
    setRole(member.role);
    setPassword(''); // Reset password field
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setSubmitting(true);
    try {
      const payload: any = {
        full_name: fullName || null,
        phone: phone || null,
        role,
      };
      if (password) {
        payload.password = password;
      }

      await client.put(`/auth/staff/${selectedStaff.id}`, payload);
      toast.success(`Staff member @${selectedStaff.username} updated successfully.`);
      setEditModalOpen(false);
      resetForm();
      setSelectedStaff(null);
      fetchStaff();
    } catch (error: any) {
      console.error('Failed to update staff:', error);
      toast.error(error.response?.data?.error || 'Failed to update staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (member: StaffProfile) => {
    if (currentUser && currentUser.id === member.id) {
      toast.error('You cannot delete your own account.');
      return;
    }
    setSelectedStaff(member);
    setDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedStaff) return;
    setSubmitting(true);
    try {
      await client.delete(`/auth/staff/${selectedStaff.id}`);
      toast.success(`Staff member @${selectedStaff.username} deleted successfully.`);
      setDeleteModalOpen(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (error: any) {
      console.error('Failed to delete staff:', error);
      toast.error(error.response?.data?.error || 'Failed to delete staff member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Staff Management</h1>
          <p className="text-xs text-muted-foreground font-sans mt-1">
            Create, update roles, and manage administration and sales team accounts.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setAddModalOpen(true);
          }}
          className="bg-primary hover:bg-accent text-primary-foreground py-2.5 px-5 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 rounded-none transition-colors shrink-0"
        >
          <UserPlus size={16} />
          <span>Add Staff Member</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center font-sans">
          <Loader2 className="animate-spin text-accent mb-4" size={32} />
          <p className="text-xs text-muted-foreground">Loading staff registry...</p>
        </div>
      ) : staff.length === 0 ? (
        <div className="border border-border p-12 text-center bg-card shadow-card font-sans">
          <Users size={36} className="mx-auto text-muted-foreground mb-4" />
          <p className="font-serif text-lg font-bold mb-2">No Staff Seeding Found</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
            Currently there are no other administrators or sales representatives registered.
          </p>
        </div>
      ) : (
        <div className="border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans border-collapse">
              <thead>
                <tr className="bg-secondary text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-3.5 px-6">Avatar</th>
                  <th className="py-3.5 px-6">Username / Email</th>
                  <th className="py-3.5 px-6">Full Name</th>
                  <th className="py-3.5 px-6">Phone Number</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="py-4 px-6">
                      <img
                        src={member.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.username}`}
                        alt={member.username}
                        className="w-8 h-8 rounded-none border border-border"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-foreground block">@{member.username}</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">{member.email}</span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground font-medium">
                      {member.full_name || '—'}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">
                      {member.phone || '—'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block py-0.5 px-2 text-[9px] font-bold uppercase tracking-wider ${
                        member.role === 'superadmin' 
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                          : member.role === 'admin' 
                            ? 'bg-accent/10 text-accent border border-accent/20' 
                            : 'bg-green-500/10 text-green-500 border border-green-500/20'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2 shrink-0">
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-1.5 text-muted-foreground hover:text-accent hover:bg-secondary transition-colors"
                        title="Edit Details"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(member)}
                        disabled={currentUser?.id === member.id}
                        className={`p-1.5 transition-colors ${
                          currentUser?.id === member.id 
                            ? 'text-muted-foreground/30 cursor-not-allowed' 
                            : 'text-muted-foreground hover:text-destructive hover:bg-secondary'
                        }`}
                        title={currentUser?.id === member.id ? "Cannot delete yourself" : "Delete Account"}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD STAFF */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card border border-border max-w-md w-full shadow-hover relative p-6">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute top-4 right-4 p-1 hover:text-accent transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center space-x-2 mb-6">
              <UserPlus className="text-accent" size={20} />
              <h3 className="font-serif text-lg font-bold">Add Staff Account</h3>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">Username (Required)</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="e.g. kofid"
                  className="w-full bg-background border border-border px-3 py-2 outline-none focus:border-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">Email Address (Required)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. kofi@seveedesigns.com"
                  className="w-full bg-background border border-border px-3 py-2 outline-none focus:border-accent"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kofi Darko"
                    className="w-full bg-background border border-border px-3 py-2 outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +23324..."
                    className="w-full bg-background border border-border px-3 py-2 outline-none focus:border-accent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-background border border-border px-3 py-2 outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="salesperson">Salesperson</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">Password (Required)</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-background border border-border px-3 py-2 outline-none focus:border-accent"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="border border-border hover:bg-secondary text-foreground py-2 px-4 font-bold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-accent text-primary-foreground py-2 px-4 font-bold uppercase tracking-wider transition-colors flex items-center space-x-1.5"
                >
                  {submitting && <Loader2 className="animate-spin" size={14} />}
                  <span>Save Staff</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT STAFF */}
      {editModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card border border-border max-w-md w-full shadow-hover relative p-6">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 p-1 hover:text-accent transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center space-x-2 mb-6">
              <Edit3 className="text-accent" size={20} />
              <h3 className="font-serif text-lg font-bold">Edit Staff Profile: @{selectedStaff.username}</h3>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Kofi Darko"
                  className="w-full bg-background border border-border px-3 py-2 outline-none focus:border-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +23324..."
                  className="w-full bg-background border border-border px-3 py-2 outline-none focus:border-accent"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-background border border-border px-3 py-2 outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="salesperson">Salesperson</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">Change Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep same"
                    className="w-full bg-background border border-border px-3 py-2 outline-none focus:border-accent"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="border border-border hover:bg-secondary text-foreground py-2 px-4 font-bold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-accent text-primary-foreground py-2 px-4 font-bold uppercase tracking-wider transition-colors flex items-center space-x-1.5"
                >
                  {submitting && <Loader2 className="animate-spin" size={14} />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE STAFF CONFIRMATION */}
      {deleteModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card border border-border max-w-sm w-full shadow-hover relative p-6">
            <div className="text-center font-sans text-xs space-y-4">
              <ShieldAlert className="text-destructive mx-auto animate-bounce" size={40} />
              <h3 className="font-serif text-lg font-bold text-foreground">Confirm Account Deletion</h3>
              <p className="text-muted-foreground leading-relaxed">
                Are you sure you want to delete the staff account for **@{selectedStaff.username}** ({selectedStaff.email})? 
                This action is irreversible and will remove all their profile data.
              </p>
              <div className="pt-4 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="border border-border hover:bg-secondary text-foreground py-2 px-5 font-bold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSubmit}
                  disabled={submitting}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground py-2 px-5 font-bold uppercase tracking-wider transition-colors flex items-center space-x-1.5"
                >
                  {submitting && <Loader2 className="animate-spin" size={14} />}
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaffPage;
