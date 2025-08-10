'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Modal from '../../components/Modal';
import AppointmentRescheduleForm from '../components/AppointmentRescheduleForm';
import dynamic from 'next/dynamic';
const MonthlyCalendar = dynamic(()=> import('../components/MonthlyCalendar'), { ssr:false });
import AppointmentForm from '../../components/AppointmentForm';
import DoctorCard from '../../components/DoctorCard';
import StatusBadge from '../../components/StatusBadge';
import VirtualizedList from '../../components/VirtualizedList';
import { updateAppointment } from './appointments.service';
import { useAppointmentUpdates } from '../../hooks/useRealTimeUpdates';
import { useQueryClient } from 'react-query';
import { logMetric } from '../../../lib/metrics';
import PaginationControls from '../../components/PaginationControls';
import { fetchDoctors, fetchPatients, createAppointment, cancelAppointment, fetchDoctorById, searchAppointmentsAdvanced, updateDoctorSchedule } from './appointments.service';
import { apiService } from '../../../lib/api';
import { Doctor, Patient, CreateAppointmentDto, Appointment } from '../../../types';
import { highlightMatch } from '../../components/highlight';
import FilterBar from '../../components/FilterBar';
import DoctorScheduleForm from '../../components/DoctorScheduleForm';

const AppointmentsPage = () => {
  useAuth(); // ensure auth context utilized without unused variable
  React.useEffect(()=>{ const start = performance.now(); return () => { logMetric({ name:'appointments_page_time', duration: performance.now()-start, timestamp: Date.now() }); }; }, []);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data: appointmentsData, isLoading, refetch } = useAppointmentUpdates(page, pageSize);
  const queryClient = useQueryClient();
  const appointmentsRaw: any = appointmentsData?.data;
  let appointments: any[] = [];
  if (Array.isArray(appointmentsRaw?.data)) {
    appointments = appointmentsRaw.data;
  } else if (Array.isArray(appointmentsRaw)) {
    appointments = appointmentsRaw;
  }
  // Local copy to enable optimistic UI updates without mutating source objects directly
  const [localAppointments, setLocalAppointments] = useState<Appointment[]>([] as any);
  // Guarded effect to prevent infinite render loops when upstream wrapper identities churn
  React.useEffect(() => {
    setLocalAppointments(prev => {
      if (prev.length === appointments.length && prev.every((p, i) => p.id === appointments[i].id && p.status === appointments[i].status)) {
        return prev; // no structural/status change
      }
      return appointments.map(a => ({ ...a }));
    });
  }, [appointments.map(a => a.id + ':' + a.status).join('|')]);
  const total = appointmentsRaw?.meta?.total || appointments.length;
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showDoctorScheduleModal, setShowDoctorScheduleModal] = useState(false);
  const [doctorScheduleDirty, setDoctorScheduleDirty] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<any | null>(null);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search appointments when search term or filters change
  React.useEffect(() => {
    const searchAppointmentsDebounced = async () => {
      if (debouncedSearchTerm || statusFilter !== 'all' || doctorFilter !== 'all' || dateFilter) {
        try {
          const found = await searchAppointmentsAdvanced(
            debouncedSearchTerm,
            statusFilter !== 'all' ? statusFilter : undefined,
            dateFilter || undefined,
            dateFilter || undefined
          );
          if (found) setSearchResults(found);
        } catch (err) {
          console.error('Error searching appointments:', err);
        }
      } else {
        setSearchResults(null);
        refetch();
      }
    };
    searchAppointmentsDebounced();
  }, [debouncedSearchTerm, statusFilter, doctorFilter, dateFilter]);

  // Fetch doctors and patients
  React.useEffect(() => {
    const load = async () => {
      try {
        const [doctorsData, patientsData] = await Promise.all([
          fetchDoctors(),
          fetchPatients()
        ]);
        setDoctors(doctorsData);
        setPatients(patientsData);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    load();
  }, []);

  // Filter appointments based on search and filters
  const sourceAppointments = searchResults ?? localAppointments;
  const filteredAppointments = sourceAppointments.filter((appointment: any) => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    const matchesSearch = !debouncedSearchTerm ||
      appointment.patient?.name?.toLowerCase().includes(searchLower) ||
      appointment.doctor?.name?.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    const matchesDoctor = doctorFilter === 'all' || appointment.doctorId.toString() === doctorFilter;
    
    const matchesDate = !dateFilter ||
      new Date(appointment.appointmentDatetime).toDateString() === new Date(dateFilter).toDateString();
    
    return matchesSearch && matchesStatus && matchesDoctor && matchesDate;
  });

  const handleCreateAppointment = async (data: CreateAppointmentDto) => {
    try {
      const newAppointment = await createAppointment(data);
      if (newAppointment) {
        setShowNewAppointmentModal(false);
        refetch();
      }
    } catch (err) {
      console.error('Error creating appointment:', err);
    }
  };

  const handleCancelAppointment = async (id: number) => {
    try {
      const success = await cancelAppointment(id);
      if (success) {
        refetch();
      }
    } catch (err) {
      console.error('Error canceling appointment:', err);
    }
  };

  const handleViewDoctorSchedule = async (doctorId: number) => {
    try {
      const doctor = await fetchDoctorById(doctorId);
      if (doctor) {
        setSelectedDoctor(doctor);
        setShowDoctorScheduleModal(true);
      }
    } catch (err) {
      console.error('Error fetching doctor:', err);
    }
  };

  const handleEditDoctor = (doctorId: number) => {
    // Implementation for editing doctor
    console.log('Edit doctor:', doctorId);
  };

  const handleDeleteDoctor = (doctorId: number) => {
    // Implementation for deleting doctor
    console.log('Delete doctor:', doctorId);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid gap-4">
          {Array.from({length:8}).map((_,i)=>(
            <div key={i} className="h-20 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Appointments Management</h1>
        <button 
          onClick={() => setShowNewAppointmentModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          + New Appointment
        </button>
      </div>

      <FilterBar
        search={{ id: 'search', label: 'Search', placeholder: 'Search patient or doctor name', value: searchTerm, onChange: setSearchTerm }}
        selects={[
          { id: 'status', label: 'Status', value: statusFilter, onChange: setStatusFilter, options: [
            { value:'all', label:'All Statuses' },
            { value:'booked', label:'Booked' },
            { value:'completed', label:'Completed' },
            { value:'canceled', label:'Canceled' }
          ]},
          { id: 'doctor', label: 'Doctor', value: doctorFilter, onChange: setDoctorFilter, options: [
            { value:'all', label:'All Doctors' },
            ...doctors.map(d => ({ value: String(d.id), label: d.name }))
          ]}
        ]}
        onClear={() => { setSearchTerm(''); setStatusFilter('all'); setDoctorFilter('all'); setDateFilter(''); }}
      >
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            id="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </FilterBar>

      {/* View Toggle */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md ${
              viewMode === 'list' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-md ${
              viewMode === 'calendar' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {/* Appointments List */}
  {viewMode === 'list' ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="responsive-table">
    <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Appointments table">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:table-cell mobile-hidden">
                    Doctor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
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
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      {searchTerm || statusFilter !== 'all' || dateFilter
                        ? 'No appointments match your search criteria'
                        : 'No appointments found'}
                    </td>
                  </tr>
                ) : (
                  <VirtualizedList
                    items={filteredAppointments}
                    itemHeight={72}
                    height={Math.min(600, filteredAppointments.length * 72)}
                    className="divide-y divide-gray-200"
                    renderItem={(appointment: any) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {highlightMatch(appointment.patient?.name || 'N/A', debouncedSearchTerm)}
                        </div>
                        <div className="sm:hidden text-xs text-gray-500">
                          {highlightMatch(appointment.doctor?.name || 'N/A', debouncedSearchTerm)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap mobile-hidden">
                        <div className="text-sm text-gray-900">
                          {highlightMatch(appointment.doctor?.name || 'N/A', debouncedSearchTerm)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.doctor?.specialization || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(appointment.appointmentDatetime).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(appointment.appointmentDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span data-testid={`appointment-status-badge-${appointment.id}`} data-status={appointment.status} aria-label={`Status badge for appointment ${appointment.id}`}>
                            <StatusBadge status={appointment.status} />
                          </span>
                          <select
                            aria-label={`Change status for appointment ${appointment.id}`}
                            data-testid={`appointment-status-select-${appointment.id}`}
                            value={appointment.status}
                            onChange={async (e)=>{
                              const newStatus = e.target.value as 'booked' | 'completed' | 'canceled';
                              const prev = appointment.status;
                              // optimistic UI via state update
                              setLocalAppointments(prevList => prevList.map(a => a.id === appointment.id ? { ...a, status: newStatus } : a));
                              try {
                                await updateAppointment(appointment.id, { status: newStatus });
                                queryClient.invalidateQueries('appointments');
                              } catch {
                                // revert on error
                                setLocalAppointments(prevList => prevList.map(a => a.id === appointment.id ? { ...a, status: prev } : a));
                              }
                            }}
                            className="text-xs border-gray-300 rounded"
                          >
                            <option value="booked">Booked</option>
                            <option value="completed">Completed</option>
                            <option value="canceled">Canceled</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-3">
                          <button
                            onClick={() => setDetailAppointment(appointment)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => setRescheduleAppointment(appointment)}
                            className="text-blue-600 hover:text-blue-900"
                            disabled={appointment.status !== 'booked'}
                          >
      {/* Appointment Detail Modal */}
      <Modal
        isOpen={!!detailAppointment}
        onClose={() => setDetailAppointment(null)}
        title={detailAppointment ? `Appointment #${detailAppointment.id}` : 'Appointment'}
        size="md"
      >
        {detailAppointment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Patient</div>
                <div className="font-medium">{detailAppointment.patient?.name}</div>
              </div>
              <div>
                <div className="text-gray-500">Doctor</div>
                <div className="font-medium">{detailAppointment.doctor?.name}</div>
              </div>
              <div>
                <div className="text-gray-500">Date</div>
                <div className="font-medium">{new Date(detailAppointment.appointmentDatetime).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-gray-500">Time</div>
                <div className="font-medium">{new Date(detailAppointment.appointmentDatetime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
              </div>
              <div>
                <div className="text-gray-500">Status</div>
                <div className="font-medium capitalize">{detailAppointment.status}</div>
              </div>
              {detailAppointment.notes && (
                <div className="col-span-2">
                  <div className="text-gray-500">Notes</div>
                  <div className="font-medium whitespace-pre-wrap">{detailAppointment.notes}</div>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end pt-2">
              {detailAppointment.status === 'booked' && (
                <button
                  onClick={async () => {
                    if (!window.confirm('Cancel this appointment?')) return;
                    await handleCancelAppointment(detailAppointment.id);
                    setDetailAppointment(null);
                  }}
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => setRescheduleAppointment(detailAppointment)}
                disabled={detailAppointment.status !== 'booked'}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                Reschedule
              </button>
              <button
                onClick={() => setDetailAppointment(null)}
                className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={appointment.status === 'canceled' || appointment.status === 'completed'}
                            className={`text-red-600 hover:text-red-900 ${
                              (appointment.status === 'canceled' || appointment.status === 'completed')
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            }`}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                    )}
                  />
                )}
              </tbody>
            </table>
      {/* Reschedule Modal */}
      <Modal
        isOpen={!!rescheduleAppointment}
        onClose={() => setRescheduleAppointment(null)}
        title={rescheduleAppointment ? `Reschedule #${rescheduleAppointment.id}` : 'Reschedule'}
        size="md"
      >
        {rescheduleAppointment && (
          <AppointmentRescheduleForm
            appointment={rescheduleAppointment}
            onSuccess={() => { setRescheduleAppointment(null); refetch(); }}
            onCancel={() => setRescheduleAppointment(null)}
          />
        )}
      </Modal>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-4">
          <MonthlyCalendar
            appointments={filteredAppointments}
            month={new Date().getMonth()}
            year={new Date().getFullYear()}
            onSelectAppointment={(a)=> setRescheduleAppointment(a)}
          />
        </div>
      )}

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(p) => { setPage(p); refetch(); }}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); refetch(); }}
      />

      {/* Available Doctors Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Available Doctors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.filter(d => d.status === 'available').map(doctor => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onEdit={handleEditDoctor}
              onDelete={handleDeleteDoctor}
              onViewSchedule={handleViewDoctorSchedule}
            />
          ))}
        </div>
      </div>

      {/* New Appointment Modal */}
      <Modal
        isOpen={showNewAppointmentModal}
        onClose={() => setShowNewAppointmentModal(false)}
        title="Schedule New Appointment"
        size="lg"
      >
        <AppointmentForm
          doctors={doctors}
          patients={patients}
          onSubmit={handleCreateAppointment}
          onCancel={() => setShowNewAppointmentModal(false)}
        />
      </Modal>

      {/* Doctor Schedule Modal */}
      <Modal
        isOpen={showDoctorScheduleModal && !!selectedDoctor}
        onClose={() => {
          setShowDoctorScheduleModal(false);
          setSelectedDoctor(null);
        }}
        title={`${selectedDoctor?.name} - Schedule`}
        size="md"
        confirmOnClose={doctorScheduleDirty}
        onBeforeClose={() => { if (doctorScheduleDirty) { return window.confirm('Discard unsaved schedule changes?') || false; } }}
      >
        {selectedDoctor && (
          <DoctorScheduleForm
            doctor={selectedDoctor as any}
            onDirtyChange={setDoctorScheduleDirty}
            onCancel={() => { setShowDoctorScheduleModal(false); setSelectedDoctor(null); }}
            onSave={async (schedule) => {
              const doctorId = selectedDoctor.id;
              // optimistic update
              setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, availabilitySchedule: schedule } : d));
              setDoctorScheduleDirty(false);
              setShowDoctorScheduleModal(false);
              try {
                await updateDoctorSchedule(doctorId, schedule);
                queryClient.invalidateQueries('doctors');
              } catch (e) {
                console.error('Failed to save schedule', e);
                // rollback fetch
                const fresh = await fetchDoctorById(doctorId);
                if (fresh) {
                  setDoctors(prev => prev.map(d => d.id === doctorId ? fresh : d));
                }
              }
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default AppointmentsPage;
