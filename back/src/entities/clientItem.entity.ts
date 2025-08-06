import { IsUUID } from "class-validator";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { v4 as uuid } from 'uuid';
import { Client } from "./client.entity";
import { Document } from "./document.entity";
@Entity("clientItems")
export class ClientItem {
 @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column()
  title : string

  @Column()
  description : string

  @ManyToOne(()=> Client , client => client.clientItems)
  client : Client

  @OneToMany(()=>Document , document => document.clientItem )
  documents : Document[]

}