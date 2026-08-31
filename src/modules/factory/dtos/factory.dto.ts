import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { StringField, StringFieldOptional } from '../../../decorators/field.decorators.ts';
import type { FactoryEntity } from '../factory.entity.ts';

export class FactoryDto extends AbstractDto {
  @StringField()
  name!: string;

  @StringFieldOptional({ nullable: true })
  address?: string | null;

  @StringFieldOptional({ nullable: true })
  description?: string | null;

  constructor(entity: FactoryEntity) {
    super(entity);
    this.name = entity.name;
    this.address = entity.address;
    this.description = entity.description;
  }
}
