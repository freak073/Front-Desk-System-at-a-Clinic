import { Doctor } from '../doctor.entity';

describe('Doctor Entity', () => {
  let doctor: Doctor;

  beforeEach(() => {
    doctor = new Doctor();
  });

  it('should be defined', () => {
    expect(doctor).toBeDefined();
  });

  it('should have correct properties', () => {
    const availabilitySchedule = {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
    };

    doctor.id = 1;
    doctor.name = 'Dr. John Doe';
    doctor.specialization = 'General Medicine';
    doctor.gender = 'male';
    doctor.location = 'Room 101';
    doctor.availabilitySchedule = availabilitySchedule;
    doctor.status = 'available';
    doctor.createdAt = new Date();
    doctor.updatedAt = new Date();

    expect(doctor.id).toBe(1);
    expect(doctor.name).toBe('Dr. John Doe');
    expect(doctor.specialization).toBe('General Medicine');
    expect(doctor.gender).toBe('male');
    expect(doctor.location).toBe('Room 101');
    expect(doctor.availabilitySchedule).toEqual(availabilitySchedule);
    expect(doctor.status).toBe('available');
    expect(doctor.createdAt).toBeInstanceOf(Date);
    expect(doctor.updatedAt).toBeInstanceOf(Date);
  });

  it('should accept valid gender values', () => {
    const validGenders = ['male', 'female', 'other'];
    validGenders.forEach((gender) => {
      doctor.gender = gender;
      expect(doctor.gender).toBe(gender);
    });
  });

  it('should accept valid status values', () => {
    const validStatuses = ['available', 'busy', 'off_duty'];
    validStatuses.forEach((status) => {
      doctor.status = status;
      expect(doctor.status).toBe(status);
    });
  });
});