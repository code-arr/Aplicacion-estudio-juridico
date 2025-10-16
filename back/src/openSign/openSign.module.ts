// src/opensign/opensign.module.ts
import { Module } from '@nestjs/common';
import { OpenSignService } from './openSign.service';
import { OpenSignController } from './openSign.controller';


@Module({
  providers: [OpenSignService],
  controllers: [OpenSignController],
})
export class OpenSignModule {}