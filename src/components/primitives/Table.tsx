import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  isNumeric?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  selectedId?: string;
  emptyMessage?: string;
  className?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectedId,
  emptyMessage = 'No records found.',
  className = '',
}: TableProps<T>) {
  return (
    <div className={`overflow-x-auto w-full border border-border dark:border-border-dark rounded-lg ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-surface-raised dark:bg-surface-raised-dark border-b border-border dark:border-border-dark z-10">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3.5 py-2.5 text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark ${
                  col.align === 'right' || col.isNumeric
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 dark:divide-border-dark/60 text-sm">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-xs text-content-secondary dark:text-content-secondary-dark"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const rowId = keyExtractor(row, idx);
              const isSelected = selectedId === rowId;

              return (
                <tr
                  key={rowId}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors duration-100 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${
                    isSelected
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[#e11d48] dark:before:bg-[#fb7185] font-medium'
                      : 'hover:bg-slate-50/80 dark:hover:bg-surface-raised-dark/60 odd:bg-transparent even:bg-slate-50/30 dark:even:bg-white/[0.015]'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3.5 py-2.5 text-content-primary dark:text-content-primary-dark ${
                        col.isNumeric ? 'font-mono tabular-nums text-right' : ''
                      } ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render ? col.render(row, idx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
