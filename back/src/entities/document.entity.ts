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

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileUrl: string | null;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'int' })
  size: number;

  @Column({ type: 'int', default: 0 })
  activeTime: number;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'uuid' })
  clientItemId?: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

  @ManyToOne(() => ClientItem, (clientItem) => clientItem.documents)
  clientItem: ClientItem;
}
