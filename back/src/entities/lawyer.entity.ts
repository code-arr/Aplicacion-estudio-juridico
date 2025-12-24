import { IsUUID } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuid } from 'uuid';
import { User } from './user.entity';
import { Client } from './client.entity';
import { ClientItem } from './clientItem.entity';
import { Event } from './events.entity';
import { Meeting } from './meeting.entity';

export enum lawyerType {
  CRIMINAL = 'criminal',
  CIVIL = 'civil',
  FAMILIAR = 'familiar',
  COMERCIAL = 'comercial',
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

  @Column({ type: 'varchar', length: 100, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 15 })
  phone: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  rut: string;

  @Column({
    type: 'enum',
    enum: lawyerType,
    nullable: true,
  })
  type: lawyerType;

  @Column({ type: 'int', default: 0 })
  workedHours: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

  //relacion con usuario
  @OneToOne(() => User, (user) => user.lawyer, { onDelete: 'CASCADE' })
  @JoinColumn() // ⬅️ Mover acá
  user: User;

  @OneToMany(() => ClientItem, (clientItem) => clientItem.lawyer)
  clientItems: ClientItem[];

  @ManyToMany(() => ClientItem, (clientItem) => clientItem.sharedWithLawyers)
  sharedClientItems: ClientItem[];

  // Relación Many-to-Many con Cliente
  // Abogado es el propietario: se creará una tabla intermedia 'abogados_clientes'.
  @ManyToMany(() => Client, (cliente) => cliente.lawyers, {
    onDelete: 'CASCADE',
  })
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

  @OneToMany(() => Meeting, (meeting) => meeting.lawyer)
  meetings: Meeting[];
}

