import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
  OneToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { IsUUID } from 'class-validator'; // Importar IsUUID para validación
import { v4 as uuid } from 'uuid'; // Importar uuid para la generación del ID
import { Lawyer } from './lawyer.entity';
import { StopWatch } from './stopwatch.entity';
import { Category } from './category.entity';
import { ClientItem } from './clientItem.entity';
import * as moment from 'moment-timezone';
import { Meeting } from './meeting.entity';


export enum clientType {
  FISICA = 'Fisica',
  JURIDICA = 'Juridica',
}

export enum status {
  ACTIVE = "active",
  INACTIVE = "inactive",
  UNDERREVIEW = "under_review"
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

  @Column({ type: 'enum', enum: status, default: status.ACTIVE })
  status: status;

 // La columna ya no necesita el "default" ya que lo asignas en el código
  @Column({ type: 'timestamp' })
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

  @ManyToMany(() => Lawyer, (lawyer) => lawyer.clients)
  lawyers: Lawyer[];

  @OneToMany(() => Meeting, (meeting) => meeting.client)
  meetings: Meeting[];

  @OneToMany(() => StopWatch, (stopwatch) => stopwatch.client)
  stopwatchs: StopWatch[];

  @OneToMany(() => ClientItem, (clientItem) => clientItem.client)
  clientItems: ClientItem[];
}
