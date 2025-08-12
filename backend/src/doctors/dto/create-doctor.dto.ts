import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsObject,
} from "class-validator";

export class CreateDoctorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  specialization: string;

  @IsEnum(["male", "female", "other"])
  gender: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsOptional()
  @IsObject()
  availabilitySchedule?: object;

  @IsOptional()
  @IsEnum(["available", "busy", "off_duty"])
  status?: string;
}
