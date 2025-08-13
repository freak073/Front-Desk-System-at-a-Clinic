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
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { LoginDto, SignupDto, AuthResponseDto, RefreshTokenDto } from "./dto";
import { ApiResponseDto } from "../common/dto/api-response.dto";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { User } from "../entities/user.entity";
import { Audit, AuditContext } from "../security/audit.decorator";
import { AuditService } from "../security/audit.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  @Audit({ action: 'signup', resource: 'user', description: 'User registration' })
  async signup(
    @Body(ValidationPipe) signupDto: SignupDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<AuthResponseDto>> {
    try {
      const auth = await this.authService.signup(signupDto);
      
      await this.auditService.logAuthEvent('signup', true, {
        username: signupDto.username,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
      
      return ApiResponseDto.success(auth, "User registered successfully");
    } catch (error) {
      await this.auditService.logAuthEvent('signup', false, {
        username: signupDto.username,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        errorMessage: error.message,
      });
      throw error;
    }
  }

  @UseGuards(LocalAuthGuard)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Audit({ action: 'login', resource: 'authentication', description: 'User login' })
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<ApiResponseDto<AuthResponseDto>> {
    try {
      const auth = await this.authService.login(loginDto);
      
      await this.auditService.logAuthEvent('login', true, {
        userId: user.id,
        username: user.username,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
      
      return ApiResponseDto.success(auth);
    } catch (error) {
      await this.auditService.logAuthEvent('login', false, {
        username: loginDto.username,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        errorMessage: error.message,
      });
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @Audit({ action: 'logout', resource: 'authentication', description: 'User logout' })
  async logout(
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<ApiResponseDto<{ message: string }>> {
    await this.auditService.logAuthEvent('logout', true, {
      userId: user.id,
      username: user.username,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
    
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
