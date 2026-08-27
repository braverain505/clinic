import { FormEvent, useEffect, useState } from 'react';
import { Plus, Search, UserRound, Eye, Trash2 } from 'lucide-react';
import { api } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  gender: string;
  dateOfBirth?: string | null;
  address?: string | null;
  city?: string | null;
  createdAt: string;
}

interface PatientForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  address: string;
}

const emptyForm: PatientForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  gender: 'FEMALE',
  dateOfBirth: '',
  address: '',
};

export default function Patients() {
  const toast = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPatients = async (term = search) => {
    setLoading(true);
    try {
      const response = await api.get('/patients', {
        params: { page: 1, limit: 50, search: term || undefined },
      });
      setPatients(response.data.patients);
    } catch {
      toast.error('Unable to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPatients();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await api.post('/patients', {
        ...form,
        email: form.email || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
      });
      setPatients((current) => [response.data.patient, ...current]);
      setForm(emptyForm);
      setShowForm(false);
      toast.success(`Patient registered — ${response.data.patient.patientId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Unable to register patient');
    } finally {
      setSaving(false);
    }
  };

  const deletePatient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    try {
      await api.delete(`/patients/${id}`);
      setPatients((prev) => prev.filter((p) => p.id !== id));
      toast.success('Patient deleted');
    } catch {
      toast.error('Failed to delete patient');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-16 w-64" />
        <div className="skeleton h-12 w-full max-w-md" />
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="page-header">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Clinical</p>
          <h1>Patients</h1>
          <p>Register patients and keep every visit connected to their record.</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
          Register Patient
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-surface-400" size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && void loadPatients()}
            placeholder="Search name, phone, or patient ID..."
            className="input pl-9"
          />
        </div>
        <span className="text-sm text-surface-400">{patients.length} records</span>
      </div>

      {/* Table */}
      {patients.length === 0 ? (
        <EmptyState
          icon={<UserRound size={28} />}
          title="No patients found"
          description="Register a patient to begin their care journey."
          action={
            <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
              Register Patient
            </Button>
          }
        />
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Patient ID</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>Registered</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-brand-50 rounded-full flex items-center justify-center text-brand-700 text-sm font-semibold shrink-0">
                          {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-surface-800">{patient.firstName} {patient.lastName}</p>
                          <p className="text-xs text-surface-400">{patient.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-brand-600 font-medium">{patient.patientId}</td>
                    <td className="text-surface-600">{patient.phone}</td>
                    <td>
                      <Badge variant="neutral">{patient.gender}</Badge>
                    </td>
                    <td className="text-surface-500">{new Date(patient.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedPatient(patient)}
                          className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="View patient"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => deletePatient(patient.id)}
                          className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete patient"
                        >
                          <Trash2 size={15} />
                        </button>
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
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Register Patient"
        description="A unique patient ID will be generated automatically."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={submit} loading={saving}>Register Patient</Button>
          </>
        }
      >
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            required
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <Input
            label="Last Name"
            required
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
          <Input
            label="Phone"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Select
            label="Gender"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            options={[
              { value: 'FEMALE', label: 'Female' },
              { value: 'MALE', label: 'Male' },
              { value: 'OTHER', label: 'Other' },
            ]}
          />
          <Input
            label="Date of Birth"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
          />
          <div className="col-span-2">
            <Input
              label="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Home address"
            />
          </div>
        </form>
      </Modal>

      {/* Detail View Modal */}
      <Modal
        open={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        title={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : ''}
        size="lg"
      >
        {selectedPatient && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xl font-bold">
                {selectedPatient.firstName.charAt(0)}{selectedPatient.lastName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </h3>
                <p className="text-sm text-surface-500 font-mono">{selectedPatient.patientId}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-surface-400 text-xs">Phone</p>
                <p className="font-medium">{selectedPatient.phone}</p>
              </div>
              <div>
                <p className="text-surface-400 text-xs">Email</p>
                <p className="font-medium">{selectedPatient.email || '—'}</p>
              </div>
              <div>
                <p className="text-surface-400 text-xs">Gender</p>
                <p className="font-medium">{selectedPatient.gender}</p>
              </div>
              <div>
                <p className="text-surface-400 text-xs">Registered</p>
                <p className="font-medium">{new Date(selectedPatient.createdAt).toLocaleDateString()}</p>
              </div>
              {selectedPatient.address && (
                <div className="col-span-2">
                  <p className="text-surface-400 text-xs">Address</p>
                  <p className="font-medium">{selectedPatient.address}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
