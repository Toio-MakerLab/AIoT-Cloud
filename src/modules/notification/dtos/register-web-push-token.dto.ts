import { StringField } from '../../../decorators/field.decorators.ts';

export class RegisterWebPushTokenDto {
  @StringField()
  token!: string;
}
