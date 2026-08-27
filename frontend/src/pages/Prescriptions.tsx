import { useEffect, useState } from 'react';
import { api } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { FileText, Search, Eye } from 'lucide-react';

interface Prescription {
  id: string;
  rxId: string;
  patient: { id: string; firstName: string; lastName: string; patientId: string };
  examination: { examId: string; examinationDate: string };
  optometrist: { fullName: string };
  rhSphere?: number;
  rhCylinder?: number;
  rhAxis?: number;
  rhAdd?: number;
  rhPrism?: number;
  lhSphere?: number;
  lhCylinder?: number;
  lhAxis?: number;
  lhAdd?: number;
  lhPrism?: number;
  pupillaryDistance?: number;
  recommendations?: string;
  reviewDate?: string;
  createdAt: string;
}

export default function Prescriptions() {
  const toast = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Prescription | null>(null);

  useEffect(() => {
    api.get('/prescriptions', { params: { page: 1, limit: 100 } })
      .then((res) => setPrescriptions(res.data.prescriptions))
      .catch(() => toast.error('Failed to load prescriptions'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = prescriptions.filter((p) =>
    search ? `${p.patient.firstName} ${p.patient.lastName} ${p.rxId}`.toLowerCase().includes(search.toLowerCase()) : true
  );

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
          <h1>Prescriptions</h1>
          <p>View and manage digital prescriptions linked to eye examinations.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-surface-400" size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by patient or RX ID..." className="input pl-9" />
        </div>
        <span className="text-sm text-surface-400">{filtered.length} records</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FileText size={28} />} title="No prescriptions found" description="Prescriptions are created from eye examinations." />
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Rx ID</th>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Optometrist</th>
                  <th>OD (SPH/CYL)</th>
                  <th>OS (SPH/CYL)</th>
                  <th>PD</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rx) => (
                  <tr key={rx.id}>
                    <td className="font-mono text-xs text-brand-600 font-medium">{rx.rxId}</td>
                    <td className="font-medium text-surface-800">{rx.patient.firstName} {rx.patient.lastName}</td>
                    <td className="text-surface-500">{new Date(rx.createdAt).toLocaleDateString()}</td>
                    <td className="text-surface-500">{rx.optometrist?.fullName}</td>
                    <td className="font-mono text-xs">
                      {rx.rhSphere != null ? `${rx.rhSphere.toFixed(2)} / ${rx.rhCylinder?.toFixed(2) || '0'}` : '—'}
                    </td>
                    <td className="font-mono text-xs">
                      {rx.lhSphere != null ? `${rx.lhSphere.toFixed(2)} / ${rx.lhCylinder?.toFixed(2) || '0'}` : '—'}
                    </td>
                    <td className="font-mono text-xs">{rx.pupillaryDistance?.toFixed(1) || '—'}</td>
                    <td>
                      <button onClick={() => setSelected(rx)} className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="View prescription">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prescription Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Prescription ${selected?.rxId}`} size="lg">
        {selected && (
          <div className="bg-surface-50 rounded-xl p-6 border border-surface-200">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Eye size={20} className="text-brand-600" />
                <h3 className="text-lg font-bold text-surface-900">LISS EYE CARE SERVICES</h3>
              </div>
              <p className="text-sm font-semibold text-surface-600 uppercase tracking-wider">Optical Prescription</p>
              <div className="w-16 h-0.5 bg-brand-600 mx-auto mt-3" />
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-surface-400 text-xs">Patient</p>
                <p className="font-medium">{selected.patient.firstName} {selected.patient.lastName}</p>
              </div>
              <div>
                <p className="text-surface-400 text-xs">Patient ID</p>
                <p className="font-medium font-mono">{selected.patient.patientId}</p>
              </div>
              <div>
                <p className="text-surface-400 text-xs">Date</p>
                <p className="font-medium">{new Date(selected.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-surface-400 text-xs">Optometrist</p>
                <p className="font-medium">{selected.optometrist?.fullName}</p>
              </div>
            </div>

            {/* Refraction Table */}
            <div className="bg-white rounded-lg border border-surface-200 overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-surface-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-surface-500 uppercase">Eye</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-surface-500 uppercase">SPH</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-surface-500 uppercase">CYL</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-surface-500 uppercase">AXIS</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-surface-500 uppercase">ADD</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-surface-500 uppercase">PRISM</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-surface-100">
                    <td className="px-4 py-3 font-medium text-brand-700">OD (Right)</td>
                    <td className="px-4 py-3 text-center font-mono">{selected.rhSphere?.toFixed(2) || '—'}</td>
                    <td className="px-4 py-3 text-center font-mono">{selected.rhCylinder?.toFixed(2) || '—'}</td>
                    <td className="px-4 py-3 text-center font-mono">{selected.rhAxis || '—'}</td>
                    <td className="px-4 py-3 text-center font-mono">{selected.rhAdd?.toFixed(2) || '—'}</td>
                    <td className="px-4 py-3 text-center font-mono">{selected.rhPrism?.toFixed(2) || '—'}</td>
                  </tr>
                  <tr className="border-t border-surface-100">
                    <td className="px-4 py-3 font-medium text-brand-700">OS (Left)</td>
                    <td className="px-4 py-3 text-center font-mono">{selected.lhSphere?.toFixed(2) || '—'}</td>
                    <td className="px-4 py-3 text-center font-mono">{selected.lhCylinder?.toFixed(2) || '—'}</td>
                    <td className="px-4 py-3 text-center font-mono">{selected.lhAxis || '—'}</td>
                    <td className="px-4 py-3 text-center font-mono">{selected.lhAdd?.toFixed(2) || '—'}</td>
                    <td className="px-4 py-3 text-center font-mono">{selected.lhPrism?.toFixed(2) || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* PD */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-white rounded-lg border border-surface-200 p-3">
                <p className="text-surface-400 text-xs">Pupillary Distance</p>
                <p className="font-medium font-mono">{selected.pupillaryDistance?.toFixed(1) || '—'} mm</p>
              </div>
              <div className="bg-white rounded-lg border border-surface-200 p-3">
                <p className="text-surface-400 text-xs">Review Date</p>
                <p className="font-medium">{selected.reviewDate ? new Date(selected.reviewDate).toLocaleDateString() : '—'}</p>
              </div>
            </div>

            {/* Recommendations */}
            {selected.recommendations && (
              <div className="text-sm">
                <p className="text-surface-400 text-xs mb-1">Recommendations</p>
                <p className="text-surface-700">{selected.recommendations}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
