import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { sectionDto } from "../dtos/section.dto";
import { Section } from "../entities/section.entity";
import { SectionService } from "../services/section.service";

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