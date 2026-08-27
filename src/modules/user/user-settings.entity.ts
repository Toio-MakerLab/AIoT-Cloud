import type { Relation } from 'typeorm';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { UserDto } from './dtos/user.dto.ts';
import { UserEntity } from './user.entity.ts';

@Entity({ name: 'user_settings' })
@UseDto(UserDto)
export class UserSettingsEntity extends AbstractEntity<UserDto> {
  @Column({ default: false })
  isEmailVerified?: boolean;

  @Column({ default: true })
  isActive?: boolean;

  @Column({ default: false })
  isPhoneVerified?: boolean;

  @Column({ type: 'varchar', nullable: true })
  emailVerificationToken?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerificationTokenExpiresAt?: Date | null;

  @Column({ type: 'varchar' })
  userId?: string;

  @OneToOne(
    () => UserEntity,
    (user) => user.settings,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'user_id' })
  user?: Relation<UserEntity>;
}
