import { IsOptional, IsString, IsEnum } from 'class-validator';

export class DoctorQueryDto {
  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(['available', 'busy', 'off_duty'])
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;
}