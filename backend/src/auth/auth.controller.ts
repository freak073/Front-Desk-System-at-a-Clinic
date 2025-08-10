import { ApiTags } from '@nestjs/swagger';
import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  UseGuards, 
  HttpCode, 
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, AuthResponseDto, RefreshTokenDto } from './dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @CurrentUser() user: User,
  ): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<{ message: string }> {
    // JWT tokens are stateless, so logout is handled client-side
    // by removing the token from storage
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: User): Promise<{
    id: number;
    username: string;
    role: string;
  }> {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }

  // Token verification for existing session
  @UseGuards(JwtAuthGuard)
  @Get('verify')
  verifyToken() {
    return { success: true };
  }

  // Simplistic refresh: guarded endpoint re-issues token with same identity.
  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@CurrentUser() user: User, @Body() _body: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.issueFromUser(user);
  }
}