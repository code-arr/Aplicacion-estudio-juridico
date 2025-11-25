// src/entities/client.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsUUID } from 'class-validator'; // Importar IsUUID para validación
import { v4 as uuid } from 'uuid'; // Importar uuid para la generación del ID
import { Lawyer } from './lawyer.entity';
import { StopWatch } from './stopwatch.entity';
import { Category } from './category.entity';
import { ClientItem } from './clientItem.entity';
import { Meeting } from './meeting.entity';

export enum clientType {
  FISICA = 'Fisica',
  JURIDICA = 'Juridica',
}

export enum status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  UNDERREVIEW = 'under_review',
}

export enum Currency {
  CLP = 'CLP',
  USD = 'USD',
  UF = 'UF',
}

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  rut: string;

  @Column({ type: 'enum', enum: clientType, default: clientType.FISICA })
  type: clientType;

  @Column({ type: 'enum', enum: status, default: status.ACTIVE })
  status: status;

  @Column({ type: 'int', default: 0 })
  activeTime: number;

  @Column({ type: 'varchar', nullable: true, unique: true })
  companyName: string;

  @Column({ type: 'varchar', nullable: true })
  legalRepresentative: string;

  // Tarifa por hora (guardamos numeric, TypeORM sugiere string en TS)
  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  hourlyRate?: string | null;

  @Column({ type: 'enum', enum: Currency, default: Currency.CLP })
  currency: Currency;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

  @ManyToMany(() => Lawyer, (lawyer) => lawyer.clients, { onDelete: 'CASCADE' })
  lawyers: Lawyer[];

  @OneToMany(() => Meeting, (meeting) => meeting.client)
  meetings: Meeting[];

  @OneToMany(() => StopWatch, (stopwatch) => stopwatch.client)
  stopwatchs: StopWatch[];

  @OneToMany(() => ClientItem, (clientItem) => clientItem.client, {
    onDelete: 'CASCADE',
  })
  clientItems: ClientItem[];
}
