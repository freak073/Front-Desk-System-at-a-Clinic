import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as request from "supertest";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { LocalStrategy } from "./strategies/local.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { User } from "../entities/user.entity";

describe("Auth Integration Tests", () => {
  let app: INestApplication;
  let mockUserRepository: jest.Mocked<Repository<User>>;
  let testUser: User;

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash("password123", 10);
    testUser = {
      id: 1,
      username: "testuser",
      passwordHash: hashedPassword,
      role: "staff",
      fullName: "Test User",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock repository
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PassportModule,
        JwtModule.register({
          secret: "test-secret",
          signOptions: { expiresIn: "24h" },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        LocalStrategy,
        JwtStrategy,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe("POST /auth/signup", () => {
    it("should create new user with valid data", async () => {
      const newUser = {
        id: 2,
        username: "newuser",
        passwordHash: "hashedPassword",
        role: "staff",
        fullName: "New User",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(null); // Username doesn't exist
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const response = await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          username: "newuser",
          password: "Password123",
          role: "staff",
          fullName: "New User",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully");
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveProperty("access_token");
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data.user).toEqual({
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
      });
      expect(typeof response.body.data.access_token).toBe("string");
    });

    it("should create user with default role when role not provided", async () => {
      const newUser = {
        id: 3,
        username: "newuser2",
        passwordHash: "hashedPassword",
        role: "staff",
        fullName: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const response = await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          username: "newuser2",
          password: "Password123",
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe("staff");
    });

    it("should reject signup when username already exists", async () => {
      mockUserRepository.findOne.mockResolvedValue(testUser); // Username exists

      const response = await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          username: "testuser",
          password: "Password123",
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Username already exists");
    });

    it("should validate signup input data", async () => {
      // Missing username
      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          password: "Password123",
        })
        .expect(400);

      // Missing password
      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          username: "newuser",
        })
        .expect(400);

      // Username too short
      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          username: "ab",
          password: "Password123",
        })
        .expect(400);

      // Password too short
      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          username: "newuser",
          password: "Pass1",
        })
        .expect(400);

      // Password without uppercase
      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          username: "newuser",
          password: "password123",
        })
        .expect(400);

      // Invalid role
      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          username: "newuser",
          password: "Password123",
          role: "invalid_role",
        })
        .expect(400);

      // Username with invalid characters
      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({
          username: "new-user!",
          password: "Password123",
        })
        .expect(400);
    });
  });

  describe("POST /auth/login", () => {
    it("should login with valid credentials", async () => {
      mockUserRepository.findOne.mockResolvedValue(testUser);

      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          username: "testuser",
          password: "password123",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveProperty("access_token");
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data.user).toEqual({
        id: testUser.id,
        username: testUser.username,
        role: testUser.role,
      });
      expect(typeof response.body.data.access_token).toBe("string");
    });

    it("should reject invalid credentials", async () => {
      mockUserRepository.findOne.mockResolvedValue(testUser);

      await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          username: "testuser",
          password: "wrongpassword",
        })
        .expect(401);
    });

    it("should reject non-existent user", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          username: "nonexistent",
          password: "password123",
        })
        .expect(401);
    });

    it("should validate input data", async () => {
      // Missing username - LocalStrategy will handle this as 401
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          password: "password123",
        })
        .expect(401);

      // Missing password - LocalStrategy will handle this as 401
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          username: "testuser",
        })
        .expect(401);

      // Password too short - LocalStrategy will handle this as 401
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          username: "testuser",
          password: "123",
        })
        .expect(401);
    });
  });

  describe("Authentication endpoints without JWT guard", () => {
    it("should return 401 for profile endpoint without a valid JWT", async () => {
      await request(app.getHttpServer()).get("/auth/profile").expect(401);
    });

    it("should return 401 for logout endpoint without a valid JWT", async () => {
      await request(app.getHttpServer()).post("/auth/logout").expect(401);
    });
  });
});
