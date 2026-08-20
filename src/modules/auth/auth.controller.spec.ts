import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { UserService } from '../user/user.service.ts';
import { AuthController } from './auth.controller.ts';
import { AuthService } from './auth.service.ts';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: { validateUser: jest.Mock; createAccessToken: jest.Mock };
  let userService: { createUser: jest.Mock };

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      createAccessToken: jest.fn(),
    };
    userService = {
      createUser: jest.fn(),
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
});
