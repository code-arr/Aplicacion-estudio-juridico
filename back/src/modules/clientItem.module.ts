import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientItem } from '../entities/clientItem.entity';
import { ItemTypeModule } from './itemType.module';
import { ClientItemService } from '../services/clientItem.service';
import { ClientItemController } from '../controllers/clientItem.controller';
import { ClientItemRepository } from '../repositories/clientItem.repository';
import { ClienteModule } from './cliente.module';
import { AbogadoModule } from './abogado.module';
import { SectionModule } from './sectionModule';
import { CategoryModule } from './category.module';
import { EventModule } from './event.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientItem]),
    ItemTypeModule,
    ClienteModule,
    AbogadoModule,
    SectionModule,
    CategoryModule,
    EventModule,
  ],
  controllers: [ClientItemController],
  providers: [ClientItemService, ClientItemRepository],
  exports: [ClientItemService, ClientItemRepository],
})
export class clientItemModule {}
