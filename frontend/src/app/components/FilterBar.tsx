import React from 'react';

export interface FilterOption { value: string; label: string; }
export interface FilterSelectConfig {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
  className?: string;
}

interface FilterBarProps {
  search?: {
    id?: string;
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
  };
  selects?: FilterSelectConfig[];
  onClear?: () => void;
  className?: string;
  children?: React.ReactNode; // extra custom filters
}

const FilterBar: React.FC<FilterBarProps> = ({ search, selects = [], onClear, className = '', children }) => {
  return (
  <div className={`bg-surface-800 border border-gray-700 shadow rounded-lg p-4 mb-6 ${className}`}>      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {search && (
          <div>
            <label htmlFor={search.id || 'search'} className="block text-sm font-medium text-gray-300 mb-1">
              {search.label || 'Search'}
            </label>
            <input
              type="text"
              id={search.id || 'search'}
              placeholder={search.placeholder || 'Search...'}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            />
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
              {sel.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ))}
        {onClear && (
          <div className="flex items-end">
            <button
              onClick={onClear}
              className="w-full px-4 py-2 bg-surface-700 text-gray-200 rounded-md hover:bg-surface-600 transition focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              Clear Filters
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default FilterBar;
