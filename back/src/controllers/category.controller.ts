import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CategoryDto } from "../dtos/category.dto";
import { Category } from "../entities/category.entity";
import { CategoryService } from "../services/category.service";

@Controller('category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Post("create")
    async createCategory(@Body() category: CategoryDto, @Param('clientId') clientId: string) :Promise<Category |null> {
        return this.categoryService.createCategory(category);
    }

    @Get("getAll")
    async getAllCategories():Promise<Category[]> {
        return this.categoryService.getAllCategories();
    }
    
}