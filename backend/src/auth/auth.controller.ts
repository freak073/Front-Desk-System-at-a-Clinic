import { ApiTags } from "@nestjs/swagger";
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, SignupDto, AuthResponseDto, RefreshTokenDto } from "./dto";
import { ApiResponseDto } from "../common/dto/api-response.dto";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { User } from "../entities/user.entity";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  async signup(
    @Body(ValidationPipe) signupDto: SignupDto,
  ): Promise<ApiResponseDto<AuthResponseDto>> {
    const auth = await this.authService.signup(signupDto);
    return ApiResponseDto.success(auth, "User registered successfully");
  }

  @UseGuards(LocalAuthGuard)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @CurrentUser() _user: User,
  ): Promise<ApiResponseDto<AuthResponseDto>> {
    const auth = await this.authService.login(loginDto);
    return ApiResponseDto.success(auth);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(): ApiResponseDto<{ message: string }> {
    // JWT tokens are stateless, so logout is handled client-side
    // by removing the token from storage
    return ApiResponseDto.success({ message: "Logged out successfully" });
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(
    @CurrentUser() user: User,
  ): ApiResponseDto<{ id: number; username: string; role: string }> {
    return ApiResponseDto.success({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  }

  // Token verification for existing session
  @UseGuards(JwtAuthGuard)
  @Get("verify")
  verifyToken(): ApiResponseDto<{ valid: true }> {
    return ApiResponseDto.success({ valid: true });
  }

  // Simplistic refresh: guarded endpoint re-issues token with same identity.
  @UseGuards(JwtAuthGuard)
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(
    @CurrentUser() user: User,
    @Body() _body: RefreshTokenDto,
  ): ApiResponseDto<AuthResponseDto> {
    const issued = this.authService.issueFromUser(user);
    return ApiResponseDto.success(issued);
  }
}
