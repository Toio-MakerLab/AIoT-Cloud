import { Column, Entity, Index, OneToOne, VirtualColumn } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { RoleType } from '../../constants/role-type.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { UserDto } from './dtos/user.dto.ts';
import { UserSettingsEntity } from './user-settings.entity.ts';

@Entity({ name: 'users' })
@UseDto(UserDto)
export class UserEntity extends AbstractEntity<UserDto> {
  @Column({ nullable: true, type: 'varchar' })
  firstName!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  lastName!: string | null;

  @Column({ type: 'varchar', length: 16, default: RoleType.USER })
  role!: RoleType;

  @Column({ type: 'varchar', length: 32, nullable: false, unique: true })
  username!: string;

  @Column({ unique: true, nullable: true, type: 'varchar' })
  email!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  password!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  phone!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  avatar!: string | null;

  /** The factory this account belongs to — widens read access from "my own records" to
   * "every record this factory owns" (devices, dashboards, and other factory members).
   * `null` means the account isn't assigned to a factory yet and falls back to own-user scoping. */
  @Index()
  @Column({ nullable: true, type: 'varchar' })
  factoryId!: string | null;

  @VirtualColumn({
    query: (alias) => `SELECT CONCAT(${alias}.first_name, ' ', ${alias}.last_name)`,
  })
  fullName!: string;

  @OneToOne(
    () => UserSettingsEntity,
    (userSettings) => userSettings.user,
  )
  settings?: UserSettingsEntity;
}
