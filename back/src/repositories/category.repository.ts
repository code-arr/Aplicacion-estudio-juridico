import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryDto } from '../dtos/category.dto';
import { Category } from '../entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryRepository implements OnModuleInit{
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async onModuleInit() {
      await this.seedCategories();
  }
  async createCategory(category: CategoryDto): Promise<Category> {
    try {
      return this.categoryRepository.save(category);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Error al crear la categoría: ' + error);
    }
  }

  async getOneById(categoryId: string): Promise<Category | null> {
    return await this.categoryRepository.findOne({ where: { id: categoryId } });
  }

  async getAllCategories(): Promise<Category[]> {
    return await this.categoryRepository.find();
  }

  async seedCategories(): Promise<void> {
    const existingCategories = await this.categoryRepository.find();
    if (existingCategories.length > 0) {
      return;
    }
    const categories: CategoryDto[] = [
      { name: 'Corporativo' },
      { name: 'Judicial' },
      { name: 'Compliance' },
      { name: 'Informes' },
      { name: 'Procesos administrativos' }
    ];


    await this.categoryRepository.save(categories);
  }
  }

