'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useDoctorSearchAndFilter } from '../../hooks/useSearchAndFilter';
import Modal from '../../components/Modal';
import DoctorCard from '../../components/DoctorCard';
import FilterBar from '../../components/FilterBar';
import SearchResults from '../../components/SearchResults';
import {
  fetchDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  filterDoctors
} from '../appointments/appointments.service';
import { Doctor, CreateDoctorDto } from '../../../types';

const DoctorManagementPage = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewDoctorModal, setShowNewDoctorModal] = useState(false);
  const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Enhanced search and filter functionality
  const searchAndFilter = useDoctorSearchAndFilter(doctors);
  const {
    state: { searchTerm, debouncedSearchTerm, filters },
    actions: { setSearchTerm, setFilter, clearFilters, clearAll },
    filteredData: filteredDoctors,
    isFiltered,
    hasResults,
    resultCount
  } = searchAndFilter;

  // Search doctors when search term or filters change
  React.useEffect(() => {
    const searchDoctorsDebounced = async () => {
      if (debouncedSearchTerm || filters.status !== 'all' || filters.specialization !== 'all' || filters.location !== 'all') {
        try {
          const doctors = await filterDoctors(
            filters.specialization !== 'all' ? filters.specialization : undefined,
            filters.location !== 'all' ? filters.location : undefined,
            filters.status !== 'all' ? filters.status : undefined
          );
          setDoctors(doctors);
        } catch (err) {
          console.error('Error filtering doctors:', err);
        }
      } else {
        // Fetch all doctors when search term is cleared
        try {
          const doctors = await fetchDoctors();
          setDoctors(doctors);
        } catch (err) {
          console.error('Error fetching doctors:', err);
        }
      }
    };

    searchDoctorsDebounced();
  }, [debouncedSearchTerm, filters.status, filters.specialization, filters.location]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const doctorsData = await fetchDoctors();
        setDoctors(doctorsData);
        setError(null);
      } catch (err) {
        setError('Failed to load doctors');
        console.error('Error fetching doctors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique specializations and locations for filter options
  const specializations = Array.from(new Set(doctors.map(d => d.specialization)));
  const locations = Array.from(new Set(doctors.map(d => d.location)));

  // Get filter options with counts
  const statusOptions = [
    { value: 'all', label: 'All Statuses', count: doctors.length },
    { value: 'available', label: 'Available', count: doctors.filter(d => d.status === 'available').length },
    { value: 'busy', label: 'Busy', count: doctors.filter(d => d.status === 'busy').length },
    { value: 'off_duty', label: 'Off Duty', count: doctors.filter(d => d.status === 'off_duty').length }
  ];

  const specializationOptions = [
    { value: 'all', label: 'All Specializations', count: doctors.length },
    ...specializations.map(spec => ({
      value: spec,
      label: spec,
      count: doctors.filter(d => d.specialization === spec).length
    }))
  ];

  const locationOptions = [
    { value: 'all', label: 'All Locations', count: doctors.length },
    ...locations.map(loc => ({
      value: loc,
      label: loc,
      count: doctors.filter(d => d.location === loc).length
    }))
  ];

  const handleCreateDoctor = async (data: CreateDoctorDto) => {
    try {
      const newDoctor = await createDoctor(data);
      if (newDoctor) {
        setDoctors(prev => [...prev, newDoctor]);
        setShowNewDoctorModal(false);
      }
    } catch (err) {
      console.error('Error creating doctor:', err);
    }
  };

  const handleUpdateDoctor = async (data: Partial<CreateDoctorDto>) => {
    if (!selectedDoctor) return;
    
    try {
      // Convert Partial<CreateDoctorDto> to UpdateDoctorDto
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.specialization) updateData.specialization = data.specialization;
      if (data.gender) updateData.gender = data.gender;
      if (data.location) updateData.location = data.location;
      if (data.status) updateData.status = data.status;
      
      const updatedDoctor = await updateDoctor(selectedDoctor.id, updateData);
      if (updatedDoctor) {
        setDoctors(prev => 
          prev.map(doc => doc.id === selectedDoctor.id ? updatedDoctor : doc)
        );
        setShowEditDoctorModal(false);
        setSelectedDoctor(null);
      }
    } catch (err) {
      console.error('Error updating doctor:', err);
    }
  };

  const handleDeleteDoctor = async (doctorId: number) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete Dr. ${doctor.name}? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const success = await deleteDoctor(doctorId);
      if (success) {
        setDoctors(prev => prev.filter(doc => doc.id !== doctorId));
      }
    } catch (err) {
      console.error('Error deleting doctor:', err);
      alert('Failed to delete doctor. Please try again.');
    }
  };

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDoctor, setScheduleDoctor] = useState<Doctor | null>(null);

  const handleViewDoctorSchedule = async (doctorId: number) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor) {
      setScheduleDoctor(doctor);
      setShowScheduleModal(true);
    }
  };

  const handleEditDoctor = (doctorId: number) => {
    const doctorToEdit = doctors.find(d => d.id === doctorId);
    if (doctorToEdit) {
      setSelectedDoctor(doctorToEdit);
      setShowEditDoctorModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-violet-600/6 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="relative z-10 flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500 mx-auto mb-4"></div>
            <p className="text-purple-300 text-lg">Loading doctors...</p>
          </div>
        </div>
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
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col space-y-6 mb-8 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                  Doctors
                </h1>
                <p className="text-purple-300 text-sm mt-1">Manage medical staff and schedules</p>
              </div>
            </div>
            <button 
              onClick={() => setShowNewDoctorModal(true)}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-lg shadow-purple-500/20"
            >
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span>Add New Doctor</span>
              </div>
            </button>
          </div>

          {/* Enhanced Filters */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-purple-500/5 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-purple-200/90 mb-2">
                  Search Doctors
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    placeholder="Search by name or specialization..."
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

              {/* Specialization Filter */}
              <div>
                <label htmlFor="specialization" className="block text-sm font-medium text-purple-200/90 mb-2">
                  Specialization
                </label>
                <div className="relative">
                  <select
                    id="specialization"
                    value={filters.specialization || 'all'}
                    onChange={(e) => setFilter('specialization', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                  >
                    {specializationOptions.map(option => (
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

              {/* Location Filter */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-purple-200/90 mb-2">
                  Location
                </label>
                <div className="relative">
                  <select
                    id="location"
                    value={filters.location || 'all'}
                    onChange={(e) => setFilter('location', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
                  >
                    {locationOptions.map(option => (
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
                {resultCount} of {doctors.length} doctors
              </div>
            </div>
          </div>

          {/* Doctors Grid */}
          <div className="mb-8">
            {filteredDoctors.length === 0 ? (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center shadow-2xl shadow-purple-500/5">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {isFiltered ? 'No doctors found' : 'No doctors registered'}
                </h3>
                <p className="text-gray-300">
                  {isFiltered 
                    ? 'No doctors match your search criteria. Try adjusting your filters or search terms.'
                    : 'No doctors have been registered yet. Add a new doctor to get started.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors.map((doctor: Doctor) => (
                  <div key={doctor.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-purple-500/5 hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-lg">Dr. {doctor.name}</h3>
                          <p className="text-purple-300 text-sm">{doctor.specialization}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        doctor.status === 'available' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                        doctor.status === 'busy' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {doctor.status === 'available' ? '✅ Available' :
                         doctor.status === 'busy' ? '🟡 Busy' :
                         '🔴 Off Duty'}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center space-x-2 text-purple-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm">{doctor.location}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-purple-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm capitalize">{doctor.gender}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDoctorSchedule(doctor.id)}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-purple-300 font-medium py-2 px-3 rounded-xl transition-all duration-200 text-sm border border-white/20"
                      >
                        View Schedule
                      </button>
                      <button
                        onClick={() => handleEditDoctor(doctor.id)}
                        className="w-10 h-10 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl flex items-center justify-center text-blue-400 hover:text-blue-300 transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteDoctor(doctor.id)}
                        className="w-10 h-10 bg-red-500/20 hover:bg-red-500/30 rounded-xl flex items-center justify-center text-red-400 hover:text-red-300 transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

      {/* New Doctor Modal */}
      <Modal
        isOpen={showNewDoctorModal}
        onClose={() => setShowNewDoctorModal(false)}
        title="Add New Doctor"
        size="md"
      >
        <DoctorForm
          onSubmit={handleCreateDoctor}
          onCancel={() => setShowNewDoctorModal(false)}
        />
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal
        isOpen={showEditDoctorModal && !!selectedDoctor}
        onClose={() => {
          setShowEditDoctorModal(false);
          setSelectedDoctor(null);
        }}
        title="Edit Doctor"
        size="md"
      >
        {selectedDoctor && (
          <DoctorForm
            initialData={selectedDoctor}
            onSubmit={handleUpdateDoctor}
            onCancel={() => {
              setShowEditDoctorModal(false);
              setSelectedDoctor(null);
            }}
          />
        )}
      </Modal>

          {/* Doctor Schedule Modal */}
          <Modal
            isOpen={showScheduleModal && !!scheduleDoctor}
            onClose={() => {
              setShowScheduleModal(false);
              setScheduleDoctor(null);
            }}
            title={`${scheduleDoctor?.name} - Schedule`}
            size="lg"
          >
            {scheduleDoctor && (
              <DoctorScheduleView doctor={scheduleDoctor} />
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
};

// Doctor Schedule View Component
const DoctorScheduleView = ({ doctor }: { doctor: Doctor }) => {
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Parse the availability schedule if it exists
    try {
      if (doctor.availabilitySchedule) {
        const parsed = typeof doctor.availabilitySchedule === 'string' 
          ? JSON.parse(doctor.availabilitySchedule)
          : doctor.availabilitySchedule;
        setSchedule(parsed);
      } else {
        // Default schedule
        setSchedule({
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' },
          saturday: { start: '09:00', end: '13:00' },
          sunday: { start: 'off', end: 'off' }
        });
      }
    } catch (error) {
      console.error('Error parsing schedule:', error);
      setSchedule({});
    } finally {
      setLoading(false);
    }
  }, [doctor]);

  if (loading) {
    return <div className="p-4 text-center">Loading schedule...</div>;
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="text-purple-300 font-medium">Doctor</div>
          <div className="font-semibold text-white text-lg">Dr. {doctor.name}</div>
        </div>
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="text-purple-300 font-medium">Specialization</div>
          <div className="font-semibold text-white">{doctor.specialization}</div>
        </div>
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="text-purple-300 font-medium">Location</div>
          <div className="font-semibold text-white">{doctor.location}</div>
        </div>
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="text-purple-300 font-medium">Status</div>
          <div className="font-semibold text-white capitalize">{doctor.status.replace('_', ' ')}</div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Weekly Schedule</span>
        </h3>
        <div className="space-y-3">
          {days.map((day, index) => {
            const daySchedule = schedule[day];
            const isOff = !daySchedule || daySchedule.start === 'off' || daySchedule.end === 'off';
            
            return (
              <div key={day} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
                <div className="font-semibold text-white w-24">
                  {dayNames[index]}
                </div>
                <div className="text-purple-300">
                  {isOff ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                      🔴 Off
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                      🕒 {daySchedule.start} - {daySchedule.end}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-white/10">
        <button
          onClick={() => window.close()}
          className="px-6 py-3 text-sm font-medium text-gray-300 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Simple Doctor Form Component
const DoctorForm = ({ 
  initialData, 
  onSubmit, 
  onCancel 
}: { 
  initialData?: Partial<Doctor>;
  onSubmit: (data: CreateDoctorDto) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    specialization: initialData?.specialization || '',
    gender: initialData?.gender || 'male',
    location: initialData?.location || '',
    status: initialData?.status || 'available',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      specialization: formData.specialization,
      gender: formData.gender as 'male' | 'female' | 'other',
      location: formData.location,
      status: formData.status as 'available' | 'busy' | 'off_duty',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-purple-200/90 mb-2">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
        />
      </div>

      <div>
        <label htmlFor="specialization" className="block text-sm font-medium text-purple-200/90 mb-2">
          Specialization
        </label>
        <input
          type="text"
          id="specialization"
          name="specialization"
          value={formData.specialization}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
        />
      </div>

      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-purple-200/90 mb-2">
          Gender
        </label>
        <div className="relative">
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
          >
            <option value="male" className="bg-slate-800">Male</option>
            <option value="female" className="bg-slate-800">Female</option>
            <option value="other" className="bg-slate-800">Other</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-purple-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-purple-200/90 mb-2">
          Location
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-purple-200/90 mb-2">
          Status
        </label>
        <div className="relative">
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
          >
            <option value="available" className="bg-slate-800">Available</option>
            <option value="busy" className="bg-slate-800">Busy</option>
            <option value="off_duty" className="bg-slate-800">Off Duty</option>
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
          type="button"
          onClick={onCancel}
          className="px-6 py-3 text-sm font-medium text-gray-300 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-3 text-sm font-semibold bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-lg shadow-purple-500/25"
        >
          {initialData ? 'Update Doctor' : 'Add Doctor'}
        </button>
      </div>
    </form>
  );
};

export default DoctorManagementPage;
