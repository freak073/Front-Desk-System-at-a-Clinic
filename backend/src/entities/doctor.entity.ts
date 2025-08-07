import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  specialization: string;

  @Column({ 
    type: 'enum', 
    enum: ['male', 'female', 'other'] 
  })
  gender: string;

  @Column({ length: 100 })
  location: string;

  @Column({ 
    type: 'json', 
    name: 'availability_schedule',
    nullable: true 
  })
  availabilitySchedule: object;

  @Column({ 
    type: 'enum', 
    enum: ['available', 'busy', 'off_duty'], 
    default: 'available' 
  })
  status: string;

  @OneToMany('Appointment', 'doctor')
  appointments: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}