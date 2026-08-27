import { StringField } from '../../../decorators/field.decorators.ts';

export class UserLoginDto {
  @StringField()
  readonly usernameOrEmail!: string;

  @StringField()
  readonly password!: string;
}
