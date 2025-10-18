import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Lawyer } from './lawyer.entity';

@Entity('event')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityName: string; // Ej: "Document", "Client", etc.

  @Column()
  entityId: string;

  @Column()
  entityType: string; // Ej: "Document", "Client", etc.

  @Column()
  action: string; // Ej: CREATED, UPDATED, DELETED

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

  @ManyToOne(() => Lawyer, (lawyer) => lawyer.events)
  lawyer: Lawyer;
}
