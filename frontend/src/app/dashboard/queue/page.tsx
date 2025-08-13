'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { useAuth } from '../../../context/AuthContext';
import { useQueueUpdates, useNotifications } from '../../hooks/useRealTimeUpdates';
import { useGlobalState } from '../../../context/GlobalStateContext';
import { useOptimisticMutation } from '../../hooks/useOptimisticMutation';
import { useQueueSearchAndFilter } from '../../hooks/useSearchAndFilter';
import { logMetric } from '../../../lib/metrics';
import { PageLoading, ErrorState, EmptyState, LoadingButton } from '../../components/LoadingStates';
import { SyncStatusIndicator } from '../../components/SyncStatusIndicator';

import Modal from '../../components/Modal';
import { addToQueue, updateQueueEntryStatus, removeFromQueue, fetchPatients, searchPatients } from './queue.service';
import { CreateQueueEntryDto, UpdateQueueEntryDto } from '../../../types';

import SearchablePagination from '../../components/SearchablePagination';
import { apiService } from '../../../lib/api';
import { highlightMatch } from '../../components/highlight';
import FilterBar from '../../components/FilterBar';
import SearchResults from '../../components/SearchResults';
import NavigationTabs from '../../components/NavigationTabs';

const QueueManagementPage = () => {
  const { user, loading: authLoading } = useAuth();
  React.useEffect(()=> { const t = performance.now(); return () => { logMetric({ name:'queue_page_time', duration: performance.now()-t, timestamp: Date.now() }); }; }, []);
  const { showSuccess, showError, notifyDataUpdate, notifyDataError } = useNotifications();
  const { setLoadingState, setErrorState, isLoading: globalIsLoading } = useGlobalState();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data: queueData, isLoading, isError, error, refetch, syncStatus } = useQueueUpdates(page, pageSize, {
    onSuccess: () => setErrorState('queue', null),
    onError: (error) => setErrorState('queue', error.message),
  });
  const queryClient = useQueryClient();
  const queueEnvelope: any = queueData?.data;
  const fetchedQueue: any[] = Array.isArray(queueEnvelope?.data) ? queueEnvelope.data : Array.isArray(queueEnvelope) ? queueEnvelope : [];
  const [localQueue, setLocalQueue] = useState<any[]>([]);
  // sync local queue when fresh data arrives (length or ids change)
  useEffect(() => {
    if (fetchedQueue.length) {
      setLocalQueue(fetchedQueue.map(e => ({ ...e })));
    }
  }, [fetchedQueue.length]);
  const totalQueue = queueEnvelope?.meta?.total || localQueue.length;
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [selectedExistingPatientId, setSelectedExistingPatientId] = useState<string>('');
  const [availablePatients, setAvailablePatients] = useState<any[]>([]);
  const [priorityValue, setPriorityValue] = useState<'normal' | 'urgent'>('normal');

  // Enhanced search and filter functionality
  const searchAndFilter = useQueueSearchAndFilter(localQueue);
  const {
    state: { searchTerm, debouncedSearchTerm, filters },
    actions: { setSearchTerm, setFilter, clearFilters, clearAll },
    filteredData: filteredQueueEntries,
    isFiltered,
    hasResults,
    resultCount
  } = searchAndFilter;

  // Search / fetch patients when search term changes (after auth ready)
  useEffect(() => {
    if (authLoading || !user) return; // wait for auth
    let cancelled = false;
    const run = async () => {
      try {
        let patients;
        if (debouncedSearchTerm) {
          patients = await searchPatients(debouncedSearchTerm);
          console.debug('[QueuePage] searchPatients returned', patients.length);
        } else {
          patients = await fetchPatients();
          console.debug('[QueuePage] fetchPatients initial returned', patients.length);
        }
        if (!cancelled) {
          setAvailablePatients(patients);
          // Retry once shortly if empty but authenticated (handles race with token cookie)
          if (!debouncedSearchTerm && patients.length === 0) {
            setTimeout(async () => {
              if (cancelled) return;
              const retry = await fetchPatients();
              console.debug('[QueuePage] fetchPatients retry returned', retry.length);
              if (retry.length) setAvailablePatients(retry);
            }, 600);
          }
        }
      } catch (err) {
        if (!cancelled) console.error('[QueuePage] Error fetching/searching patients:', err);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [debouncedSearchTerm, authLoading, user]);

  // Get filter options with counts
  const statusOptions = [
    { value: 'all', label: 'All Statuses', count: localQueue.length },
    { value: 'waiting', label: 'Waiting', count: localQueue.filter(e => e.status === 'waiting').length },
    { value: 'with_doctor', label: 'With Doctor', count: localQueue.filter(e => e.status === 'with_doctor').length },
    { value: 'completed', label: 'Completed', count: localQueue.filter(e => e.status === 'completed').length }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities', count: localQueue.length },
    { value: 'normal', label: 'Normal', count: localQueue.filter(e => e.priority === 'normal').length },
    { value: 'urgent', label: 'Urgent', count: localQueue.filter(e => e.priority === 'urgent').length }
  ];

  // Enhanced optimistic mutation for adding patients
  const addPatientMutation = useOptimisticMutation(
    async (variables: { patientId: number; priority: 'normal' | 'urgent' }) => {
      const newEntry: CreateQueueEntryDto = variables;
      return await addToQueue(newEntry);
    },
    {
      queryKey: ['queue', page, pageSize],
      updateFn: (oldData: any, variables) => {
        if (!oldData?.data?.data) return oldData;
        const newEntry = {
          id: Date.now(), // temporary ID
          patientId: variables.patientId,
          priority: variables.priority,
          status: 'waiting',
          queueNumber: (oldData.data.data.length || 0) + 1,
          arrivalTime: new Date().toISOString(),
          estimatedWaitTime: 15,
          patient: availablePatients.find(p => p.id === variables.patientId) || { name: 'Unknown' }
        };
        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: [newEntry, ...oldData.data.data]
          }
        };
      },
      optimisticUpdateType: 'create',
      successMessage: 'Patient added to queue successfully',
      errorMessage: 'Failed to add patient to queue',
    }
  );

  const handleAddPatient = async () => {
    setLoadingState('queue', true);
    try {
      let patientId: number | null = null;
      if (selectedExistingPatientId) {
        patientId = parseInt(selectedExistingPatientId, 10);
      } else if (newPatientName.trim()) {
        const createRes = await apiService.post<any>('/patients', { name: newPatientName.trim() });
        if (createRes?.data?.id) patientId = createRes.data.id as unknown as number;
      }
      if (!patientId) {
        showError('Please select or create a patient');
        return;
      }
      
      await addPatientMutation.mutateAsync({ patientId, priority: priorityValue });
      
      setNewPatientName('');
      setSelectedExistingPatientId('');
      setPriorityValue('normal');
      setShowAddModal(false);
      notifyDataUpdate('queue', 'created');
    } catch (err) {
      console.error('Error adding patient to queue:', err);
      notifyDataError('queue', 'add', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoadingState('queue', false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    const prevEntries = localQueue.map(e => ({ ...e }));
    // optimistic update
    setLocalQueue(q => q.map(e => e.id === id ? { ...e, status } : e));
    try {
      const updateData: UpdateQueueEntryDto = { status: status as 'waiting' | 'with_doctor' | 'completed' };
      const result = await updateQueueEntryStatus(id, updateData);
      if (result) {
        showSuccess('Queue status updated');
  queryClient.invalidateQueries('queue');
        refetch();
      } else throw new Error('No result');
    } catch (err) {
      console.error('[QueuePage] update status failed', err);
      setLocalQueue(prevEntries); // rollback
      showError('Failed to update queue status');
    }
  };

  const handleRemovePatient = async (id: number) => {
    try {
      const success = await removeFromQueue(id);
      if (success) {
        showSuccess('Patient removed from queue successfully');
        
        // Refetch to get updated data
  queryClient.invalidateQueries('queue');
        refetch();
      }
    } catch (err) {
      console.error('Error removing patient from queue:', err);
      showError('Failed to remove patient from queue');
    }
  };

  const isInitialLoading = (authLoading || (isLoading && localQueue.length === 0));
  if (isInitialLoading) {
    return (
      <PageLoading 
        message="Loading queue data..." 
        skeletonType="table" 
        skeletonCount={6} 
      />
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <ErrorState
          title="Error Loading Queue"
          message={error?.message || 'Failed to load queue data'}
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
        <div className="responsive-container">
          <div className="flex flex-col space-y-6 mb-8 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                  Queue Management
                </h1>
                <p className="text-purple-300 text-sm mt-1">Manage patient queue and appointments</p>
              </div>
              <SyncStatusIndicator dataType="queue" showLabel />
            </div>
          </div>

          <NavigationTabs />

        {/* Enhanced Filters */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-purple-500/5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-purple-200/90 mb-2">
                Search Patients
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  placeholder="Search patients by name..."
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

            {/* Priority Filter */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-purple-200/90 mb-2">
                Priority
              </label>
              <div className="relative">
                <select
                  id="priority"
                  value={filters.priority || 'all'}
                  onChange={(e) => setFilter('priority', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                >
                  {priorityOptions.map(option => (
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
              {resultCount} of {localQueue.length} patients
            </div>
          </div>
        </div>

          {/* Queue List with Enhanced Search Results */}
          <div className="space-y-4 mb-8">
            {filteredQueueEntries.length === 0 ? (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center shadow-2xl shadow-purple-500/5">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {isFiltered ? 'No patients found' : 'Queue is empty'}
                </h3>
                <p className="text-gray-300">
                  {isFiltered 
                    ? 'No patients match your search criteria. Try adjusting your filters or search terms.'
                    : 'No patients are currently in the queue. Add a patient to get started.'
                  }
                </p>
              </div>
            ) : (
              filteredQueueEntries.map((entry: any, index: number) => (
                <div key={entry.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-purple-500/5 hover:bg-white/10 transition-all duration-300">
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                          <span className="text-lg font-bold text-white">
                            {entry.queueNumber}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-white text-lg">
                              {highlightMatch(entry.patient?.name || 'N/A', debouncedSearchTerm)}
                            </span>
                            {entry.priority === 'urgent' && (
                              <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              entry.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                              entry.status === 'with_doctor' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                              'bg-green-500/20 text-green-300 border border-green-500/30'
                            }`}>
                              {entry.status === 'waiting' ? '⏳ Waiting' :
                               entry.status === 'with_doctor' ? '👨‍⚕️ With Doctor' :
                               '✅ Completed'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePatient(entry.id)}
                        className="w-10 h-10 bg-red-500/20 hover:bg-red-500/30 rounded-xl flex items-center justify-center text-red-400 hover:text-red-300 transition-all duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <span className="text-purple-300 text-sm font-medium">Arrival Time</span>
                        <div className="text-white font-semibold">{new Date(entry.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div>
                        <span className="text-purple-300 text-sm font-medium">Est. Wait</span>
                        <div className="text-white font-semibold">{entry.estimatedWaitTime} min</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-purple-200/90 mb-2">Status</label>
                        <select
                          value={entry.status}
                          onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                        >
                          <option value="waiting" className="bg-slate-800">⏳ Waiting</option>
                          <option value="with_doctor" className="bg-slate-800">👨‍⚕️ With Doctor</option>
                          <option value="completed" className="bg-slate-800">✅ Completed</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-purple-200/90 mb-2">Priority</label>
                        <select
                          value={entry.priority}
                          onChange={async (e) => {
                            try {
                              const updateData: UpdateQueueEntryDto = { priority: e.target.value as 'normal' | 'urgent' };
                              await updateQueueEntryStatus(entry.id, updateData);
                              showSuccess('Priority updated');
                              refetch();
                            } catch {
                              showError('Failed to update priority');
                            }
                          }}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                        >
                          <option value="normal" className="bg-slate-800">Normal</option>
                          <option value="urgent" className="bg-slate-800">🚨 Urgent</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                        <span className="text-2xl font-bold text-white">{entry.queueNumber}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-white text-xl">
                            {highlightMatch(entry.patient?.name || 'N/A', debouncedSearchTerm)}
                          </span>
                          {entry.priority === 'urgent' && (
                            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            entry.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                            entry.status === 'with_doctor' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            'bg-green-500/20 text-green-300 border border-green-500/30'
                          }`}>
                            {entry.status === 'waiting' ? '⏳ Waiting' :
                             entry.status === 'with_doctor' ? '👨‍⚕️ With Doctor' :
                             '✅ Completed'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-8">
                      <div className="text-right">
                        <div className="text-purple-300 text-sm font-medium">Arrival Time</div>
                        <div className="text-white font-semibold">{new Date(entry.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-purple-300 text-sm font-medium mt-1">Est. Wait</div>
                        <div className="text-white font-semibold">{entry.estimatedWaitTime} min</div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <select
                          value={entry.status}
                          onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                        >
                          <option value="waiting" className="bg-slate-800">Waiting</option>
                          <option value="with_doctor" className="bg-slate-800">With Doctor</option>
                          <option value="completed" className="bg-slate-800">Completed</option>
                        </select>
                        
                        <select
                          value={entry.priority}
                          onChange={async (e) => {
                            try {
                              const updateData: UpdateQueueEntryDto = { priority: e.target.value as 'normal' | 'urgent' };
                              await updateQueueEntryStatus(entry.id, updateData);
                              showSuccess('Priority updated');
                              refetch();
                            } catch {
                              showError('Failed to update priority');
                            }
                          }}
                          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                        >
                          <option value="normal" className="bg-slate-800">Normal</option>
                          <option value="urgent" className="bg-slate-800">Urgent</option>
                        </select>
                        
                        <button
                          onClick={() => handleRemovePatient(entry.id)}
                          className="w-10 h-10 bg-red-500/20 hover:bg-red-500/30 rounded-xl flex items-center justify-center text-red-400 hover:text-red-300 transition-all duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add New Patient Button */}
          <LoadingButton
            isLoading={addPatientMutation.isLoading || globalIsLoading('queue')}
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
              <span>Add New Patient to Queue</span>
            </div>
          </LoadingButton>

          <SearchablePagination
            pagination={{
              page,
              pageSize,
              total: totalQueue,
              totalPages: Math.ceil(totalQueue / pageSize),
              pageNumbers: Array.from({ length: Math.min(5, Math.ceil(totalQueue / pageSize)) }, (_, i) => i + 1),
              nextPage: () => { setPage(p => p + 1); refetch(); },
              prevPage: () => { setPage(p => p - 1); refetch(); },
              goToPage: (p: number) => { setPage(p); refetch(); },
              setPageSize: (size: number) => { setPageSize(size); setPage(1); refetch(); },
              canNextPage: page < Math.ceil(totalQueue / pageSize),
              canPrevPage: page > 1
            }}
            totalResults={totalQueue}
            filteredResults={resultCount}
            isFiltered={isFiltered}
            searchTerm={debouncedSearchTerm}
            showResultSummary={true}
          />

          {/* Add Patient Modal */}
          <Modal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Add Patient to Queue"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-purple-200/90 mb-2">Select Existing Patient</label>
                <div className="relative">
                  <select
                    value={selectedExistingPatientId}
                    onChange={(e) => setSelectedExistingPatientId(e.target.value)}
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
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-purple-300/60">Or create new patient</span>
                </div>
              </div>

              <div>
                <label htmlFor="patientName" className="block text-sm font-medium text-purple-200/90 mb-2">
                  Patient Name
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
                <label htmlFor="prioritySelect" className="block text-sm font-medium text-purple-200/90 mb-2">Priority Level</label>
                <div className="relative">
                  <select
                    id="prioritySelect"
                    value={priorityValue}
                    onChange={(e) => setPriorityValue(e.target.value as 'normal' | 'urgent')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                  >
                    <option value="normal" className="bg-slate-800">Normal Priority</option>
                    <option value="urgent" className="bg-slate-800">🚨 Urgent Priority</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-purple-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
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
                  isLoading={addPatientMutation.isLoading}
                  onClick={handleAddPatient}
                  disabled={!(newPatientName.trim() || selectedExistingPatientId)}
                  className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    !(newPatientName.trim() || selectedExistingPatientId)
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg shadow-purple-500/25'
                  }`}
                  loadingText="Adding..."
                >
                  Add to Queue
                </LoadingButton>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default QueueManagementPage;