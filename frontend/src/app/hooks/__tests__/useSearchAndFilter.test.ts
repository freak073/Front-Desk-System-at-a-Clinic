import { renderHook, act } from '@testing-library/react';
import { useSearchAndFilter, usePatientSearchAndFilter, useDoctorSearchAndFilter, useAppointmentSearchAndFilter, useQueueSearchAndFilter } from '../useSearchAndFilter';

// Mock debounce function
jest.mock('../../../lib/memoization', () => ({
  debounce: (fn: Function, delay: number) => fn
}));

describe('useSearchAndFilter', () => {
  const mockData = [
    { id: 1, name: 'John Doe', status: 'active', category: 'A' },
    { id: 2, name: 'Jane Smith', status: 'inactive', category: 'B' },
    { id: 3, name: 'Bob Johnson', status: 'active', category: 'A' },
  ];

  const mockFilterFn = (item: any, searchTerm: string, filters: Record<string, any>) => {
    const matchesSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filters.status || filters.status === 'all' || item.status === filters.status;
    const matchesCategory = !filters.category || filters.category === 'all' || item.category === filters.category;
    return matchesSearch && matchesStatus && matchesCategory;
  };

  it('should initialize with default values', () => {
    const { result } = renderHook(() => 
      useSearchAndFilter(mockData, mockFilterFn)
    );

    expect(result.current.state.searchTerm).toBe('');
    expect(result.current.state.debouncedSearchTerm).toBe('');
    expect(result.current.state.filters).toEqual({});
    expect(result.current.filteredData).toEqual(mockData);
    expect(result.current.isFiltered).toBe(false);
    expect(result.current.hasResults).toBe(true);
    expect(result.current.resultCount).toBe(3);
  });

  it('should filter data based on search term', () => {
    const { result } = renderHook(() => 
      useSearchAndFilter(mockData, mockFilterFn)
    );

    act(() => {
      result.current.actions.setSearchTerm('john');
    });

    expect(result.current.state.searchTerm).toBe('john');
    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData.map(item => item.name)).toEqual(['John Doe', 'Bob Johnson']);
    expect(result.current.isFiltered).toBe(true);
  });

  it('should filter data based on filters', () => {
    const { result } = renderHook(() => 
      useSearchAndFilter(mockData, mockFilterFn)
    );

    act(() => {
      result.current.actions.setFilter('status', 'active');
    });

    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData.map(item => item.name)).toEqual(['John Doe', 'Bob Johnson']);
    expect(result.current.isFiltered).toBe(true);
  });

  it('should combine search and filters', () => {
    const { result } = renderHook(() => 
      useSearchAndFilter(mockData, mockFilterFn)
    );

    act(() => {
      result.current.actions.setSearchTerm('john');
      result.current.actions.setFilter('category', 'A');
    });

    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData.map(item => item.name)).toEqual(['John Doe', 'Bob Johnson']);
  });

  it('should clear filters', () => {
    const { result } = renderHook(() => 
      useSearchAndFilter(mockData, mockFilterFn)
    );

    act(() => {
      result.current.actions.setFilter('status', 'active');
      result.current.actions.clearFilters();
    });

    expect(result.current.state.filters).toEqual({});
    expect(result.current.filteredData).toEqual(mockData);
    expect(result.current.isFiltered).toBe(false);
  });

  it('should clear all filters and search', () => {
    const { result } = renderHook(() => 
      useSearchAndFilter(mockData, mockFilterFn)
    );

    act(() => {
      result.current.actions.setSearchTerm('john');
      result.current.actions.setFilter('status', 'active');
      result.current.actions.clearAll();
    });

    expect(result.current.state.searchTerm).toBe('');
    expect(result.current.state.filters).toEqual({});
    expect(result.current.filteredData).toEqual(mockData);
    expect(result.current.isFiltered).toBe(false);
  });

  it('should handle sorting', () => {
    const { result } = renderHook(() => 
      useSearchAndFilter(mockData, mockFilterFn)
    );

    act(() => {
      result.current.actions.setSorting('name', 'desc');
    });

    expect(result.current.filteredData.map(item => item.name)).toEqual(['John Doe', 'Jane Smith', 'Bob Johnson']);
  });
});

describe('usePatientSearchAndFilter', () => {
  const mockPatients = [
    { id: 1, name: 'John Doe', medicalRecordNumber: 'MR001' },
    { id: 2, name: 'Jane Smith', medicalRecordNumber: 'MR002' },
  ];

  it('should filter patients by name', () => {
    const { result } = renderHook(() => 
      usePatientSearchAndFilter(mockPatients)
    );

    act(() => {
      result.current.actions.setSearchTerm('john');
    });

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].name).toBe('John Doe');
  });

  it('should filter patients by medical record number', () => {
    const { result } = renderHook(() => 
      usePatientSearchAndFilter(mockPatients)
    );

    act(() => {
      result.current.actions.setSearchTerm('MR002');
    });

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].name).toBe('Jane Smith');
  });
});

describe('useDoctorSearchAndFilter', () => {
  const mockDoctors = [
    { id: 1, name: 'Dr. Smith', specialization: 'Cardiology', location: 'Building A', status: 'available' },
    { id: 2, name: 'Dr. Johnson', specialization: 'Neurology', location: 'Building B', status: 'busy' },
  ];

  it('should filter doctors by name', () => {
    const { result } = renderHook(() => 
      useDoctorSearchAndFilter(mockDoctors)
    );

    act(() => {
      result.current.actions.setSearchTerm('smith');
    });

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].name).toBe('Dr. Smith');
  });

  it('should filter doctors by specialization', () => {
    const { result } = renderHook(() => 
      useDoctorSearchAndFilter(mockDoctors)
    );

    act(() => {
      result.current.actions.setFilter('specialization', 'Cardiology');
    });

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].specialization).toBe('Cardiology');
  });

  it('should filter doctors by status', () => {
    const { result } = renderHook(() => 
      useDoctorSearchAndFilter(mockDoctors)
    );

    act(() => {
      result.current.actions.setFilter('status', 'available');
    });

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].status).toBe('available');
  });
});

describe('useAppointmentSearchAndFilter', () => {
  const mockAppointments = [
    { 
      id: 1, 
      patient: { name: 'John Doe' }, 
      doctor: { name: 'Dr. Smith' }, 
      status: 'booked',
      doctorId: 1,
      appointmentDatetime: '2024-01-15T10:00:00Z'
    },
    { 
      id: 2, 
      patient: { name: 'Jane Smith' }, 
      doctor: { name: 'Dr. Johnson' }, 
      status: 'completed',
      doctorId: 2,
      appointmentDatetime: '2024-01-16T14:00:00Z'
    },
  ];

  it('should filter appointments by patient name', () => {
    const { result } = renderHook(() => 
      useAppointmentSearchAndFilter(mockAppointments)
    );

    act(() => {
      result.current.actions.setSearchTerm('john doe');
    });

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].patient.name).toBe('John Doe');
  });

  it('should filter appointments by doctor name', () => {
    const { result } = renderHook(() => 
      useAppointmentSearchAndFilter(mockAppointments)
    );

    act(() => {
      result.current.actions.setSearchTerm('johnson');
    });

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].doctor.name).toBe('Dr. Johnson');
  });

  it('should filter appointments by status', () => {
    const { result } = renderHook(() => 
      useAppointmentSearchAndFilter(mockAppointments)
    );

    act(() => {
      result.current.actions.setFilter('status', 'booked');
    });

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].status).toBe('booked');
  });
});

describe('useQueueSearchAndFilter', () => {
  const mockQueueEntries = [
    { 
      id: 1, 
      patient: { name: 'John Doe' }, 
      status: 'waiting',
      priority: 'normal'
    },
    { 
      id: 2, 
      patient: { name: 'Jane Smith' }, 
      status: 'with_doctor',
      priority: 'urgent'
    },
  ];

  it('should filter queue entries by patient name', () => {
    const { result } = renderHook(() => 
      useQueueSearchAndFilter(mockQueueEntries)
    );

    act(() => {
      result.current.actions.setSearchTerm('john');
    });

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].patient.name).toBe('John Doe');
  });

  it('should filter queue entries by status', () => {
    const { result } = renderHook(() => 
      useQueueSearchAndFilter(mockQueueEntries)
    );

    act(() => {
      result.current.actions.setFilter('status', 'waiting');
    });

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].status).toBe('waiting');
  });

  it('should filter queue entries by priority', () => {
    const { result } = renderHook(() => 
      useQueueSearchAndFilter(mockQueueEntries)
    );

    act(() => {
      result.current.actions.setFilter('priority', 'urgent');
    });

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].priority).toBe('urgent');
  });
});