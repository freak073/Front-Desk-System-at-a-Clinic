import { IsObject, IsOptional } from "class-validator";

export class UpdateDoctorScheduleDto {
  @IsObject()
  schedule: Record<string, { start?: string; end?: string }>; // e.g. { monday: { start: '09:00', end: '17:00' } }

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
