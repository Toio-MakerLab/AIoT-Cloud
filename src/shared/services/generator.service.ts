import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { SnowflakeId } from '@vkhang2stack/snowflake-id';
import { v7 as uuid } from 'uuid';

@Injectable()
export class GeneratorService {
  private static instance: GeneratorService;

  private static snowflake = SnowflakeId({
    workerId: Math.round((randomBytes(4).readUInt32BE(0) / 0xff_ff_ff_ff) * 254) + 1,
    epoch: 1_597_017_600_000,
  });

  public static getInstance(): GeneratorService {
    if (!GeneratorService.instance) {
      GeneratorService.instance = new GeneratorService();
    }

    return GeneratorService.instance;
  }

  public uuid(): string {
    return uuid();
  }

  public fileName(ext: string): string {
    return `${this.uuid()}.${ext}`;
  }

  public generateId(): string {
    return GeneratorService.snowflake.generate();
  }
}
