import { IsUUID } from 'class-validator';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuid } from 'uuid';
import { User } from './user.entity';
import { StopWatch } from './stopwatch.entity';
import { Client } from './client.entity';
import { ClientItem } from './clientItem.entity';
import * as moment from 'moment-timezone';
import { Event } from './events.entity';

export enum lawyerType {
  CRIMINAL = 'criminal',
  CIVIL = 'civil',
  FAMILIAR = 'familiar',
}

export enum seniorityLevel {
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
}

@Entity({ name: 'abogados' })
export class Lawyer {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  address: string;

  @Column({ type: 'varchar', length: 15, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  rut: string;

  @Column({
    type: 'enum',
    enum: lawyerType,
    nullable: true,
  })
  type: lawyerType;

  @Column({
    type: 'enum',
    enum: seniorityLevel,
    nullable: true,
  })
  seniorityLevel: seniorityLevel;

  @Column({ type: 'int', default: 0 })
  workedHours: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

  //relacion con usuario
  @OneToOne(() => User, (usuario) => usuario.lawyer , {onDelete : "SET NULL"})
  user: User;

  // Relación One-to-Many con Cronometro
  // Un abogado puede tener muchos cronómetros. La clave foránea estará en la tabla 'cronometros'.
  @OneToMany(() => StopWatch, (stopWatch) => stopWatch.lawyer)
  stopWatch: StopWatch[];

  @OneToMany(() => ClientItem, (clientItem) => clientItem.lawyer)
  clientItems: ClientItem[];

  // Relación Many-to-Many con Cliente
  // Abogado es el propietario: se creará una tabla intermedia 'abogados_clientes'.
  @ManyToMany(() => Client, (cliente) => cliente.lawyers)
  @JoinTable({
    name: 'lawyers_clients', // Nombre de la tabla intermedia
    joinColumn: {
      name: 'lawyerId', // Nombre de la columna que referencia al Abogado en la tabla intermedia
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'clientId', // Nombre de la columna que referencia al Cliente en la tabla intermedia
      referencedColumnName: 'id',
    },
  })
  clients: Client[];

  @OneToMany(() => Event, (event) => event.lawyer)
  events: Event[];
}
