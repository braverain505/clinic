import { FormEvent, useEffect, useState } from 'react';
import { api } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Clock, Plus, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

interface FollowUp {
  id: string;
  reason: string;
  followUpDate: string;
  assignedStaff?: string;
  notes?: string;
  status: string;
  patient: { firstName: string; lastName: string; phone: string };
  examination?: { examId: string };
}

export default function FollowUps() {
  const toast = useToast();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [categorized, setCategorized] = useState<{ dueToday: FollowUp[]; dueThisWeek: FollowUp[]; overdue: FollowUp[] }>({ dueToday: [], dueThisWeek: [], overdue: [] });
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'today' | 'week'>('all');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patientId: '', reason: '', followUpDate: '', notes: '', status: 'PENDING' });

  const load = async () => {
    setLoading(true);
    try {
      const [fupRes, patRes] = await Promise.all([
        api.get('/follow-ups'),
        api.get('/patients', { params: { page: 1, limit: 200 } }),
      ]);
      setFollowUps(fupRes.data.followUps);
      setCategorized(fupRes.data.categorized);
      setPatients(patRes.data.patients);
    } catch {
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = activeTab === 'all' ? followUps
    : activeTab === 'overdue' ? followUps.filter((f) => f.status !== 'COMPLETED' && new Date(f.followUpDate) < new Date())
    : activeTab === 'today' ? categorized.dueToday
    : categorized.dueThisWeek;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.patientId || !form.reason || !form.followUpDate) { toast.error('Fill in all required fields'); return; }
    setSaving(true);
    try {
      await api.post('/follow-ups', form);
      toast.success('Follow-up scheduled');
      setShowForm(false);
      setForm({ patientId: '', reason: '', followUpDate: '', notes: '', status: 'PENDING' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create follow-up');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/follow-ups/${id}`, { status });
      toast.success(`Follow-up marked as ${status.toLowerCase()}`);
      load();
    } catch {
      toast.error('Failed to update follow-up');
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; dot: boolean }> = {
      PENDING: { variant: 'warning', dot: true },
      CONTACTED: { variant: 'info', dot: true },
      SCHEDULED: { variant: 'info', dot: true },
      COMPLETED: { variant: 'success', dot: true },
      MISSED: { variant: 'danger', dot: true },
      CANCELLED: { variant: 'neutral', dot: false },
    };
    const cfg = map[status] || { variant: 'neutral' as const, dot: false };
    return <Badge variant={cfg.variant} dot={cfg.dot}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-16 w-full" />
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="page-header">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Clinical</p>
          <h1>Follow-ups</h1>
          <p>Track and manage patient follow-up appointments.</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
          Schedule Follow-up
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => setActiveTab('all')} className={`card p-4 text-left transition-all ${activeTab === 'all' ? 'ring-2 ring-brand-500' : ''}`}>
          <p className="text-xs text-surface-400 font-medium">All Follow-ups</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{followUps.length}</p>
        </button>
        <button onClick={() => setActiveTab('overdue')} className={`card p-4 text-left transition-all ${activeTab === 'overdue' ? 'ring-2 ring-red-500' : ''}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" />
            <p className="text-xs text-red-500 font-medium">Overdue</p>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">{categorized.overdue.length}</p>
        </button>
        <button onClick={() => setActiveTab('today')} className={`card p-4 text-left transition-all ${activeTab === 'today' ? 'ring-2 ring-amber-500' : ''}`}>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-amber-500" />
            <p className="text-xs text-amber-500 font-medium">Due Today</p>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">{categorized.dueToday.length}</p>
        </button>
        <button onClick={() => setActiveTab('week')} className={`card p-4 text-left transition-all ${activeTab === 'week' ? 'ring-2 ring-blue-500' : ''}`}>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-blue-500" />
            <p className="text-xs text-blue-500 font-medium">This Week</p>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">{categorized.dueThisWeek.length}</p>
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Clock size={28} />} title="No follow-ups" description="Schedule a follow-up to keep patients on track." />
      ) : (
        <div className="space-y-2">
          {filtered.map((fup) => (
            <div key={fup.id} className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
              <div className="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center shrink-0">
                <Clock size={18} className="text-surface-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-surface-800">{fup.patient.firstName} {fup.patient.lastName}</p>
                  {statusBadge(fup.status)}
                </div>
                <p className="text-xs text-surface-500 mt-0.5">{fup.reason}</p>
                <p className="text-xs text-surface-400 mt-0.5">
                  Due: {new Date(fup.followUpDate).toLocaleDateString()} · {fup.assignedStaff || 'Unassigned'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {fup.status !== 'COMPLETED' && (
                  <Button size="sm" variant="success" onClick={() => updateStatus(fup.id, 'COMPLETED')} icon={<CheckCircle size={12} />}>
                    Complete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Schedule Follow-up" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={submit} loading={saving}>Schedule</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <Select
            label="Patient"
            required
            value={form.patientId}
            onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            placeholder="Select patient"
            options={patients.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName} (${p.patientId})` }))}
          />
          <Input label="Reason" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Routine eye review" />
          <Input label="Follow-up Date" type="date" required value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
        </form>
      </Modal>
    </div>
  );
}
