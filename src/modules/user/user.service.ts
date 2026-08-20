import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { FindOptionsWhere, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import type { PageDto } from '../../common/dto/page.dto.ts';
import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { ErrorCode } from '../../constants/error-code.ts';
import type { IFile } from '../../interfaces/IFile.ts';
import { AwsS3Service } from '../../shared/services/aws-s3.service.ts';
import { ValidatorService } from '../../shared/services/validator.service.ts';
import type { Reference } from '../../types.ts';
import { UserRegisterDto } from '../auth/dto/user-register.dto.ts';
import { CreateSettingsCommand } from './commands/create-settings.command.ts';
import { CreateSettingsDto } from './dtos/create-settings.dto.ts';
import type { UserDto } from './dtos/user.dto.ts';
import type { UsersPageOptionsDto } from './dtos/users-page-options.dto.ts';
import { UserEntity } from './user.entity.ts';
import type { UserSettingsEntity } from './user-settings.entity.ts';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private validatorService: ValidatorService,
    private awsS3Service: AwsS3Service,
    private commandBus: CommandBus,
  ) {}

  /**
   * Find single user
   */
  findOne(findData: FindOptionsWhere<UserEntity>): Promise<UserEntity | null> {
    return this.userRepository.findOneBy(findData);
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
  async createUser(userRegisterDto: UserRegisterDto, file?: Reference<IFile>): Promise<ResponseCore<UserEntity>> {
    const user = this.userRepository.create({
      ...userRegisterDto,
      username: userRegisterDto.email.split('@')[0],
    });

    // if (file && !this.validatorService.isImage(file.mimetype)) {
    //   return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.fileNotImage');
    // }

    // if (file) {
    //   user.avatar = await this.awsS3Service.uploadImage(file);
    // }

    await this.userRepository.save(user);

    // user.settings = await this.createSettings(
    //   user.id,
    //   plainToClass(CreateSettingsDto, {
    //     isEmailVerified: false,
    //     isPhoneVerified: false,
    //   }),
    // );

    return ResponseCore.ok(user);
  }

  async getUsers(pageOptionsDto: UsersPageOptionsDto): Promise<PageDto<UserDto>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    return items.toPageDto(pageMetaDto);
  }

  async getUser(userId: Uuid): Promise<ResponseCore<UserDto>> {
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
