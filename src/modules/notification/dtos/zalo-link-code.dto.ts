import { StringField, StringFieldOptional } from '../../../decorators/field.decorators.ts';

/** Short-lived signed code the user pastes into the Zalo bot chat to link their account. */
export class ZaloLinkCodeDto {
  @StringField()
  code!: string;

  @StringFieldOptional({ nullable: true })
  shareUrl!: string | null;

  constructor(data: ZaloLinkCodeDto) {
    Object.assign(this, data);
  }
}
