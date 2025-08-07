import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

@Entity('appointments')
@Index(['appointmentDatetime'])
@Index(['doctorId', 'appointmentDatetime'])
@Index(['patientId'])
@Index(['status'])
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'patient_id' })
  patientId: number;

  @Column({ name: 'doctor_id' })
  doctorId: number;

  @Column({
    name: 'appointment_datetime',
    type: 'datetime'
  })
  appointmentDatetime: Date;

  @Column({
    type: 'enum',
    enum: ['booked', 'completed', 'canceled'],
    default: 'booked'
  })
  status: string;

  @Column({
    type: 'text',
    nullable: true
  })
  notes: string;

  @ManyToOne('Patient', 'appointments', {
    onDelete: 'CASCADE',
    eager: true
  })
  @JoinColumn({ name: 'patient_id' })
  patient: any;

  @ManyToOne('Doctor', 'appointments', {
    onDelete: 'CASCADE',
    eager: true
  })
  @JoinColumn({ name: 'doctor_id' })
  doctor: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}