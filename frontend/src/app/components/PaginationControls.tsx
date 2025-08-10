"use client";
import React from 'react';

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50]
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = Math.min(totalPages, start + windowSize - 1);
  if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4" aria-label="Pagination navigation">
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1.5 rounded border text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
          onClick={() => canPrev && onPageChange(1)}
          disabled={!canPrev}
          aria-label="First page"
        >«</button>
        <button
          className="px-3 py-1.5 rounded border text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
          onClick={() => canPrev && onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
        >‹</button>
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`px-3 py-1.5 rounded border text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${p === page ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-600' : 'bg-white'}`}
          >{p}</button>
        ))}
        <button
          className="px-3 py-1.5 rounded border text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
          onClick={() => canNext && onPageChange(page + 1)}
          disabled={!canNext}
          aria-label="Next page"
        >›</button>
        <button
          className="px-3 py-1.5 rounded border text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
          onClick={() => canNext && onPageChange(totalPages)}
          disabled={!canNext}
          aria-label="Last page"
        >»</button>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Page {page} of {totalPages}</span>
        <span className="hidden sm:inline">•</span>
        <span>{total} total</span>
        {onPageSizeChange && (
          <label className="flex items-center gap-1">
            <span className="sr-only">Rows per page</span>
            <select
              className="border rounded px-2 py-1 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={pageSize}
              aria-label="Rows per page"
              onChange={e => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map(opt => <option key={opt} value={opt}>{opt}/page</option>)}
            </select>
          </label>
        )}
      </div>
    </div>
  );
};

export default PaginationControls;
