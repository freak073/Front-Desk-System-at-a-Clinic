import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

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

  // Pagination support (mirrors appointments query dto style)
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? Number(value) : undefined))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? Number(value) : undefined))
  limit?: number = 10;
}