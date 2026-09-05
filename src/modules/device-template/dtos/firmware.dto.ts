import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import {
  BooleanField,
  BooleanFieldOptional,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
  URLField,
} from '../../../decorators/field.decorators.ts';
import type { FirmwareEntity } from '../firmware.entity.ts';

export class FirmwareDto extends AbstractDto {
  @StringField()
  templateId!: string;

  @StringField()
  version!: string;

  @URLField()
  fileUrl!: string;

  @StringFieldOptional({ nullable: true })
  checksum?: string | null;

  @NumberFieldOptional({ nullable: true, int: true })
  sizeBytes?: number | null;

  @StringFieldOptional({ nullable: true })
  releaseNotes?: string | null;

  @BooleanField()
  isActive!: boolean;

  @StringField()
  createdBy!: string;

  constructor(entity: FirmwareEntity) {
    super(entity);
    this.templateId = entity.templateId;
    this.version = entity.version;
    this.fileUrl = entity.fileUrl;
    this.checksum = entity.checksum;
    this.sizeBytes = entity.sizeBytes;
    this.releaseNotes = entity.releaseNotes;
    this.isActive = entity.isActive;
    this.createdBy = entity.createdBy;
  }
}

export class CreateFirmwareDto {
  @StringField()
  templateId!: string;

  @StringField()
  version!: string;

  @URLField()
  fileUrl!: string;

  /** SHA-256 hex digest of the binary; optional but strongly recommended so the device can verify the download. */
  @StringFieldOptional({ nullable: true })
  checksum?: string | null;

  @NumberFieldOptional({ nullable: true, int: true, isPositive: true })
  sizeBytes?: number | null;

  @StringFieldOptional({ nullable: true })
  releaseNotes?: string | null;
}

export class UpdateFirmwareDto {
  @StringFieldOptional({ nullable: true })
  releaseNotes?: string | null;

  /** Pulls a bad build from `DeviceOtaService.triggerUpdate` without deleting its history. */
  @BooleanFieldOptional()
  isActive?: boolean;
}
