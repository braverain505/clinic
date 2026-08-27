import { CalendarDays, Plus, Clock } from 'lucide-react';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

const mockAppointments = [
  { id: '1', patient: 'Chioma Okafor', type: 'Comprehensive Eye Exam', time: '09:00 AM', date: 'Today', status: 'scheduled' },
  { id: '2', patient: 'Tunde Adeyemi', type: 'Follow-up', time: '10:30 AM', date: 'Today', status: 'confirmed' },
  { id: '3', patient: 'Amara Nwosu', type: 'Spectacle Collection', time: '11:00 AM', date: 'Today', status: 'checked-in' },
  { id: '4', patient: 'Kunle Johnson', type: 'Contact Lens Fitting', time: '02:00 PM', date: 'Today', status: 'scheduled' },
];

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  'checked-in': 'bg-amber-50 text-amber-700',
  completed: 'bg-surface-100 text-surface-600',
};

export default function Appointments() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="page-header">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Clinical</p>
          <h1>Appointments</h1>
          <p>Manage patient appointments and clinic scheduling.</p>
        </div>
        <Button icon={<Plus size={16} />}>New Appointment</Button>
      </div>

      {/* Today's appointments */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-surface-900">Today's Appointments</h3>
          <span className="text-xs text-surface-400">{mockAppointments.length} scheduled</span>
        </div>
        <div className="space-y-2">
          {mockAppointments.map((apt) => (
            <div key={apt.id} className="flex items-center gap-4 p-3 rounded-lg border border-surface-100 hover:bg-surface-50 transition-colors">
              <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                <Clock size={18} className="text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-800">{apt.patient}</p>
                <p className="text-xs text-surface-400">{apt.type}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-surface-800">{apt.time}</p>
                <span className={`inline-flex items-center px-2 py-0.5 text-2xs font-medium rounded-full ${statusColors[apt.status] || 'bg-surface-100 text-surface-600'}`}>
                  {apt.status.replace('-', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <EmptyState
        icon={<CalendarDays size={28} />}
        title="Full appointment scheduling coming soon"
        description="Advanced calendar views, recurring appointments, and clinic queue management are under development."
      />
    </div>
  );
}
