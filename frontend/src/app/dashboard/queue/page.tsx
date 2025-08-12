'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { useAuth } from '../../../context/AuthContext';
import { useQueueUpdates, useNotifications } from '../../hooks/useRealTimeUpdates';
import { useGlobalState } from '../../../context/GlobalStateContext';
import { useOptimisticMutation } from '../../hooks/useOptimisticMutation';
import { logMetric } from '../../../lib/metrics';
import { PageLoading, ErrorState, EmptyState, LoadingButton } from '../../components/LoadingStates';
import { SyncStatusIndicator } from '../../components/SyncStatusIndicator';
import VirtualizedList from '../../components/VirtualizedList';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { addToQueue, updateQueueEntryStatus, removeFromQueue, fetchPatients, searchPatients } from './queue.service';
import { CreateQueueEntryDto, UpdateQueueEntryDto } from '../../../types';
import PaginationControls from '../../components/PaginationControls';
import { apiService } from '../../../lib/api';
import { highlightMatch } from '../../components/highlight';
import FilterBar from '../../components/FilterBar';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [newPatientName, setNewPatientName] = useState('');
  const [selectedExistingPatientId, setSelectedExistingPatientId] = useState<string>('');
  const [availablePatients, setAvailablePatients] = useState<any[]>([]);
  const [priorityValue, setPriorityValue] = useState<'normal' | 'urgent'>('normal');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

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

  // Filter queue entries based on search and filter
  const filteredQueueEntries = localQueue.filter((entry: any) => {
  const matchesSearch = !debouncedSearchTerm || entry.patient?.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || entry.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
    <div className="p-4 sm:p-6 md:p-8 text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-100">Queue Management</h1>
          <SyncStatusIndicator dataType="queue" showLabel />
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Filter:</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="waiting">Waiting</option>
              <option value="with_doctor">With Doctor</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search patients"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 pr-10 border border-gray-600 rounded-lg bg-surface-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-4 mb-6">
        {filteredQueueEntries.length === 0 ? (
          <EmptyState
            title={searchTerm || statusFilter !== 'all' ? 'No matches found' : 'Queue is empty'}
            message={searchTerm || statusFilter !== 'all' 
              ? 'No patients match your search criteria. Try adjusting your filters.'
              : 'No patients are currently in the queue. Add a patient to get started.'
            }
            actionLabel={!(searchTerm || statusFilter !== 'all') ? 'Add Patient' : undefined}
            onAction={!(searchTerm || statusFilter !== 'all') ? () => setShowAddModal(true) : undefined}
          />
        ) : (
          filteredQueueEntries.map((entry: any) => (
            <div key={entry.id} className="bg-surface-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-gray-100">{entry.queueNumber}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-100">
                          {highlightMatch(entry.patient?.name || 'N/A', debouncedSearchTerm)}
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
                      className="px-3 py-1 text-sm border border-gray-600 rounded bg-surface-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
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
                      className="px-3 py-1 text-sm border border-gray-600 rounded bg-surface-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    
                    <button
                      onClick={() => handleRemovePatient(entry.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/10 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        className="w-full py-3 px-4 bg-surface-700 hover:bg-surface-600 text-gray-200 rounded-lg border border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
        loadingText="Processing..."
      >
        Add New Patient to Queue
      </LoadingButton>

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={totalQueue}
        onPageChange={(p) => { setPage(p); refetch(); }}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); refetch(); }}
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
