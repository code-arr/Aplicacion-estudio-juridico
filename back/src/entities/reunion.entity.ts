import { IsUUID } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Caso } from './caso.entity';

@Entity('reuniones')
export class Reunion {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'int', nullable: true })
  duracion: number; // Duración de la reunión (ej. 1 hora, 30 minutos, etc.)

  @Column({ type: 'timestamp' })
  fecha: Date; // Fecha y hora de la reunión

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @ManyToOne(() => Caso, (caso) => caso.reuniones)
  caso: Caso; // Relación con Caso, puede ser nulo si la reunión no está asociada a un caso específico
  //preguntar si hay que guardar la reunion
}
