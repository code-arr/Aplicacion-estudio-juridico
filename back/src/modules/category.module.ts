// category.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController } from 'src/controllers/category.controller';
import { Category } from 'src/entities/category.entity';
import { CategoryRepository } from 'src/repositories/category.repository';
import { CategoryService } from 'src/services/category.service';
import { ClienteModule } from './cliente.module';


@Module({
    imports: [
        TypeOrmModule.forFeature([Category]),
        ClienteModule // <-- Para poder usar el ClienteService
    ],
    controllers: [CategoryController],
    providers: [CategoryService, CategoryRepository],
    exports: [CategoryService, CategoryRepository],
})
export class CategoryModule {}