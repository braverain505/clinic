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
import { Users, Plus, CheckCircle, LogOut, Eye, EyeOff, Copy } from 'lucide-react';

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

interface AttendanceRecord {
  id: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: string;
}

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

export default function Staff() {
  const toast = useToast();
  const { isRole } = useAuthStore();
  const isAdmin = isRole('OWNER', 'ADMIN');

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Create form
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', role: 'RECEPTIONIST',
    phone: '', department: '', position: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff');
      setStaff(res.data);
    } catch { toast.error('Failed to load staff'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const loadDetail = async (s: StaffMember) => {
    setSelected(s);
    try {
      const res = await api.get(`/staff/${s.id}`);
      setAttendance(res.data.attendance || []);
    } catch { toast.error('Failed to load attendance'); }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.fullName || !form.email || !form.password) { toast.error('Fill in all required fields'); return; }
    setSaving(true);
    try {
      const res = await api.post('/staff', form);
      toast.success(`${form.fullName} created as ${form.role}`);
      setCreatedCredentials(res.data.credentials);
      setForm({ fullName: '', email: '', password: '', role: 'RECEPTIONIST', phone: '', department: '', position: '' });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to create staff'); }
    finally { setSaving(false); }
  };

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

  const copyCredentials = () => {
    if (createdCredentials) {
      navigator.clipboard.writeText(`Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`);
      toast.success('Credentials copied to clipboard');
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
      PRESENT: 'success', LATE: 'warning', ABSENT: 'danger', HALF_DAY: 'info', ON_LEAVE: 'neutral',
    };
    return <Badge variant={map[status] || 'neutral'} dot>{status.replace('_', ' ')}</Badge>;
  };

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="page-header">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Operations</p>
          <h1>Staff Management</h1>
          <p>Manage team members, roles, and attendance.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setShowForm(true); setCreatedCredentials(null); }} icon={<Plus size={16} />}>Add Staff Member</Button>
        )}
      </div>

      {/* Role summary */}
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

      {/* Staff list */}
      {staff.length === 0 ? (
        <EmptyState icon={<Users size={28} />} title="No staff members" description="Add staff to manage roles and attendance." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s) => (
            <div key={s.id} className="card p-5 hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => loadDetail(s)}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-semibold text-sm">
                  {s.user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-surface-900 truncate">{s.user.fullName}</p>
                  <p className="text-xs text-surface-400 font-mono">{s.employeeId || s.user.email}</p>
                </div>
                <Badge variant={s.status === 'ACTIVE' ? 'success' : 'neutral'} dot>{s.status}</Badge>
              </div>
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
              <div className="mt-4 pt-3 border-t border-surface-100 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="success" onClick={() => clockIn(s.id)} icon={<CheckCircle size={12} />}>Clock In</Button>
                <Button size="sm" variant="secondary" onClick={() => clockOut(s.id)} icon={<LogOut size={12} />}>Clock Out</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Staff Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setCreatedCredentials(null); }}
        title={createdCredentials ? 'Staff Created Successfully' : 'Add New Staff Member'}
        size="lg"
        footer={createdCredentials ? (
          <Button onClick={() => { setShowForm(false); setCreatedCredentials(null); }}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={submit} loading={saving}>Create Staff Member</Button>
          </>
        )}>
        {createdCredentials ? (
          <div className="space-y-4">
            <div className="bg-clinical-50 border border-clinical-200 rounded-lg p-4 text-center">
              <CheckCircle size={32} className="mx-auto text-clinical-500 mb-2" />
              <p className="text-sm font-medium text-clinical-800">Staff member created successfully!</p>
              <p className="text-xs text-clinical-600 mt-1">Share these login credentials with the staff member.</p>
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
            <Button onClick={copyCredentials} variant="secondary" icon={<Copy size={14} />} className="w-full">Copy Credentials</Button>
            <p className="text-xs text-surface-400 text-center">The password will not be shown again. Make sure to save it.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Full Name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="e.g. John Doe" />
              <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
              <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" />
              <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                options={ROLES.map((r) => ({ value: r.value, label: r.label }))} />
            </div>
            <div className="bg-surface-50 rounded-lg p-3">
              <p className="text-xs text-surface-500">
                <strong>Role permissions:</strong> {ROLES.find((r) => r.value === form.role)?.desc}
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

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? selected.user.fullName : ''} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 text-sm font-semibold rounded-full ${ROLE_COLORS[selected.user.role]}`}>
                {selected.user.role.replace(/_/g, ' ')}
              </div>
              <Badge variant={selected.status === 'ACTIVE' ? 'success' : 'neutral'} dot>{selected.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-surface-400 text-xs">Employee ID</p><p className="font-medium font-mono">{selected.employeeId}</p></div>
              <div><p className="text-surface-400 text-xs">Email</p><p className="font-medium">{selected.user.email}</p></div>
              <div><p className="text-surface-400 text-xs">Department</p><p className="font-medium">{selected.department || '—'}</p></div>
              <div><p className="text-surface-400 text-xs">Position</p><p className="font-medium">{selected.position || '—'}</p></div>
              <div><p className="text-surface-400 text-xs">Phone</p><p className="font-medium">{selected.phone || '—'}</p></div>
              <div><p className="text-surface-400 text-xs">Employed</p><p className="font-medium">{selected.employmentDate ? new Date(selected.employmentDate).toLocaleDateString() : '—'}</p></div>
            </div>

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
                        {statusBadge(a.status)}
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
