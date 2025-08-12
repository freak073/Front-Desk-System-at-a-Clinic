import React from 'react';

export interface FilterOption { 
  value: string; 
  label: string; 
  count?: number; // Optional count for showing result numbers
}

export interface FilterSelectConfig {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
  className?: string;
  showCounts?: boolean;
}

export interface SearchConfig {
  id?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  debounceMs?: number;
  showSearchIcon?: boolean;
  onClear?: () => void;
}

interface FilterBarProps {
  search?: SearchConfig;
  selects?: FilterSelectConfig[];
  onClear?: () => void;
  onClearAll?: () => void;
  className?: string;
  children?: React.ReactNode;
  showResultCount?: boolean;
  resultCount?: number;
  isFiltered?: boolean;
  loading?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  search, 
  selects = [], 
  onClear, 
  onClearAll,
  className = '', 
  children,
  showResultCount = false,
  resultCount = 0,
  isFiltered = false,
  loading = false
}) => {
  const handleSearchClear = () => {
    if (search?.onClear) {
      search.onClear();
    } else if (search?.onChange) {
      search.onChange('');
    }
  };

  return (
    <div className={`bg-surface-800 border border-gray-700 shadow rounded-lg p-4 mb-6 ${className}`}>      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {search && (
          <div>
            <label htmlFor={search.id || 'search'} className="block text-sm font-medium text-gray-300 mb-1">
              {search.label || 'Search'}
            </label>
            <div className="relative">
              <input
                type="text"
                id={search.id || 'search'}
                placeholder={search.placeholder || 'Search...'}
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
              {search.showSearchIcon !== false && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {search.value && (
                    <button
                      onClick={handleSearchClear}
                      className="text-gray-400 hover:text-gray-200 mr-1"
                      type="button"
                      aria-label="Clear search"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        )}
        
        {selects.map(sel => (
          <div key={sel.id}>
            <label htmlFor={sel.id} className="block text-sm font-medium text-gray-300 mb-1">
              {sel.label}
            </label>
            <select
              id={sel.id}
              value={sel.value}
              onChange={(e) => sel.onChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            >
              {sel.options.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                  {sel.showCounts && o.count !== undefined && ` (${o.count})`}
                </option>
              ))}
            </select>
          </div>
        ))}
        
        {children}
        
        {(onClear || onClearAll) && (
          <div className="flex items-end space-x-2">
            {onClear && (
              <button
                onClick={onClear}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-surface-700 text-gray-200 rounded-md hover:bg-surface-600 transition focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear Filters
              </button>
            )}
            {onClearAll && isFiltered && (
              <button
                onClick={onClearAll}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>
      
      {showResultCount && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : (
                <>
                  {resultCount === 0 ? 'No results found' : `${resultCount} result${resultCount === 1 ? '' : 's'} found`}
                  {isFiltered && ' (filtered)'}
                </>
              )}
            </span>
            {isFiltered && !loading && (
              <span className="text-accent-400">
                Filters active
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
