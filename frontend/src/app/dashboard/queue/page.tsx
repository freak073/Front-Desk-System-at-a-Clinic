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
    <div className="responsive-container text-gray-200">
      <div className="flex flex-col space-y-4 mb-6 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div className="flex items-center responsive-space-x-4">
          <h1 className="responsive-text-2xl font-semibold text-gray-100">Queue Management</h1>
          <SyncStatusIndicator dataType="queue" showLabel />
        </div>
      </div>

      {/* Enhanced Filters */}
      <FilterBar
        search={{
          placeholder: 'Search patients by name...',
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
            id: 'priority',
            label: 'Priority',
            value: filters.priority || 'all',
            onChange: (value) => setFilter('priority', value),
            options: priorityOptions,
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

      {/* Queue List with Enhanced Search Results */}
      <SearchResults
        data={filteredQueueEntries}
        searchTerm={debouncedSearchTerm}
        isFiltered={isFiltered}
        loading={isLoading}
        emptyStateTitle="Queue is empty"
        emptyStateMessage="No patients are currently in the queue. Add a patient to get started."
        noResultsTitle="No patients found"
        noResultsMessage="No patients match your search criteria. Try adjusting your filters or search terms."
        showResultCount={false}
        renderItem={(entry: any, index: number, searchTerm: string) => (
          <div key={entry.id} className="responsive-card">
            {/* Mobile Layout */}
            <div className="md:hidden space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xl font-bold text-gray-100 bg-accent-600 rounded-full w-8 h-8 flex items-center justify-center text-sm">
                    {entry.queueNumber}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-100 text-sm">
                        {highlightMatch(entry.patient?.name || 'N/A', searchTerm)}
                      </span>
                      {entry.priority === 'urgent' && (
                        <span className="inline-flex items-center">
                          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemovePatient(entry.id)}
                  className="touch-target text-red-400 hover:text-red-300 hover:bg-red-600/10 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Arrival:</span>
                  <div className="text-gray-200">{new Date(entry.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div>
                  <span className="text-gray-400">Est. Wait:</span>
                  <div className="text-gray-200">{entry.estimatedWaitTime} min</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Status</label>
                  <select
                    value={entry.status}
                    onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                    className="touch-input w-full bg-surface-700 border-gray-600 text-gray-200"
                  >
                    <option value="waiting">⏳ Waiting</option>
                    <option value="with_doctor">👨‍⚕️ With Doctor</option>
                    <option value="completed">✅ Completed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Priority</label>
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
                    className="touch-input w-full bg-surface-700 border-gray-600 text-gray-200"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">🚨 Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold text-gray-100">{entry.queueNumber}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-100">
                        {highlightMatch(entry.patient?.name || 'N/A', searchTerm)}
                      </span>
                      {entry.priority === 'urgent' && (
                        <span className="inline-flex items-center">
                          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        entry.status === 'waiting' ? 'bg-yellow-600/20 text-yellow-300' :
                        entry.status === 'with_doctor' ? 'bg-blue-600/20 text-blue-300' :
                        'bg-green-600/20 text-green-300'
                      }`}>
                        {entry.status === 'waiting' ? '⏳ Waiting' :
                         entry.status === 'with_doctor' ? '👨‍⚕️ With Doctor' :
                         '✅ Completed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-right text-sm">
                  <div className="text-gray-300">
                    <span className="font-medium">Arrival:</span> {new Date(entry.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-gray-400">
                    <span className="font-medium">Est. Wait:</span> {entry.estimatedWaitTime} min
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <select
                    value={entry.status}
                    onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-600 rounded bg-surface-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-500 desktop:hover:border-gray-500 desktop:hover:shadow-sm transition-all duration-200"
                  >
                    <option value="waiting">Waiting</option>
                    <option value="with_doctor">With Doctor</option>
                    <option value="completed">Completed</option>
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
                    className="px-3 py-1 text-sm border border-gray-600 rounded bg-surface-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-500 desktop:hover:border-gray-500 desktop:hover:shadow-sm transition-all duration-200"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  
                  <button
                    onClick={() => handleRemovePatient(entry.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/10 rounded desktop:hover:shadow-sm transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        className="space-y-4 mb-6"
      />

      {/* Add New Patient Button */}
      <LoadingButton
        isLoading={addPatientMutation.isLoading || globalIsLoading('queue')}
        onClick={() => setShowAddModal(true)}
        className="w-full touch-button bg-surface-700 hover:bg-surface-600 text-gray-200 rounded-lg border border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 desktop:hover:shadow-md desktop:hover:scale-105"
        loadingText="Processing..."
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add New Patient to Queue
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
        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-gray-700">Select Existing Patient</legend>
            <select
              value={selectedExistingPatientId}
              onChange={(e) => setSelectedExistingPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- None --</option>
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
            <label htmlFor="prioritySelect" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              id="prioritySelect"
              value={priorityValue}
              onChange={(e) => setPriorityValue(e.target.value as 'normal' | 'urgent')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-200 bg-surface-700 border border-gray-600 rounded-md hover:bg-surface-600 focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              Cancel
            </button>
            <LoadingButton
              isLoading={addPatientMutation.isLoading}
              onClick={handleAddPatient}
              disabled={!(newPatientName.trim() || selectedExistingPatientId)}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                !(newPatientName.trim() || selectedExistingPatientId)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              loadingText="Adding..."
            >
              Add to Queue
            </LoadingButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QueueManagementPage;
