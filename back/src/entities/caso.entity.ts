import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
  ManyToOne, // Asegúrate de que OneToOne esté aquí
} from 'typeorm';
import { IsUUID } from 'class-validator';
import { v4 as uuid } from 'uuid';
import { Abogado } from './abogado.entity';
import { Cliente } from './cliente.entity';
import { Cronometro } from './cronometro.entity'; // Asegúrate de que Cronometro esté aquí
import { Documento } from './documento.entity';
import { Reunion } from './reunion.entity'; // Asegúrate de que Reunion esté aquí

@Entity('casos') // Nombre de la tabla en la base de datos
export class Caso {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true }) // Almacena documentos como un array de strings (ej. URLs, nombres de archivos), puede ser nulo
  documents: string[];

  @Column({ type: 'jsonb', nullable: true })
  meetings: any[];

  // Relación ManyToOne con Abogado: Un caso pertenece a un único abogado
  @ManyToMany(() => Abogado, (abogado) => abogado.casos)
  abogados: Abogado[];

  // Relación ManyToMany con Cliente: Un caso puede tener varios clientes y un cliente puede tener varios casos
 // En Caso.entity.ts
@ManyToOne(() => Cliente, (cliente) => cliente.casos)

  cliente: Cliente;

  @OneToMany(() => Documento, (documento) => documento.caso, { nullable: true })
  documentos: Documento[];

  @OneToMany(() => Reunion, (reunion) => reunion.caso, { nullable: true })
  reuniones: Reunion[];
}