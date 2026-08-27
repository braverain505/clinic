import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[60] space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    success: <CheckCircle size={18} className="text-clinical-500 shrink-0" />,
    error: <AlertCircle size={18} className="text-danger shrink-0" />,
    info: <Info size={18} className="text-blue-500 shrink-0" />,
  };

  const borders = {
    success: 'border-clinical-200',
    error: 'border-red-200',
    info: 'border-blue-200',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border bg-white shadow-elevated animate-slide-up pointer-events-auto ${borders[toast.type]}`}
    >
      {icons[toast.type]}
      <p className="text-sm text-surface-700 flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-surface-400 hover:text-surface-600 shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function useToast() {
  const addToast = (type: Toast['type'], message: string): string => {
    const id = Math.random().toString(36).slice(2);
    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent('toast', { detail: { id, type, message } })
    );
    return id;
  };

  return {
    success: (message: string) => addToast('success', message),
    error: (message: string) => addToast('error', message),
    info: (message: string) => addToast('info', message),
  };
}
