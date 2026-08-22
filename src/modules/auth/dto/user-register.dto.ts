import { EmailField, PasswordField, PhoneFieldOptional, StringField } from '../../../decorators/field.decorators.ts';

export class UserRegisterDto {
  @StringField({ minLength: 3, maxLength: 32 })
  readonly username!: string;

  @StringField()
  readonly firstName!: string;

  @StringField()
  readonly lastName!: string;

  @EmailField()
  readonly email!: string;

  @PasswordField({ minLength: 6 })
  readonly password!: string;

  @PhoneFieldOptional()
  phone?: string;
}
