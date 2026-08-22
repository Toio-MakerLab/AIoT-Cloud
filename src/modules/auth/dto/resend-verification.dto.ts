import { EmailField } from '../../../decorators/field.decorators.ts';

export class ResendVerificationDto {
  @EmailField()
  readonly email!: string;
}
