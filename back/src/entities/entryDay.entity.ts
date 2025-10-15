import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne } from 'typeorm';


@Entity('EntryDay')
export class EntryDay {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  day : Date;

  @Column()
  durationSec : number;

  @Column()
  trackableId : string;

  @Column()
  lawyerId : string;
}