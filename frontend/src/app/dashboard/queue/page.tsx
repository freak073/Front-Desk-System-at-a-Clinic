'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { useAuth } from '../../../context/AuthContext';
import { useQueueUpdates, useNotifications } from '../../hooks/useRealTimeUpdates';
import { logMetric } from '../../../lib/metrics';
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
  useAuth();
  React.useEffect(()=> { const t = performance.now(); return () => { logMetric({ name:'queue_page_time', duration: performance.now()-t, timestamp: Date.now() }); }; }, []);
  const { showSuccess, showError } = useNotifications();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data: queueData, isLoading, isError, error, refetch } = useQueueUpdates(page, pageSize);
  const queryClient = useQueryClient();
  const queueEntriesRaw: any = queueData?.data;
  let fetchedQueue: any[] = [];
  if (Array.isArray(queueEntriesRaw?.data)) {
    fetchedQueue = queueEntriesRaw.data;
  } else if (Array.isArray(queueEntriesRaw)) {
    fetchedQueue = queueEntriesRaw;
  }
  const [localQueue, setLocalQueue] = useState<any[]>([]);
  // sync local queue when fresh data arrives (length or ids change)
  useEffect(() => {
    if (fetchedQueue.length) {
      setLocalQueue(fetchedQueue.map(e => ({ ...e })));
    }
  }, [fetchedQueue.length]);
  const totalQueue = queueEntriesRaw?.meta?.total || localQueue.length;
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

  // Search patients when search term changes
  useEffect(() => {
    const searchPatientsDebounced = async () => {
      if (debouncedSearchTerm) {
        try {
          const patients = await searchPatients(debouncedSearchTerm);
          setAvailablePatients(patients);
        } catch (err) {
          console.error('Error searching patients:', err);
        }
      } else {
        // Fetch all patients when search term is cleared
        try {
          const patients = await fetchPatients();
          setAvailablePatients(patients);
        } catch (err) {
          console.error('Error fetching patients:', err);
        }
      }
    };

    searchPatientsDebounced();
  }, [debouncedSearchTerm]);

  // Filter queue entries based on search and filter
  const filteredQueueEntries = localQueue.filter((entry: any) => {
  const matchesSearch = !debouncedSearchTerm || entry.patient?.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || entry.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleAddPatient = async () => {
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
      const newEntry: CreateQueueEntryDto = { patientId, priority: priorityValue };
      const result = await addToQueue(newEntry);
      if (result) {
        setNewPatientName('');
        setSelectedExistingPatientId('');
        setPriorityValue('normal');
        setShowAddModal(false);
        showSuccess('Patient added to queue successfully');
        refetch();
      }
    } catch (err) {
      console.error('Error adding patient to queue:', err);
      showError('Failed to add patient to queue');
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
      // rollback
      setLocalQueue(prevEntries);
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

  const isInitialLoading = isLoading && localQueue.length === 0;
  if (isInitialLoading) {
    return (
      <div className="p-8">
        <div className="grid gap-4">
          {Array.from({length:6}).map((_,i)=>(
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800">Error Loading Queue</h3>
          <p className="mt-2 text-red-600">{error?.message || 'Failed to load queue data'}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Queue Management</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          + Add Patient to Queue
        </button>
      </div>

      <FilterBar
        search={{ id: 'search', label: 'Search Patient', placeholder: 'Search by patient name', value: searchTerm, onChange: setSearchTerm }}
        selects={[
          { id: 'status', label: 'Status', value: statusFilter, onChange: setStatusFilter, options: [
            { value:'all', label:'All Statuses' },
            { value:'waiting', label:'Waiting' },
            { value:'with_doctor', label:'With Doctor' },
            { value:'completed', label:'Completed' }
          ]},
          { id: 'priority', label: 'Priority', value: priorityFilter, onChange: setPriorityFilter, options: [
            { value:'all', label:'All Priorities' },
            { value:'normal', label:'Normal' },
            { value:'urgent', label:'Urgent' }
          ]}
        ]}
        onClear={() => { setSearchTerm(''); setStatusFilter('all'); setPriorityFilter('all'); }}
      />

      {/* Queue List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="responsive-table">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Queue #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:table-cell mobile-hidden">
                  Arrival Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:table-cell mobile-hidden">
                  Est. Wait
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQueueEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all'
                      ? 'No patients match your search criteria'
                      : 'No patients in queue'}
                  </td>
                </tr>
              ) : (
                <VirtualizedList
                  items={filteredQueueEntries}
                  itemHeight={70}
                  height={Math.min(560, filteredQueueEntries.length * 70)}
                  className="divide-y divide-gray-200"
                  renderItem={(entry: any) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.queueNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {highlightMatch(entry.patient?.name || 'N/A', debouncedSearchTerm)}
                      <div className="sm:hidden text-xs text-gray-500">
                        {new Date(entry.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({entry.estimatedWaitTime} min)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 mobile-hidden">
                      {new Date(entry.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 mobile-hidden">
                      {entry.estimatedWaitTime} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.priority === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {entry.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <div className="flex flex-col gap-1">
                          <select
                            aria-label="Update status"
                            value={entry.status}
                            onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                            className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="waiting">Waiting</option>
                            <option value="with_doctor">With Doctor</option>
                            <option value="completed">Completed</option>
                          </select>
                          <select
                            aria-label="Update priority"
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
                            className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="normal">Normal</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                        <button
                          onClick={() => handleRemovePatient(entry.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                  )}
                />
              )}
            </tbody>
          </table>
        </div>
      </div>

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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPatient}
              disabled={!(newPatientName.trim() || selectedExistingPatientId)}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                !(newPatientName.trim() || selectedExistingPatientId)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Add to Queue
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QueueManagementPage;
