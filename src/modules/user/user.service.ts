import { randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { FindOptionsWhere, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import type { PageDto } from '../../common/dto/page.dto.ts';
import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { ErrorCode } from '../../constants/error-code.ts';
import { RoleType } from '../../constants/role-type.ts';
import type { IFile } from '../../interfaces/IFile.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { MailService } from '../../shared/services/mail.service.ts';
import type { Reference } from '../../types.ts';
import { UserRegisterDto } from '../auth/dto/user-register.dto.ts';
import { CreateSettingsCommand } from './commands/create-settings.command.ts';
import { CreateSettingsDto } from './dtos/create-settings.dto.ts';
import type { CreateUserDto } from './dtos/create-user.dto.ts';
import type { UpdateUserDto } from './dtos/update-user.dto.ts';
import type { UserDto } from './dtos/user.dto.ts';
import type { UsersPageOptionsDto } from './dtos/users-page-options.dto.ts';
import { UserEntity } from './user.entity.ts';
import { UserSettingsEntity } from './user-settings.entity.ts';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserSettingsEntity)
    private userSettingsRepository: Repository<UserSettingsEntity>,
    private commandBus: CommandBus,
    private mailService: MailService,
    private apiConfigService: ApiConfigService,
  ) {}

  /**
   * Find single user (loads settings relation)
   */
  findOne(findData: FindOptionsWhere<UserEntity>): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: findData,
      relations: ['settings'],
    });
  }

  findByUsernameOrEmail(options: Partial<{ username: string; email: string }>): Promise<UserEntity | null> {
    const queryBuilder = this.userRepository.createQueryBuilder('user').leftJoinAndSelect<UserEntity, 'user'>('user.settings', 'settings');

    if (options.email) {
      queryBuilder.orWhere('user.email = :email', {
        email: options.email,
      });
    }

    if (options.username) {
      queryBuilder.orWhere('user.username = :username', {
        username: options.username,
      });
    }

    return queryBuilder.getOne();
  }

  @Transactional()
  async createUser(userRegisterDto: UserRegisterDto, _?: Reference<IFile>): Promise<ResponseCore<UserEntity>> {
    const existing = await this.findByUsernameOrEmail({
      username: userRegisterDto.username,
      email: userRegisterDto.email,
    });

    if (existing) {
      return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.userAlreadyExists');
    }

    const user = this.userRepository.create(userRegisterDto);

    // if (file && !this.validatorService.isImage(file.mimetype)) {
    //   return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.fileNotImage');
    // }

    // if (file) {
    //   user.avatar = await this.awsS3Service.uploadImage(file);
    // }

    await this.userRepository.save(user);

    const emailVerificationToken = randomBytes(32).toString('hex');

    user.settings = await this.createSettings(user.id, {
      isEmailVerified: false,
      isPhoneVerified: false,
      emailVerificationToken,
      emailVerificationTokenExpiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    });

    await this.mailService.sendVerificationEmail(user.email!, emailVerificationToken);

    return ResponseCore.ok(user);
  }

  /**
   * Admin/root-driven user creation. Unlike self-registration (createUser
   * above), this skips the email-verification flow since the account is
   * being vouched for by an already-trusted operator.
   */
  @Transactional()
  async createUserByAdmin(dto: CreateUserDto): Promise<ResponseCore<UserDto>> {
    const existing = await this.findByUsernameOrEmail({
      username: dto.username,
      email: dto.email,
    });

    if (existing) {
      return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.userAlreadyExists');
    }

    const user = this.userRepository.create(dto);
    await this.userRepository.save(user);

    user.settings = await this.userSettingsRepository.save(
      this.userSettingsRepository.create({
        userId: user.id,
        isEmailVerified: true,
        isPhoneVerified: true,
      }),
    );

    return ResponseCore.ok(user.toDto());
  }

  @Transactional()
  async updateUser(userId: string, dto: UpdateUserDto): Promise<ResponseCore<UserDto>> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['settings'] });

      if (!user) {
        return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.userNotFound');
      }

      if (dto.username || dto.email) {
        const existing = await this.findByUsernameOrEmail({
          username: dto.username,
          email: dto.email,
        });

        if (existing && existing.id !== userId) {
          return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.userAlreadyExists');
        }
      }

      const { isActive, ...userFields } = dto;

      Object.assign(user, userFields);
      await this.userRepository.save(user);

      if (isActive !== undefined && user.settings) {
        user.settings.isActive = isActive;
        await this.userSettingsRepository.save(user.settings);
      }

      return ResponseCore.ok(user.toDto());
    } catch (error: any) {
      return ResponseCore.fail(ErrorCode.INTERNAL_SERVER_ERROR, error.message || 'error.internalServerError');
    }
  }

  @Transactional()
  async initRootUser(): Promise<void> {
    const existing = await this.findByUsernameOrEmail({
      username: 'root',
    });

    if (existing) {
      return;
    }

    const user = this.userRepository.create({
      username: 'root',
      firstName: 'Root',
      lastName: 'User',
      email: 'root@example.com',
      password: this.apiConfigService.rootPassword,
      role: RoleType.ROOT,
    });

    await this.userRepository.save(user);

    const settings = this.userSettingsRepository.create({
      userId: user.id,
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    user.settings = await this.userSettingsRepository.save(settings);
  }

  async verifyEmail(email: string, token: string): Promise<ResponseCore<null>> {
    const user = await this.findByUsernameOrEmail({ email });

    if (!user?.settings) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.userNotFound');
    }

    if (user.settings.isEmailVerified) {
      return ResponseCore.ok(null, 'success.emailAlreadyVerified');
    }

    const tokenExpired = !user.settings.emailVerificationTokenExpiresAt || user.settings.emailVerificationTokenExpiresAt.getTime() < Date.now();

    if (!user.settings.emailVerificationToken || user.settings.emailVerificationToken !== token || tokenExpired) {
      return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.invalidOrExpiredToken');
    }

    user.settings.isEmailVerified = true;
    user.settings.emailVerificationToken = null;
    user.settings.emailVerificationTokenExpiresAt = null;
    await this.userSettingsRepository.save(user.settings);

    return ResponseCore.ok(null, 'success.emailVerified');
  }

  async resendVerification(email: string): Promise<ResponseCore<null>> {
    const user = await this.findByUsernameOrEmail({ email });

    if (!user?.settings) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.userNotFound');
    }

    if (user.settings.isEmailVerified) {
      return ResponseCore.ok(null, 'success.emailAlreadyVerified');
    }

    const emailVerificationToken = randomBytes(32).toString('hex');

    user.settings.emailVerificationToken = emailVerificationToken;
    user.settings.emailVerificationTokenExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    await this.userSettingsRepository.save(user.settings);

    await this.mailService.sendVerificationEmail(user.email!, emailVerificationToken);

    return ResponseCore.ok(null, 'success.verificationEmailSent');
  }

  async getUsers(pageOptionsDto: UsersPageOptionsDto): Promise<PageDto<UserDto>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    return items.toPageDto(pageMetaDto);
  }

  async getUser(userId: string): Promise<ResponseCore<UserDto>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    queryBuilder.where('user.id = :userId', { userId });

    const userEntity = await queryBuilder.getOne();

    if (!userEntity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.userNotFound');
    }

    return ResponseCore.ok(userEntity.toDto());
  }

  createSettings(userId: string, createSettingsDto: CreateSettingsDto): Promise<UserSettingsEntity> {
    return this.commandBus.execute<CreateSettingsCommand, UserSettingsEntity>(new CreateSettingsCommand(userId, createSettingsDto));
  }
}
