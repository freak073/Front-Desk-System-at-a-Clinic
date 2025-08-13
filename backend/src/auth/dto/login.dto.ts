import { IsString, IsNotEmpty, MinLength } from "class-validator";
import { SanitizeString } from "../../security/sanitization.service";

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @SanitizeString()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
