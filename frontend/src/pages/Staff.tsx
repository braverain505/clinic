import { FormEvent, useEffect, useState } from 'react';
import { api } from '../store/authStore';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import {
  Users, Plus, CheckCircle, LogOut, Eye, EyeOff, Copy,
  Edit, Shield, Key, UserX, Search,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────
interface StaffMember {
  id: string;
  employeeId: string;
  phone?: string;
  department?: string;
  position?: string;
  employmentDate?: string;
  status: string;
  user: { id: string; fullName: string; email: string; role: string };
}

interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
  staff?: {
    id: string;
    employeeId: string;
    department?: string;
    position?: string;
    phone?: string;
    status: string;
  } | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: string;
}

// ─── Constants ──────────────────────────────────────────────
const ROLES = [
  { value: 'OWNER', label: 'Owner', desc: 'Full access to everything' },
  { value: 'ADMIN', label: 'Administrator', desc: 'Manages staff, operations, and analytics' },
  { value: 'OPTOMETRIST', label: 'Optometrist', desc: 'Clinical exams, prescriptions, patients' },
  { value: 'RECEPTIONIST', label: 'Receptionist', desc: 'Patient registration, appointments, basic info' },
  { value: 'CASHIER', label: 'Cashier', desc: 'Sales, payments, receipts' },
  { value: 'INVENTORY_MANAGER', label: 'Inventory Manager', desc: 'Products, suppliers, stock management' },
];

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-brand-100 text-brand-700',
  OPTOMETRIST: 'bg-clinical-100 text-clinical-700',
  RECEPTIONIST: 'bg-blue-100 text-blue-700',
  CASHIER: 'bg-amber-100 text-amber-700',
  INVENTORY_MANAGER: 'bg-orange-100 text-orange-700',
};

type Tab = 'staff' | 'users';

// ─── Component ──────────────────────────────────────────────
export default function Staff() {
  const toast = useToast();
  const { isRole } = useAuthStore();
  const isAdmin = isRole('OWNER', 'ADMIN');

  // Data
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('staff');
  const [search, setSearch] = useState('');

  // Detail modal
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', role: 'RECEPTIONIST',
    phone: '', department: '', position: '',
  });

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState({
    role: '', phone: '', department: '', position: '', status: 'ACTIVE',
  });

  // Reset password modal
  const [showResetPw, setShowResetPw] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSaving, setResetSaving] = useState(false);

  // ─── Data loading ───────────────────────────────────────
  const loadStaff = async () => {
    try {
      const res = await api.get('/staff');
      setStaff(res.data);
    } catch { toast.error('Failed to load staff'); }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/staff/users');
      setUsers(res.data);
    } catch { toast.error('Failed to load users'); }
  };

  const load = async () => {
    setLoading(true);
    await Promise.all([loadStaff(), loadUsers()]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ─── Staff detail ───────────────────────────────────────
  const loadDetail = async (s: StaffMember) => {
    setSelected(s);
    try {
      const res = await api.get(`/staff/${s.id}`);
      setAttendance(res.data.attendance || []);
    } catch { toast.error('Failed to load attendance'); }
  };

  // ─── Create staff ───────────────────────────────────────
  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error('Fill in all required fields'); return;
    }
    setSaving(true);
    try {
      const res = await api.post('/staff', form);
      toast.success(`${form.fullName} created as ${ROLES.find((r) => r.value === form.role)?.label}`);
      setCreatedCredentials(res.data.credentials);
      setForm({ fullName: '', email: '', password: '', role: 'RECEPTIONIST', phone: '', department: '', position: '' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create staff');
    } finally { setSaving(false); }
  };

  const copyCredentials = () => {
    if (createdCredentials) {
      navigator.clipboard.writeText(`Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`);
      toast.success('Credentials copied to clipboard');
    }
  };

  // ─── Edit staff ─────────────────────────────────────────
  const openEdit = (s: StaffMember) => {
    setEditTarget(s);
    setEditForm({
      role: s.user.role,
      phone: s.phone || '',
      department: s.department || '',
      position: s.position || '',
      status: s.status,
    });
    setShowEdit(true);
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await api.put(`/staff/${editTarget.id}`, editForm);
      toast.success('Staff member updated');
      setShowEdit(false);
      setEditTarget(null);
      load();
      // Refresh detail if open
      if (selected?.id === editTarget.id) {
        loadDetail({ ...selected, ...editForm, user: { ...selected.user, role: editForm.role } } as StaffMember);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally { setSaving(false); }
  };

  // ─── Deactivate ─────────────────────────────────────────
  const deactivate = async (s: StaffMember) => {
    if (!confirm(`Deactivate ${s.user.fullName}? They will no longer be able to log in.`)) return;
    try {
      await api.put(`/staff/${s.id}/deactivate`);
      toast.success(`${s.user.fullName} deactivated`);
      load();
      if (selected?.id === s.id) setSelected(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to deactivate');
    }
  };

  // ─── Reset password ─────────────────────────────────────
  const openResetPw = (s: StaffMember) => {
    setResetTarget(s);
    setNewPassword('');
    setShowResetPw(true);
  };

  const submitResetPw = async () => {
    if (!resetTarget || !newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    setResetSaving(true);
    try {
      await api.put(`/staff/${resetTarget.id}/reset-password`, { newPassword });
      toast.success(`Password reset for ${resetTarget.user.fullName}`);
      setShowResetPw(false);
      setResetTarget(null);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally { setResetSaving(false); }
  };

  // ─── Clock in / out ─────────────────────────────────────
  const clockIn = async (staffId: string) => {
    try {
      await api.post(`/staff/${staffId}/clock-in`);
      toast.success('Clocked in');
      if (selected?.id === staffId) loadDetail(selected);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const clockOut = async (staffId: string) => {
    try {
      await api.post(`/staff/${staffId}/clock-out`);
      toast.success('Clocked out');
      if (selected?.id === staffId) loadDetail(selected);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  // ─── Helpers ────────────────────────────────────────────
  const attendanceStatus = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
      PRESENT: 'success', LATE: 'warning', ABSENT: 'danger', HALF_DAY: 'info', ON_LEAVE: 'neutral',
    };
    return <Badge variant={map[status] || 'neutral'} dot>{status.replace('_', ' ')}</Badge>;
  };

  const filteredStaff = staff.filter((s) =>
    search ? `${s.user.fullName} ${s.user.email} ${s.employeeId} ${s.user.role}`.toLowerCase().includes(search.toLowerCase()) : true
  );

  const filteredUsers = users.filter((u) =>
    search ? `${u.fullName} ${u.email} ${u.role}`.toLowerCase().includes(search.toLowerCase()) : true
  );

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-16 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="page-header">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Operations</p>
          <h1>User Management</h1>
          <p>Create users, assign roles, and manage team access.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setShowCreate(true); setCreatedCredentials(null); }} icon={<Plus size={16} />}>
            Add User
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('staff')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'staff' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          Staff ({staff.length})
        </button>
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'users' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          All Users ({users.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-surface-400" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, role..."
          className="input pl-9"
        />
      </div>

      {/* Role summary (staff tab) */}
      {tab === 'staff' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {ROLES.map((r) => {
            const count = staff.filter((s) => s.user.role === r.value).length;
            return (
              <div key={r.value} className="card p-3 text-center">
                <span className={`inline-flex items-center px-2 py-0.5 text-2xs font-semibold rounded-full ${ROLE_COLORS[r.value]}`}>{r.label}</span>
                <p className="text-xl font-bold text-surface-900 mt-2">{count}</p>
                <p className="text-2xs text-surface-400">members</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Staff Tab ────────────────────────────────────── */}
      {tab === 'staff' && (
        filteredStaff.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title="No staff members"
            description="Add a team member to get started."
            action={isAdmin ? <Button onClick={() => { setShowCreate(true); setCreatedCredentials(null); }} icon={<Plus size={16} />}>Add Staff</Button> : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((s) => (
              <div key={s.id} className="card p-5 hover:shadow-card-hover transition-shadow">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => loadDetail(s)}>
                  <div className="w-11 h-11 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-semibold text-sm shrink-0">
                    {s.user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-900 truncate">{s.user.fullName}</p>
                    <p className="text-xs text-surface-400 font-mono">{s.employeeId}</p>
                  </div>
                  <Badge variant={s.status === 'ACTIVE' ? 'success' : s.status === 'INACTIVE' ? 'danger' : 'neutral'} dot>
                    {s.status}
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-surface-400">Role</span>
                    <span className={`px-2 py-0.5 text-2xs font-semibold rounded-full ${ROLE_COLORS[s.user.role]}`}>
                      {s.user.role.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {s.department && (
                    <div className="flex justify-between">
                      <span className="text-surface-400">Department</span>
                      <span className="text-surface-700">{s.department}</span>
                    </div>
                  )}
                  {s.position && (
                    <div className="flex justify-between">
                      <span className="text-surface-400">Position</span>
                      <span className="text-surface-700">{s.position}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-surface-100 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="success" onClick={() => clockIn(s.id)} icon={<CheckCircle size={12} />}>
                    Clock In
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => clockOut(s.id)} icon={<LogOut size={12} />}>
                    Clock Out
                  </Button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => openResetPw(s)}
                        className="p-1.5 text-surface-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Reset password"
                      >
                        <Key size={14} />
                      </button>
                      <button
                        onClick={() => deactivate(s)}
                        className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deactivate"
                      >
                        <UserX size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Users Tab ────────────────────────────────────── */}
      {tab === 'users' && (
        filteredUsers.length === 0 ? (
          <EmptyState icon={<Shield size={28} />} title="No users found" description="No users match your search." />
        ) : (
          <div className="table-container">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Staff Profile</th>
                    <th>Status</th>
                    <th>Joined</th>
                    {isAdmin && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-brand-50 rounded-full flex items-center justify-center text-brand-700 text-sm font-semibold shrink-0">
                            {u.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <p className="font-medium text-surface-800">{u.fullName}</p>
                        </div>
                      </td>
                      <td className="text-surface-500 font-mono text-xs">{u.email}</td>
                      <td>
                        <span className={`px-2 py-0.5 text-2xs font-semibold rounded-full ${ROLE_COLORS[u.role] || 'bg-surface-100 text-surface-600'}`}>
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-surface-500 text-sm">
                        {u.staff ? (
                          <span>
                            {u.staff.employeeId}
                            {u.staff.department && <span className="text-surface-400"> · {u.staff.department}</span>}
                          </span>
                        ) : (
                          <span className="text-surface-300">—</span>
                        )}
                      </td>
                      <td>
                        {u.staff ? (
                          <Badge variant={u.staff.status === 'ACTIVE' ? 'success' : 'danger'} dot>{u.staff.status}</Badge>
                        ) : (
                          <Badge variant="info">No profile</Badge>
                        )}
                      </td>
                      <td className="text-surface-500 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                      {isAdmin && (
                        <td>
                          <div className="flex items-center gap-1">
                            {u.staff && (
                              <>
                                <button
                                  onClick={() => {
                                    const s = staff.find((st) => st.id === u.staff!.id);
                                    if (s) openEdit(s);
                                  }}
                                  className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    const s = staff.find((st) => st.id === u.staff!.id);
                                    if (s) openResetPw(s);
                                  }}
                                  className="p-1.5 text-surface-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="Reset password"
                                >
                                  <Key size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ═══════════════════════════════════════════════════════
          CREATE USER MODAL
          ═══════════════════════════════════════════════════════ */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); setCreatedCredentials(null); }}
        title={createdCredentials ? 'User Created Successfully' : 'Add New User'}
        size="lg"
        footer={createdCredentials ? (
          <Button onClick={() => { setShowCreate(false); setCreatedCredentials(null); }}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={submitCreate} loading={saving}>Create User</Button>
          </>
        )}
      >
        {createdCredentials ? (
          <div className="space-y-4">
            <div className="bg-clinical-50 border border-clinical-200 rounded-lg p-4 text-center">
              <CheckCircle size={32} className="mx-auto text-clinical-500 mb-2" />
              <p className="text-sm font-medium text-clinical-800">User created successfully!</p>
              <p className="text-xs text-clinical-600 mt-1">Share these login credentials with the team member.</p>
            </div>
            <div className="bg-surface-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-500">Email:</span>
                <span className="text-sm font-mono font-medium text-surface-800">{createdCredentials.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-500">Password:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-medium text-surface-800">
                    {showPassword ? createdCredentials.password : '••••••••'}
                  </span>
                  <button onClick={() => setShowPassword(!showPassword)} className="text-surface-400 hover:text-surface-600">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
            <Button onClick={copyCredentials} variant="secondary" icon={<Copy size={14} />} className="w-full">
              Copy Credentials
            </Button>
            <p className="text-xs text-surface-400 text-center">
              The password will not be shown again. Make sure to save it.
            </p>
          </div>
        ) : (
          <form onSubmit={submitCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Full Name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="e.g. John Doe" />
              <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
              <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" />
              <Select
                label="Role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
              />
            </div>
            <div className="bg-surface-50 rounded-lg p-3">
              <p className="text-xs text-surface-500">
                <strong>Role permissions:</strong>{' '}
                {ROLES.find((r) => r.value === form.role)?.desc}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Clinical" />
              <div className="col-span-2">
                <Input label="Position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="e.g. Senior Optometrist" />
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          EDIT USER MODAL
          ═══════════════════════════════════════════════════════ */}
      <Modal
        open={showEdit}
        onClose={() => { setShowEdit(false); setEditTarget(null); }}
        title={`Edit — ${editTarget?.user.fullName || ''}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowEdit(false); setEditTarget(null); }}>Cancel</Button>
            <Button onClick={submitEdit} loading={saving}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Role selector */}
          <Select
            label="Role"
            value={editForm.role}
            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
            options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
          />
          <div className="bg-surface-50 rounded-lg p-3">
            <p className="text-xs text-surface-500">
              <strong>Permissions:</strong>{' '}
              {ROLES.find((r) => r.value === editForm.role)?.desc}
            </p>
          </div>

          {/* Profile fields */}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            <Input label="Department" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
            <Input label="Position" value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} />
            <Select
              label="Status"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'TERMINATED', label: 'Terminated' },
              ]}
            />
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          RESET PASSWORD MODAL
          ═══════════════════════════════════════════════════════ */}
      <Modal
        open={showResetPw}
        onClose={() => { setShowResetPw(false); setResetTarget(null); setNewPassword(''); }}
        title={`Reset Password — ${resetTarget?.user.fullName || ''}`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowResetPw(false); setResetTarget(null); }}>Cancel</Button>
            <Button onClick={submitResetPw} loading={resetSaving}>Reset Password</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
            <Key size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Password Reset</p>
              <p className="text-xs text-amber-600 mt-0.5">
                This will immediately replace the current password. The user will need the new password to log in.
              </p>
            </div>
          </div>
          <Input
            label="New Password"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 6 characters"
          />
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          DETAIL MODAL
          ═══════════════════════════════════════════════════════ */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? selected.user.fullName : ''}
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            {/* Badges */}
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 text-sm font-semibold rounded-full ${ROLE_COLORS[selected.user.role]}`}>
                {selected.user.role.replace(/_/g, ' ')}
              </div>
              <Badge variant={selected.status === 'ACTIVE' ? 'success' : selected.status === 'INACTIVE' ? 'danger' : 'neutral'} dot>
                {selected.status}
              </Badge>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-surface-400 text-xs">Employee ID</p><p className="font-medium font-mono">{selected.employeeId}</p></div>
              <div><p className="text-surface-400 text-xs">Email</p><p className="font-medium">{selected.user.email}</p></div>
              <div><p className="text-surface-400 text-xs">Department</p><p className="font-medium">{selected.department || '—'}</p></div>
              <div><p className="text-surface-400 text-xs">Position</p><p className="font-medium">{selected.position || '—'}</p></div>
              <div><p className="text-surface-400 text-xs">Phone</p><p className="font-medium">{selected.phone || '—'}</p></div>
              <div><p className="text-surface-400 text-xs">Employed</p><p className="font-medium">{selected.employmentDate ? new Date(selected.employmentDate).toLocaleDateString() : '—'}</p></div>
            </div>

            {/* Admin actions */}
            {isAdmin && (
              <div className="border-t border-surface-100 pt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setSelected(null); openEdit(selected); }} icon={<Edit size={12} />}>
                  Edit Details
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { setSelected(null); openResetPw(selected); }} icon={<Key size={12} />}>
                  Reset Password
                </Button>
                <Button size="sm" variant="danger" onClick={() => { setSelected(null); deactivate(selected); }} icon={<UserX size={12} />}>
                  Deactivate
                </Button>
              </div>
            )}

            {/* Attendance */}
            <div className="border-t border-surface-100 pt-4">
              <h4 className="text-sm font-semibold mb-3">Recent Attendance</h4>
              {attendance.length === 0 ? (
                <p className="text-sm text-surface-400">No attendance records yet</p>
              ) : (
                <div className="space-y-2">
                  {attendance.slice(0, 10).map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-2.5 bg-surface-50 rounded-lg text-sm">
                      <span className="text-surface-600">{new Date(a.date).toLocaleDateString()}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-surface-500 font-mono text-xs">
                          {a.clockIn ? new Date(a.clockIn).toLocaleTimeString() : '—'} — {a.clockOut ? new Date(a.clockOut).toLocaleTimeString() : '—'}
                        </span>
                        {attendanceStatus(a.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
