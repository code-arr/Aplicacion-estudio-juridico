import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column('uuid')
  trackableId: string;

  @Column('uuid')
  lawyerId: string;

  @Column('uuid')
  clientId: string;

  @Column('uuid', { nullable: true })
  clientItemId: string;

  @Column()
  type: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;
}
