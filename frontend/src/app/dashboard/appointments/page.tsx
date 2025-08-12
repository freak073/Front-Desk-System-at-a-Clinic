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
import Header from '../../components/Header';
import NavigationTabs from '../../components/NavigationTabs';

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
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden">
      {/* Vanta Black Background with Purple Accents */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-violet-600/6 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-indigo-600/4 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400/15 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${4 + Math.random() * 3}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <Header />
        
        <div className="responsive-container">
          <div className="flex flex-col space-y-6 mb-8 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                  Appointments
                </h1>
                <p className="text-purple-300 text-sm mt-1">Schedule and manage patient appointments</p>
              </div>
              <SyncStatusIndicator dataType="appointments" showLabel />
            </div>
          </div>

          <NavigationTabs />

          {/* Enhanced Filters */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-purple-500/5 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-purple-200/90 mb-2">
                  Search Appointments
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    placeholder="Search appointments by patient name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <svg className="w-5 h-5 text-purple-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-purple-200/90 mb-2">
                  Status
                </label>
                <div className="relative">
                  <select
                    id="status"
                    value={filters.status || 'all'}
                    onChange={(e) => setFilter('status', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value} className="bg-slate-800 text-white">
                        {option.label} ({option.count})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-purple-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Doctor Filter */}
              <div>
                <label htmlFor="doctor" className="block text-sm font-medium text-purple-200/90 mb-2">
                  Doctor
                </label>
                <div className="relative">
                  <select
                    id="doctor"
                    value={filters.doctorId || 'all'}
                    onChange={(e) => setFilter('doctorId', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                  >
                    {doctorOptions.map(option => (
                      <option key={option.value} value={option.value} className="bg-slate-800 text-white">
                        {option.label} ({option.count})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-purple-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center space-x-4">
                {isFiltered && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-purple-300 hover:bg-white/20 transition-all duration-200 text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
              <div className="text-sm text-purple-300/80">
                {resultCount} of {localAppointments.length} appointments
              </div>
            </div>
          </div>

          {/* Appointments List */}
          <div className="space-y-4 mb-8">
            {filteredAppointments.length === 0 ? (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center shadow-2xl shadow-purple-500/5">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {isFiltered ? 'No appointments found' : 'No appointments scheduled'}
                </h3>
                <p className="text-gray-300">
                  {isFiltered 
                    ? 'No appointments match your search criteria. Try adjusting your filters or search terms.'
                    : 'No appointments are currently scheduled. Create a new appointment to get started.'
                  }
                </p>
              </div>
            ) : (
              filteredAppointments.map((appointment: any) => (
                <div key={appointment.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-purple-500/5 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-white text-xl mb-1">
                          {highlightMatch(appointment.patient?.name || 'N/A', debouncedSearchTerm)}
                        </div>
                        <div className="flex items-center space-x-4 text-purple-300">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>{appointment.doctor?.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{appointment.appointmentDate}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{appointment.appointmentTime}</span>
                          </div>
                        </div>
                        <div className="flex items-center mt-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${ 
                            appointment.status === 'booked' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            appointment.status === 'completed' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                            'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}>
                            {appointment.status === 'booked' ? '📅 Booked' :
                             appointment.status === 'completed' ? '✅ Completed' :
                             '❌ Canceled'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <select
                        value={appointment.status}
                        onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                      >
                        <option value="booked" className="bg-slate-800">Booked</option>
                        <option value="completed" className="bg-slate-800">Completed</option>
                        <option value="canceled" className="bg-slate-800">Canceled</option>
                      </select>
                      
                      <button
                        onClick={() => handleCancelAppointment(appointment.id)}
                        className="w-10 h-10 bg-red-500/20 hover:bg-red-500/30 rounded-xl flex items-center justify-center text-red-400 hover:text-red-300 transition-all duration-200"
                        disabled={appointment.status === 'canceled'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create New Appointment Button */}
          <LoadingButton
            isLoading={createAppointmentMutation.isLoading || globalIsLoading('appointments')}
            onClick={() => setShowAddModal(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-purple-500/20"
            loadingText="Processing..."
          >
            <div className="flex items-center justify-center space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span>Schedule New Appointment</span>
            </div>
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
        </div>
      </div>

          {/* Create Appointment Modal */}
          <Modal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Schedule New Appointment"
          >
            <div className="space-y-6">
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-purple-200/90">Select Existing Patient</legend>
                <div className="relative">
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-800">-- Select Patient --</option>
                    {availablePatients.map(p => (
                      <option key={p.id} value={p.id} className="bg-slate-800">{p.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-purple-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </fieldset>
              
              <div>
                <label htmlFor="patientName" className="block text-sm font-medium text-purple-200/90 mb-2">
                  Or Create New Patient
                </label>
                <input
                  type="text"
                  id="patientName"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                  placeholder="Enter patient name"
                />
              </div>
              
              <div>
                <label htmlFor="doctorSelect" className="block text-sm font-medium text-purple-200/90 mb-2">Doctor</label>
                <div className="relative">
                  <select
                    id="doctorSelect"
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-800">-- Select Doctor --</option>
                    {availableDoctors.map(d => (
                      <option key={d.id} value={d.id} className="bg-slate-800">{d.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-purple-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="appointmentDate" className="block text-sm font-medium text-purple-200/90 mb-2">Date</label>
                  <input
                    type="date"
                    id="appointmentDate"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                  />
                </div>
                <div>
                  <label htmlFor="appointmentTime" className="block text-sm font-medium text-purple-200/90 mb-2">Time</label>
                  <input
                    type="time"
                    id="appointmentTime"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 text-sm font-medium text-gray-300 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                >
                  Cancel
                </button>
                <LoadingButton
                  isLoading={createAppointmentMutation.isLoading}
                  onClick={handleCreateAppointment}
                  disabled={!(newPatientName.trim() || selectedPatientId) || !selectedDoctorId || !appointmentDate || !appointmentTime}
                  className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    !(newPatientName.trim() || selectedPatientId) || !selectedDoctorId || !appointmentDate || !appointmentTime
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg shadow-purple-500/25'
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
