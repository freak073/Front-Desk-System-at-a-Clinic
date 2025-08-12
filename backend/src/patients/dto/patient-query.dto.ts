import { IsOptional, IsString } from "class-validator";

export class PatientQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  medicalRecordNumber?: string;
}
