import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'; // Asegúrate de que JoinColumn esté aquí
import { IsUUID } from 'class-validator';
import { v4 as uuid } from 'uuid';
import { Lawyer } from './lawyer.entity';
import { Client } from './client.entity';
import * as moment from 'moment-timezone';

@Entity('stopwatchs')
export class StopWatch {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  hours: number;

  @Column({ type: 'int', default: 0 })
  price: number;

  @ManyToOne(() => Lawyer, (lawyer) => lawyer.stopWatch)
  lawyer: Lawyer;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

  // Relación OneToOne con Caso: Un cronómetro está asociado a un único caso (y viceversa)
  //@OneToOne(() => Caso, (caso) => caso.cronometro)
  // @JoinColumn() // ¡Esta es la clave! Indica que 'cronometros' tendrá la FK 'casoId'
  //caso: Caso; // Referencia al caso asociado a este cronómetro

  @ManyToOne(() => Client, (cliente) => cliente.stopwatchs)
  client: Client;
}
