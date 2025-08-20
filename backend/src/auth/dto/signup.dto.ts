import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  Matches,
} from "class-validator";

export class SignupDto {
  @IsString({ message: "Username must be a string" })
  @IsNotEmpty({ message: "Username is required" })
  @MinLength(3, { message: "Username must be at least 3 characters long" })
  @MaxLength(50, { message: "Username cannot exceed 50 characters" })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: "Username can only contain letters, numbers, and underscores",
  })
  username: string;

  @IsString({ message: "Password must be a string" })
  @IsNotEmpty({ message: "Password is required" })
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  @MaxLength(100, { message: "Password cannot exceed 100 characters" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      "Password must contain at least one lowercase letter, one uppercase letter, and one number",
  })
  password: string;

  @IsOptional()
  @IsEnum(["admin", "staff"], {
    message: 'Role must be either "admin" or "staff"',
  })
  role?: "admin" | "staff" = "staff";

  @IsOptional()
  @IsString({ message: "Full name must be a string" })
  @MaxLength(100, { message: "Full name cannot exceed 100 characters" })
  fullName?: string;
}
