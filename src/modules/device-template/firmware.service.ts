import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { ErrorCode } from '../../constants/error-code.ts';
import type { IFile } from '../../interfaces/IFile.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { GeneratorService } from '../../shared/services/generator.service.ts';
import { DeviceTemplateEntity } from './device-template.entity.ts';
import type { CreateFirmwareDto, FirmwareDto, UpdateFirmwareDto } from './dtos/firmware.dto.ts';
import { FirmwareEntity } from './firmware.entity.ts';

/** Local disk root uploaded firmware binaries are written to, served back out under `/uploads` — see app.module.ts's ServeStaticModule config. */
const UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'firmware');

@Injectable()
export class FirmwareService {
  constructor(
    @InjectRepository(FirmwareEntity)
    private firmwareRepository: Repository<FirmwareEntity>,
    @InjectRepository(DeviceTemplateEntity)
    private deviceTemplateRepository: Repository<DeviceTemplateEntity>,
    private apiConfigService: ApiConfigService,
    private generatorService: GeneratorService,
  ) {}

  /** Raw-entity lookup for `DeviceOtaService.triggerUpdate` — needs the entity itself (e.g. `fileUrl`/`checksum`) to build the downlink payload, not a serialized DTO. */
  findEntityById(id: string): Promise<FirmwareEntity | null> {
    return this.firmwareRepository.findOneBy({ id });
  }

  /** Latest active build for a template, if any — backs `DeviceOtaService.getManifest`'s "is there a newer version" check. */
  findLatestActiveForTemplate(templateId: string): Promise<FirmwareEntity | null> {
    return this.firmwareRepository.findOne({ where: { templateId, isActive: true }, order: { createdAt: 'DESC' } });
  }

  async getFirmwares(templateId?: string): Promise<ResponseCore<FirmwareDto[]>> {
    const entities = await this.firmwareRepository.find({
      where: templateId ? { templateId } : {},
      order: { createdAt: 'DESC' },
    });

    return ResponseCore.ok(entities.toDtos());
  }

  async getFirmware(id: string): Promise<ResponseCore<FirmwareDto>> {
    const entity = await this.firmwareRepository.findOneBy({ id });

    if (!entity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.firmwareNotFound');
    }

    return ResponseCore.ok(entity.toDto());
  }

  /**
   * Registers a firmware build without a binary upload — `fileUrl` points at wherever the caller
   * already hosts it (S3/CDN/GitHub release/etc). See `uploadFirmware` for the multipart variant
   * that accepts and stores the `.bin` itself.
   */
  async createFirmware(userId: string, dto: CreateFirmwareDto): Promise<ResponseCore<FirmwareDto>> {
    const template = await this.deviceTemplateRepository.findOneBy({ id: dto.templateId });

    if (!template) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceTemplateNotFound');
    }

    const entity = this.firmwareRepository.create({ ...dto, createdBy: userId });
    await this.firmwareRepository.save(entity);

    return ResponseCore.ok(entity.toDto());
  }

  /**
   * Stores an uploaded `.bin` build on local disk under `UPLOAD_ROOT` and registers a firmware row
   * pointing at it — `checksum`/`sizeBytes` are computed from the actual bytes received rather than
   * trusted from the caller, so a device can always verify what it downloads matches what was
   * uploaded. The file is served back out at `${PUBLIC_API_URL}/uploads/firmware/<name>` (see
   * app.module.ts's second `ServeStaticModule` root) — this backend never proxies/streams it itself.
   */
  async uploadFirmware(
    userId: string,
    templateId: string,
    version: string,
    releaseNotes: string | null,
    file: IFile,
  ): Promise<ResponseCore<FirmwareDto>> {
    const template = await this.deviceTemplateRepository.findOneBy({ id: templateId });

    if (!template) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceTemplateNotFound');
    }

    if (!file?.buffer?.length) {
      return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.firmwareFileRequired');
    }

    const fileName = this.generatorService.fileName('bin');
    await fs.mkdir(UPLOAD_ROOT, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_ROOT, fileName), file.buffer);

    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    const fileUrl = `${this.apiConfigService.publicUrl}/uploads/firmware/${fileName}`;

    const entity = this.firmwareRepository.create({
      templateId,
      version,
      fileUrl,
      checksum,
      sizeBytes: file.buffer.length,
      releaseNotes,
      createdBy: userId,
    });
    await this.firmwareRepository.save(entity);

    return ResponseCore.ok(entity.toDto());
  }

  async updateFirmware(id: string, dto: UpdateFirmwareDto): Promise<ResponseCore<FirmwareDto>> {
    const entity = await this.firmwareRepository.findOneBy({ id });

    if (!entity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.firmwareNotFound');
    }

    Object.assign(entity, dto);
    await this.firmwareRepository.save(entity);

    return ResponseCore.ok(entity.toDto());
  }

  async deleteFirmware(id: string): Promise<ResponseCore<null>> {
    const entity = await this.firmwareRepository.findOneBy({ id });

    if (!entity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.firmwareNotFound');
    }

    await this.firmwareRepository.remove(entity);

    return ResponseCore.ok(null);
  }
}
