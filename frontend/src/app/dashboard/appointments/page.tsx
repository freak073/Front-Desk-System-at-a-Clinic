'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { useAuth } from '../../../context/AuthContext';
import { useAppointmentUpdates, useNotifications } from '../../hooks/useRealTimeUpdates';
import { useGlobalState } from '../../../context/GlobalStateContext';
import { useOptimisticMutation } from '../../hooks/useOptimisticMutation';
import { useAppointmentSearchAndFilter } from '../../hooks/useSearchAndFilter';
import { logMetric } from '../../../lib/metrics';
import { PageLoading, ErrorState, EmptyState, LoadingButton } from '../../components/LoadingStates';
import { SyncStatusIndicator } from '../../components/SyncStatusIndicator';

import Modal from '../../components/Modal';
import { createAppointment, updateAppointment, cancelAppointment, fetchDoctors, fetchPatients } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from '../../../types';

import SearchablePagination from '../../components/SearchablePagination';
import { apiService } from '../../../lib/api';
import { highlightMatch } from '../../components/highlight';
import FilterBar from '../../components/FilterBar';
import SearchResults from '../../components/SearchResults';

const AppointmentsPage = () => {
  const { user, loading: authLoading } = useAuth();
  React.useEffect(()=> { const t = performance.now(); return () => { logMetric({ name:'appointments_page_time', duration: performance.now()-t, timestamp: Date.now() }); }; }, []);
  const { showSuccess, showError, notifyDataUpdate, notifyDataError } = useNotifications();
  const { setLoadingState, setErrorState, isLoading: globalIsLoading } = useGlobalState();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data: appointmentsData, isLoading, isError, error, refetch, syncStatus } = useAppointmentUpdates(page, pageSize, undefined, {
    onSuccess: () => setErrorState('appointments', null),
    onError: (error) => setErrorState('appointments', error.message),
  });
  const queryClient = useQueryClient();
  const appointmentsEnvelope: any = appointmentsData?.data;
  const fetchedAppointments: any[] = Array.isArray(appointmentsEnvelope?.data) ? appointmentsEnvelope.data : Array.isArray(appointmentsEnvelope) ? appointmentsEnvelope : [];
  const [localAppointments, setLocalAppointments] = useState<any[]>([]);
  // sync local appointments when fresh data arrives (length or ids change)
  useEffect(() => {
    if (fetchedAppointments.length) {
      setLocalAppointments(fetchedAppointments.map(e => ({ ...e })));
    }
  }, [fetchedAppointments.length]);
  const totalAppointments = appointmentsEnvelope?.meta?.total || localAppointments.length;
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [availablePatients, setAvailablePatients] = useState<any[]>([]);

  // Enhanced search and filter functionality
  const searchAndFilter = useAppointmentSearchAndFilter(localAppointments);
  const {
    state: { searchTerm, debouncedSearchTerm, filters },
    actions: { setSearchTerm, setFilter, clearFilters, clearAll },
    filteredData: filteredAppointments,
    isFiltered,
    hasResults,
    resultCount
  } = searchAndFilter;

  // Fetch doctors and patients when component mounts
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [doctors, patients] = await Promise.all([
          fetchDoctors(),
          fetchPatients()
        ]);
        if (!cancelled) {
          setAvailableDoctors(doctors);
          setAvailablePatients(patients);
        }
      } catch (err) {
        if (!cancelled) console.error('[AppointmentsPage] Error fetching data:', err);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [authLoading, user]);

  // Get filter options with counts
  const statusOptions = [
    { value: 'all', label: 'All Statuses', count: localAppointments.length },
    { value: 'booked', label: 'Booked', count: localAppointments.filter(a => a.status === 'booked').length },
    { value: 'completed', label: 'Completed', count: localAppointments.filter(a => a.status === 'completed').length },
    { value: 'canceled', label: 'Canceled', count: localAppointments.filter(a => a.status === 'canceled').length }
  ];

  const doctorOptions = [
    { value: 'all', label: 'All Doctors', count: localAppointments.length },
    ...availableDoctors.map(doctor => ({
      value: doctor.id.toString(),
      label: doctor.name,
      count: localAppointments.filter(a => a.doctorId === doctor.id).length
    }))
  ];

  // Enhanced optimistic mutation for creating appointments
  const createAppointmentMutation = useOptimisticMutation(
    async (variables: CreateAppointmentDto) => {
      return await createAppointment(variables);
    },
    {
      queryKey: ['appointments', page, pageSize],
      updateFn: (oldData: any, variables) => {
        if (!oldData?.data?.data) return oldData;
        const newAppointment = {
          id: Date.now(), // temporary ID
          ...variables,
          status: 'booked',
          patient: availablePatients.find(p => p.id === variables.patientId) || { name: 'Unknown' },
          doctor: availableDoctors.find(d => d.id === variables.doctorId) || { name: 'Unknown' }
        };
        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: [newAppointment, ...oldData.data.data]
          }
        };
      },
      optimisticUpdateType: 'create',
      successMessage: 'Appointment created successfully',
      errorMessage: 'Failed to create appointment',
    }
  );

  const handleCreateAppointment = async () => {
    setLoadingState('appointments', true);
    try {
      let patientId: number | null = null;
      if (selectedPatientId) {
        patientId = parseInt(selectedPatientId, 10);
      } else if (newPatientName.trim()) {
        const createRes = await apiService.post<any>('/patients', { name: newPatientName.trim() });
        if (createRes?.data?.id) patientId = createRes.data.id as unknown as number;
      }
      if (!patientId || !selectedDoctorId || !appointmentDate || !appointmentTime) {
        showError('Please fill in all required fields');
        return;
      }
      
      const appointmentData: CreateAppointmentDto = {
        patientId,
        doctorId: parseInt(selectedDoctorId, 10),
        appointmentDatetime: `${appointmentDate}T${appointmentTime}:00.000Z`
      };
      
      await createAppointmentMutation.mutateAsync(appointmentData);
      
      setNewPatientName('');
      setSelectedPatientId('');
      setSelectedDoctorId('');
      setAppointmentDate('');
      setAppointmentTime('');
      setShowAddModal(false);
      notifyDataUpdate('appointments', 'created');
    } catch (err) {
      console.error('Error creating appointment:', err);
      notifyDataError('appointments', 'create', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoadingState('appointments', false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    const prevAppointments = localAppointments.map(a => ({ ...a }));
    // optimistic update
    setLocalAppointments(a => a.map(app => app.id === id ? { ...app, status } : app));
    try {
      const updateData: UpdateAppointmentDto = { status: status as 'booked' | 'completed' | 'canceled' };
      const result = await updateAppointment(id, updateData);
      if (result) {
        showSuccess('Appointment status updated');
        queryClient.invalidateQueries('appointments');
        refetch();
      } else throw new Error('No result');
    } catch (err) {
      console.error('[AppointmentsPage] update status failed', err);
      setLocalAppointments(prevAppointments); // rollback
      showError('Failed to update appointment status');
    }
  };

  const handleCancelAppointment = async (id: number) => {
    try {
      const success = await cancelAppointment(id);
      if (success) {
        showSuccess('Appointment cancelled successfully');
        queryClient.invalidateQueries('appointments');
        refetch();
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      showError('Failed to cancel appointment');
    }
  };

  const isInitialLoading = (authLoading || (isLoading && localAppointments.length === 0));
  if (isInitialLoading) {
    return (
      <PageLoading 
        message="Loading appointments..." 
        skeletonType="table" 
        skeletonCount={6} 
      />
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <ErrorState
          title="Error Loading Appointments"
          message={error?.message || 'Failed to load appointments data'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="responsive-container text-gray-200">
      <div className="flex flex-col space-y-4 mb-6 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div className="flex items-center responsive-space-x-4">
          <h1 className="responsive-text-2xl font-semibold text-gray-100">Appointment Management</h1>
          <SyncStatusIndicator dataType="appointments" showLabel />
        </div>
      </div>

      {/* Enhanced Filters */}
      <FilterBar
        search={{
          placeholder: 'Search appointments by patient name...',
          value: searchTerm,
          onChange: setSearchTerm,
          showSearchIcon: true
        }}
        selects={[
          {
            id: 'status',
            label: 'Status',
            value: filters.status || 'all',
            onChange: (value) => setFilter('status', value),
            options: statusOptions,
            showCounts: true
          },
          {
            id: 'doctor',
            label: 'Doctor',
            value: filters.doctorId || 'all',
            onChange: (value) => setFilter('doctorId', value),
            options: doctorOptions,
            showCounts: true
          }
        ]}
        onClear={clearFilters}
        onClearAll={clearAll}
        showResultCount={true}
        resultCount={resultCount}
        isFiltered={isFiltered}
        loading={isLoading}
      />

      {/* Appointments List with Enhanced Search Results */}
      <SearchResults
        data={filteredAppointments}
        searchTerm={debouncedSearchTerm}
        isFiltered={isFiltered}
        loading={isLoading}
        emptyStateTitle="No appointments scheduled"
        emptyStateMessage="No appointments are currently scheduled. Create a new appointment to get started."
        noResultsTitle="No appointments found"
        noResultsMessage="No appointments match your search criteria. Try adjusting your filters or search terms."
        showResultCount={false}
        renderItem={(appointment: any, index: number, searchTerm: string) => (
          <div key={appointment.id} className="responsive-card">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-100">
                    {highlightMatch(appointment.patient?.name || 'N/A', searchTerm)}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'booked' ? 'bg-blue-600/20 text-blue-300' :
                      appointment.status === 'completed' ? 'bg-green-600/20 text-green-300' :
                      'bg-red-600/20 text-red-300'
                    }`}>
                      {appointment.status === 'booked' ? '📅 Booked' :
                       appointment.status === 'completed' ? '✅ Completed' :
                       '❌ Canceled'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{appointment.doctor?.name || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{appointment.appointmentDate}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{appointment.appointmentTime}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  value={appointment.status}
                  onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-600 rounded bg-surface-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option value="booked">Booked</option>
                  <option value="completed">Completed</option>
                  <option value="canceled">Canceled</option>
                </select>
                
                <button
                  onClick={() => handleCancelAppointment(appointment.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/10 rounded"
                  disabled={appointment.status === 'canceled'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        className="space-y-4 mb-6"
      />

      {/* Create New Appointment Button */}
      <LoadingButton
        isLoading={createAppointmentMutation.isLoading || globalIsLoading('appointments')}
        onClick={() => setShowAddModal(true)}
        className="w-full touch-button bg-surface-700 hover:bg-surface-600 text-gray-200 rounded-lg border border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 desktop:hover:shadow-md desktop:hover:scale-105"
        loadingText="Processing..."
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Schedule New Appointment
      </LoadingButton>

      <SearchablePagination
        pagination={{
          page,
          pageSize,
          total: totalAppointments,
          totalPages: Math.ceil(totalAppointments / pageSize),
          pageNumbers: Array.from({ length: Math.min(5, Math.ceil(totalAppointments / pageSize)) }, (_, i) => i + 1),
          nextPage: () => { setPage(p => p + 1); refetch(); },
          prevPage: () => { setPage(p => p - 1); refetch(); },
          goToPage: (p: number) => { setPage(p); refetch(); },
          setPageSize: (size: number) => { setPageSize(size); setPage(1); refetch(); },
          canNextPage: page < Math.ceil(totalAppointments / pageSize),
          canPrevPage: page > 1
        }}
        totalResults={totalAppointments}
        filteredResults={resultCount}
        isFiltered={isFiltered}
        searchTerm={debouncedSearchTerm}
        showResultSummary={true}
      />

      {/* Create Appointment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Schedule New Appointment"
      >
        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-gray-700">Select Existing Patient</legend>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select Patient --</option>
              {availablePatients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </fieldset>
          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
              Or Create New Patient
            </label>
            <input
              type="text"
              id="patientName"
              value={newPatientName}
              onChange={(e) => setNewPatientName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter patient name"
            />
          </div>
          <div>
            <label htmlFor="doctorSelect" className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <select
              id="doctorSelect"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select Doctor --</option>
              {availableDoctors.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              id="appointmentDate"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="appointmentTime" className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              id="appointmentTime"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-200 bg-surface-700 border border-gray-600 rounded-md hover:bg-surface-600 focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              Cancel
            </button>
            <LoadingButton
              isLoading={createAppointmentMutation.isLoading}
              onClick={handleCreateAppointment}
              disabled={!(newPatientName.trim() || selectedPatientId) || !selectedDoctorId || !appointmentDate || !appointmentTime}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                !(newPatientName.trim() || selectedPatientId) || !selectedDoctorId || !appointmentDate || !appointmentTime
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              loadingText="Creating..."
            >
              Schedule Appointment
            </LoadingButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AppointmentsPage;
