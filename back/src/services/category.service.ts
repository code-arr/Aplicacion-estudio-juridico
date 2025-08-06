import { Injectable } from "@nestjs/common";
import { CategoryDto } from "src/dtos/category.dto";
import { Category } from "src/entities/category.entity";
import { CategoryRepository } from "src/repositories/category.repository";

@Injectable()
export class CategoryService {
    constructor(private readonly categoryRepository: CategoryRepository) {}

    async createCategory(category: CategoryDto): Promise<Category> {
        return this.categoryRepository.createCategory(category);
    }

    async getOneById(categoryId : string) :Promise<Category|null>{
        return this.categoryRepository.getOneById(categoryId);
    }
    async getAllCategories():Promise<Category[]>{
    return this.categoryRepository.getAllCategories();
  }
}