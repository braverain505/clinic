import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import useAuthStore, { api } from '../store/authStore';
import {
  Menu, X, LayoutDashboard, Users, Clock, Eye, FileText, ShoppingCart,
  Package, DollarSign, BarChart3, LogOut, Search, Bell, ChevronLeft,
  CalendarDays, Receipt, Truck, Settings, Glasses, Shield,
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface SearchResult {
  type: string;
  id: string;
  name: string;
  value: string;
}

// Navigation items with required permissions
const navSections = [
  {
    label: 'OVERVIEW',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', permissions: [] as string[] },
    ],
  },
  {
    label: 'CLINICAL',
    items: [
      { icon: Users, label: 'Patients', path: '/patients', permissions: ['VIEW_PATIENTS'] },
      { icon: CalendarDays, label: 'Appointments', path: '/appointments', permissions: ['VIEW_PATIENTS'] },
      { icon: Eye, label: 'Eye Examinations', path: '/examinations', permissions: ['VIEW_EXAMINATIONS'] },
      { icon: FileText, label: 'Prescriptions', path: '/prescriptions', permissions: ['VIEW_PRESCRIPTIONS'] },
      { icon: Clock, label: 'Follow-ups', path: '/follow-ups', permissions: ['VIEW_FOLLOWUPS'] },
    ],
  },
  {
    label: 'OPTICAL',
    items: [
      { icon: ShoppingCart, label: 'Optical Sales', path: '/sales', permissions: ['VIEW_SALES'] },
      { icon: Glasses, label: 'Spectacle Orders', path: '/spectacle-orders', permissions: ['VIEW_SPECTACLE_ORDERS'] },
      { icon: Package, label: 'Inventory', path: '/inventory', permissions: ['VIEW_INVENTORY'] },
      { icon: Truck, label: 'Suppliers', path: '/suppliers', permissions: ['VIEW_SUPPLIERS'] },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { icon: Receipt, label: 'Payments', path: '/payments', permissions: ['VIEW_PAYMENTS'] },
      { icon: DollarSign, label: 'Expenses', path: '/expenses', permissions: ['VIEW_EXPENSES'] },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { icon: Shield, label: 'Staff', path: '/staff', permissions: ['VIEW_STAFF'] },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { icon: BarChart3, label: 'Analytics', path: '/analytics', permissions: ['VIEW_ANALYTICS'] },
      { icon: FileText, label: 'Reports', path: '/reports', permissions: ['VIEW_REPORTS'] },
    ],
  },
];

const roleDisplayNames: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Administrator',
  OPTOMETRIST: 'Optometrist',
  RECEPTIONIST: 'Receptionist',
  CASHIER: 'Cashier',
  INVENTORY_MANAGER: 'Inventory Manager',
};

const roleColors: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-brand-100 text-brand-700',
  OPTOMETRIST: 'bg-clinical-100 text-clinical-700',
  RECEPTIONIST: 'bg-blue-100 text-blue-700',
  CASHIER: 'bg-amber-100 text-amber-700',
  INVENTORY_MANAGER: 'bg-orange-100 text-orange-700',
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, hasPermission } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Record<string, SearchResult[]>>({});
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch notifications
  useEffect(() => {
    api.get('/notifications')
      .then((res) => setNotifications(res.data.notifications || []))
      .catch(() => {});
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  // Global search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults({}); return; }
    const timer = setTimeout(() => {
      setSearching(true);
      api.get(`/search?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => setSearchResults(res.data.results))
        .catch(() => setSearchResults({}))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Filter nav sections by permissions
  const filteredNavSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.permissions.length === 0 || item.permissions.some((p) => hasPermission(p))
      ),
    }))
    .filter((section) => section.items.length > 0);

  const roleDisplayName = user?.role ? (roleDisplayNames[user.role] || user.role) : '';
  const roleColor = user?.role ? (roleColors[user.role] || 'bg-surface-100 text-surface-600') : '';

  return (
    <div className="h-screen bg-surface-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-white border-r border-surface-200/80 shadow-sidebar z-40 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-[68px]' : 'w-64'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        {/* Logo */}
        <div className="h-16 flex items-center border-b border-surface-100 px-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
              <Eye size={18} className="text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <span className="font-bold text-surface-900 text-sm tracking-tight block truncate">LISS Eye Care</span>
                <span className="text-2xs text-surface-400 block truncate">Management Platform</span>
              </div>
            )}
          </div>
        </div>

        {/* Role Badge */}
        {!sidebarCollapsed && user && (
          <div className="px-4 pt-3 pb-1">
            <span className={`inline-flex items-center px-2.5 py-1 text-2xs font-semibold rounded-full ${roleColor}`}>
              {roleDisplayName}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {filteredNavSections.map((section) => (
            <div key={section.label} className="mb-4">
              {!sidebarCollapsed && (
                <p className="px-3 mb-2 text-2xs font-semibold text-surface-400 uppercase tracking-widest">{section.label}</p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${active ? 'bg-brand-50 text-brand-700' : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'}`}>
                      <Icon size={18} className="shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="hidden lg:flex items-center justify-end border-t border-surface-100 px-3 py-2">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <ChevronLeft size={16} className={`transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Settings & Logout */}
        <div className="border-t border-surface-100 p-3 shrink-0 space-y-1">
          {hasPermission('MANAGE_SETTINGS') && (
            <Link to="/settings" onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors">
              <Settings size={18} className="shrink-0" />
              {!sidebarCollapsed && <span>Settings</span>}
            </Link>
          )}
          {hasPermission('VIEW_NOTIFICATIONS') && (
            <Link to="/notifications" onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors">
              <Bell size={18} className="shrink-0" />
              {!sidebarCollapsed && <span>Notifications</span>}
            </Link>
          )}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut size={18} className="shrink-0" />
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-surface-200/80 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-surface-800">{getGreeting()}, {user?.fullName?.split(' ')[0]}</p>
              <p className="text-xs text-surface-400">LISS Eye Care Services</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <button onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-lg px-3 py-2 text-sm text-surface-400 hover:border-surface-300 transition-colors">
              <Search size={16} />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-2xs font-medium text-surface-400 bg-surface-100 border border-surface-200 rounded">⌘K</kbd>
            </button>

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-danger text-white text-2xs font-bold rounded-full flex items-center justify-center px-1">{unreadCount}</span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-surface-200 rounded-xl shadow-elevated z-50 animate-slide-down">
                  <div className="px-4 py-3 border-b border-surface-100"><h3 className="text-sm font-semibold text-surface-900">Notifications</h3></div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-surface-400">No notifications</div>
                    ) : notifications.map((n) => (
                      <div key={n.id} className={`px-4 py-3 border-b border-surface-50 ${!n.read ? 'bg-brand-50/30' : ''}`}>
                        <p className="text-sm font-medium text-surface-800">{n.title}</p>
                        <p className="text-xs text-surface-500 mt-0.5">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User */}
            <div className="flex items-center gap-3 pl-3 border-l border-surface-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-surface-800">{user?.fullName}</p>
                <p className={`text-2xs font-medium uppercase tracking-wide px-1.5 py-0.5 rounded ${roleColor}`}>{roleDisplayName}</p>
              </div>
              <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-sm font-semibold">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] p-4">
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} />
          <div className="relative w-full max-w-xl bg-white border border-surface-200 shadow-modal rounded-xl animate-scale-in overflow-hidden">
            <div className="flex items-center gap-3 px-4 border-b border-surface-100">
              <Search size={18} className="text-surface-400 shrink-0" />
              <input ref={searchInputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patients, prescriptions, products, invoices..." className="flex-1 py-3.5 text-sm bg-transparent outline-none placeholder:text-surface-400" />
              <kbd className="text-2xs text-surface-400 bg-surface-100 px-1.5 py-0.5 rounded border border-surface-200">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {searching && <div className="p-6 text-center text-sm text-surface-400">Searching...</div>}
              {!searching && searchQuery && Object.values(searchResults).every((r) => r.length === 0) && (
                <div className="p-6 text-center text-sm text-surface-400">No results found for "{searchQuery}"</div>
              )}
              {!searching && Object.entries(searchResults).map(([category, items]) => {
                if (items.length === 0) return null;
                return (
                  <div key={category} className="border-b border-surface-50 last:border-0">
                    <p className="px-4 py-2 text-2xs font-semibold text-surface-400 uppercase tracking-wider bg-surface-50">{category}</p>
                    {items.map((item) => (
                      <button key={item.id} onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-50 transition-colors text-left">
                        <div className="w-8 h-8 bg-surface-100 rounded-lg flex items-center justify-center text-surface-500 shrink-0">
                          {category === 'patients' && <Users size={14} />}
                          {category === 'products' && <Package size={14} />}
                          {category === 'sales' && <ShoppingCart size={14} />}
                          {category === 'prescriptions' && <FileText size={14} />}
                          {category === 'payments' && <DollarSign size={14} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-surface-800 truncate">{item.name}</p>
                          <p className="text-xs text-surface-400">{item.value}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
              {!searchQuery && <div className="p-6 text-center text-sm text-surface-400">Type to search across the entire system</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
