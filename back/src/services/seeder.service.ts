import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CategoryService } from './category.service';
import { SectionService } from './section.service';
import { ItemTypeService } from './itemType.service';
import { categoriesData } from '../utils/categories';

@Injectable()
export class SeederService {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly sectionService: SectionService,
    private readonly itemTypeService: ItemTypeService,
  ) {}

  public async seedDataBase() {
    const existingCategories = await this.categoryService.getAllCategories();

    if (existingCategories.length > 0) {
      console.log('La base de datos ya contiene datos. Seeder cancelado.');
      return;
    }

    console.log('La base de datos está vacía. Iniciando el seeding...');

    for (const categoryData of categoriesData) {
      const savedCategory = await this.categoryService.createCategory(categoryData);

      if (categoryData.sections) {
        for (const sectionData of categoryData.sections) {
          const savedSection = await this.sectionService.createSection(sectionData, savedCategory.id);

          if (sectionData.itemTypes) {
            for (const itemTypeData of sectionData.itemTypes) {
              await this.itemTypeService.createItemType(itemTypeData, savedSection.id);
            }
          }
        }
      }
    }

    console.log('Seeding completado exitosamente.');
  }
}