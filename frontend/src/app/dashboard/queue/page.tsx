'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  fetchCurrentQueue, 
  addToQueue, 
  updateQueueEntryStatus, 
  removeFromQueue,
  fetchPatients,
  searchPatients
} from './queue.service';
import { QueueEntry, Patient } from '../../../types';

const QueuePage = () => {
  const { user } = useAuth();
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');

  // Load queue entries and patients
  useEffect(() => {
    loadQueueEntries();
    loadPatients();
  }, []);

  const loadQueueEntries = async () => {
    try {
      setLoading(true);
      const entries = await fetchCurrentQueue();
      setQueueEntries(entries);
      setError(null);
    } catch (err) {
      setError('Failed to load queue entries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const patientList = await fetchPatients();
      setPatients(patientList);
      setFilteredPatients(patientList);
    } catch (err) {
      console.error('Failed to load patients', err);
    }
  };

  // Handle search
  useEffect(() => {
    if (patientSearchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient => 
        patient.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        (patient.medicalRecordNumber && patient.medicalRecordNumber.toLowerCase().includes(patientSearchTerm.toLowerCase()))
      );
      setFilteredPatients(filtered);
    }
  }, [patientSearchTerm, patients]);

  // Filter queue entries by status and search term
  const filteredQueueEntries = queueEntries.filter(entry => {
    // Status filter
    if (statusFilter !== 'all' && entry.status !== statusFilter) {
      return false;
    }
    
    // Search filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      const patientName = entry.patient?.name?.toLowerCase() || '';
      const medicalRecordNumber = entry.patient?.medicalRecordNumber?.toLowerCase() || '';
      return patientName.includes(searchLower) || medicalRecordNumber.includes(searchLower);
    }
    
    return true;
  });

  // Handle adding patient to queue
  const handleAddToQueue = async () => {
    if (!selectedPatient) return;

    try {
      const newEntry = await addToQueue({
        patientId: selectedPatient.id,
        priority
      });

      if (newEntry) {
        setQueueEntries(prev => [...prev, newEntry]);
        setShowAddModal(false);
        setSelectedPatient(null);
        setPriority('normal');
        setPatientSearchTerm('');
      } else {
        setError('Failed to add patient to queue');
      }
    } catch (err) {
      setError('Failed to add patient to queue');
      console.error(err);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (id: number, newStatus: 'waiting' | 'with_doctor' | 'completed') => {
    try {
      const updatedEntry = await updateQueueEntryStatus(id, { status: newStatus });
      if (updatedEntry) {
        setQueueEntries(prev => 
          prev.map(entry => entry.id === id ? updatedEntry : entry)
        );
      }
    } catch (err) {
      setError('Failed to update queue entry status');
      console.error(err);
    }
  };

  // Handle removing patient from queue
  const handleRemoveFromQueue = async (id: number) => {
    try {
      const success = await removeFromQueue(id);
      if (success) {
        setQueueEntries(prev => prev.filter(entry => entry.id !== id));
      } else {
        setError('Failed to remove patient from queue');
      }
    } catch (err) {
      setError('Failed to remove patient from queue');
      console.error(err);
    }
  };

  // Format date for display
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Priority badge component
  const PriorityBadge = ({ priority }: { priority: 'normal' | 'urgent' }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      priority === 'urgent' 
        ? 'bg-red-100 text-red-800' 
        : 'bg-blue-100 text-blue-800'
    }`}>
      {priority === 'urgent' ? 'Urgent' : 'Normal'}
    </span>
  );

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusClasses = {
      waiting: 'bg-yellow-100 text-yellow-800',
      with_doctor: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    };

    const statusText = {
      waiting: 'Waiting',
      with_doctor: 'With Doctor',
      completed: 'Completed'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {statusText[status as keyof typeof statusText] || status}
      </span>
    );
  };

  if (!user) return null;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold">Queue Management</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition flex items-center gap-2 justify-center shadow-md hover:shadow-lg"
        >
          <span className="text-xl">+</span> Add to Queue
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search patients by name or medical record number..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="waiting">Waiting</option>
              <option value="with_doctor">With Doctor</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Queue List */}
      <div className="bg-white shadow rounded-lg">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading queue entries...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Queue #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arrival Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wait Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                      No patients in queue
                    </td>
                  </tr>
                ) : (
                  filteredQueueEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{entry.queueNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{entry.patient?.name}</div>
                        <div className="text-sm text-gray-500">{entry.patient?.medicalRecordNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={entry.priority as 'normal' | 'urgent'} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(entry.arrivalTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.estimatedWaitTime !== undefined ? `${entry.estimatedWaitTime} min` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={entry.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <select
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                            value={entry.status}
                            onChange={(e) => handleStatusUpdate(entry.id, e.target.value as any)}
                          >
                            <option value="waiting">Waiting</option>
                            <option value="with_doctor">With Doctor</option>
                            <option value="completed">Completed</option>
                          </select>
                          <button
                            onClick={() => handleRemoveFromQueue(entry.id)}
                            className="text-red-600 hover:text-red-900 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add to Queue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add Patient to Queue</h3>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Patient
                </label>
                <input
                  type="text"
                  placeholder="Search by name or medical record number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                />
              </div>

              {selectedPatient ? (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{selectedPatient.name}</p>
                      <p className="text-sm text-gray-500">{selectedPatient.medicalRecordNumber}</p>
                    </div>
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 max-h-48 overflow-y-auto">
                  {filteredPatients.slice(0, 5).map((patient) => (
                    <div
                      key={patient.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <p className="font-medium text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-500">{patient.medicalRecordNumber}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="priority"
                      value="normal"
                      checked={priority === 'normal'}
                      onChange={() => setPriority('normal')}
                    />
                    <span className="ml-2">Normal</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="priority"
                      value="urgent"
                      checked={priority === 'urgent'}
                      onChange={() => setPriority('urgent')}
                    />
                    <span className="ml-2">Urgent</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToQueue}
                disabled={!selectedPatient}
                className={`px-4 py-2 rounded-md text-white ${
                  selectedPatient
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Add to Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueuePage;
