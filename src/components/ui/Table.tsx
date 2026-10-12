import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { ChevronUp, ChevronDown } from 'lucide-react';

// ============================================================
// Sortable Table
// ============================================================

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  className?: string;
  width?: string;
}

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyMessage?: string;
  rowClassName?: (row: T) => string;
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  onRowClick,
  sortKey,
  sortDir,
  onSort,
  emptyMessage = 'No data available',
  rowClassName,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-midnight-700/40">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-midnight-700 bg-midnight-800/40">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-midnight-300',
                  col.sortable && 'cursor-pointer select-none hover:text-midnight-100',
                  col.width
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-midnight-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-midnight-700/30 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-midnight-700/20',
                  rowClassName?.(row)
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-3 py-2.5 text-midnight-200', col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
