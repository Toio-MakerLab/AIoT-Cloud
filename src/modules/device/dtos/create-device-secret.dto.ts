import { StringFieldOptional } from '../../../decorators/field.decorators.ts';

export class CreateDeviceSecretDto {
  @StringFieldOptional()
  label?: string;
}
