import { IsUUID } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Caso } from './caso.entity';

@Entity('documentos')
export class Documento {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  tipo: string; // Tipo de documento (ej. PDF, Word, etc.)

  @Column({ type: 'text', nullable: true })
  contenido: string;

  @ManyToOne(() => Caso, (caso) => caso.documents, { nullable: true })
  caso: Caso; // Relación con Caso, puede ser nulo si el documento no
}
