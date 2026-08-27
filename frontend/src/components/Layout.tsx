import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import useAuthStore, { api } from '../store/authStore';
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Clock,
  Eye,
  FileText,
  ShoppingCart,
  Package,
  DollarSign,
  BarChart3,
  LogOut,
  Search,
  Bell,
  ChevronLeft,
  CalendarDays,
  Receipt,
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

const navSections = [
  {
    label: 'OVERVIEW',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ],
  },
  {
    label: 'CLINICAL',
    items: [
      { icon: Users, label: 'Patients', path: '/patients' },
      { icon: CalendarDays, label: 'Appointments', path: '/appointments' },
      { icon: Eye, label: 'Eye Examinations', path: '/examinations' },
      { icon: FileText, label: 'Prescriptions', path: '/prescriptions' },
      { icon: Clock, label: 'Follow-ups', path: '/follow-ups' },
    ],
  },
  {
    label: 'OPTICAL',
    items: [
      { icon: ShoppingCart, label: 'Optical Sales', path: '/sales' },
      { icon: Package, label: 'Inventory', path: '/inventory' },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { icon: Receipt, label: 'Payments', path: '/payments' },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    ],
  },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications] = useState<Notification[]>([]);
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
    api.get('/search?q=').catch(() => {});
    // Notifications aren't in a dedicated endpoint, but we can use search
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
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Global search
  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults({});
      return;
    }
    setSearching(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(term)}`);
      setSearchResults(res.data.results);
    } catch {
      setSearchResults({});
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => performSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="h-screen bg-surface-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 bg-white border-r border-surface-200/80 shadow-sidebar z-40 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'w-[68px]' : 'w-64'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}
      >
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

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              {!sidebarCollapsed && (
                <p className="px-3 mb-2 text-2xs font-semibold text-surface-400 uppercase tracking-widest">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        active
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                      }`}
                    >
                      <Icon size={18} className="shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:flex items-center justify-end border-t border-surface-100 px-3 py-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft size={16} className={`transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Logout */}
        <div className="border-t border-surface-100 p-3 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
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
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Greeting - hidden on small screens */}
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-surface-800">{getGreeting()}, {user?.fullName?.split(' ')[0]}</p>
              <p className="text-xs text-surface-400">LISS Eye Care Services</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-lg px-3 py-2 text-sm text-surface-400 hover:border-surface-300 transition-colors"
            >
              <Search size={16} />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-2xs font-medium text-surface-400 bg-surface-100 border border-surface-200 rounded">
                ⌘K
              </kbd>
            </button>

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-danger text-white text-2xs font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-surface-200 rounded-xl shadow-elevated z-50 animate-slide-down">
                  <div className="px-4 py-3 border-b border-surface-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-surface-900">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-surface-400">No notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`px-4 py-3 border-b border-surface-50 ${!n.read ? 'bg-brand-50/30' : ''}`}>
                          <p className="text-sm font-medium text-surface-800">{n.title}</p>
                          <p className="text-xs text-surface-500 mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User */}
            <div className="flex items-center gap-3 pl-3 border-l border-surface-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-surface-800">{user?.fullName}</p>
                <p className="text-2xs text-surface-400 uppercase tracking-wide">{user?.role}</p>
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
        <div
          className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] p-4">
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} />
          <div className="relative w-full max-w-xl bg-white border border-surface-200 shadow-modal rounded-xl animate-scale-in overflow-hidden">
            <div className="flex items-center gap-3 px-4 border-b border-surface-100">
              <Search size={18} className="text-surface-400 shrink-0" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patients, prescriptions, products, invoices..."
                className="flex-1 py-3.5 text-sm bg-transparent outline-none placeholder:text-surface-400"
              />
              <kbd className="text-2xs text-surface-400 bg-surface-100 px-1.5 py-0.5 rounded border border-surface-200">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {searching && (
                <div className="p-6 text-center text-sm text-surface-400">Searching...</div>
              )}
              {!searching && searchQuery && Object.values(searchResults).every((r) => r.length === 0) && (
                <div className="p-6 text-center text-sm text-surface-400">No results found for "{searchQuery}"</div>
              )}
              {!searching && Object.entries(searchResults).map(([category, items]) => {
                if (items.length === 0) return null;
                return (
                  <div key={category} className="border-b border-surface-50 last:border-0">
                    <p className="px-4 py-2 text-2xs font-semibold text-surface-400 uppercase tracking-wider bg-surface-50">
                      {category}
                    </p>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                          if (category === 'patients') navigate(`/patients`);
                          else if (category === 'products') navigate(`/inventory`);
                          else if (category === 'sales') navigate(`/sales`);
                          else if (category === 'prescriptions') navigate(`/prescriptions`);
                          else if (category === 'payments') navigate(`/payments`);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-50 transition-colors text-left"
                      >
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
              {!searchQuery && (
                <div className="p-6 text-center text-sm text-surface-400">Type to search across the entire system</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
