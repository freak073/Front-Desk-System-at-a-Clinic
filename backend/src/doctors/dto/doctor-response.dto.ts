import { Exclude, Expose, Transform } from 'class-transformer';

export class DoctorResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  specialization: string;

  @Expose()
  gender: string;

  @Expose()
  location: string;

  @Expose()
  availabilitySchedule: object;

  @Expose()
  status: string;

  @Expose()
  @Transform(({ value }) => value?.toISOString())
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => value?.toISOString())
  updatedAt: Date;
}