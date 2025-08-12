import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsOptional,
  IsEnum,
  IsPositive,
  MaxLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { Transform } from "class-transformer";

@ValidatorConstraint({ name: "isFutureDate", async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    return date > now;
  }

  defaultMessage() {
    return "Appointment time must be in the future";
  }
}

@ValidatorConstraint({ name: "isBusinessHours", async: false })
export class IsBusinessHoursConstraint implements ValidatorConstraintInterface {
  validate(dateString: string) {
    const date = new Date(dateString);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Check if it's a weekday (Monday = 1, Friday = 5)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    // Check if it's during business hours (9 AM - 5 PM)
    return hour >= 9 && hour < 17;
  }

  defaultMessage() {
    return "Appointments must be scheduled during business hours (9 AM - 5 PM, Monday - Friday)";
  }
}

export class CreateAppointmentDto {
  @IsNumber({}, { message: "Patient ID must be a valid number" })
  @IsPositive({ message: "Patient ID must be a positive number" })
  @IsNotEmpty({ message: "Patient ID is required" })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  patientId: number;

  @IsNumber({}, { message: "Doctor ID must be a valid number" })
  @IsPositive({ message: "Doctor ID must be a positive number" })
  @IsNotEmpty({ message: "Doctor ID is required" })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  doctorId: number;

  @IsDateString(
    {},
    { message: "Appointment datetime must be a valid ISO date string" },
  )
  @IsNotEmpty({ message: "Appointment datetime is required" })
  @Validate(IsFutureDateConstraint)
  @Validate(IsBusinessHoursConstraint)
  appointmentDatetime: string;

  @IsOptional()
  @IsString({ message: "Notes must be a string" })
  @MaxLength(1000, { message: "Notes cannot exceed 1000 characters" })
  notes?: string;

  @IsOptional()
  @IsEnum(["booked", "completed", "canceled"], {
    message: "Status must be one of: booked, completed, canceled",
  })
  status?: string;
}
