import { IsUUID } from 'class-validator';
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
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

  @Column({ type: 'uuid', nullable: true })
  clientId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createAt: Date;

  // La columna ya no necesita "onUpdate"
  @Column({ type: 'timestamp', nullable: true })
  updateAt: Date;

  @BeforeInsert()
  setCreateAt() {
    this.createAt = moment().tz('America/Santiago').toDate();
  }

  @BeforeUpdate()
  setUpdateAt() {
    this.updateAt = moment().tz('America/Santiago').toDate();
  }

  @ManyToOne(() => ClientItem, (clientItem) => clientItem.documents)
  clientItem: ClientItem;
}
