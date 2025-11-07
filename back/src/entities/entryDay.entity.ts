import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ClientItem } from './clientItem.entity';

@Entity('EntryDay')
export class EntryDay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /*   @Column()
  day: Date; */

  // ✅ Solo fecha (YYYY-MM-DD). Evita TZ.
  @Column({ type: 'date' })
  day: string;

  @Column()
  durationSec: number;

  @Column('text')
  trackableId: string;

  @Column('uuid')
  lawyerId: string;

  @Column('uuid', { nullable: true })
  clientId?: string;

  @Column('uuid', { nullable: true })
  clientItemId?: string;

  @ManyToOne(() => ClientItem, (item) => item.entries)
  @JoinColumn({ name: 'clientItemId' }) // <-- Usa tu columna existente como referencia
  public clientItem: ClientItem;
  @Column()
  type: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;
}
