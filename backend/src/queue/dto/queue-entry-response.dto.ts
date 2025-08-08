import { Expose, Transform, Type } from 'class-transformer';

export class QueueEntryResponseDto {
  @Expose()
  id: number;

  @Expose()
  patientId: number;

  @Expose()
  queueNumber: number;

  @Expose()
  status: string;

  @Expose()
  priority: string;

  @Expose()
  @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
  arrivalTime: Date;

  @Expose()
  estimatedWaitTime: number;

  @Expose()
  @Type(() => Object)
  patient: {
    id: number;
    name: string;
    contactInfo: string;
    medicalRecordNumber: string;
  };

  @Expose()
  @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
  updatedAt: Date;
}