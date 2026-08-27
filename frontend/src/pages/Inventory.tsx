import { FormEvent, useEffect, useState } from 'react';
import { api } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Package, Plus, Search, AlertTriangle, Edit } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  category: string;
  brand: string;
  description?: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minimumStock: number;
  supplier?: string;
  status: string;
}

interface ProductForm {
  sku: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  purchasePrice: string;
  sellingPrice: string;
  quantity: string;
  minimumStock: string;
  supplier: string;
}

const emptyForm: ProductForm = {
  sku: '', name: '', category: 'FRAMES', brand: '', description: '',
  purchasePrice: '', sellingPrice: '', quantity: '', minimumStock: '10', supplier: '',
};

export default function Inventory() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [prodRes, statsRes] = await Promise.all([
        api.get('/products', { params: { page: 1, limit: 200, ...(categoryFilter ? { category: categoryFilter } : {}) } }),
        api.get('/products/dashboard/stats'),
      ]);
      setProducts(prodRes.data.products);
      setStats(statsRes.data);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [categoryFilter]);

  const filtered = products.filter((p) =>
    search ? `${p.name} ${p.sku} ${p.brand}`.toLowerCase().includes(search.toLowerCase()) : true
  );

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      sku: product.sku,
      name: product.name,
      category: product.category,
      brand: product.brand,
      description: product.description || '',
      purchasePrice: product.purchasePrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      quantity: product.quantity.toString(),
      minimumStock: product.minimumStock.toString(),
      supplier: product.supplier || '',
    });
    setShowForm(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', form);
        toast.success('Product created successfully');
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-16 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24" />)}
        </div>
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="page-header">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Optical</p>
          <h1>Inventory</h1>
          <p>Manage products, stock levels, and inventory movements.</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }} icon={<Plus size={16} />}>
          Add Product
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-xs text-surface-400 font-medium">Total Products</p>
            <p className="text-2xl font-bold text-surface-900 mt-1">{stats.totalProducts}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-surface-400 font-medium">Total Units</p>
            <p className="text-2xl font-bold text-surface-900 mt-1">{stats.totalUnits}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-surface-400 font-medium">Inventory Value</p>
            <p className="text-2xl font-bold text-surface-900 mt-1">{formatCurrency(stats.inventoryValue)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-surface-400 font-medium">Low Stock Items</p>
            <p className={`text-2xl font-bold mt-1 ${stats.lowStockProducts > 0 ? 'text-red-600' : 'text-surface-900'}`}>
              {stats.lowStockProducts}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-surface-400" size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="input pl-9" />
        </div>
        <div className="flex gap-2">
          {['', 'FRAMES', 'LENSES', 'CONTACT_LENSES', 'ACCESSORIES'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                categoryFilter === cat
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
              }`}
            >
              {cat || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Package size={28} />} title="No products found" description="Add products to start managing inventory." />
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <p className="font-medium text-surface-800">{product.name}</p>
                      {product.description && <p className="text-xs text-surface-400 truncate max-w-[200px]">{product.description}</p>}
                    </td>
                    <td className="font-mono text-xs text-brand-600">{product.sku}</td>
                    <td>
                      <Badge variant="info">{product.category.replace('_', ' ')}</Badge>
                    </td>
                    <td className="text-surface-500">{product.brand}</td>
                    <td className="font-medium">{formatCurrency(product.sellingPrice)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${product.quantity <= product.minimumStock ? 'text-red-600' : 'text-surface-800'}`}>
                          {product.quantity}
                        </span>
                        {product.quantity <= product.minimumStock && product.quantity > 0 && (
                          <AlertTriangle size={14} className="text-amber-500" />
                        )}
                        {product.quantity === 0 && (
                          <Badge variant="danger">Out of stock</Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      {product.quantity <= product.minimumStock ? (
                        <Badge variant="danger" dot>Low Stock</Badge>
                      ) : (
                        <Badge variant="success" dot>In Stock</Badge>
                      )}
                    </td>
                    <td>
                      <button onClick={() => openEdit(product)} className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                        <Edit size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing ? 'Edit Product' : 'Add Product'} size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            <Button onClick={submit} loading={saving}>{editing ? 'Update Product' : 'Add Product'}</Button>
          </>
        }
      >
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          {!editing && <Input label="SKU" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. FRM-006" />}
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Category" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={[
              { value: 'FRAMES', label: 'Frames' },
              { value: 'LENSES', label: 'Lenses' },
              { value: 'CONTACT_LENSES', label: 'Contact Lenses' },
              { value: 'ACCESSORIES', label: 'Accessories' },
            ]}
          />
          <Input label="Brand" required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          <Input label="Purchase Price" type="number" required value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
          <Input label="Selling Price" type="number" required value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
          <Input label="Quantity" type="number" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <Input label="Minimum Stock" type="number" required value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} />
          <div className="col-span-2">
            <Input label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="input-label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-[80px]" placeholder="Product description..." />
          </div>
        </form>
      </Modal>
    </div>
  );
}
