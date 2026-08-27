import { useState } from 'react';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Building, CreditCard, Bell, Shield, Palette } from 'lucide-react';

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const sections: SettingsSection[] = [
  { id: 'clinic', label: 'Clinic Profile', icon: <Building size={16} /> },
  { id: 'billing', label: 'Billing & Invoice', icon: <CreditCard size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'security', label: 'Security', icon: <Shield size={16} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
];

export default function Settings() {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState('clinic');
  const [clinicName, setClinicName] = useState('LISS Eye Care Services');
  const [clinicEmail, setClinicEmail] = useState('info@lisseyecare.com');
  const [clinicPhone, setClinicPhone] = useState('+234 801 234 5678');
  const [clinicAddress, setClinicAddress] = useState('123 Vision Lane, Victoria Island, Lagos, Nigeria');
  const [currency, setCurrency] = useState('NGN');
  const [taxRate, setTaxRate] = useState('0');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [receiptPrefix, setReceiptPrefix] = useState('RCP');
  const [patientIdPrefix, setPatientIdPrefix] = useState('LIS');
  const [rxPrefix, setRxPrefix] = useState('RX');

  const save = (section: string) => {
    toast.success(`${section} settings saved`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">System</p>
        <h1>Settings</h1>
        <p>Configure your clinic profile, billing, and system preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-56 shrink-0">
          <nav className="space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === s.id ? 'bg-brand-50 text-brand-700' : 'text-surface-600 hover:bg-surface-50'
                }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeSection === 'clinic' && (
            <div className="card p-6 space-y-5">
              <h3 className="text-lg font-semibold text-surface-900">Clinic Profile</h3>
              <p className="text-sm text-surface-500">Configure your clinic details used across receipts, invoices, and documents.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Clinic Name" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
                <Input label="Email" type="email" value={clinicEmail} onChange={(e) => setClinicEmail(e.target.value)} />
                <Input label="Phone" value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} />
                <Input label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
                <div className="md:col-span-2">
                  <Input label="Address" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => save('Clinic')}>Save Changes</Button>
              </div>
            </div>
          )}

          {activeSection === 'billing' && (
            <div className="card p-6 space-y-5">
              <h3 className="text-lg font-semibold text-surface-900">Billing & Invoice Settings</h3>
              <p className="text-sm text-surface-500">Configure invoice numbering, tax rates, and receipt formats.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Tax Rate (%)" type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
                <Input label="Invoice Prefix" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} />
                <Input label="Receipt Prefix" value={receiptPrefix} onChange={(e) => setReceiptPrefix(e.target.value)} />
                <Input label="Patient ID Prefix" value={patientIdPrefix} onChange={(e) => setPatientIdPrefix(e.target.value)} />
                <Input label="Prescription Prefix" value={rxPrefix} onChange={(e) => setRxPrefix(e.target.value)} />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => save('Billing')}>Save Changes</Button>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="card p-6 space-y-5">
              <h3 className="text-lg font-semibold text-surface-900">Notification Settings</h3>
              <p className="text-sm text-surface-500">Configure when and how you receive notifications.</p>
              <div className="space-y-4">
                {[
                  { label: 'New patient registered', desc: 'When a new patient is added to the system' },
                  { label: 'Payment received', desc: 'When a payment is recorded against an invoice' },
                  { label: 'Low stock alerts', desc: 'When a product falls below minimum stock level' },
                  { label: 'Follow-up due', desc: 'When a patient follow-up is due' },
                  { label: 'Outstanding payments', desc: 'Daily summary of outstanding balances' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-surface-800">{item.label}</p>
                      <p className="text-xs text-surface-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-surface-300 peer-focus:ring-2 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600" />
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => save('Notification')}>Save Changes</Button>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="card p-6 space-y-5">
              <h3 className="text-lg font-semibold text-surface-900">Security Settings</h3>
              <p className="text-sm text-surface-500">Manage authentication and access controls.</p>
              <div className="space-y-4">
                <div className="p-4 bg-surface-50 rounded-lg">
                  <p className="text-sm font-medium text-surface-800">Password Policy</p>
                  <p className="text-xs text-surface-500 mt-1">Minimum 6 characters required for all user passwords.</p>
                </div>
                <div className="p-4 bg-surface-50 rounded-lg">
                  <p className="text-sm font-medium text-surface-800">JWT Token Expiry</p>
                  <p className="text-xs text-surface-500 mt-1">Authentication tokens expire after 7 days.</p>
                </div>
                <div className="p-4 bg-surface-50 rounded-lg">
                  <p className="text-sm font-medium text-surface-800">Role-Based Access Control</p>
                  <p className="text-xs text-surface-500 mt-1">ADMIN, OPTOMETRIST, CASHIER roles with server-side enforcement.</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="card p-6 space-y-5">
              <h3 className="text-lg font-semibold text-surface-900">Appearance</h3>
              <p className="text-sm text-surface-500">Customize the look and feel of the platform.</p>
              <div className="space-y-4">
                <div className="p-4 bg-surface-50 rounded-lg">
                  <p className="text-sm font-medium text-surface-800">Theme</p>
                  <p className="text-xs text-surface-500 mt-1">Light mode is currently active. Dark mode support coming soon.</p>
                </div>
                <div className="p-4 bg-surface-50 rounded-lg">
                  <p className="text-sm font-medium text-surface-800">Brand Colors</p>
                  <div className="flex gap-2 mt-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-600" title="Primary" />
                    <div className="w-8 h-8 rounded-lg bg-clinical-600" title="Success" />
                    <div className="w-8 h-8 rounded-lg bg-amber-500" title="Warning" />
                    <div className="w-8 h-8 rounded-lg bg-red-500" title="Danger" />
                  </div>
                </div>
                <div className="p-4 bg-surface-50 rounded-lg">
                  <p className="text-sm font-medium text-surface-800">Typography</p>
                  <p className="text-xs text-surface-500 mt-1">Inter font family • 14px base size</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
