import { BooleanFieldOptional, StringFieldOptional } from '../../../decorators/field.decorators.ts';

export class UpsertNotificationConfigDto {
  @StringFieldOptional({ nullable: true })
  messageTemplate?: string | null;

  @BooleanFieldOptional()
  isEnabled?: boolean;
}
