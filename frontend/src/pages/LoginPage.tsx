import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error, loading, clearError } = useAuthStore();
  const [email, setEmail] = useState('admin@lisseyecare.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email || !password) {
      setLocalError('Email and password are required');
      return;
    }

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setLocalError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Eye size={22} />
            </div>
            <div>
              <p className="font-bold text-lg tracking-tight">LISS Eye Care</p>
              <p className="text-brand-200 text-xs">Management Platform</p>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Premium Eye Care
              <br />
              Management
            </h1>
            <p className="mt-4 text-brand-200 text-lg leading-relaxed">
              A complete platform for managing clinical, optical, and business operations with precision and professionalism.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-6">
              <div>
                <p className="text-3xl font-bold">62+</p>
                <p className="text-brand-200 text-sm mt-1">API Endpoints</p>
              </div>
              <div>
                <p className="text-3xl font-bold">12</p>
                <p className="text-brand-200 text-sm mt-1">Database Models</p>
              </div>
              <div>
                <p className="text-3xl font-bold">100%</p>
                <p className="text-brand-200 text-sm mt-1">Data Persistence</p>
              </div>
              <div>
                <p className="text-3xl font-bold">24/7</p>
                <p className="text-brand-200 text-sm mt-1">Cloud Access</p>
              </div>
            </div>
          </div>

          <p className="text-brand-300 text-sm">
            © 2026 LISS Eye Care Services. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Eye size={22} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-lg text-surface-900 tracking-tight">LISS Eye Care</p>
              <p className="text-surface-400 text-xs">Management Platform</p>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-surface-900 tracking-tight">Sign in</h2>
            <p className="text-surface-500 mt-2">
              Enter your credentials to access the management platform.
            </p>
          </div>

          {/* Error */}
          {(error || localError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error || localError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="admin@lisseyecare.com"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base group"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-surface-50 border border-surface-200 rounded-lg">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Demo Credentials</p>
            <div className="space-y-1">
              <p className="text-sm text-surface-700">
                <span className="text-surface-400">Email:</span>{' '}
                <span className="font-medium font-mono">admin@lisseyecare.com</span>
              </p>
              <p className="text-sm text-surface-700">
                <span className="text-surface-400">Password:</span>{' '}
                <span className="font-medium font-mono">password123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
