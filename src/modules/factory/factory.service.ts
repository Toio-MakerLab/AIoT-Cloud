import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import type { PageDto } from '../../common/dto/page.dto.ts';
import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { ErrorCode } from '../../constants/error-code.ts';
import { DeviceEntity } from '../device/device.entity.ts';
import { UserEntity } from '../user/user.entity.ts';
import { CreateFactoryDto } from './dtos/create-factory.dto.ts';
import type { FactoriesPageOptionsDto } from './dtos/factories-page-options.dto.ts';
import type { FactoryDto } from './dtos/factory.dto.ts';
import { UpdateFactoryDto } from './dtos/update-factory.dto.ts';
import { FactoryEntity } from './factory.entity.ts';

@Injectable()
export class FactoryService {
  private readonly logger = new Logger(FactoryService.name);

  constructor(
    @InjectRepository(FactoryEntity)
    private factoryRepository: Repository<FactoryEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(DeviceEntity)
    private deviceRepository: Repository<DeviceEntity>,
  ) {}

  async getFactories(pageOptionsDto: FactoriesPageOptionsDto): Promise<PageDto<FactoryDto>> {
    try {
      const queryBuilder = this.factoryRepository.createQueryBuilder('factory');
      queryBuilder.orderBy('factory.createdAt', pageOptionsDto.order);

      const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);
      if (!items || items.length === 0) {
        return [].toPageDto(pageMetaDto);
      }

      return items.toPageDto(pageMetaDto);
    } catch (error) {
      this.logger.error('Error occurred while fetching factories', error);
      throw error;
    }
  }

  async getFactory(id: string): Promise<ResponseCore<FactoryDto>> {
    const entity = await this.factoryRepository.findOneBy({ id });

    if (!entity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.factoryNotFound');
    }

    return ResponseCore.ok(entity.toDto());
  }

  @Transactional()
  async createFactory(dto: CreateFactoryDto): Promise<ResponseCore<FactoryDto>> {
    const entity = this.factoryRepository.create(dto);
    await this.factoryRepository.save(entity);

    return ResponseCore.ok(entity.toDto());
  }

  @Transactional()
  async updateFactory(id: string, dto: UpdateFactoryDto): Promise<ResponseCore<FactoryDto>> {
    const entity = await this.factoryRepository.findOneBy({ id });

    if (!entity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.factoryNotFound');
    }

    Object.assign(entity, dto);
    await this.factoryRepository.save(entity);

    return ResponseCore.ok(entity.toDto());
  }

  @Transactional()
  async deleteFactory(id: string): Promise<ResponseCore<null>> {
    const entity = await this.factoryRepository.findOneBy({ id });

    if (!entity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.factoryNotFound');
    }

    const [userCount, deviceCount] = await Promise.all([
      this.userRepository.countBy({ factoryId: id }),
      this.deviceRepository.countBy({ factoryId: id }),
    ]);

    if (userCount > 0 || deviceCount > 0) {
      return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.factoryInUse');
    }

    await this.factoryRepository.remove(entity);

    return ResponseCore.ok(null);
  }
}
