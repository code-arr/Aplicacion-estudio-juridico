import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { sectionDto } from "src/dtos/section.dto";
import { Section } from "src/entities/section.entity";
import { SectionService } from "src/services/section.service";

@Controller("section")
export class sectionController {
    constructor(private readonly sectionService : SectionService){}
    @Post("create/:sectionId")
    async createSection(@Body() section : sectionDto , @Param("sectionId") sectionId :string) : Promise<Section> {
        return this.sectionService.createSection(section , sectionId)
    }

    @Get("getAll")
    async getAllSections() : Promise<Section[]> {
        return this.sectionService.getAllSections()
    }
}