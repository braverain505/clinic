import { FormEvent, useEffect, useState } from 'react';
import { api } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Truck, Plus, Search, Edit, Phone, Mail } from 'lucide-react';

interface Supplier {
  id: string;
  supplierId: string;
  company: string;
  contactName?: string;
  phone: string;
  email?: string;
  address?: string;
  paymentTerms?: string;
  balance: number;
  status: string;
}

interface SupplierForm {
  company: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
  notes: string;
}

const emptyForm: SupplierForm = { company: '', contactName: '', phone: '', email: '', address: '', paymentTerms: '', notes: '' };

export default function Suppliers() {
  const toast = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = suppliers.filter((s) =>
    search ? `${s.company} ${s.contactName || ''}`.toLowerCase().includes(search.toLowerCase()) : true
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/suppliers/${editing.id}`, form);
        toast.success('Supplier updated');
      } else {
        await api.post('/suppliers', form);
        toast.success('Supplier created');
      }
      setShowForm(false); setEditing(null); setForm(emptyForm); load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ company: s.company, contactName: s.contactName || '', phone: s.phone, email: s.email || '', address: s.address || '', paymentTerms: s.paymentTerms || '', notes: '' });
    setShowForm(true);
  };

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="page-header">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Optical</p>
          <h1>Suppliers</h1>
          <p>Manage supplier profiles and purchase orders.</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }} icon={<Plus size={16} />}>Add Supplier</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-surface-400" size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers..." className="input pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Truck size={28} />} title="No suppliers found" description="Add suppliers to track procurement." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className="card p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-surface-900">{s.company}</p>
                  <p className="text-xs text-surface-400 font-mono">{s.supplierId}</p>
                </div>
                <Badge variant={s.status === 'ACTIVE' ? 'success' : 'neutral'} dot>{s.status}</Badge>
              </div>
              {s.contactName && <p className="text-sm text-surface-600 mb-1">{s.contactName}</p>}
              <div className="space-y-1 text-sm text-surface-500">
                <div className="flex items-center gap-2"><Phone size={13} /> {s.phone}</div>
                {s.email && <div className="flex items-center gap-2"><Mail size={13} /> {s.email}</div>}
              </div>
              {s.balance > 0 && (
                <div className="mt-3 pt-3 border-t border-surface-100">
                  <p className="text-xs text-surface-400">Outstanding Balance</p>
                  <p className="font-semibold text-red-600">₦{s.balance.toLocaleString('en-NG')}</p>
                </div>
              )}
              <div className="mt-3 flex justify-end">
                <button onClick={() => openEdit(s)} className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                  <Edit size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing ? 'Edit Supplier' : 'Add Supplier'} size="lg"
        footer={<><Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button><Button onClick={submit} loading={saving}>{editing ? 'Update' : 'Create'}</Button></>}>
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          <Input label="Company" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <Input label="Contact Name" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          <Input label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="col-span-2"><Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <Input label="Payment Terms" value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} placeholder="e.g. Net 30" />
          <div className="col-span-2"><label className="input-label">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input min-h-[80px]" /></div>
        </form>
      </Modal>
    </div>
  );
}
