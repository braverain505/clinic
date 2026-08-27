import { FormEvent, useEffect, useState } from 'react';
import { api } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { DollarSign, Plus, Search } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  paymentDate: string;
  patient: { firstName: string; lastName: string };
  sale: { invoiceId: string; total: number; outstandingBalance: number };
  receivedBy: { fullName: string };
}

interface Sale {
  id: string;
  invoiceId: string;
  patient: { firstName: string; lastName: string };
  total: number;
  outstandingBalance: number;
  paymentStatus: string;
}

export default function Payments() {
  const toast = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [outstandingSales, setOutstandingSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saleId, setSaleId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [reference, setReference] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [payRes, outRes] = await Promise.all([
        api.get('/payments'),
        api.get('/payments/summary/outstanding'),
      ]);
      setPayments(payRes.data);
      setOutstandingSales(outRes.data.sales || []);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = payments.filter((p) =>
    search ? `${p.patient.firstName} ${p.patient.lastName} ${p.sale.invoiceId}`.toLowerCase().includes(search.toLowerCase()) : true
  );

  const submitPayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!saleId || !amount) { toast.error('Select a sale and enter amount'); return; }
    setSaving(true);
    try {
      await api.post('/payments', {
        saleId,
        amount: parseFloat(amount),
        paymentMethod,
        reference: reference || undefined,
      });
      toast.success('Payment recorded successfully');
      setShowForm(false);
      setSaleId('');
      setAmount('');
      setReference('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

  const methodBadge = (method: string) => {
    const map: Record<string, 'success' | 'info' | 'warning' | 'neutral'> = {
      CASH: 'success',
      BANK_TRANSFER: 'info',
      POS: 'warning',
      CARD: 'neutral',
    };
    return <Badge variant={map[method] || 'neutral'}>{method.replace('_', ' ')}</Badge>;
  };

  const totalOutstanding = outstandingSales.reduce((sum, s) => sum + s.outstandingBalance, 0);

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
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Finance</p>
          <h1>Payments</h1>
          <p>Record payments and track outstanding balances.</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
          Record Payment
        </Button>
      </div>

      {/* Outstanding Summary */}
      {totalOutstanding > 0 && (
        <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <DollarSign size={20} className="text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {outstandingSales.length} outstanding invoice(s) totalling {formatCurrency(totalOutstanding)}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Customers with pending balances</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-surface-400" size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by patient or invoice..." className="input pl-9" />
        </div>
        <span className="text-sm text-surface-400">{filtered.length} records</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={<DollarSign size={28} />} title="No payments found" description="Record a payment against an invoice." />
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Received By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((payment) => (
                  <tr key={payment.id}>
                    <td className="font-medium text-surface-800">{payment.patient.firstName} {payment.patient.lastName}</td>
                    <td className="font-mono text-xs text-brand-600">{payment.sale.invoiceId}</td>
                    <td className="font-semibold text-surface-900">{formatCurrency(payment.amount)}</td>
                    <td>{methodBadge(payment.paymentMethod)}</td>
                    <td className="text-surface-500 font-mono text-xs">{payment.reference || '—'}</td>
                    <td className="text-surface-500">{payment.receivedBy?.fullName}</td>
                    <td className="text-surface-500">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Payment" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={submitPayment} loading={saving}>Record Payment</Button>
          </>
        }
      >
        <form onSubmit={submitPayment} className="space-y-4">
          <Select
            label="Invoice"
            required
            value={saleId}
            onChange={(e) => {
              setSaleId(e.target.value);
              const sale = outstandingSales.find((s) => s.id === e.target.value);
              if (sale) setAmount(sale.outstandingBalance.toString());
            }}
            placeholder="Select invoice with outstanding balance"
            options={outstandingSales.map((s) => ({
              value: s.id,
              label: `${s.invoiceId} — ${s.patient.firstName} ${s.patient.lastName} (Balance: ${formatCurrency(s.outstandingBalance)})`,
            }))}
          />
          <Input label="Amount" type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter payment amount" />
          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: 'CASH', label: 'Cash' },
              { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
              { value: 'POS', label: 'POS Terminal' },
              { value: 'CARD', label: 'Card' },
            ]}
          />
          <Input label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction reference (optional)" />
        </form>
      </Modal>
    </div>
  );
}
