import { IsUUID } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';


@Entity('reuniones')
export class Reunion {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column({ type: 'varchar', length: 255 })
  name : string;

  @Column({ type: 'int', nullable: true })
  duration: number; // Duración de la reunión (ej. 1 hora, 30 minutos, etc.)

  @Column({ type: 'timestamp' })
  date: Date; // Fecha y hora de la reunión

  @Column({ type: 'text', nullable: true })
  description: string;

}
