import { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${className}`}>
        {children}
      </table>
    </div>
  );
}

interface TableHeadProps {
  children: ReactNode;
}

export function TableHead({ children }: TableHeadProps) {
  return <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>;
}

interface TableBodyProps {
  children: ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return (
    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
      {children}
    </tbody>
  );
}

interface TableRowProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function TableRow({ children, onClick, className = '' }: TableRowProps) {
  return (
    <tr
      className={`
        transition-colors duration-150
        ${onClick ? 'cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/20' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface TableCellProps {
  children: ReactNode;
  header?: boolean;
  className?: string;
  title?: string;
}

export function TableCell({ children, header = false, className = '', title }: TableCellProps) {
  if (header) {
    return (
      <th
        className={`
          px-4 py-3.5 text-left text-xs font-semibold
          text-gray-500 dark:text-gray-400 uppercase tracking-wider
          ${className}
        `}
        title={title}
      >
        {children}
      </th>
    );
  }

  return (
    <td className={`px-4 py-4 text-sm text-gray-900 dark:text-gray-100 ${className}`} title={title}>
      {children}
    </td>
  );
}
