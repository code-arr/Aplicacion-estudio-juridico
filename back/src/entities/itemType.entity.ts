import { IsUUID } from "class-validator";
import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { v4 as uuid } from 'uuid';
import { Client } from "./client.entity";
import { Section } from "./section.entity";

@Entity("itemTypes")
export class ItemType {
    @PrimaryGeneratedColumn('uuid')
    @IsUUID()
    id: string = uuid();

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @ManyToOne(() => Section, (section) => section.items)
    section: Section;
}  