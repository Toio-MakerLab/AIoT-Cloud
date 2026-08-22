import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import type { PageDto } from '../../common/dto/page.dto.ts';
import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { ErrorCode } from '../../constants/error-code.ts';
import { DeviceEntity } from '../device/device.entity.ts';
import { CreateDeviceTemplateDto } from './dtos/create-device-template.dto.ts';
import type { DeviceTemplateDto } from './dtos/device-template.dto.ts';
import type { DeviceTemplatesPageOptionsDto } from './dtos/device-templates-page-options.dto.ts';
import { UpdateDeviceTemplateDto } from './dtos/update-device-template.dto.ts';
import { DeviceTemplateEntity } from './device-template.entity.ts';

@Injectable()
export class DeviceTemplateService {
  constructor(
    @InjectRepository(DeviceTemplateEntity)
    private deviceTemplateRepository: Repository<DeviceTemplateEntity>,
    @InjectRepository(DeviceEntity)
    private deviceRepository: Repository<DeviceEntity>,
  ) {}

  async getDeviceTemplates(pageOptionsDto: DeviceTemplatesPageOptionsDto): Promise<PageDto<DeviceTemplateDto>> {
    const queryBuilder = this.deviceTemplateRepository.createQueryBuilder('deviceTemplate');
    queryBuilder.orderBy('deviceTemplate.createdAt', pageOptionsDto.order);

    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    return items.toPageDto(pageMetaDto);
  }

  async getDeviceTemplate(id: Uuid): Promise<ResponseCore<DeviceTemplateDto>> {
    const entity = await this.deviceTemplateRepository.findOneBy({ id });

    if (!entity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceTemplateNotFound');
    }

    return ResponseCore.ok(entity.toDto());
  }

  @Transactional()
  async createDeviceTemplate(dto: CreateDeviceTemplateDto): Promise<ResponseCore<DeviceTemplateDto>> {
    const entity = this.deviceTemplateRepository.create(dto);
    await this.deviceTemplateRepository.save(entity);

    return ResponseCore.ok(entity.toDto());
  }

  @Transactional()
  async updateDeviceTemplate(id: Uuid, dto: UpdateDeviceTemplateDto): Promise<ResponseCore<DeviceTemplateDto>> {
    const entity = await this.deviceTemplateRepository.findOneBy({ id });

    if (!entity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceTemplateNotFound');
    }

    Object.assign(entity, dto);
    await this.deviceTemplateRepository.save(entity);

    return ResponseCore.ok(entity.toDto());
  }

  @Transactional()
  async deleteDeviceTemplate(id: Uuid): Promise<ResponseCore<null>> {
    const entity = await this.deviceTemplateRepository.findOneBy({ id });

    if (!entity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceTemplateNotFound');
    }

    const deviceCount = await this.deviceRepository.countBy({ templateId: id });

    if (deviceCount > 0) {
      return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.deviceTemplateInUse');
    }

    await this.deviceTemplateRepository.remove(entity);

    return ResponseCore.ok(null);
  }
}
