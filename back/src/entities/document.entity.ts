import { IsUUID } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ClientItem } from './clientItem.entity';
import { DocumentVersion } from './documentVersion.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'uuid', nullable: true })
  clientItemId?: string;

  @Column({ type: 'int', default: 1 })
  currentVersion: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

  @ManyToOne(() => ClientItem, (clientItem) => clientItem.documents)
  clientItem: ClientItem;

  @Column({ name: 'fileUrl', type: 'varchar', length: 1000, nullable: true })
  fileUrl: string | null;

  @OneToMany(() => DocumentVersion, (v) => v.document, { cascade: true })
  versions: DocumentVersion[];
}
