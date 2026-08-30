import { createHash, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { ErrorCode } from '../../constants/error-code.ts';
import { DeviceSecretEntity } from './device-secret.entity.ts';
import type { CreateDeviceSecretDto } from './dtos/create-device-secret.dto.ts';
import type { DeviceSecretDto } from './dtos/device-secret.dto.ts';

export interface CreatedDeviceSecret {
  deviceSecret: DeviceSecretDto;
  plaintext: string;
}

@Injectable()
export class DeviceSecretService {
  constructor(
    @InjectRepository(DeviceSecretEntity)
    private deviceSecretRepository: Repository<DeviceSecretEntity>,
  ) {}

  async list(): Promise<ResponseCore<DeviceSecretDto[]>> {
    const secrets = await this.deviceSecretRepository.find({ order: { createdAt: 'DESC' } });

    return ResponseCore.ok(secrets.toDtos());
  }

  async create(userId: string, dto: CreateDeviceSecretDto): Promise<ResponseCore<CreatedDeviceSecret>> {
    const plaintext = randomBytes(32).toString('hex');

    const entity = this.deviceSecretRepository.create({
      label: dto.label ?? null,
      secretHash: this.hash(plaintext),
      createdByUserId: userId,
      revokedAt: null,
    });

    await this.deviceSecretRepository.save(entity);

    return ResponseCore.ok({ deviceSecret: entity.toDto(), plaintext });
  }

  async revoke(id: string): Promise<ResponseCore<DeviceSecretDto>> {
    const secret = await this.deviceSecretRepository.findOneBy({ id });

    if (!secret) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceSecretNotFound');
    }

    if (!secret.revokedAt) {
      secret.revokedAt = new Date();
      await this.deviceSecretRepository.save(secret);
    }

    return ResponseCore.ok(secret.toDto());
  }

  async verify(secret: string): Promise<boolean> {
    const match = await this.deviceSecretRepository.findOneBy({
      secretHash: this.hash(secret),
      revokedAt: IsNull(),
    });

    return !!match;
  }

  private hash(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
  }
}
