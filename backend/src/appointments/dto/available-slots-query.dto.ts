import { IsDateString, IsNotEmpty, IsNumber } from "class-validator";
import { Transform } from "class-transformer";

export class AvailableSlotsQueryDto {
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  doctorId: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;
}
