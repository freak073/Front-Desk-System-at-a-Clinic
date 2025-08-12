import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { SignupDto } from '../signup.dto';

describe('SignupDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = plainToClass(SignupDto, {
      username: 'testuser',
      password: 'Password123',
      role: 'staff',
      fullName: 'Test User',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation with minimal required data', async () => {
    const dto = plainToClass(SignupDto, {
      username: 'testuser',
      password: 'Password123',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.role).toBe('staff'); // Default value
  });

  describe('username validation', () => {
    it('should fail when username is empty', async () => {
      const dto = plainToClass(SignupDto, {
        username: '',
        password: 'Password123',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('username');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail when username is too short', async () => {
      const dto = plainToClass(SignupDto, {
        username: 'ab',
        password: 'Password123',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('username');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail when username is too long', async () => {
      const dto = plainToClass(SignupDto, {
        username: 'a'.repeat(51),
        password: 'Password123',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('username');
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('should fail when username contains invalid characters', async () => {
      const dto = plainToClass(SignupDto, {
        username: 'test-user!',
        password: 'Password123',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('username');
      expect(errors[0].constraints).toHaveProperty('matches');
    });
  });

  describe('password validation', () => {
    it('should fail when password is empty', async () => {
      const dto = plainToClass(SignupDto, {
        username: 'testuser',
        password: '',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail when password is too short', async () => {
      const dto = plainToClass(SignupDto, {
        username: 'testuser',
        password: 'Pass1',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail when password lacks uppercase letter', async () => {
      const dto = plainToClass(SignupDto, {
        username: 'testuser',
        password: 'password123',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should fail when password lacks lowercase letter', async () => {
      const dto = plainToClass(SignupDto, {
        username: 'testuser',
        password: 'PASSWORD123',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should fail when password lacks number', async () => {
      const dto = plainToClass(SignupDto, {
        username: 'testuser',
        password: 'Password',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('matches');
    });
  });

  describe('role validation', () => {
    it('should fail when role is invalid', async () => {
      const dto = plainToClass(SignupDto, {
        username: 'testuser',
        password: 'Password123',
        role: 'invalid_role' as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('role');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should pass when role is admin', async () => {
      const dto = plainToClass(SignupDto, {
        username: 'testuser',
        password: 'Password123',
        role: 'admin',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when role is staff', async () => {
      const dto = plainToClass(SignupDto, {
        username: 'testuser',
        password: 'Password123',
        role: 'staff',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('fullName validation', () => {
    it('should fail when fullName is too long', async () => {
      const dto = plainToClass(SignupDto, {
        username: 'testuser',
        password: 'Password123',
        fullName: 'a'.repeat(101),
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('fullName');
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('should pass when fullName is valid', async () => {
      const dto = plainToClass(SignupDto, {
        username: 'testuser',
        password: 'Password123',
        fullName: 'John Doe',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});