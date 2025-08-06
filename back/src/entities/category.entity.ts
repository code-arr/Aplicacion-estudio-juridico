import { IsUUID } from "class-validator";
import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { v4 as uuid } from 'uuid';
import { Client } from "./client.entity";
import { Section } from "./section.entity";

@Entity("categories")
export class Category {
    @PrimaryGeneratedColumn('uuid')
    @IsUUID()
    id: string = uuid();

    @Column({ type: 'varchar', length: 255 })
    name : string;

    @OneToMany(() => Section, (section) => section.category)
    sections: Section[];
}