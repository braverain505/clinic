import { useEffect, useState } from 'react';
import { api } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import { Download, TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react';

export default function Reports() {
  const toast = useToast();
  const [period, setPeriod] = useState('30days');
  const [revenue, setRevenue] = useState<any>(null);
  const [financial, setFinancial] = useState<any>(null);
  const [sales, setSales] = useState<any>(null);
  const [clinical, setClinical] = useState<any>(null);
  const [patients, setPatients] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [revRes, finRes, salRes, cliRes, patRes] = await Promise.all([
        api.get(`/analytics/revenue?filter=${period}`),
        api.get(`/analytics/financial?filter=${period}`),
        api.get(`/analytics/sales?filter=${period}`),
        api.get(`/analytics/clinical?filter=${period}`),
        api.get(`/analytics/patients?filter=${period}`),
      ]);
      setRevenue(revRes.data);
      setFinancial(finRes.data);
      setSales(salRes.data);
      setClinical(cliRes.data);
      setPatients(patRes.data);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [period]);

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) { toast.info('No data to export'); return; }
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map((row) => headers.map((h) => `"${String(row[h] ?? '')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} exported`);
  };

  const reports = [
    {
      id: 'revenue',
      title: 'Revenue Report',
      description: 'Daily revenue breakdown for the selected period',
      icon: <DollarSign size={20} />,
      color: 'bg-emerald-50 text-emerald-600',
      data: revenue?.byDate?.map((d: any) => ({ date: d.date, amount: d.amount })) || [],
      summary: [
        { label: 'Total Revenue', value: formatCurrency(revenue?.totalRevenue || 0) },
        { label: 'Avg Daily', value: formatCurrency(revenue?.avgDaily || 0) },
        { label: 'Transactions', value: revenue?.transactions || 0 },
      ],
    },
    {
      id: 'financial',
      title: 'Financial Summary',
      description: 'Revenue, collections, and outstanding balances',
      icon: <TrendingUp size={20} />,
      color: 'bg-blue-50 text-blue-600',
      data: [
        { metric: 'Total Revenue', value: financial?.totalRevenue || 0 },
        { metric: 'Amount Collected', value: financial?.totalPaid || 0 },
        { metric: 'Outstanding', value: financial?.totalOutstanding || 0 },
        { metric: 'Discounts Given', value: financial?.totalDiscount || 0 },
      ],
      summary: [
        { label: 'Collection Rate', value: financial?.totalRevenue ? `${((financial.totalPaid / financial.totalRevenue) * 100).toFixed(1)}%` : '0%' },
        { label: 'Outstanding', value: formatCurrency(financial?.totalOutstanding || 0) },
      ],
    },
    {
      id: 'sales',
      title: 'Sales by Category',
      description: 'Optical sales broken down by product category',
      icon: <ShoppingCart size={20} />,
      color: 'bg-orange-50 text-orange-600',
      data: sales?.byCategory ? Object.entries(sales.byCategory).map(([cat, data]: [string, any]) => ({
        category: cat.replace('_', ' '),
        count: data.count,
        revenue: data.revenue,
      })) : [],
      summary: [
        { label: 'Total Sales', value: sales?.totalSales || 0 },
        { label: 'Total Revenue', value: formatCurrency(sales?.totalRevenue || 0) },
        { label: 'Avg Sale', value: formatCurrency(sales?.avgSale || 0) },
      ],
    },
    {
      id: 'clinical',
      title: 'Clinical Activity',
      description: 'Examinations, prescriptions, and follow-ups',
      icon: <Users size={20} />,
      color: 'bg-purple-50 text-purple-600',
      data: [
        { activity: 'Eye Examinations', count: clinical?.examinations || 0 },
        { activity: 'Prescriptions', count: clinical?.prescriptions || 0 },
        { activity: 'Follow-ups', count: clinical?.followups || 0 },
      ],
      summary: [
        { label: 'Examinations', value: clinical?.examinations || 0 },
        { label: 'Prescriptions', value: clinical?.prescriptions || 0 },
        { label: 'Follow-ups', value: clinical?.followups || 0 },
      ],
    },
    {
      id: 'patients',
      title: 'Patient Report',
      description: 'New vs returning patients',
      icon: <Users size={20} />,
      color: 'bg-brand-50 text-brand-600',
      data: [
        { metric: 'Total Patients', value: patients?.totalPatients || 0 },
        { metric: 'New Patients', value: patients?.newPatients || 0 },
        { metric: 'Returning Patients', value: patients?.returningPatients || 0 },
      ],
      summary: [
        { label: 'Total', value: patients?.totalPatients || 0 },
        { label: 'New', value: patients?.newPatients || 0 },
        { label: 'Growth', value: `${patients?.growth || 0}%` },
      ],
    },
  ];

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-48 w-full" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="page-header">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Intelligence</p>
          <h1>Reports</h1>
          <p>Generate and export business reports.</p>
        </div>
        <div className="flex gap-2">
          {[
            { value: '7days', label: '7 Days' },
            { value: '30days', label: '30 Days' },
            { value: 'month', label: 'This Month' },
            { value: 'year', label: 'This Year' },
          ].map((opt) => (
            <button key={opt.value} onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${period === opt.value ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.color}`}>
                  {report.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-surface-900">{report.title}</h3>
                  <p className="text-xs text-surface-400">{report.description}</p>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => exportCSV(report.data, report.id)} icon={<Download size={14} />}>
                Export CSV
              </Button>
            </div>

            {/* Summary chips */}
            <div className="flex flex-wrap gap-3 mb-4">
              {report.summary.map((s) => (
                <div key={s.label} className="px-3 py-2 bg-surface-50 rounded-lg">
                  <p className="text-2xs text-surface-400 font-medium">{s.label}</p>
                  <p className="text-sm font-bold text-surface-900">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Data table */}
            {report.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table text-sm">
                  <thead>
                    <tr>
                      {Object.keys(report.data[0]).map((key) => (
                        <th key={key} className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.data.slice(0, 10).map((row: any, i: number) => (
                      <tr key={i}>
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j} className={typeof val === 'number' ? 'font-medium' : ''}>
                            {typeof val === 'number' && val > 1000 ? formatCurrency(val) : String(val ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
