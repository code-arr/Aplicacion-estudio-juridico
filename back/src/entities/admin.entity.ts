import { Entity, JoinColumn, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { IsUUID } from 'class-validator';
import { User } from './user.entity';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  //relacion con usuario
   
  @OneToOne(() => User, user => user.admin, { onDelete: 'CASCADE' })
  @JoinColumn() 
  user: User;
}
