import { IsOptional, IsString, IsEnum } from 'class-validator';

export class QueueQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['waiting', 'with_doctor', 'completed'])
  status?: 'waiting' | 'with_doctor' | 'completed';

  @IsOptional()
  @IsEnum(['normal', 'urgent'])
  priority?: 'normal' | 'urgent';

  @IsOptional()
  @IsString()
  patientName?: string;
}