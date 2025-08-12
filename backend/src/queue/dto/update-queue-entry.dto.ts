import { IsEnum, IsOptional } from "class-validator";

export class UpdateQueueEntryDto {
  @IsOptional()
  @IsEnum(["waiting", "with_doctor", "completed"])
  status?: "waiting" | "with_doctor" | "completed";

  @IsOptional()
  @IsEnum(["normal", "urgent"])
  priority?: "normal" | "urgent";
}
