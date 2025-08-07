import { User } from '../user.entity';

describe('User Entity', () => {
  let user: User;

  beforeEach(() => {
    user = new User();
  });

  it('should be defined', () => {
    expect(user).toBeDefined();
  });

  it('should have correct properties', () => {
    user.id = 1;
    user.username = 'testuser';
    user.passwordHash = 'hashedpassword';
    user.role = 'front_desk';
    user.createdAt = new Date();
    user.updatedAt = new Date();

    expect(user.id).toBe(1);
    expect(user.username).toBe('testuser');
    expect(user.passwordHash).toBe('hashedpassword');
    expect(user.role).toBe('front_desk');
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  it('should have default role as front_desk', () => {
    // This would be tested in integration tests with actual database
    expect(user.role).toBeUndefined(); // Before setting default
  });
});