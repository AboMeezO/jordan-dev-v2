import type { useReactTable } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'

import { EmptyState } from '#/components/app'

import { moduleColumns, statusTone } from '../data'
import { compactNumber } from '../utils'

import type { ModuleRow, ModuleStatus } from '../types'

export function ModuleTable({
  table,
}: {
  table: ReturnType<typeof useReactTable<ModuleRow>>
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              className="border-b border-[var(--nd-border-visible)]"
              key={headerGroup.id}
            >
              {headerGroup.headers.map((header) => (
                <th className="nd-th" key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <tr
                className="border-b border-[var(--nd-border)] last:border-0"
                key={row.id}
              >
                {row.getVisibleCells().map((cell) => (
                  <td className="px-4 py-4" key={cell.id}>
                    <TableCell
                      cellId={cell.column.id}
                      value={cell.getValue()}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                className="px-4"
                colSpan={moduleColumns.length}
              >
                <EmptyState
                  description="Try clearing the search filter or turning off alerts-only mode."
                  title="[NO MATCHING MODULES]"
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function TableCell({ cellId, value }: { cellId: string; value: unknown }) {
  if (cellId === 'status') {
    const status = value as ModuleStatus
    return (
      <span
        className={`font-mono text-xs uppercase tracking-[0.12em] ${statusTone[status]}`}
      >
        {status}
      </span>
    )
  }

  if (cellId === 'requests') {
    return <span className="font-mono">{compactNumber(value as number)}</span>
  }

  if (cellId === 'latency') {
    return (
      <span className="font-mono">
        {typeof value === 'number' ? `${value}ms` : '--'}
      </span>
    )
  }

  if (cellId === 'owner') {
    return (
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--nd-text-secondary)]">
        {String(value)}
      </span>
    )
  }

  return <span>{String(value)}</span>
}
