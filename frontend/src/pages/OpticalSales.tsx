import { useEffect, useState } from 'react';
import { api } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { ShoppingCart, Plus, Search, Trash2, Package, Minus, Download } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  sellingPrice: number;
  quantity: number;
}

interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Sale {
  id: string;
  invoiceId: string;
  patient: { firstName: string; lastName: string };
  subtotal: number;
  discount: number;
  total: number;
  paymentStatus: string;
  amountPaid: number;
  outstandingBalance: number;
  createdAt: string;
  items: { product: { name: string }; quantity: number; unitPrice: number; total: number }[];
}

export default function OpticalSales() {
  const toast = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPOS, setShowPOS] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [discount, setDiscount] = useState('0');
  const [paymentStatus, setPaymentStatus] = useState('UNPAID');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const load = async () => {
    setLoading(true);
    try {
      const [salesRes, productsRes, patientsRes] = await Promise.all([
        api.get('/optical-sales', { params: { page: 1, limit: 50 } }),
        api.get('/products', { params: { page: 1, limit: 200 } }),
        api.get('/patients', { params: { page: 1, limit: 200 } }),
      ]);
      setSales(salesRes.data.sales);
      setProducts(productsRes.data.products);
      setPatients(patientsRes.data.patients);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredSales = sales.filter((s) =>
    search ? `${s.patient.firstName} ${s.patient.lastName} ${s.invoiceId}`.toLowerCase().includes(search.toLowerCase()) : true
  );

  const filteredProducts = products.filter((p) =>
    productSearch ? p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()) : true
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast.error(`Only ${product.quantity} units in stock`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, qty: number) => {
    const product = products.find((p) => p.id === productId);
    if (product && qty > product.quantity) {
      toast.error(`Only ${product.quantity} units in stock`);
      return;
    }
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item))
      );
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const discountAmount = Math.min(parseFloat(discount) || 0, subtotal);
  const total = subtotal - discountAmount;

  const submitSale = async () => {
    if (!selectedPatient) { toast.error('Please select a patient'); return; }
    if (cart.length === 0) { toast.error('Cart is empty'); return; }

    setSaving(true);
    try {
      const saleRes = await api.post('/optical-sales', {
        patientId: selectedPatient,
        items: cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        discount: discountAmount,
        paymentStatus,
      });

      // Record payment if paid
      if (paymentAmount && parseFloat(paymentAmount) > 0) {
        await api.post('/payments', {
          saleId: saleRes.data.sale.id,
          amount: parseFloat(paymentAmount),
          paymentMethod,
        });
      }

      // Generate receipt
      await api.post('/receipts', { saleId: saleRes.data.sale.id });

      toast.success('Sale completed successfully');
      setShowPOS(false);
      setCart([]);
      setSelectedPatient('');
      setDiscount('0');
      setPaymentStatus('UNPAID');
      setPaymentAmount('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create sale');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <Badge variant="success" dot>Paid</Badge>;
      case 'PARTIALLY_PAID': return <Badge variant="warning" dot>Partial</Badge>;
      default: return <Badge variant="danger" dot>Unpaid</Badge>;
    }
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
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Optical</p>
          <h1>Optical Sales</h1>
          <p>Process sales, manage invoices, and track payments.</p>
        </div>
        <Button onClick={() => setShowPOS(true)} icon={<Plus size={16} />}>
          New Sale
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-surface-400" size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by patient or invoice..." className="input pl-9" />
        </div>
        <span className="text-sm text-surface-400">{filteredSales.length} records</span>
      </div>

      {filteredSales.length === 0 ? (
        <EmptyState icon={<ShoppingCart size={28} />} title="No sales found" description="Create an optical sale to get started." action={<Button onClick={() => setShowPOS(true)} icon={<Plus size={16} />}>New Sale</Button>} />
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Patient</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="font-mono text-xs text-brand-600 font-medium">{sale.invoiceId}</td>
                    <td className="font-medium text-surface-800">{sale.patient.firstName} {sale.patient.lastName}</td>
                    <td className="text-surface-500">{sale.items.length} item(s)</td>
                    <td className="font-medium">{formatCurrency(sale.total)}</td>
                    <td className="text-surface-600">{formatCurrency(sale.amountPaid)}</td>
                    <td className="text-surface-500">
                      <div className="flex items-center gap-2">
                        {sale.outstandingBalance > 0 && (
                          <Badge variant="danger" dot>Pending</Badge>
                        )}
                      </div>
                    </td>
                    <td className={sale.outstandingBalance > 0 ? 'text-red-600 font-medium' : 'text-surface-500'}>
                      {formatCurrency(sale.outstandingBalance)}
                    </td>
                    <td>{statusBadge(sale.paymentStatus)}</td>
                    <td>
                      <a
                        href={`${import.meta.env.VITE_API_URL || '/api'}/receipts/${sale.id}/pdf`}
                        target="_blank"
                        className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors inline-flex"
                        title="Download Receipt PDF"
                      >
                        <Download size={15} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POS Modal */}
      <Modal open={showPOS} onClose={() => setShowPOS(false)} title="New Optical Sale" size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPOS(false)}>Cancel</Button>
            <Button onClick={submitSale} loading={saving} disabled={cart.length === 0}>
              Complete Sale — {formatCurrency(total)}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Patient Selection */}
          <Select
            label="Patient"
            required
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            placeholder="Select patient"
            options={patients.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName} (${p.patientId})` }))}
          />

          {/* Product Search */}
          <div>
            <label className="input-label">Add Products</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-surface-400" size={16} />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="input pl-9"
              />
            </div>
            {productSearch && (
              <div className="mt-2 bg-white border border-surface-200 rounded-lg max-h-48 overflow-y-auto shadow-elevated">
                {filteredProducts.slice(0, 8).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => { addToCart(product); setProductSearch(''); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-50 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-surface-800">{product.name}</p>
                      <p className="text-xs text-surface-400">{product.sku} · {product.brand} · {product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-surface-900">{formatCurrency(product.sellingPrice)}</p>
                      <p className={`text-xs ${product.quantity < 5 ? 'text-red-500' : 'text-surface-400'}`}>
                        {product.quantity} in stock
                      </p>
                    </div>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="p-4 text-center text-sm text-surface-400">No products found</div>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="bg-surface-50 rounded-lg border border-surface-200">
              <div className="px-4 py-3 border-b border-surface-200 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-surface-900">Cart ({cart.length} items)</h4>
              </div>
              <div className="divide-y divide-surface-100">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                      <Package size={16} className="text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800 truncate">{item.product.name}</p>
                      <p className="text-xs text-surface-400">{item.product.sku} · {formatCurrency(item.product.sellingPrice)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-7 h-7 bg-white border border-surface-200 rounded flex items-center justify-center text-surface-500 hover:bg-surface-50">
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-7 h-7 bg-white border border-surface-200 rounded flex items-center justify-center text-surface-500 hover:bg-surface-50">
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-surface-900 w-24 text-right">
                      {formatCurrency(item.product.sellingPrice * item.quantity)}
                    </p>
                    <button onClick={() => removeFromCart(item.product.id)} className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          {cart.length > 0 && (
            <div className="bg-white rounded-lg border border-surface-200 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm items-center gap-3">
                <span className="text-surface-500">Discount</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-28 text-right input py-1.5 text-sm"
                  min="0"
                />
              </div>
              <div className="border-t border-surface-200 pt-3 flex justify-between">
                <span className="font-semibold text-surface-900">Total</span>
                <span className="text-lg font-bold text-surface-900">{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          {/* Payment */}
          {cart.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-surface-900">Payment</h4>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Payment Status"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  options={[
                    { value: 'UNPAID', label: 'Unpaid (Credit)' },
                    { value: 'PARTIALLY_PAID', label: 'Partial Payment' },
                    { value: 'PAID', label: 'Full Payment' },
                  ]}
                />
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
              </div>
              {(paymentStatus === 'PARTIALLY_PAID' || paymentStatus === 'PAID') && (
                <Input
                  label="Payment Amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={paymentStatus === 'PAID' ? total.toString() : 'Enter amount'}
                />
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
