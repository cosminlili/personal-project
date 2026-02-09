import { AuthService } from '../src/auth/auth.service';
import { UserRepository } from '../src/auth/user.repository';

describe('AuthService', () => {
  it('registers a user and returns an RTO', async () => {
    const mockRepository: Partial<UserRepository> = {
      create: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z')
      })
    };

    const service = new AuthService(mockRepository as UserRepository);
    const result = await service.register({
      email: 'user@example.com',
      password: 'password123'
    });

    expect(result).toEqual({
      id: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    });
  });
});
