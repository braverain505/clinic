import { FormEvent, useEffect, useState } from 'react';
import { api } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Eye, Plus, Search, FileText } from 'lucide-react';

interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
}

interface Examination {
  id: string;
  examId: string;
  patientId: string;
  examinationDate: string;
  patient: Patient;
  optometrist: { fullName: string };
  vaRightDistance?: string;
  vaLeftDistance?: string;
  vaBothDistance?: string;
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
  diagnosis?: string;
  clinicalNotes?: string;
  treatment?: string;
  prescriptions?: any[];
}

interface ExamForm {
  patientId: string;
  vaRightDistance: string;
  vaLeftDistance: string;
  vaBothDistance: string;
  vaRightNear: string;
  vaLeftNear: string;
  vaBothNear: string;
  rhSphere: string;
  rhCylinder: string;
  rhAxis: string;
  rhAdd: string;
  rhPrism: string;
  lhSphere: string;
  lhCylinder: string;
  lhAxis: string;
  lhAdd: string;
  lhPrism: string;
  pupillaryDistance: string;
  nearPD: string;
  tonometry: string;
  colourVision: string;
  keratometry: string;
  visualFields: string;
  otherTests: string;
  clinicalNotes: string;
  diagnosis: string;
  treatment: string;
}

const emptyForm: ExamForm = {
  patientId: '',
  vaRightDistance: '', vaLeftDistance: '', vaBothDistance: '',
  vaRightNear: '', vaLeftNear: '', vaBothNear: '',
  rhSphere: '', rhCylinder: '', rhAxis: '', rhAdd: '', rhPrism: '',
  lhSphere: '', lhCylinder: '', lhAxis: '', lhAdd: '', lhPrism: '',
  pupillaryDistance: '', nearPD: '',
  tonometry: '', colourVision: '', keratometry: '', visualFields: '', otherTests: '',
  clinicalNotes: '', diagnosis: '', treatment: '',
};

export default function Examinations() {
  const toast = useToast();
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<ExamForm>(emptyForm);
  const [selectedExam, setSelectedExam] = useState<Examination | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [examRes, patientRes] = await Promise.all([
        api.get('/examinations', { params: { page: 1, limit: 50 } }),
        api.get('/patients', { params: { page: 1, limit: 200 } }),
      ]);
      setExaminations(examRes.data.examinations);
      setPatients(patientRes.data.patients);
    } catch {
      toast.error('Failed to load examinations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = examinations.filter((e) =>
    search ? `${e.patient.firstName} ${e.patient.lastName} ${e.examId}`.toLowerCase().includes(search.toLowerCase()) : true
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.patientId) { toast.error('Please select a patient'); return; }
    setSaving(true);
    try {
      await api.post('/examinations', form);
      toast.success('Eye examination recorded successfully');
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save examination');
    } finally {
      setSaving(false);
    }
  };

  const createPrescription = async (exam: Examination) => {
    try {
      await api.post('/prescriptions', {
        patientId: exam.patientId,
        examinationId: exam.id,
        rhSphere: exam.rhSphere,
        rhCylinder: exam.rhCylinder,
        rhAxis: exam.rhAxis,
        lhSphere: exam.lhSphere,
        lhCylinder: exam.lhCylinder,
        lhAxis: exam.lhAxis,
      });
      toast.success('Prescription created from examination');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create prescription');
    }
  };

  const updateField = (field: keyof ExamForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-12 w-full" />
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="page-header">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Clinical</p>
          <h1>Eye Examinations</h1>
          <p>Record and manage patient eye examinations with full refraction data.</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
          New Examination
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-surface-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name or exam ID..."
            className="input pl-9"
          />
        </div>
        <span className="text-sm text-surface-400">{filtered.length} records</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Eye size={28} />}
          title="No examinations found"
          description="Record an eye examination to begin clinical documentation."
          action={<Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>New Examination</Button>}
        />
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Exam ID</th>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Optometrist</th>
                  <th>Refraction (OD)</th>
                  <th>Diagnosis</th>
                  <th>Rx</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((exam) => (
                  <tr key={exam.id}>
                    <td className="font-mono text-xs text-brand-600 font-medium">{exam.examId}</td>
                    <td>
                      <p className="font-medium text-surface-800">{exam.patient.firstName} {exam.patient.lastName}</p>
                    </td>
                    <td className="text-surface-500">{new Date(exam.examinationDate).toLocaleDateString()}</td>
                    <td className="text-surface-500">{exam.optometrist?.fullName}</td>
                    <td className="font-mono text-xs">
                      {exam.rhSphere != null ? `${exam.rhSphere.toFixed(2)} / ${exam.rhCylinder?.toFixed(2) || '0'} × ${exam.rhAxis || '0'}` : '—'}
                    </td>
                    <td className="max-w-[200px] truncate text-surface-500">{exam.diagnosis || '—'}</td>
                    <td>
                      {exam.prescriptions && exam.prescriptions.length > 0 ? (
                        <Badge variant="success" dot>Issued</Badge>
                      ) : (
                        <Badge variant="neutral">None</Badge>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedExam(exam)}
                          className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <FileText size={15} />
                        </button>
                        {(!exam.prescriptions || exam.prescriptions.length === 0) && (
                          <button
                            onClick={() => createPrescription(exam)}
                            className="p-1.5 text-surface-400 hover:text-clinical-600 hover:bg-clinical-50 rounded-lg transition-colors"
                            title="Create prescription"
                          >
                            <Plus size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Eye Examination" size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={submit} loading={saving}>Save Examination</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-6">
          {/* Patient */}
          <Select
            label="Patient"
            required
            value={form.patientId}
            onChange={(e) => updateField('patientId', e.target.value)}
            placeholder="Select patient"
            options={patients.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName} (${p.patientId})` }))}
          />

          {/* Visual Acuity */}
          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-3 flex items-center gap-2">
              <Eye size={16} className="text-brand-600" /> Visual Acuity
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <Input label="OD Distance" placeholder="e.g. 20/20" value={form.vaRightDistance} onChange={(e) => updateField('vaRightDistance', e.target.value)} />
              <Input label="OS Distance" placeholder="e.g. 20/20" value={form.vaLeftDistance} onChange={(e) => updateField('vaLeftDistance', e.target.value)} />
              <Input label="OU Distance" placeholder="e.g. 20/20" value={form.vaBothDistance} onChange={(e) => updateField('vaBothDistance', e.target.value)} />
              <Input label="OD Near" placeholder="e.g. N5" value={form.vaRightNear} onChange={(e) => updateField('vaRightNear', e.target.value)} />
              <Input label="OS Near" placeholder="e.g. N5" value={form.vaLeftNear} onChange={(e) => updateField('vaLeftNear', e.target.value)} />
              <Input label="OU Near" placeholder="e.g. N5" value={form.vaBothNear} onChange={(e) => updateField('vaBothNear', e.target.value)} />
            </div>
          </div>

          {/* Refraction Right Eye */}
          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-3">Refraction — Right Eye (OD)</h4>
            <div className="grid grid-cols-5 gap-3">
              <Input label="Sphere" type="number" step="0.25" placeholder="SPH" value={form.rhSphere} onChange={(e) => updateField('rhSphere', e.target.value)} />
              <Input label="Cylinder" type="number" step="0.25" placeholder="CYL" value={form.rhCylinder} onChange={(e) => updateField('rhCylinder', e.target.value)} />
              <Input label="Axis" type="number" placeholder="AXIS" value={form.rhAxis} onChange={(e) => updateField('rhAxis', e.target.value)} />
              <Input label="Add" type="number" step="0.25" placeholder="ADD" value={form.rhAdd} onChange={(e) => updateField('rhAdd', e.target.value)} />
              <Input label="Prism" type="number" step="0.25" placeholder="PRISM" value={form.rhPrism} onChange={(e) => updateField('rhPrism', e.target.value)} />
            </div>
          </div>

          {/* Refraction Left Eye */}
          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-3">Refraction — Left Eye (OS)</h4>
            <div className="grid grid-cols-5 gap-3">
              <Input label="Sphere" type="number" step="0.25" placeholder="SPH" value={form.lhSphere} onChange={(e) => updateField('lhSphere', e.target.value)} />
              <Input label="Cylinder" type="number" step="0.25" placeholder="CYL" value={form.lhCylinder} onChange={(e) => updateField('lhCylinder', e.target.value)} />
              <Input label="Axis" type="number" placeholder="AXIS" value={form.lhAxis} onChange={(e) => updateField('lhAxis', e.target.value)} />
              <Input label="Add" type="number" step="0.25" placeholder="ADD" value={form.lhAdd} onChange={(e) => updateField('lhAdd', e.target.value)} />
              <Input label="Prism" type="number" step="0.25" placeholder="PRISM" value={form.lhPrism} onChange={(e) => updateField('lhPrism', e.target.value)} />
            </div>
          </div>

          {/* PD & Clinical Tests */}
          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-3">Measurements & Clinical Tests</h4>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Pupillary Distance" type="number" step="0.5" placeholder="mm" value={form.pupillaryDistance} onChange={(e) => updateField('pupillaryDistance', e.target.value)} />
              <Input label="Near PD" type="number" step="0.5" placeholder="mm" value={form.nearPD} onChange={(e) => updateField('nearPD', e.target.value)} />
              <Input label="Tonometry" placeholder="e.g. IOP: 15 mmHg" value={form.tonometry} onChange={(e) => updateField('tonometry', e.target.value)} />
              <Input label="Colour Vision" placeholder="e.g. Normal" value={form.colourVision} onChange={(e) => updateField('colourVision', e.target.value)} />
              <Input label="Keratometry" placeholder="e.g. K1: 43.50, K2: 44.00" value={form.keratometry} onChange={(e) => updateField('keratometry', e.target.value)} />
              <Input label="Visual Fields" placeholder="e.g. Normal" value={form.visualFields} onChange={(e) => updateField('visualFields', e.target.value)} />
            </div>
          </div>

          {/* Clinical Notes */}
          <div className="space-y-3">
            <Input label="Clinical Notes" placeholder="Observations, notes..." value={form.clinicalNotes} onChange={(e) => updateField('clinicalNotes', e.target.value)} />
            <Input label="Diagnosis" placeholder="e.g. Myopic Astigmatism" value={form.diagnosis} onChange={(e) => updateField('diagnosis', e.target.value)} />
            <Input label="Treatment" placeholder="e.g. Corrective lenses recommended" value={form.treatment} onChange={(e) => updateField('treatment', e.target.value)} />
          </div>
        </form>
      </Modal>

      {/* Detail View */}
      <Modal open={!!selectedExam} onClose={() => setSelectedExam(null)} title={`Examination ${selectedExam?.examId}`} size="lg">
        {selectedExam && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-surface-400">Patient</p>
                <p className="font-medium">{selectedExam.patient.firstName} {selectedExam.patient.lastName}</p>
              </div>
              <div>
                <p className="text-surface-400">Date</p>
                <p className="font-medium">{new Date(selectedExam.examinationDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-surface-400">Optometrist</p>
                <p className="font-medium">{selectedExam.optometrist?.fullName}</p>
              </div>
              <div>
                <p className="text-surface-400">Diagnosis</p>
                <p className="font-medium">{selectedExam.diagnosis || '—'}</p>
              </div>
            </div>

            <div className="border-t border-surface-100 pt-4">
              <h4 className="text-sm font-semibold mb-3">Visual Acuity</h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-surface-50 rounded-lg p-3">
                  <p className="text-surface-400 text-xs">OD Distance</p>
                  <p className="font-medium">{selectedExam.vaRightDistance || '—'}</p>
                </div>
                <div className="bg-surface-50 rounded-lg p-3">
                  <p className="text-surface-400 text-xs">OS Distance</p>
                  <p className="font-medium">{selectedExam.vaLeftDistance || '—'}</p>
                </div>
                <div className="bg-surface-50 rounded-lg p-3">
                  <p className="text-surface-400 text-xs">OU Distance</p>
                  <p className="font-medium">{selectedExam.vaBothDistance || '—'}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-surface-100 pt-4">
              <h4 className="text-sm font-semibold mb-3">Refraction</h4>
              <div className="overflow-x-auto">
                <table className="table text-sm">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Sphere</th>
                      <th>Cylinder</th>
                      <th>Axis</th>
                      <th>Add</th>
                      <th>Prism</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-medium">OD (Right)</td>
                      <td>{selectedExam.rhSphere?.toFixed(2) || '—'}</td>
                      <td>{selectedExam.rhCylinder?.toFixed(2) || '—'}</td>
                      <td>{selectedExam.rhAxis || '—'}</td>
                      <td>{selectedExam.rhAdd?.toFixed(2) || '—'}</td>
                      <td>{selectedExam.rhPrism?.toFixed(2) || '—'}</td>
                    </tr>
                    <tr>
                      <td className="font-medium">OS (Left)</td>
                      <td>{selectedExam.lhSphere?.toFixed(2) || '—'}</td>
                      <td>{selectedExam.lhCylinder?.toFixed(2) || '—'}</td>
                      <td>{selectedExam.lhAxis || '—'}</td>
                      <td>{selectedExam.lhAdd?.toFixed(2) || '—'}</td>
                      <td>{selectedExam.lhPrism?.toFixed(2) || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {selectedExam.clinicalNotes && (
              <div className="border-t border-surface-100 pt-4">
                <h4 className="text-sm font-semibold mb-1">Clinical Notes</h4>
                <p className="text-sm text-surface-600">{selectedExam.clinicalNotes}</p>
              </div>
            )}

            {selectedExam.treatment && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Treatment</h4>
                <p className="text-sm text-surface-600">{selectedExam.treatment}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
