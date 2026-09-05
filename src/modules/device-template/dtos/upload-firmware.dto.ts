import { StringField, StringFieldOptional } from '../../../decorators/field.decorators.ts';

/** Form fields alongside the `.bin` in `POST /firmwares/upload`'s multipart body. */
export class UploadFirmwareDto {
  @StringField()
  templateId!: string;

  @StringField()
  version!: string;

  @StringFieldOptional({ nullable: true })
  releaseNotes?: string | null;
}
