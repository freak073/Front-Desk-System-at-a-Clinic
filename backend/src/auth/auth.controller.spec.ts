import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto, AuthResponseDto } from './dto';
import { User } from '../entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    passwordHash: 'hashedpassword',
    role: 'front_desk',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthResponse: AuthResponseDto = {
    access_token: 'jwt-token',
    user: {
      id: 1,
      username: 'testuser',
      role: 'front_desk',
    },
  };

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
      validateUser: jest.fn(),
      hashPassword: jest.fn(),
      findUserById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      username: 'testuser',
      password: 'password',
    };

    it('should return auth response when login is successful', async () => {
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto, mockUser);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException when login fails', async () => {
      authService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(loginDto, mockUser)).rejects.toThrow(UnauthorizedException);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('logout', () => {
    it('should return success message', async () => {
      const result = await controller.logout();

      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const result = await controller.getProfile(mockUser);

      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });
    });
  });
});