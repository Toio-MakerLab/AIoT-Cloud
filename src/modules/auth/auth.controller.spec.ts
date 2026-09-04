import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { ErrorCode } from '../../constants/error-code.ts';
import { UserEntity } from '../user/user.entity.ts';
import { UserService } from '../user/user.service.ts';
import { AuthController } from './auth.controller.ts';
import { AuthService } from './auth.service.ts';
import type { ChangePasswordDto } from './dto/change-password.dto.ts';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: { validateUser: jest.Mock; createAccessToken: jest.Mock };
  let userService: { createUser: jest.Mock; changePassword: jest.Mock };

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      createAccessToken: jest.fn(),
    };
    userService = {
      createUser: jest.fn(),
      changePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('changePassword', () => {
    const user = { id: 'user-1' } as UserEntity;
    const dto: ChangePasswordDto = { currentPassword: 'old-password', newPassword: 'new-password' };

    it('delegates to userService.changePassword with the authenticated user id', async () => {
      const expected = ResponseCore.ok(null, 'success.passwordChanged');
      userService.changePassword.mockResolvedValue(expected);

      const result = await authController.changePassword(user, dto);

      expect(userService.changePassword).toHaveBeenCalledWith(user.id, dto);
      expect(result).toBe(expected);
    });

    it('surfaces a failure result from userService.changePassword unchanged', async () => {
      const expected = ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.currentPasswordIncorrect');
      userService.changePassword.mockResolvedValue(expected);

      const result = await authController.changePassword(user, dto);

      expect(result).toBe(expected);
    });
  });
});
