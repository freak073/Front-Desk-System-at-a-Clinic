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
import { updateAppointment, fetchDoctors, fetchPatients, createAppointment, cancelAppointment, fetchDoctorById, searchAppointmentsAdvanced, updateDoctorSchedule } from './appointments.service';
import { useAppointmentUpdates } from '../../hooks/useRealTimeUpdates';
import { useQueryClient } from 'react-query';
import { logMetric } from '../../../lib/metrics';
import PaginationControls from '../../components/PaginationControls';
// removed duplicate import & unused apiService
import { Doctor, Patient, CreateAppointmentDto, Appointment } from '../../../types';
import { highlightMatch } from '../../components/highlight';
import FilterBar from '../../components/FilterBar';
import DoctorScheduleForm from '../../components/DoctorScheduleForm';

const AppointmentsPage = () => {
  const { user, loading: authLoading } = useAuth(); // ensure auth context utilized
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
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
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

  // Fetch doctors and patients after auth ready
  React.useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [doctorsData, patientsData] = await Promise.all([
          fetchDoctors(),
          fetchPatients()
        ]);
        if (cancelled) return;
        setDoctors(doctorsData);
        setPatients(patientsData);
        console.debug('[AppointmentsPage] doctors:', doctorsData.length, 'patients:', patientsData.length);
        if (patientsData.length === 0) {
          setTimeout(async () => {
            if (cancelled) return;
            const retryPatients = await fetchPatients();
            console.debug('[AppointmentsPage] patients retry length:', retryPatients.length);
            if (retryPatients.length) setPatients(retryPatients);
          }, 600);
        }
      } catch (err) {
        if (!cancelled) console.error('[AppointmentsPage] Error fetching doctors/patients:', err);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [authLoading, user]);

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

  const applyAppointmentStatus = async (appointmentId: number, newStatus: Appointment['status'], currentStatus: Appointment['status']) => {
    setLocalAppointments(list => list.map(a => a.id === appointmentId ? { ...a, status: newStatus } : a));
    try {
      await updateAppointment(appointmentId, { status: newStatus });
      queryClient.invalidateQueries('appointments');
    } catch (err) {
      console.error('[AppointmentsPage] status update failed', err);
      setLocalAppointments(list => list.map(a => a.id === appointmentId ? { ...a, status: currentStatus } : a));
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="p-8">
        <div className="grid gap-4">
          {[...Array(8)].map((_,i)=>{
            const key = `appt-skel-${i}`; // stable within render, acceptable for static skeletons
            return <div key={key} className="h-20 bg-gray-100 animate-pulse rounded" />;
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-900 text-white">
      <div className="p-4 sm:p-6 md:p-8 text-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-100">Appointment Management</h1>
          <button
            onClick={() => setShowNewAppointmentModal(true)}
            className="btn-primary"
          >
            + New Appointment
          </button>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="mb-6">
            <div className="bg-surface-800 border border-gray-700 shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <button className="text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-lg font-semibold text-white">December 2024</h2>
                <button className="text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <MonthlyCalendar
                appointments={filteredAppointments}
                month={new Date().getMonth()}
                year={new Date().getFullYear()}
                onSelectAppointment={(a)=> setRescheduleAppointment(a)}
              />
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-surface-800 border border-gray-700 shadow rounded-lg p-4 mb-6 ">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-1">Search</label>
              <input
                id="search"
                type="text"
                placeholder="Search patient or doctor name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status</label>
              <select 
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="booked">Booked</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
            <div>
              <label htmlFor="doctor" className="block text-sm font-medium text-gray-300 mb-1">Doctor</label>
              <select 
                id="doctor"
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              >
                <option value="all">All Doctors</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id.toString()}>{doctor.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDoctorFilter('all');
                  setDateFilter('');
                }}
                className="w-full px-4 py-2 bg-surface-700 text-gray-200 rounded-md hover:bg-surface-600 transition focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                Clear Filters
              </button>
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Date</label>
              <input
                id="date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-500 ${
                viewMode === 'list'
                  ? 'bg-accent-600 text-white hover:bg-accent-500'
                  : 'bg-surface-700 text-gray-300 hover:bg-surface-600'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-500 ${
                viewMode === 'calendar'
                  ? 'bg-accent-600 text-white hover:bg-accent-500'
                  : 'bg-surface-700 text-gray-300 hover:bg-surface-600'
              }`}
            >
              Calendar View
            </button>
          </div>
        </div>

        {/* Appointments List */}
        {viewMode === 'list' ? (
          <div className="space-y-4 mb-6">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchTerm || statusFilter !== 'all' || dateFilter
                  ? 'No appointments match your search criteria'
                  : 'No appointments found'}
              </div>
            ) : (
              filteredAppointments.map((appointment: any) => (
                <div key={appointment.id} className="bg-surface-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium text-gray-100">
                          {highlightMatch(appointment.patient?.name || 'N/A', debouncedSearchTerm)}
                        </div>
                        <div className="text-sm text-gray-400">
                          👨‍⚕️ {highlightMatch(appointment.doctor?.name || 'N/A', debouncedSearchTerm)}
                        </div>
                        <div className="text-sm text-gray-400">
                          🕐 {new Date(appointment.appointmentDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <select
                          value={appointment.status}
                          onChange={(e)=> applyAppointmentStatus(appointment.id, e.target.value as Appointment['status'], appointment.status)}
                          className="px-3 py-1 text-sm border border-gray-600 rounded bg-surface-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                        >
                          <option value="booked">Booked</option>
                          <option value="completed">Completed</option>
                          <option value="canceled">Canceled</option>
                        </select>
                        
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'booked' ? 'bg-blue-600/20 text-blue-300' :
                          appointment.status === 'completed' ? 'bg-green-600/20 text-green-300' :
                          'bg-red-600/20 text-red-300'
                        }`}>
                          {appointment.status === 'booked' ? 'Booked' :
                           appointment.status === 'completed' ? 'Completed' :
                           'Canceled'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setDetailAppointment(appointment)}
                          className="text-gray-400 hover:text-gray-200 text-sm"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => setRescheduleAppointment(appointment)}
                          className="text-accent-400 hover:text-accent-300 text-sm"
                          disabled={appointment.status !== 'booked'}
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          disabled={appointment.status === 'canceled' || appointment.status === 'completed'}
                          className={`text-red-400 hover:text-red-300 text-sm ${
                            (appointment.status === 'canceled' || appointment.status === 'completed')
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-surface-900 border border-gray-700 shadow rounded-lg p-4">
            <MonthlyCalendar
              appointments={filteredAppointments}
              month={new Date().getMonth()}
              year={new Date().getFullYear()}
              onSelectAppointment={(a)=> setRescheduleAppointment(a)}
            />
          </div>
        )}
        {/* Schedule New Appointment Button */}
        <button
          onClick={() => setShowNewAppointmentModal(true)}
          className="w-full py-3 px-4 bg-surface-700 hover:bg-surface-600 text-gray-200 rounded-lg border border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          Schedule New Appointment
        </button>

        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(p) => { setPage(p); refetch(); }}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); refetch(); }}
        />

        {/* Available Doctors Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-100">Available Doctors</h2>
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
    </div>
  );
};

export default AppointmentsPage;
