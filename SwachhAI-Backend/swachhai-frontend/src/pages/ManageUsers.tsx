import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  UserPlus, Users, Shield, Trash2, MapPin, Mail, Lock, User,
  CheckCircle, AlertTriangle, X, ChevronDown
} from 'lucide-react';

const API = '/api/auth';

export default function ManageUsers({ washrooms }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('NODAL_OFFICER');
  const [assigned, setAssigned] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get unique washroom IDs from live data
  const washroomIds = washrooms.map((w: any) => w.washroomId);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/users`);
      if (res.data.success) setUsers(res.data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = await axios.post(`${API}/register`, {
        name, email, password, role,
        assignedWashrooms: role === 'NODAL_OFFICER' ? assigned : []
      });

      if (res.data.success) {
        setMsg({ type: 'success', text: `${role === 'MCD_SUPER_ADMIN' ? 'Super Admin' : 'Nodal Officer'} "${name}" created successfully!` });
        setName(''); setEmail(''); setPassword(''); setRole('NODAL_OFFICER'); setAssigned([]);
        setShowForm(false);
        fetchUsers();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create user.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove "${userName}"? This action cannot be undone.`)) return;
    try {
      const res = await axios.delete(`${API}/users/${id}`);
      if (res.data.success) {
        setMsg({ type: 'success', text: `"${userName}" has been removed.` });
        fetchUsers();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete user.' });
    }
  };

  const toggleAssigned = (wId: string) => {
    setAssigned(prev =>
      prev.includes(wId) ? prev.filter(w => w !== wId) : [...prev, wId]
    );
  };

  const admins = users.filter(u => u.role === 'MCD_SUPER_ADMIN');
  const officers = users.filter(u => u.role === 'NODAL_OFFICER');

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ──── Header ──── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" /> Access Control Management
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Create and manage accounts for Nodal Officers and Admins
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setMsg(null); }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all"
        >
          {showForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Create Account'}
        </button>
      </div>

      {/* ──── Status Message ──── */}
      {msg && (
        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border text-sm font-medium ${
          msg.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {msg.type === 'success'
            ? <CheckCircle className="w-4.5 h-4.5 shrink-0" />
            : <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
          }
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ──── Create Form ──── */}
      {showForm && (
        <div className="glass-card p-6 lg:p-8 border-2 border-blue-100 relative z-50">
          <h3 className="font-bold text-slate-900 text-lg mb-5 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" /> New Account
          </h3>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. ramesh@mcd.gov.in"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
                <select
                  value={role} onChange={e => setRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
                >
                  <option value="NODAL_OFFICER">Nodal Officer</option>
                  <option value="MCD_SUPER_ADMIN">MCD Super Admin</option>
                </select>
              </div>
            </div>

            {/* Assign Washrooms (visible only for Nodal Officer) */}
            {role === 'NODAL_OFFICER' && (
              <div className="relative z-20">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Assign Washrooms
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-all"
                  >
                    <span className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      {assigned.length > 0
                        ? `${assigned.length} washroom${assigned.length > 1 ? 's' : ''} selected`
                        : 'Select washrooms to assign...'
                      }
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showDropdown && (
                    <div className="absolute left-0 right-0 z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {washroomIds.length > 0 ? washroomIds.map((wId: string) => (
                        <label
                          key={wId}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={assigned.includes(wId)}
                            onChange={() => toggleAssigned(wId)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-mono font-bold text-slate-700">{wId}</span>
                        </label>
                      )) : (
                        <p className="px-4 py-3 text-sm text-slate-400">No washrooms found in the system</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected chips */}
                {assigned.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {assigned.map(wId => (
                      <span
                        key={wId}
                        className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-200"
                      >
                        {wId}
                        <button type="button" onClick={() => toggleAssigned(wId)} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 text-sm flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ──── Users Grid ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Super Admins */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><Shield className="w-4 h-4" /></div>
              Super Admins
            </h3>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              {admins.length}
            </span>
          </div>
          <div className="space-y-3">
            {admins.map((u: any) => (
              <UserCard key={u.id || u._id} user={u} onDelete={handleDelete} isSelf={false} />
            ))}
            {admins.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No admin accounts</p>
            )}
          </div>
        </div>

        {/* Nodal Officers */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Users className="w-4 h-4" /></div>
              Nodal Officers
            </h3>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200/60">
              {officers.length}
            </span>
          </div>
          <div className="space-y-3">
            {officers.map((u: any) => (
              <UserCard key={u.id || u._id} user={u} onDelete={handleDelete} isSelf={false} />
            ))}
            {officers.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No nodal officers yet — create one above</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── User Card Component ───── */
function UserCard({ user, onDelete }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50/60 border border-slate-100 rounded-xl hover:border-slate-200 transition-all group">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          user.role === 'MCD_SUPER_ADMIN'
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
            : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
        }`}>
          <User className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-sm truncate">{user.name}</p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
          {user.role === 'NODAL_OFFICER' && user.assignedWashrooms?.length > 0 && (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
              {user.assignedWashrooms.map((w: string) => (
                <span key={w} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={() => onDelete(user.id || user._id, user.name)}
        className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
        title="Remove user"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
