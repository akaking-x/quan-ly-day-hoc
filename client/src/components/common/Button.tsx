import { ButtonHTMLAttributes, forwardRef, CSSProperties } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variants = {
  primary: 'text-white focus:ring-blue-500 shadow-lg shadow-blue-500/25',
  secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500',
  danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 focus:ring-red-500 shadow-lg shadow-red-500/25',
  ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500',
  success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 focus:ring-green-500 shadow-lg shadow-green-500/25',
};

// Primary button uses theme gradient
const getPrimaryStyle = (): CSSProperties => ({
  background: 'linear-gradient(to right, var(--gradient-from, #3B82F6), var(--gradient-to, #8B5CF6))',
});

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, loading, style, ...props }, ref) => {
    const buttonStyle = variant === 'primary' ? { ...getPrimaryStyle(), ...style } : style;

    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center font-medium rounded-xl
          focus:outline-none focus:ring-2 focus:ring-offset-2
          transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          active:opacity-90 hover:opacity-90 hover:shadow-xl
          ${variants[variant]} ${sizes[size]} ${className}
        `}
        style={buttonStyle}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Đang xử lý...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
