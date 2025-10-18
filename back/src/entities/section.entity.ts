import { IsUUID } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Category } from './category.entity';
import { ItemType } from './itemType.entity';
import { ClientItem } from './clientItem.entity';
@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

  @ManyToOne(() => Category, (category) => category.sections)
  category: Category;

  @OneToMany(() => ItemType, (item) => item.section)
  items: ItemType[];

  @OneToMany(() => ClientItem, (clientItem) => clientItem.section)
  clientItems: ClientItem[];
}
