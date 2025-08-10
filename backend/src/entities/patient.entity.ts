import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';

@Entity('patients')
@Index(['name'])
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({
    name: 'contact_info',
    length: 255,
    nullable: true
  })
  contactInfo: string;

  @Column({
    name: 'medical_record_number',
    length: 50,
    unique: true,
    nullable: true
  })
  medicalRecordNumber: string;

  @OneToMany('QueueEntry', 'patient')
  queueEntries: any[];

  @OneToMany('Appointment', 'patient')
  appointments: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}