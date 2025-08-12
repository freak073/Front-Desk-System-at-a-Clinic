'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Modal from '../../components/Modal';
import DoctorCard from '../../components/DoctorCard';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [specializationFilter, setSpecializationFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  // Search doctors when search term or filters change
  React.useEffect(() => {
    const searchDoctorsDebounced = async () => {
      if (debouncedSearchTerm || statusFilter !== 'all' || specializationFilter !== 'all' || locationFilter !== 'all') {
        try {
          const doctors = await filterDoctors(
            specializationFilter !== 'all' ? specializationFilter : undefined,
            locationFilter !== 'all' ? locationFilter : undefined,
            statusFilter !== 'all' ? statusFilter : undefined
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
  }, [debouncedSearchTerm, statusFilter, specializationFilter, locationFilter]);

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

  // Filter doctors based on search and filters
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = !debouncedSearchTerm ||
      doctor.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || doctor.status === statusFilter;
    const matchesSpecialization = specializationFilter === 'all' || doctor.specialization === specializationFilter;
    const matchesLocation = locationFilter === 'all' || doctor.location === locationFilter;
    
    return matchesSearch && matchesStatus && matchesSpecialization && matchesLocation;
  });

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
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
  <div className="p-4 sm:p-6 md:p-8 text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-100">Doctor Management</h1>
        <button 
          onClick={() => setShowNewDoctorModal(true)}
          className="btn-primary"
        >
          + Add New Doctor
        </button>
      </div>

      {/* Filters */}
  <div className="bg-surface-900 border border-gray-700 shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by name or specialization"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="off_duty">Off Duty</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="specialization" className="block text-sm font-medium text-gray-300 mb-1">
              Specialization
            </label>
            <select
              id="specialization"
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            >
              <option value="all">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
              Location
            </label>
            <select
              id="location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSpecializationFilter('all');
                setLocationFilter('all');
              }}
              className="w-full px-4 py-2 bg-surface-700 text-gray-200 rounded-md hover:bg-surface-600 transition focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'No doctors match your search criteria' 
                : 'No doctors found'}
            </p>
          </div>
        ) : (
          filteredDoctors.map(doctor => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onEdit={handleEditDoctor}
              onDelete={handleDeleteDoctor}
              onViewSchedule={handleViewDoctorSchedule}
            />
          ))
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
        <div>
          <div className="text-gray-500">Doctor</div>
          <div className="font-medium text-gray-100">{doctor.name}</div>
        </div>
        <div>
          <div className="text-gray-500">Specialization</div>
          <div className="font-medium text-gray-100">{doctor.specialization}</div>
        </div>
        <div>
          <div className="text-gray-500">Location</div>
          <div className="font-medium text-gray-100">{doctor.location}</div>
        </div>
        <div>
          <div className="text-gray-500">Status</div>
          <div className="font-medium text-gray-100 capitalize">{doctor.status.replace('_', ' ')}</div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-100 mb-4">Weekly Schedule</h3>
        <div className="space-y-2">
          {days.map((day, index) => {
            const daySchedule = schedule[day];
            const isOff = !daySchedule || daySchedule.start === 'off' || daySchedule.end === 'off';
            
            return (
              <div key={day} className="flex items-center justify-between p-3 bg-surface-700 rounded-lg">
                <div className="font-medium text-gray-200 w-24">
                  {dayNames[index]}
                </div>
                <div className="text-gray-300">
                  {isOff ? (
                    <span className="text-red-400">Off</span>
                  ) : (
                    <span>
                      {daySchedule.start} - {daySchedule.end}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-surface-700 text-gray-200 rounded-md hover:bg-surface-600 transition focus:outline-none focus:ring-2 focus:ring-accent-500"
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
        />
      </div>

      <div>
  <label htmlFor="specialization" className="block text-sm font-medium text-gray-300 mb-1">
          Specialization
        </label>
        <input
          type="text"
          id="specialization"
          name="specialization"
          value={formData.specialization}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
        />
      </div>

      <div>
  <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-1">
          Gender
        </label>
        <select
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
  <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
          Location
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
        />
      </div>

      <div>
  <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-surface-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
        >
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="off_duty">Off Duty</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-200 bg-surface-700 border border-gray-600 rounded-md hover:bg-surface-600 focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-accent-600 border border-transparent rounded-md hover:bg-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          {initialData ? 'Update Doctor' : 'Add Doctor'}
        </button>
      </div>
    </form>
  );
};

export default DoctorManagementPage;
