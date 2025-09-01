import { IsUUID } from 'class-validator';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { v4 as uuid } from 'uuid';
import { User } from './user.entity';
import { StopWatch } from './stopwatch.entity';
import { Client } from './client.entity';
import { ClientItem } from './clientItem.entity';
import * as moment from 'moment-timezone';

export enum typeOffLawyer {
  CRIMINAL = 'criminal',
  CIVIL = 'civil',
  FAMILIAR = 'familiar',
}

export enum SeniorityLevel {
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
  adress: string;

  @Column({ type: 'varchar', length: 15, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  rut: string;

  @Column({
    type: 'enum',
    enum: typeOffLawyer,
    nullable: true,
  })
  type: typeOffLawyer;

  @Column({
    type: 'enum',
    enum: SeniorityLevel,
    nullable: true,
  })
  seniorityLevel: SeniorityLevel;

  @Column({ type: 'int', default: 0 })
  workedHours: number;

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

  //relacion con usuario
  @OneToOne(() => User, (usuario) => usuario.lawyer)
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
}
