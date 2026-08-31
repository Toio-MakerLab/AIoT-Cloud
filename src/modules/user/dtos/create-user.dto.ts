import { RoleType } from '../../../constants/role-type.ts';
import {
  EmailFieldOptional,
  EnumFieldOptional,
  PasswordField,
  PhoneFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class CreateUserDto {
  @StringField({ minLength: 3, maxLength: 32 })
  readonly username!: string;

  @PasswordField({ minLength: 6 })
  readonly password!: string;

  @StringFieldOptional()
  firstName?: string;

  @StringFieldOptional()
  lastName?: string;

  @EmailFieldOptional()
  email?: string;

  @PhoneFieldOptional()
  phone?: string;

  @EnumFieldOptional(() => RoleType)
  role?: RoleType;

  @StringFieldOptional({ nullable: true })
  factoryId?: string | null;
}
