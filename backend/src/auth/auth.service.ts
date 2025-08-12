import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "../entities/user.entity";
import { LoginDto, SignupDto, AuthResponseDto } from "./dto";
import { JwtPayload } from "./strategies/jwt.strategy";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) return null;
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    return passwordValid ? user : null;
  }

  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    // Check if username already exists
    const existingUser = await this.userRepository.findOne({
      where: { username: signupDto.username }
    });
    
    if (existingUser) {
      throw new ConflictException("Username already exists");
    }

    // Hash the password
    const passwordHash = await this.hashPassword(signupDto.password);

    // Create new user
    const user = this.userRepository.create({
      username: signupDto.username,
      passwordHash,
      role: signupDto.role || 'staff',
      fullName: signupDto.fullName,
    });

    const savedUser = await this.userRepository.save(user);
    return this.issueFromUser(savedUser);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) throw new UnauthorizedException("Invalid credentials");
    return this.issueFromUser(user);
  }

  // Re-issue token directly from existing user (used by refresh endpoint guarded by JWT)
  issueFromUser(user: User): AuthResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, username: user.username, role: user.role },
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async findUserById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }
}
