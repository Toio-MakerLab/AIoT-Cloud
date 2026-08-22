import { EmailField, StringField } from '../../../decorators/field.decorators.ts';

export class VerifyEmailDto {
  @EmailField()
  readonly email!: string;

  @StringField()
  readonly token!: string;
}
