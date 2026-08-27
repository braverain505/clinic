import { FormEvent, useEffect, useState } from 'react';
import { api } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Glasses, Plus, Search, ChevronRight } from 'lucide-react';

interface SpectacleOrder {
  id: string;
  orderNumber: string;
  patient: { firstName: string; lastName: string; patientId: string };
  prescription?: { rxId: string };
  supplier?: { company: string };
  frameProduct?: string;
  lensProduct?: string;
  pd?: number;
  notes?: string;
  cost?: number;
  sellingPrice?: number;
  expectedCompletion?: string;
  status: string;
  createdBy?: { fullName: string };
  createdAt: string;
}

const STATUS_FLOW = ['DRAFT', 'ORDERED', 'IN_PRODUCTION', 'READY', 'COLLECTED'];
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-surface-100 text-surface-600',
  ORDERED: 'bg-blue-50 text-blue-700',
  IN_PRODUCTION: 'bg-amber-50 text-amber-700',
  READY: 'bg-clinical-50 text-clinical-700',
  COLLECTED: 'bg-surface-100 text-surface-500 line-through',
  CANCELLED: 'bg-red-50 text-red-600',
};

export default function SpectacleOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState<SpectacleOrder[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<SpectacleOrder | null>(null);
  const [form, setForm] = useState({
    patientId: '', frameProduct: '', lensProduct: '', pd: '',
    rightFittingHeight: '', leftFittingHeight: '', segmentHeight: '',
    notes: '', supplierId: '', cost: '', sellingPrice: '',
    expectedCompletion: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [ordRes, patRes, supRes] = await Promise.all([
        api.get('/spectacle-orders'),
        api.get('/patients', { params: { page: 1, limit: 200 } }),
        api.get('/suppliers'),
      ]);
      setOrders(ordRes.data);
      setPatients(patRes.data.patients);
      setSuppliers(supRes.data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter((o) =>
    search ? `${o.patient.firstName} ${o.patient.lastName} ${o.orderNumber}`.toLowerCase().includes(search.toLowerCase()) : true
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.patientId) { toast.error('Select a patient'); return; }
    setSaving(true);
    try {
      await api.post('/spectacle-orders', form);
      toast.success('Spectacle order created');
      setShowForm(false); setForm({ patientId: '', frameProduct: '', lensProduct: '', pd: '', rightFittingHeight: '', leftFittingHeight: '', segmentHeight: '', notes: '', supplierId: '', cost: '', sellingPrice: '', expectedCompletion: '' });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const advanceStatus = async (order: SpectacleOrder) => {
    const idx = STATUS_FLOW.indexOf(order.status);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[idx + 1];
    try {
      await api.put(`/spectacle-orders/${order.id}/status`, { status: nextStatus });
      toast.success(`Order moved to ${nextStatus.replace('_', ' ')}`);
      load();
    } catch { toast.error('Failed to update status'); }
  };

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="page-header">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Optical</p>
          <h1>Spectacle Orders</h1>
          <p>Track orders from prescription through production to collection.</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>New Order</Button>
      </div>

      {/* Status Flow Visual */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          {STATUS_FLOW.map((status, i) => (
            <div key={status} className="flex items-center">
              <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
                {status.replace('_', ' ')}
              </div>
              {i < STATUS_FLOW.length - 1 && <ChevronRight size={16} className="text-surface-300 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-surface-400" size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="input pl-9" />
      </div>

      {/* Orders */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Glasses size={28} />} title="No spectacle orders" description="Create an order from a prescription." />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="card p-4 hover:shadow-card-hover transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                  <Glasses size={18} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-surface-900">{order.orderNumber}</p>
                    <span className={`px-2 py-0.5 text-2xs font-medium rounded-full ${STATUS_COLORS[order.status]}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-surface-600">{order.patient.firstName} {order.patient.lastName}</p>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {order.frameProduct || 'No frame'} · {order.lensProduct || 'No lens'}
                    {order.expectedCompletion && ` · Due: ${new Date(order.expectedCompletion).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {order.sellingPrice && (
                    <p className="text-sm font-semibold text-surface-900">{formatCurrency(order.sellingPrice)}</p>
                  )}
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => setSelected(order)} className="btn-secondary btn-sm">View</button>
                    {order.status !== 'COLLECTED' && order.status !== 'CANCELLED' && (
                      <Button size="sm" onClick={() => advanceStatus(order)}>
                        {order.status === 'READY' ? 'Mark Collected' : 'Advance'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Spectacle Order" size="xl"
        footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={submit} loading={saving}>Create Order</Button></>}>
        <form onSubmit={submit} className="space-y-5">
          <Select label="Patient" required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            placeholder="Select patient" options={patients.map((p: any) => ({ value: p.id, label: `${p.firstName} ${p.lastName} (${p.patientId})` }))} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Frame" value={form.frameProduct} onChange={(e) => setForm({ ...form, frameProduct: e.target.value })} placeholder="e.g. RayBan Classic Black" />
            <Input label="Lens" value={form.lensProduct} onChange={(e) => setForm({ ...form, lensProduct: e.target.value })} placeholder="e.g. Progressive Lens" />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-3">Measurements</h4>
            <div className="grid grid-cols-4 gap-3">
              <Input label="PD" type="number" step="0.5" value={form.pd} onChange={(e) => setForm({ ...form, pd: e.target.value })} placeholder="mm" />
              <Input label="Right Fitting H." type="number" step="0.5" value={form.rightFittingHeight} onChange={(e) => setForm({ ...form, rightFittingHeight: e.target.value })} placeholder="mm" />
              <Input label="Left Fitting H." type="number" step="0.5" value={form.leftFittingHeight} onChange={(e) => setForm({ ...form, leftFittingHeight: e.target.value })} placeholder="mm" />
              <Input label="Segment H." type="number" step="0.5" value={form.segmentHeight} onChange={(e) => setForm({ ...form, segmentHeight: e.target.value })} placeholder="mm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Supplier" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              placeholder="Select supplier" options={suppliers.map((s: any) => ({ value: s.id, label: s.company }))} />
            <Input label="Expected Completion" type="date" value={form.expectedCompletion} onChange={(e) => setForm({ ...form, expectedCompletion: e.target.value })} />
            <Input label="Cost (₦)" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            <Input label="Selling Price (₦)" type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
          </div>

          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.orderNumber} — ${selected.patient.firstName} ${selected.patient.lastName}` : ''} size="lg">
        {selected && (
          <div className="space-y-4">
            {/* Status progress */}
            <div className="flex items-center gap-2">
              {STATUS_FLOW.map((s, i) => {
                const currentIdx = STATUS_FLOW.indexOf(selected.status);
                const isActive = i <= currentIdx;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-400'}`}>
                      {i + 1}
                    </div>
                    {i < STATUS_FLOW.length - 1 && <div className={`w-8 h-0.5 ${i < currentIdx ? 'bg-brand-600' : 'bg-surface-200'}`} />}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-surface-400 text-xs">Frame</p><p className="font-medium">{selected.frameProduct || '—'}</p></div>
              <div><p className="text-surface-400 text-xs">Lens</p><p className="font-medium">{selected.lensProduct || '—'}</p></div>
              <div><p className="text-surface-400 text-xs">PD</p><p className="font-medium">{selected.pd || '—'} mm</p></div>
              <div><p className="text-surface-400 text-xs">Supplier</p><p className="font-medium">{selected.supplier?.company || '—'}</p></div>
              <div><p className="text-surface-400 text-xs">Cost</p><p className="font-medium">{selected.cost ? formatCurrency(selected.cost) : '—'}</p></div>
              <div><p className="text-surface-400 text-xs">Selling Price</p><p className="font-medium">{selected.sellingPrice ? formatCurrency(selected.sellingPrice) : '—'}</p></div>
              {selected.expectedCompletion && (
                <div><p className="text-surface-400 text-xs">Expected Completion</p><p className="font-medium">{new Date(selected.expectedCompletion).toLocaleDateString()}</p></div>
              )}
              <div><p className="text-surface-400 text-xs">Created By</p><p className="font-medium">{selected.createdBy?.fullName || '—'}</p></div>
            </div>
            {selected.notes && (
              <div><p className="text-surface-400 text-xs">Notes</p><p className="text-sm text-surface-700">{selected.notes}</p></div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
