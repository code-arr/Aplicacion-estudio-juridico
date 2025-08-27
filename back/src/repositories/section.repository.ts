import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { sectionDto } from "../dtos/section.dto";
import { Repository } from "typeorm";
import { CategoryService } from "../services/category.service";
import { Section } from "../entities/section.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ComplianceSections, CorporativeSections, JudicialSections, ProcesosAdministrativosSections } from "src/utils/sections";

@Injectable()
export class SectionRepository implements OnModuleInit { // <-- Nombre de clase corregido para claridad
    constructor(
        @InjectRepository(Section)
        private sectionRepository: Repository<Section>,
        private readonly categoryService: CategoryService
    ) {}

    async onModuleInit() {
        await this.seedSections();
    }

    async seedSections(): Promise<void> {
        const corporativeSections = CorporativeSections;
        const judicialSections = JudicialSections;
        const procesosSections = ProcesosAdministrativosSections;
        const complianceSections = ComplianceSections;

        const existingSections = await this.sectionRepository.find();
        if (existingSections.length > 0) {
            return;
        }
        const categories = await this.categoryService.getAllCategories();
        
        for (const category of categories) {
            if (category.name === 'Corporativo') {
                for (const section of corporativeSections) {
                    this.createSection(section, category.id);
                }
            } else if (category.name === 'Judicial') {
                for (const section of judicialSections) {
                    this.createSection(section, category.id);
                }
            } else if (category.name === 'Compliance') {
                for (const section of complianceSections) {
                    this.createSection(section, category.id);
                }
            } else if (category.name === 'Procesos administrativos') {
                for (const section of procesosSections) {
                    this.createSection(section, category.id);
                }
            }
        }
        

        
    }

    async createSection(section: sectionDto, categoryId: string): Promise<Section> { // <--  de retorno corregido a 'Section'
        // Usa 'await' para esperar la respuesta asíncrona
        const category = await this.categoryService.getOneById(categoryId);

        if (!category) {
            throw new NotFoundException("categoría no encontrada");
        }

        return this.sectionRepository.save({
            ...section,
            category: category,
        });
    }

    async getOneById(sectionId : string) : Promise<Section|null> {
        return await this.sectionRepository.findOne({where : {id : sectionId}})
    }

    // En tu SectionRepository o SectionService

// En tu SectionRepository o SectionService

async getAllSections(): Promise<any[]> {
    return this.sectionRepository
        .createQueryBuilder("section")
        .leftJoin("section.category", "category")
        .select([
            "section.id AS id",        // <-- Alias manual para mantener el nombre 'id'
            "section.name AS name"     // <-- Alias manual para mantener el nombre 'name'
        ])
        .addSelect("category.id", "categoryId") // <-- Alias para el id de la categoría
        .getRawMany();
}
}