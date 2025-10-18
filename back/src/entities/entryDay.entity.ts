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

  @Column()
  day: Date;

  @Column()
  durationSec: number;

  @Column()
  trackableId: string;

  @Column()
  lawyerId: string;

  @Column()
  clientId: string;

  @Column()
  type: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;
}
