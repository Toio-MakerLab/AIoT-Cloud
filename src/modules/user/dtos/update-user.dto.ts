import { RoleType } from '../../../constants/role-type.ts';
import {
  BooleanFieldOptional,
  EmailFieldOptional,
  EnumFieldOptional,
  PasswordFieldOptional,
  PhoneFieldOptional,
  StringFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class UpdateUserDto {
  @StringFieldOptional({ minLength: 3, maxLength: 32 })
  username?: string;

  @PasswordFieldOptional({ minLength: 6 })
  password?: string;

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

  @BooleanFieldOptional()
  isActive?: boolean;

  @StringFieldOptional({ nullable: true })
  factoryId?: string | null;
}
