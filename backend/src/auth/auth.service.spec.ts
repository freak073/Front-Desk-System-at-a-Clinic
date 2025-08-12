import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UnauthorizedException, ConflictException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { User } from "../entities/user.entity";
import { LoginDto, SignupDto } from "./dto";

// Mock bcrypt
jest.mock("bcrypt");
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("AuthService", () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: 1,
    username: "testuser",
    passwordHash: "hashedpassword",
    role: "staff",
    fullName: "Test User",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("validateUser", () => {
    it("should return user when credentials are valid", async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser("testuser", "password");

      expect(result).toEqual(mockUser);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: "testuser" },
      });
      expect(() => bcrypt.compare).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(bcrypt.compare).toHaveBeenCalledWith("password", "hashedpassword");
    });

    it("should return null when user is not found", async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser("nonexistent", "password");

      expect(result).toBeNull();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: "nonexistent" },
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should return null when password is invalid", async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser("testuser", "wrongpassword");

      expect(result).toBeNull();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongpassword",
        "hashedpassword",
      );
    });
  });

  describe("login", () => {
    const loginDto: LoginDto = {
      username: "testuser",
      password: "password",
    };

    it("should return auth response when credentials are valid", async () => {
      const mockToken = "jwt-token";
      userRepository.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
        },
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });
    });

    it("should throw UnauthorizedException when credentials are invalid", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe("hashPassword", () => {
    it("should hash password with bcrypt", async () => {
      const password = "plainpassword";
      const hashedPassword = "hashedpassword";
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await service.hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });
  });

  describe("signup", () => {
    const signupDto: SignupDto = {
      username: "newuser",
      password: "Password123",
      role: "staff",
      fullName: "New User",
    };

    it("should create new user and return auth response", async () => {
      const hashedPassword = "hashedPassword123";
      const newUser = { ...mockUser, id: 2, username: "newuser", fullName: "New User" };
      const mockToken = "jwt-token";

      userRepository.findOne.mockResolvedValue(null); // Username doesn't exist
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockResolvedValue(newUser);
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.signup(signupDto);

      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
        },
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: "newuser" },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith("Password123", 10);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.create).toHaveBeenCalledWith({
        username: "newuser",
        passwordHash: hashedPassword,
        role: "staff",
        fullName: "New User",
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.save).toHaveBeenCalledWith(newUser);
    });

    it("should throw ConflictException when username already exists", async () => {
      userRepository.findOne.mockResolvedValue(mockUser); // Username exists

      await expect(service.signup(signupDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.signup(signupDto)).rejects.toThrow(
        "Username already exists",
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: "newuser" },
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.create).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it("should create user with default role when role not provided", async () => {
      const signupDtoWithoutRole = {
        username: "newuser2",
        password: "Password123",
      };
      const hashedPassword = "hashedPassword123";
      const newUser = { ...mockUser, id: 3, username: "newuser2", role: "staff" };
      const mockToken = "jwt-token";

      userRepository.findOne.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockResolvedValue(newUser);
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.signup(signupDtoWithoutRole);

      expect(result).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.create).toHaveBeenCalledWith({
        username: "newuser2",
        passwordHash: hashedPassword,
        role: "staff",
        fullName: undefined,
      });
    });
  });

  describe("findUserById", () => {
    it("should return user when found", async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findUserById(1);

      expect(result).toEqual(mockUser);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should return null when user not found", async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findUserById(999);

      expect(result).toBeNull();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });
});
