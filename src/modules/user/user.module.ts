import { Module, type OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreateSettingsHandler } from './commands/create-settings.command.ts';
import { UserController } from './user.controller.ts';
import { UserEntity } from './user.entity.ts';
import { UserService } from './user.service.ts';
import { UserSettingsEntity } from './user-settings.entity.ts';

const handlers = [CreateSettingsHandler];

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserSettingsEntity])],
  controllers: [UserController],
  exports: [UserService],
  providers: [UserService, ...handlers],
})
export class UserModule implements OnModuleInit {
  constructor(private readonly userService: UserService) {}

  async onModuleInit() {
    await this.userService.initRootUser();
  }
}
