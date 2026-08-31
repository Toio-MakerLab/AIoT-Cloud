import { StringFieldOptional } from '../../../decorators/field.decorators.ts';

export class UpdateFactoryDto {
  @StringFieldOptional()
  name?: string;

  @StringFieldOptional({ nullable: true })
  address?: string | null;

  @StringFieldOptional({ nullable: true })
  description?: string | null;
}
