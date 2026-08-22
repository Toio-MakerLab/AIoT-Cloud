import { BooleanFieldOptional, DateFieldOptional, StringFieldOptional } from '../../../decorators/field.decorators.ts';

export class CreateSettingsDto {
  @BooleanFieldOptional()
  isEmailVerified?: boolean;

  @BooleanFieldOptional()
  isPhoneVerified?: boolean;

  @StringFieldOptional({ nullable: true })
  emailVerificationToken?: string | null;

  @DateFieldOptional({ nullable: true })
  emailVerificationTokenExpiresAt?: Date | null;
}
