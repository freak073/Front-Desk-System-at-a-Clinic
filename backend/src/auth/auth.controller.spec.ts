import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException, ConflictException } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { LoginDto, SignupDto, AuthResponseDto } from "./dto";
import { User } from "../entities/user.entity";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser: User = {
    id: 1,
    username: "testuser",
    passwordHash: "hashedpassword",
    role: "staff",
    fullName: "Test User",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthResponse: AuthResponseDto = {
    access_token: "jwt-token",
    user: {
      id: 1,
      username: "testuser",
      role: "staff",
    },
  };

  beforeEach(async () => {
    const mockAuthService = {
      signup: jest.fn(),
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

  describe("signup", () => {
    const signupDto: SignupDto = {
      username: "newuser",
      password: "Password123",
      role: "staff",
      fullName: "New User",
    };

    it("should return auth response when signup is successful", async () => {
      const newUserAuthResponse: AuthResponseDto = {
        access_token: "jwt-token",
        user: {
          id: 2,
          username: "newuser",
          role: "staff",
        },
      };

      authService.signup.mockResolvedValue(newUserAuthResponse);

      const result = await controller.signup(signupDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(newUserAuthResponse);
      expect(result.message).toBe("User registered successfully");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.signup).toHaveBeenCalledWith(signupDto);
    });

    it("should throw ConflictException when username already exists", async () => {
      authService.signup.mockRejectedValue(
        new ConflictException("Username already exists"),
      );

      await expect(controller.signup(signupDto)).rejects.toThrow(
        ConflictException,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.signup).toHaveBeenCalledWith(signupDto);
    });
  });

  describe("login", () => {
    const loginDto: LoginDto = {
      username: "testuser",
      password: "password",
    };

    it("should return auth response when login is successful", async () => {
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto, mockUser);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAuthResponse);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it("should throw UnauthorizedException when login fails", async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException("Invalid credentials"),
      );

      await expect(controller.login(loginDto, mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe("logout", () => {
    it("should return success message", () => {
      const result = controller.logout();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ message: "Logged out successfully" });
    });
  });

  describe("getProfile", () => {
    it("should return user profile", () => {
      const result = controller.getProfile(mockUser);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });
    });
  });
});
