import { StringField, StringFieldOptional } from '../../../decorators/field.decorators.ts';

export class CreateFactoryDto {
  @StringField()
  name!: string;

  @StringFieldOptional({ nullable: true })
  address?: string | null;

  @StringFieldOptional({ nullable: true })
  description?: string | null;
}
