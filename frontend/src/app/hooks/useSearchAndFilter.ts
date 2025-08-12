'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { debounce } from '../../lib/memoization';

export interface SearchFilterState {
  searchTerm: string;
  debouncedSearchTerm: string;
  filters: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchFilterActions {
  setSearchTerm: (term: string) => void;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  clearAll: () => void;
  setSorting: (sortBy: string, sortOrder?: 'asc' | 'desc') => void;
}

export interface UseSearchAndFilterOptions {
  debounceMs?: number;
  initialFilters?: Record<string, any>;
  initialSearchTerm?: string;
  onSearchChange?: (searchTerm: string, filters: Record<string, any>) => void;
}

export interface UseSearchAndFilterResult<T> {
  state: SearchFilterState;
  actions: SearchFilterActions;
  filteredData: T[];
  isFiltered: boolean;
  hasResults: boolean;
  resultCount: number;
}

/**
 * Enhanced search and filter hook with debouncing and real-time filtering
 */
export function useSearchAndFilter<T>(
  data: T[],
  filterFn: (item: T, searchTerm: string, filters: Record<string, any>) => boolean,
  options: UseSearchAndFilterOptions = {}
): UseSearchAndFilterResult<T> {
  const {
    debounceMs = 300,
    initialFilters = {},
    initialSearchTerm = '',
    onSearchChange
  } = options;

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearchTerm);
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Debounce search term
  const debouncedSetSearchTerm = useMemo(
    () => debounce((term: string) => {
      setDebouncedSearchTerm(term);
    }, debounceMs),
    [debounceMs]
  );

  useEffect(() => {
    debouncedSetSearchTerm(searchTerm);
  }, [searchTerm, debouncedSetSearchTerm]);

  // Notify parent of search changes
  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(debouncedSearchTerm, filters);
    }
  }, [debouncedSearchTerm, filters, onSearchChange]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = data.filter(item => filterFn(item, debouncedSearchTerm, filters));

    // Apply sorting if specified
    if (sortBy) {
      result = [...result].sort((a, b) => {
        const aValue = (a as any)[sortBy];
        const bValue = (b as any)[sortBy];
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, debouncedSearchTerm, filters, filterFn, sortBy, sortOrder]);

  const setFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const clearAll = useCallback(() => {
    setSearchTerm(initialSearchTerm);
    setDebouncedSearchTerm(initialSearchTerm);
    setFilters(initialFilters);
    setSortBy(undefined);
    setSortOrder('asc');
  }, [initialFilters, initialSearchTerm]);

  const setSorting = useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc' = 'asc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }, []);

  const isFiltered = useMemo(() => {
    return debouncedSearchTerm !== initialSearchTerm || 
           Object.keys(filters).some(key => filters[key] !== initialFilters[key]);
  }, [debouncedSearchTerm, initialSearchTerm, filters, initialFilters]);

  const hasResults = filteredData.length > 0;
  const resultCount = filteredData.length;

  return {
    state: {
      searchTerm,
      debouncedSearchTerm,
      filters,
      sortBy,
      sortOrder
    },
    actions: {
      setSearchTerm,
      setFilter,
      clearFilters,
      clearAll,
      setSorting
    },
    filteredData,
    isFiltered,
    hasResults,
    resultCount
  };
}

/**
 * Specialized hook for patient search and filtering
 */
export function usePatientSearchAndFilter(patients: any[]) {
  return useSearchAndFilter(
    patients,
    (patient, searchTerm, filters) => {
      const matchesSearch = !searchTerm || 
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.medicalRecordNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value || value === 'all') return true;
        return patient[key] === value;
      });

      return matchesSearch && matchesFilters;
    }
  );
}

/**
 * Specialized hook for doctor search and filtering
 */
export function useDoctorSearchAndFilter(doctors: any[]) {
  return useSearchAndFilter(
    doctors,
    (doctor, searchTerm, filters) => {
      const matchesSearch = !searchTerm ||
        doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.location?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !filters.status || filters.status === 'all' || doctor.status === filters.status;
      const matchesSpecialization = !filters.specialization || filters.specialization === 'all' || doctor.specialization === filters.specialization;
      const matchesLocation = !filters.location || filters.location === 'all' || doctor.location === filters.location;

      return matchesSearch && matchesStatus && matchesSpecialization && matchesLocation;
    }
  );
}

/**
 * Specialized hook for appointment search and filtering
 */
export function useAppointmentSearchAndFilter(appointments: any[]) {
  return useSearchAndFilter(
    appointments,
    (appointment, searchTerm, filters) => {
      const matchesSearch = !searchTerm ||
        appointment.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !filters.status || filters.status === 'all' || appointment.status === filters.status;
      const matchesDoctor = !filters.doctorId || filters.doctorId === 'all' || appointment.doctorId.toString() === filters.doctorId;
      
      const matchesDate = !filters.date ||
        new Date(appointment.appointmentDatetime).toDateString() === new Date(filters.date).toDateString();

      return matchesSearch && matchesStatus && matchesDoctor && matchesDate;
    }
  );
}

/**
 * Specialized hook for queue search and filtering
 */
export function useQueueSearchAndFilter(queueEntries: any[]) {
  return useSearchAndFilter(
    queueEntries,
    (entry, searchTerm, filters) => {
      const matchesSearch = !searchTerm ||
        entry.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !filters.status || filters.status === 'all' || entry.status === filters.status;
      const matchesPriority = !filters.priority || filters.priority === 'all' || entry.priority === filters.priority;

      return matchesSearch && matchesStatus && matchesPriority;
    }
  );
}