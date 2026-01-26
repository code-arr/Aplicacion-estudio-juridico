// src/entities/clientItem.entity.ts
import { IsUUID } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  ManyToMany,
  JoinTable,
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
import { EntryDay } from './entryDay.entity';

export enum status {
  OPEN = 'open',
  ON_HOLD = 'on_hold',
  CLOSED = 'closed',
}

export enum Currency {
  CLP = 'CLP',
  USD = 'USD',
  UF = 'UF',
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

  @Column({ type: 'boolean', default: false })
  isPrivate: Boolean;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  hourlyRateOverride?: string | null;

  @Column({ type: 'enum', enum: Currency, nullable: true })
  currencyOverride?: Currency | null;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

  @ManyToOne(() => Client, (client) => client.clientItems)
  client: Client;

  @ManyToOne(() => Lawyer, (lawyer) => lawyer.clientItems)
  lawyer: Lawyer;

  // --- NUEVA RELACIÓN MANY-TO-MANY ---
  // Esta lista define "con quién más" se comparte este item
  // si 'isPrivate' es true.
  @ManyToMany(() => Lawyer, (lawyer) => lawyer.sharedClientItems)
  @JoinTable({
    name: 'client_item_shared_lawyers', // Nombre de la tabla pívot
    joinColumn: { name: 'clientItemId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'lawyerId', referencedColumnName: 'id' },
  })
  sharedWithLawyers: Lawyer[];

  @OneToMany(() => Document, (document) => document.clientItem)
  documents: Document[];

  @OneToMany(() => Process, (process) => process.clientItem)
  processes: Process[];

  @OneToMany(() => Audience, (audience) => audience.clientItem)
  audiences: Audience[];

  @OneToMany(() => Meeting, (meet) => meet.clientItem)
  meetings: Meeting[];

  @ManyToOne(() => ItemType, { nullable: true })
  itemType?: ItemType | null;

  @ManyToOne(() => Category, { nullable: true })
  category?: Category | null;

  @ManyToOne(() => Section, { nullable: true })
  section?: Section | null;

  @OneToMany(() => EntryDay, (entry) => entry.clientItem, {
    onDelete: 'CASCADE',
  }) // 'entry.clientItem' debe coincidir con el nombre de la propiedad en EntryDay
  public entries: EntryDay[];
}

