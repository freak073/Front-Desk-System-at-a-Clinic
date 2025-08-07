import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

@Entity('queue_entries')
@Index(['queueNumber'])
@Index(['status'])
@Index(['priority'])
@Index(['arrivalTime'])
export class QueueEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'patient_id' })
  patientId: number;

  @Column({ name: 'queue_number' })
  queueNumber: number;

  @Column({ 
    type: 'enum', 
    enum: ['waiting', 'with_doctor', 'completed'], 
    default: 'waiting' 
  })
  status: string;

  @Column({ 
    type: 'enum', 
    enum: ['normal', 'urgent'], 
    default: 'normal' 
  })
  priority: string;

  @Column({ 
    name: 'arrival_time', 
    type: 'timestamp', 
    default: () => 'CURRENT_TIMESTAMP' 
  })
  arrivalTime: Date;

  @Column({ 
    name: 'estimated_wait_time', 
    nullable: true,
    comment: 'Estimated wait time in minutes'
  })
  estimatedWaitTime: number;

  @ManyToOne('Patient', 'queueEntries', { 
    onDelete: 'CASCADE',
    eager: true 
  })
  @JoinColumn({ name: 'patient_id' })
  patient: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}