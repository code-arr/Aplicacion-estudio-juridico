import { IsUUID } from 'class-validator';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ClientItem } from './clientItem.entity';
import * as moment from 'moment-timezone';

@Entity()
export class Process {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'integer', default: 0 })
  durationSec: number; // Duración del trabajo en segundos

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dateTime: Date;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

  @ManyToOne(() => ClientItem, (clientItem) => clientItem.processes)
  clientItem: ClientItem;
}
