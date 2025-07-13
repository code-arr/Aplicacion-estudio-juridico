import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
  OneToOne, // Asegúrate de que OneToOne esté aquí
} from 'typeorm';
import { IsUUID } from 'class-validator';
import { v4 as uuid } from 'uuid';
import { Abogado } from './abogado.entity';
import { Cliente } from './cliente.entity';
import { Cronometro } from './cronometro.entity'; // Asegúrate de que Cronometro esté aquí

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
  @ManyToOne(() => Abogado, (abogado) => abogado.casos)
  abogado: Abogado;

  // Relación ManyToMany con Cliente: Un caso puede tener varios clientes y un cliente puede tener varios casos
  @ManyToMany(() => Cliente, (cliente) => cliente.casos)
  @JoinTable({
    name: 'casos_clientes', // Nombre de la tabla intermedia
    joinColumn: {
      name: 'casoId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'clienteId',
      referencedColumnName: 'id',
    },
  })
  clientes: Cliente[];

  // Relación OneToOne con Cronometro: Un caso puede tener un único cronómetro asociado (y viceversa)
  @OneToOne(() => Cronometro, (cronometro) => cronometro.caso) // 'caso' es la relación inversa en Cronometro
  cronometro: Cronometro; // Referencia al cronómetro asociado a este caso
}