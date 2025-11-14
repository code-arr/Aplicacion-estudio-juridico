import { IsUUID } from 'class-validator';
import {
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
export class Audience {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileUrl: string | null;

  @Column({ type: 'int', default: 0 })
  activeTime: number;

  @Column({ type: 'int', nullable: true })
  size: number;

  @Column({ type: 'int', nullable: true })
  pages: number;

  // nuevo campo canónico con timezone (igual que Process)
  @Column({ type: 'timestamptz' })
  dateTime: Date;

  // duración en segundos (opcional)
  @Column({ type: 'integer' })
  durationSec: number;

  // modalidad: 'virtual' | 'presencial'
  @Column({ type: 'varchar', length: 20 })
  mode: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'uuid' })
  clientItemId?: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

  @ManyToOne(() => ClientItem, (clientItem) => clientItem.audiences)
  clientItem: ClientItem;
}
