import { IsUUID } from 'class-validator';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Client } from './client.entity';
import { Document } from './document.entity';
import { ItemType } from './itemType.entity';
import { Lawyer } from './lawyer.entity';
import { Process } from './process.entity';
import { Audience } from './audience.entity';
import { Meeting } from './meeting.entity';
import { Category } from './category.entity';
import { Section } from './section.entity';
import * as moment from 'moment-timezone';

export enum status {
  OPEN = 'open',
  ON_HOLD = 'on_hold',
  CLOSED = 'closed',
}

@Entity('clientItems')
export class ClientItem {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ type: 'enum', enum: status, default: status.OPEN })
  status: status;

  @Column({ type: 'int', default: 0 })
  activeTime: number;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

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

  @ManyToOne(() => Category, (category) => category.clientItems)
  category: Category;

  @ManyToOne(() => Section, (section) => section.clientItems)
  section: Section;
}
