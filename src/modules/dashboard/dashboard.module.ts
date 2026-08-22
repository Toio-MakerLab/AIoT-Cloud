import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DashboardController } from './dashboard.controller.ts';
import { DashboardEntity } from './dashboard.entity.ts';
import { DashboardService } from './dashboard.service.ts';

@Module({
  imports: [TypeOrmModule.forFeature([DashboardEntity])],
  controllers: [DashboardController],
  exports: [DashboardService],
  providers: [DashboardService],
})
export class DashboardModule {}
