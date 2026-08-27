import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  help?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, help, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-surface-700">
            {label}
            {props.required && <span className="text-danger ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3.5 py-2.5 text-sm border bg-white rounded-lg outline-none transition-all duration-150 placeholder:text-surface-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${
            error ? 'border-danger focus:border-danger focus:ring-red-100' : 'border-surface-200'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
        {help && !error && <p className="text-xs text-surface-400 mt-1">{help}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
