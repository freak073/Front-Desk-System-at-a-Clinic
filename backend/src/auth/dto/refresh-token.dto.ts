import { IsString, IsOptional } from "class-validator";

// Frontend sends { token }; guard already validated user via current token.
// Accept token for forward compatibility and optional fallbackPassword (not used now).
export class RefreshTokenDto {
  @IsString()
  @IsOptional()
  token?: string;

  @IsString()
  @IsOptional()
  fallbackPassword?: string; // Transitional only if legacy flows require
}
