// section.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { sectionController } from '../controllers/section.controller';
import { Section } from '../entities/section.entity';
import { SectionRepository } from '../repositories/section.repository';
import { SectionService } from '../services/section.service';
import { CategoryModule } from './category.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Section]),
    CategoryModule, // <-- Añade esta línea para que SectionModule pueda usar CategoryService
  ],
  controllers: [sectionController],
  providers: [SectionService, SectionRepository],
  exports: [SectionService, SectionRepository],
})
export class SectionModule {}
