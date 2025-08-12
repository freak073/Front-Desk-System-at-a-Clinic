import { Exclude, Expose, Transform } from "class-transformer";

export class PatientResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  contactInfo: string;

  @Expose()
  medicalRecordNumber: string;

  @Expose()
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  createdAt: Date;

  @Expose()
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  updatedAt: Date;
}
