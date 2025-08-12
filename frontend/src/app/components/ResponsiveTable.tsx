'use client';

import React from 'react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  mobileHidden?: boolean;
  tabletHidden?: boolean;
  desktopOnly?: boolean;
  className?: string;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  mobileCardView?: boolean;
  onRowClick?: (row: any) => void;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  mobileCardView = true,
  onRowClick
}) => {
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface-800 border border-gray-700 rounded-lg p-4 animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="bg-surface-800 border border-gray-700 rounded-lg p-8">
          <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-400">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Mobile card view
  if (mobileCardView) {
    return (
      <>
        {/* Mobile Card View */}
        <div className={`md:hidden space-y-4 ${className}`}>
          {data.map((row, index) => (
            <div
              key={index}
              className={`bg-surface-800 border border-gray-700 rounded-lg p-4 ${
                onRowClick ? 'cursor-pointer hover:bg-surface-700 transition-colors' : ''
              }`}
              onClick={() => onRowClick?.(row)}
            >
              <div className="space-y-3">
                {columns
                  .filter(col => !col.mobileHidden)
                  .map(column => (
                    <div key={column.key} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-400 min-w-0 flex-shrink-0 mr-3">
                        {column.label}:
                      </span>
                      <span className="text-sm text-gray-200 text-right min-w-0 flex-1">
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tablet and Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full bg-surface-800 border border-gray-700 rounded-lg">
            <thead className="bg-surface-700">
              <tr>
                {columns
                  .filter(col => !col.tabletHidden || (typeof window !== 'undefined' && window.innerWidth >= 1024))
                  .map(column => (
                    <th
                      key={column.key}
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ${
                        column.className || ''
                      } ${column.desktopOnly ? 'hidden lg:table-cell' : ''}`}
                    >
                      {column.label}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {data.map((row, index) => (
                <tr
                  key={index}
                  className={`${
                    onRowClick 
                      ? 'cursor-pointer hover:bg-surface-700 transition-colors desktop:hover:shadow-sm' 
                      : ''
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns
                    .filter(col => !col.tabletHidden || (typeof window !== 'undefined' && window.innerWidth >= 1024))
                    .map(column => (
                      <td
                        key={column.key}
                        className={`px-4 py-4 whitespace-nowrap text-sm text-gray-200 ${
                          column.className || ''
                        } ${column.desktopOnly ? 'hidden lg:table-cell' : ''}`}
                      >
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  // Standard table view only
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full bg-surface-800 border border-gray-700 rounded-lg">
        <thead className="bg-surface-700">
          <tr>
            {columns.map(column => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ${
                  column.className || ''
                } ${column.mobileHidden ? 'hidden sm:table-cell' : ''} ${
                  column.tabletHidden ? 'hidden md:table-cell' : ''
                } ${column.desktopOnly ? 'hidden lg:table-cell' : ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {data.map((row, index) => (
            <tr
              key={index}
              className={`${
                onRowClick 
                  ? 'cursor-pointer hover:bg-surface-700 transition-colors desktop:hover:shadow-sm' 
                  : ''
              }`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map(column => (
                <td
                  key={column.key}
                  className={`px-4 py-4 whitespace-nowrap text-sm text-gray-200 ${
                    column.className || ''
                  } ${column.mobileHidden ? 'hidden sm:table-cell' : ''} ${
                    column.tabletHidden ? 'hidden md:table-cell' : ''
                  } ${column.desktopOnly ? 'hidden lg:table-cell' : ''}`}
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResponsiveTable;