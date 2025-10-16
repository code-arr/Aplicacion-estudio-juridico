import { Injectable } from "@nestjs/common";
import { sectionDto } from "src/dtos/section.dto";
import { Section } from "../entities/section.entity";
import { SectionRepository } from "../repositories/section.repository";

@Injectable()
export class SectionService {
    constructor(private readonly sectionRepository : SectionRepository){}

    async createSection(section : sectionDto , categoryId : string) :Promise<Section> {
        return  this.sectionRepository.createSection(section , categoryId)
    }

    async getOneById(sectionId : string) : Promise<Section|null> {
        return this.sectionRepository.getOneById(sectionId);
    }

    async getAllSections() :Promise<Section[]> {
        return this.sectionRepository.getAllSections();
    }
}