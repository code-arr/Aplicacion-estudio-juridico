import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne } from 'typeorm';
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

  @CreateDateColumn({nullable: true})
  createdAt: Date;

  @ManyToOne(() => Lawyer, (lawyer) => lawyer.events)
  lawyer: Lawyer;
}