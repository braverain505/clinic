import { FormEvent, useEffect, useState } from 'react';
import { api } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { DollarSign, Plus, Search, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Expense {
  id: string;
  expenseId: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod?: string;
  reference?: string;
  status: string;
  createdBy?: { fullName: string };
}

const CATEGORIES = ['RENT', 'UTILITIES', 'SALARIES', 'TRANSPORTATION', 'PROCUREMENT', 'MAINTENANCE', 'MARKETING', 'SUPPLIES', 'OTHER'];
const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];

export default function Expenses() {
  const toast = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: 'RENT', description: '', amount: '', paymentMethod: 'CASH', date: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [expRes, sumRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/expenses/summary'),
      ]);
      setExpenses(expRes.data);
      setSummary(sumRes.data);
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = expenses.filter((e) =>
    search ? `${e.description} ${e.category} ${e.expenseId}`.toLowerCase().includes(search.toLowerCase()) : true
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.description || !form.amount) { toast.error('Fill in all required fields'); return; }
    setSaving(true);
    try {
      await api.post('/expenses', form);
      toast.success('Expense recorded');
      setShowForm(false);
      setForm({ category: 'RENT', description: '', amount: '', paymentMethod: 'CASH', date: '' });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

  const chartData = summary?.byCategory?.map((c: any) => ({ name: c.category.replace('_', ' '), value: c.total })) || [];

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="page-header">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Finance</p>
          <h1>Expenses</h1>
          <p>Track and manage business expenses by category.</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>Record Expense</Button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                <TrendingUp size={18} className="text-brand-600" />
              </div>
              <div>
                <p className="text-xs text-surface-400 font-medium">This Month</p>
                <p className="text-xl font-bold text-surface-900">{formatCurrency(summary.monthlyTotal)}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {summary.byCategory?.map((c: any) => (
                <div key={c.category} className="flex items-center justify-between text-sm">
                  <span className="text-surface-600">{c.category.replace('_', ' ')}</span>
                  <span className="font-medium">{formatCurrency(c.total)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-surface-900 mb-4">By Category</h3>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                      {chartData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`₦${v.toLocaleString('en-NG')}`, 'Amount']} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-sm text-surface-400">No data</div>}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-surface-400" size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expenses..." className="input pl-9" />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={<DollarSign size={28} />} title="No expenses found" description="Record a business expense." />
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>ID</th><th>Category</th><th>Description</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th>Recorded By</th></tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td className="font-mono text-xs text-brand-600">{e.expenseId}</td>
                    <td><Badge variant="info">{e.category.replace('_', ' ')}</Badge></td>
                    <td className="text-surface-800 max-w-[200px] truncate">{e.description}</td>
                    <td className="font-semibold">{formatCurrency(e.amount)}</td>
                    <td className="text-surface-500">{e.paymentMethod?.replace('_', ' ') || '—'}</td>
                    <td><Badge variant={e.status === 'APPROVED' ? 'success' : e.status === 'REJECTED' ? 'danger' : 'warning'} dot>{e.status}</Badge></td>
                    <td className="text-surface-500">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="text-surface-500">{e.createdBy?.fullName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Expense" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={submit} loading={saving}>Record Expense</Button></>}>
        <form onSubmit={submit} className="space-y-4">
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={CATEGORIES.map((c) => ({ value: c, label: c.replace('_', ' ') }))} />
          <Input label="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What was this expense for?" />
          <Input label="Amount" type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="₦" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Payment Method" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} options={[{ value: 'CASH', label: 'Cash' }, { value: 'BANK_TRANSFER', label: 'Bank Transfer' }, { value: 'POS', label: 'POS' }, { value: 'CARD', label: 'Card' }]} />
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
