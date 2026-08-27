import { useEffect, useState } from 'react';
import { api } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { Users, CheckCircle, LogOut } from 'lucide-react';

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

export default function Staff() {
  const toast = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);


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

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
      PRESENT: 'success', LATE: 'warning', ABSENT: 'danger', HALF_DAY: 'info', ON_LEAVE: 'neutral',
    };
    return <Badge variant={map[status] || 'neutral'} dot>{status.replace('_', ' ')}</Badge>;
  };

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Operations</p>
        <h1>Staff Management</h1>
        <p>Manage staff profiles and track attendance.</p>
      </div>

      {staff.length === 0 ? (
        <EmptyState icon={<Users size={28} />} title="No staff members" description="Add staff to manage attendance and assignments." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s) => (
            <div key={s.id} className="card p-5 hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => loadDetail(s)}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-semibold">
                  {s.user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-surface-900">{s.user.fullName}</p>
                  <p className="text-xs text-surface-400 font-mono">{s.employeeId}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-400">Role</span>
                  <Badge variant="info">{s.user.role}</Badge>
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

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? selected.user.fullName : ''} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-surface-400 text-xs">Employee ID</p><p className="font-medium font-mono">{selected.employeeId}</p></div>
              <div><p className="text-surface-400 text-xs">Email</p><p className="font-medium">{selected.user.email}</p></div>
              <div><p className="text-surface-400 text-xs">Department</p><p className="font-medium">{selected.department || '—'}</p></div>
              <div><p className="text-surface-400 text-xs">Position</p><p className="font-medium">{selected.position || '—'}</p></div>
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
