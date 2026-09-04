import { PasswordField } from '../../../decorators/field.decorators.ts';

export class ChangePasswordDto {
  @PasswordField()
  readonly currentPassword!: string;

  @PasswordField()
  readonly newPassword!: string;
}
