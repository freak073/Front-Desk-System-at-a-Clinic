import { IsNumber, IsEnum, IsOptional } from "class-validator";

export class CreateQueueEntryDto {
  @IsNumber()
  patientId: number;

  @IsOptional()
  @IsEnum(["normal", "urgent"])
  priority?: "normal" | "urgent" = "normal";
}
