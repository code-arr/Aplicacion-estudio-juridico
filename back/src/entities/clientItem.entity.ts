import { IsUUID } from 'class-validator';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Client } from './client.entity';
import { Document } from './document.entity';
import { ItemType } from './itemType.entity';
import { Lawyer } from './lawyer.entity';
import { Process } from './process.entity';
import { Audience } from './audience.entity';
import { Meeting } from './meet.entity';

@Entity('clientItems')
export class ClientItem {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column()
  title: string;

  @Column()
  description: string;

  @ManyToOne(() => Client, (client) => client.clientItems)
  client: Client;

  @ManyToOne(() => Lawyer, (lawyer) => lawyer.clientItems)
  lawyer: Lawyer;

  @OneToMany(() => Document, (document) => document.clientItem)
  documents: Document[];

  @OneToMany(() => Process, (process) => process.clientItem)
  processes: Process[];

  @OneToMany(() => Audience, (audience) => audience.clientItem)
  audiences: Audience[];

  @OneToMany(() => Meeting, (meet) => meet.clientItem)
  meetings: Meeting[];

  @ManyToOne(() => ItemType, (itemType) => itemType.clientItems)
  itemType: ItemType;
}
  