import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { IsUUID } from 'class-validator'; // Importar IsUUID para validación
import { v4 as uuid } from 'uuid'; // Importar uuid para la generación del ID
import { Lawyer } from './lawyer.entity';
import { StopWatch } from './stopwatch.entity';
import { Category } from './category.entity';
import { ClientItem } from './clientItem.entity';

export enum clientType {
  FISICA = 'Fisica',
  JURIDICA = 'Juridica',
}

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column()
  rut: string;

  @Column({ type: 'enum', enum: clientType, default: clientType.FISICA })
  type: clientType;

  @ManyToMany(() => Lawyer, (lawyer) => lawyer.clients)
  lawyers: Lawyer[];

  @OneToMany(() => StopWatch, (stopwatch) => stopwatch.client)
  stopwatchs: StopWatch[];

  @OneToMany(() => ClientItem, (clientItem) => clientItem.client)
  clientItems: ClientItem[];
}
