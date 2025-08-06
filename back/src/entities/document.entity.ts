import { IsUUID } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ClientItem } from './clientItem.entity';


@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  type: string; // Tipo de documento (ej. PDF, Word, etc.)

  @Column({ type: 'text', nullable: true })
  content: string;

  @ManyToOne(()=> ClientItem , clientItem => clientItem.documents)
  clientItem : ClientItem

}
