import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray' | 'info' | 'secondary';
  size?: 'sm' | 'md';
  className?: string;
  animate?: boolean;
  pulse?: boolean;
}

const variants = {
  primary: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ring-blue-600/20',
  success: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20',
  warning: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 ring-amber-600/20',
  danger: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 ring-red-600/20',
  gray: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-gray-600/20',
  info: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-indigo-600/20',
  secondary: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 ring-purple-600/20',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function Badge({
  children,
  variant = 'gray',
  size = 'sm',
  className = '',
  animate = false,
  pulse = false,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium ring-1 ring-inset
        transition-all duration-200 ease-out
        hover:scale-105 hover:shadow-sm
        ${animate ? 'animate-scale-in' : ''}
        ${pulse ? 'animate-pulse-soft' : ''}
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {children}
    </span>
  );
}
