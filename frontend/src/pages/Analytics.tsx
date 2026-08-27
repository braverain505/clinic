import { useEffect, useState } from 'react';
import { api } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Users, ShoppingCart, Activity, DollarSign } from 'lucide-react';

interface RevenueData {
  totalRevenue: number;
  avgDaily: number;
  transactions: number;
  byDate: { date: string; amount: number }[];
}

interface PatientData {
  totalPatients: number;
  newPatients: number;
  returningPatients: number;
  growth: number;
}

interface SalesData {
  totalSales: number;
  totalRevenue: number;
  avgSale: number;
  byCategory: Record<string, { count: number; revenue: number }>;
}

interface FinancialData {
  totalRevenue: number;
  totalPaid: number;
  totalOutstanding: number;
  totalDiscount: number;
}

interface ClinicalData {
  examinations: number;
  prescriptions: number;
  followups: number;
}

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const toast = useToast();
  const [filter, setFilter] = useState('30days');
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [patients, setPatients] = useState<PatientData | null>(null);
  const [sales, setSales] = useState<SalesData | null>(null);
  const [financial, setFinancial] = useState<FinancialData | null>(null);
  const [clinical, setClinical] = useState<ClinicalData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [revRes, patRes, salRes, finRes, cliRes] = await Promise.all([
        api.get(`/analytics/revenue?filter=${filter}`),
        api.get(`/analytics/patients?filter=${filter}`),
        api.get(`/analytics/sales?filter=${filter}`),
        api.get(`/analytics/financial?filter=${filter}`),
        api.get(`/analytics/clinical?filter=${filter}`),
      ]);
      setRevenue(revRes.data);
      setPatients(patRes.data);
      setSales(salRes.data);
      setFinancial(finRes.data);
      setClinical(cliRes.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

  const revenueChartData = revenue?.byDate?.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
    revenue: d.amount,
  })) || [];

  const categoryChartData = sales?.byCategory
    ? Object.entries(sales.byCategory).map(([name, data]) => ({
        name: name.replace('_', ' '),
        count: data.count,
        revenue: data.revenue,
      }))
    : [];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-16 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-80" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="page-header">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Intelligence</p>
          <h1>Analytics</h1>
          <p>Business performance insights and trends.</p>
        </div>
        <div className="flex gap-2">
          {[
            { value: '7days', label: '7 Days' },
            { value: '30days', label: '30 Days' },
            { value: 'month', label: 'This Month' },
            { value: 'year', label: 'This Year' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                filter === opt.value
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <DollarSign size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-surface-400 font-medium">Total Revenue</p>
              <p className="text-xl font-bold text-surface-900">{formatCurrency(revenue?.totalRevenue || 0)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-surface-400 font-medium">New Patients</p>
              <p className="text-xl font-bold text-surface-900">{patients?.newPatients || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <ShoppingCart size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-surface-400 font-medium">Total Sales</p>
              <p className="text-xl font-bold text-surface-900">{sales?.totalSales || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Activity size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-surface-400 font-medium">Examinations</p>
              <p className="text-xl font-bold text-surface-900">{clinical?.examinations || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Revenue Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number) => [`₦${value.toLocaleString('en-NG')}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Sales by Category</h3>
          <div className="h-72">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                  >
                    {categoryChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number) => [`₦${value.toLocaleString('en-NG')}`, 'Revenue']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-surface-400">No sales data</div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      {financial && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Financial Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-50 rounded-lg p-4">
              <p className="text-xs text-surface-400 font-medium">Total Revenue</p>
              <p className="text-lg font-bold text-surface-900 mt-1">{formatCurrency(financial.totalRevenue)}</p>
            </div>
            <div className="bg-clinical-50 rounded-lg p-4">
              <p className="text-xs text-clinical-600 font-medium">Amount Collected</p>
              <p className="text-lg font-bold text-clinical-700 mt-1">{formatCurrency(financial.totalPaid)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-xs text-red-600 font-medium">Outstanding</p>
              <p className="text-lg font-bold text-red-700 mt-1">{formatCurrency(financial.totalOutstanding)}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-xs text-amber-600 font-medium">Discounts Given</p>
              <p className="text-lg font-bold text-amber-700 mt-1">{formatCurrency(financial.totalDiscount)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Clinical Summary */}
      {clinical && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Clinical Activity</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-surface-50 rounded-lg">
              <p className="text-3xl font-bold text-brand-600">{clinical.examinations}</p>
              <p className="text-xs text-surface-500 mt-1">Examinations</p>
            </div>
            <div className="text-center p-4 bg-surface-50 rounded-lg">
              <p className="text-3xl font-bold text-clinical-600">{clinical.prescriptions}</p>
              <p className="text-xs text-surface-500 mt-1">Prescriptions</p>
            </div>
            <div className="text-center p-4 bg-surface-50 rounded-lg">
              <p className="text-3xl font-bold text-amber-600">{clinical.followups}</p>
              <p className="text-xs text-surface-500 mt-1">Follow-ups</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
