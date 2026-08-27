import { Users, Eye, ShoppingCart, AlertCircle, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Good morning, Admin</h1>
        <p className="text-gray-600">Here's what's happening at Liss Eye Care Services today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Today's Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">₦485,000</p>
              <p className="text-sm text-green-600 mt-2">↑ 18.4% from yesterday</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Patients Today */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Patients Today</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">12</p>
              <p className="text-sm text-green-600 mt-2">↑ 3 new patients</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Eye Examinations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Eye Examinations</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">8</p>
              <p className="text-sm text-green-600 mt-2">↑ 2 more than yesterday</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Eye size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        {/* Optical Sales */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Optical Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">6</p>
              <p className="text-sm text-green-600 mt-2">↑ 1 more than yesterday</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <ShoppingCart size={24} className="text-orange-600" />
            </div>
          </div>
        </div>

        {/* Outstanding Payments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Outstanding Payments</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">₦245,000</p>
              <p className="text-sm text-red-600 mt-2">↑ 12.3% from yesterday</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>

        {/* Pending Follow-ups */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Follow-ups</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">7</p>
              <p className="text-sm text-yellow-600 mt-2">5 due this week</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-900">
          📊 Charts, tables, and detailed sections are coming next in the implementation!
        </p>
      </div>
    </div>
  );
}

// Import clock icon
import { Clock } from 'lucide-react';
