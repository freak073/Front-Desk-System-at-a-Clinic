import { IsString, IsNotEmpty, IsOptional, Length, Matches } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  contactInfo?: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Medical record number must contain only uppercase letters, numbers, and hyphens',
  })
  medicalRecordNumber?: string;
}