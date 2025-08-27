import { IsUUID } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ClientItem } from './clientItem.entity';
import { Client } from './client.entity';

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int', nullable: true })
  duration: number; // Duración de la reunión (ej. 1 hora, 30 minutos, etc.)

  @Column({ type: 'timestamp' })
  date: Date; // Fecha y hora de la reunión

  @Column({ type: 'varchar', length: 255, nullable: true })
  url: string;

  @Column({type : "enum", enum: ["google-meet", "in-person"] , default: "google-meet"})
  meetingType: "google-meet" | "in-person";

  @Column({ type: 'enum', enum: ["scheduled", "completed"], default: "scheduled" })
  status: "scheduled" | "completed";

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Client, (client) => client.meetings)
  client: Client;

  @ManyToOne(() => ClientItem, (clientItem) => clientItem.meetings)
  clientItem: ClientItem;
}
