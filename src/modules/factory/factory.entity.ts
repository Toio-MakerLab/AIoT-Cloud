import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { FactoryDto } from './dtos/factory.dto.ts';

/** A physical site/plant (e.g. an industrial-zone factory). Users, devices and dashboards can be
 * assigned to one, which widens their read access from "my own records" to "every record my
 * factory owns" — see `resolveAccessScope` in `src/common/access-scope.util.ts`. */
@Entity({ name: 'factories' })
@UseDto(FactoryDto)
export class FactoryEntity extends AbstractEntity<FactoryDto> {
  @Index({ unique: true })
  @Column({ type: 'varchar' })
  name!: string;

  @Column({ nullable: true, type: 'varchar' })
  address!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  description!: string | null;
}
