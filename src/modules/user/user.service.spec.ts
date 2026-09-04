import { CommandBus } from '@nestjs/cqrs';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { ErrorCode } from '../../constants/error-code.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { MailService } from '../../shared/services/mail.service.ts';
import type { ChangePasswordDto } from '../auth/dto/change-password.dto.ts';
import { UserEntity } from './user.entity.ts';
import { UserService } from './user.service.ts';
import { UserSettingsEntity } from './user-settings.entity.ts';

// `changePassword` is @Transactional() (see user.service.ts). That decorator needs
// `initializeTransactionalContext()` + a registered DataSource, neither of which exist in a unit
// test — so it's no-op'd here to just run the wrapped method directly, same as every other
// @Transactional() method on this service would need if tested in isolation.
jest.mock('typeorm-transactional', () => ({
  Transactional: () => (_target: unknown, _key: string, descriptor: PropertyDescriptor) => descriptor,
}));

describe('UserService#changePassword', () => {
  const userId = 'user-1';
  let userRepository: { findOne: jest.Mock; save: jest.Mock };
  let userService: UserService;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(UserEntity), useValue: userRepository },
        { provide: getRepositoryToken(UserSettingsEntity), useValue: {} },
        { provide: CommandBus, useValue: { execute: jest.fn() } },
        { provide: MailService, useValue: { sendVerificationEmail: jest.fn() } },
        { provide: ApiConfigService, useValue: {} },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  function buildUser(hashedPassword: string): UserEntity {
    return { id: userId, password: hashedPassword } as UserEntity;
  }

  it('fails with NOT_FOUND when the user does not exist', async () => {
    userRepository.findOne.mockResolvedValue(null);

    const dto: ChangePasswordDto = { currentPassword: 'old-password', newPassword: 'new-password' };
    const result = await userService.changePassword(userId, dto);

    expect(result.error).toBe(ErrorCode.NOT_FOUND);
    expect(result.message).toBe('error.userNotFound');
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('fails with BAD_REQUEST when the current password does not match', async () => {
    userRepository.findOne.mockResolvedValue(buildUser(bcrypt.hashSync('correct-password', 10)));

    const dto: ChangePasswordDto = { currentPassword: 'wrong-password', newPassword: 'new-password' };
    const result = await userService.changePassword(userId, dto);

    expect(result.error).toBe(ErrorCode.BAD_REQUEST);
    expect(result.message).toBe('error.currentPasswordIncorrect');
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('saves the new plaintext password when the current password matches (the UserSubscriber hashes it on flush)', async () => {
    const user = buildUser(bcrypt.hashSync('correct-password', 10));
    userRepository.findOne.mockResolvedValue(user);
    userRepository.save.mockImplementation((entity: UserEntity) => Promise.resolve(entity));

    const dto: ChangePasswordDto = { currentPassword: 'correct-password', newPassword: 'brand-new-password' };
    const result = await userService.changePassword(userId, dto);

    expect(result.error).toBe(ErrorCode.SUCCESS);
    expect(result.message).toBe('success.passwordChanged');
    expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: userId, password: 'brand-new-password' }));
  });
});
