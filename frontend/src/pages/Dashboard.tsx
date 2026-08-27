import { useEffect, useState } from 'react';
import { api } from '../store/authStore';
import useAuthStore from '../store/authStore';
import {
  Users, Eye, ShoppingCart, AlertCircle, TrendingUp, TrendingDown,
  Clock, Package, DollarSign, Activity, ArrowRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface DashboardData {
  kpis: Record<string, { value: number; change?: number; comparison?: string; count?: number }>;
}

interface AttentionData {
  needsAttention: {
    overdue_followups: number;
    low_stock_items: number;
    outstanding_payments: number;
  };
}

interface RevenueData {
  byDate: { date: string; amount: number }[];
  totalRevenue: number;
}

const formatCurrency = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

export default function Dashboard() {
  const { user, hasPermission } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [attention, setAttention] = useState<AttentionData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, attRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/dashboard/attention'),
        ]);
        setData(dashRes.data);
        setAttention(attRes.data);

        if (hasPermission('VIEW_REVENUE')) {
          const revRes = await api.get('/analytics/revenue?filter=30days');
          setRevenue(revRes.data);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Build KPI cards based on what data is available
  const kpiCards = data?.kpis ? Object.entries(data.kpis).map(([key, kpi]) => {
    const config: Record<string, { label: string; icon: any; color: string; isCurrency?: boolean }> = {
      todayRevenue: { label: "Today's Revenue", icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', isCurrency: true },
      patientsToday: { label: 'Patients Today', icon: Users, color: 'bg-blue-50 text-blue-600' },
      eyeExaminations: { label: 'Eye Examinations', icon: Eye, color: 'bg-purple-50 text-purple-600' },
      opticalSales: { label: 'Optical Sales', icon: ShoppingCart, color: 'bg-orange-50 text-orange-600' },
      outstandingPayments: { label: 'Outstanding Payments', icon: AlertCircle, color: 'bg-red-50 text-red-600', isCurrency: true },
      pendingFollowUps: { label: 'Pending Follow-ups', icon: Clock, color: 'bg-amber-50 text-amber-600' },
    };
    const c = config[key];
    if (!c) return null;
    const Icon = c.icon;
    return {
      key,
      label: c.label,
      value: c.isCurrency ? formatCurrency(kpi.value) : kpi.value,
      comparison: kpi.comparison,
      change: kpi.change,
      icon: Icon,
      color: c.color,
      changeColor: (kpi.change ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600',
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null) : [];

  const chartData = revenue?.byDate?.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
    revenue: d.amount,
  })) || [];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-20 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card p-5"><div className="skeleton h-4 w-24 mb-3" /><div className="skeleton h-8 w-32 mb-2" /><div className="skeleton h-3 w-20" /></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-surface-500 mt-1">
          {user?.role === 'OWNER' || user?.role === 'ADMIN'
            ? "Here's the complete overview of Liss Eye Care Services."
            : `Welcome back, ${user?.fullName?.split(' ')[0]}. Here's what's in your scope.`}
        </p>
      </div>

      {/* Role Notice */}
      {user?.role !== 'OWNER' && user?.role !== 'ADMIN' && (
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 flex items-center gap-3">
          <Activity size={16} className="text-brand-600 shrink-0" />
          <p className="text-sm text-brand-700">
            You're viewing data for the <strong>{user?.role?.replace(/_/g, ' ').toLowerCase()}</strong> role.
            Contact an administrator for access to additional modules.
          </p>
        </div>
      )}

      {/* KPI Cards */}
      {kpiCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.key} className="card p-5 group hover:shadow-card-hover transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface-500">{kpi.label}</p>
                    <p className="text-2xl font-bold text-surface-900 mt-2 tracking-tight">{kpi.value}</p>
                    {kpi.comparison && (
                      <div className="flex items-center gap-1 mt-2">
                        {kpi.change !== undefined && (
                          kpi.change >= 0
                            ? <TrendingUp size={14} className={kpi.changeColor} />
                            : <TrendingDown size={14} className="text-red-600" />
                        )}
                        <span className="text-xs text-surface-500">{kpi.comparison}</span>
                      </div>
                    )}
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${kpi.color}`}>
                    <Icon size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts & Attention (only for admin/owner) */}
      {(hasPermission('VIEW_REVENUE') || hasPermission('VIEW_INVENTORY')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue Chart */}
          {hasPermission('VIEW_REVENUE') && revenue && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-surface-900">Revenue Trend</h3>
                  <p className="text-xs text-surface-400 mt-0.5">Last 30 days</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-surface-900">{formatCurrency(revenue.totalRevenue)}</p>
                  <p className="text-xs text-surface-400">Total revenue</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} formatter={(value: number) => [`₦${value.toLocaleString('en-NG')}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} fill="url(#revenueGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Needs Attention */}
          {attention && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-surface-900 mb-4">Needs Attention</h3>
              <div className="space-y-3">
                {attention.needsAttention.overdue_followups > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200/50">
                    <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                      <Clock size={18} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-800">{attention.needsAttention.overdue_followups} Overdue Follow-ups</p>
                      <p className="text-xs text-amber-600">Patients past their follow-up date</p>
                    </div>
                    <ArrowRight size={16} className="text-amber-400 shrink-0" />
                  </div>
                )}
                {attention.needsAttention.low_stock_items > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200/50">
                    <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                      <Package size={18} className="text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-800">{attention.needsAttention.low_stock_items} Low Stock Items</p>
                      <p className="text-xs text-red-600">Products below minimum stock level</p>
                    </div>
                    <ArrowRight size={16} className="text-red-400 shrink-0" />
                  </div>
                )}
                {attention.needsAttention.outstanding_payments > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200/50">
                    <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                      <DollarSign size={18} className="text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-orange-800">{attention.needsAttention.outstanding_payments} Outstanding Invoices</p>
                      <p className="text-xs text-orange-600">Customers with pending balances</p>
                    </div>
                    <ArrowRight size={16} className="text-orange-400 shrink-0" />
                  </div>
                )}
                {attention.needsAttention.overdue_followups === 0 && attention.needsAttention.low_stock_items === 0 && attention.needsAttention.outstanding_payments === 0 && (
                  <div className="text-center py-8">
                    <Activity size={24} className="mx-auto text-surface-300 mb-2" />
                    <p className="text-sm text-surface-500">All clear! No items need attention.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
