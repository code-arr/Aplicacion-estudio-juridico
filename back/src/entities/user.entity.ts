import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsUUID } from 'class-validator';
import { Admin } from './admin.entity';
import { Lawyer } from './lawyer.entity';

export enum UserRole {
  ADMIN = 'admin',
  LAWYER = 'lawyer',
}
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  password: string;

  @Column({type : 'varchar', length: 300, default: '' })
  googleRefreshToken: string;

  @Column({ type: 'varchar', length: 100, default: '' })
  mailerKey: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.LAWYER,
  })
  role: UserRole;

  //relacion con admin
  @OneToOne(() => Admin, (admin) => admin.user)
  @JoinColumn() 
  admin: Admin;

  //relacion con abogado
  @OneToOne(() => Lawyer, (lawyer) => lawyer.user)
  @JoinColumn() // <-- ¡Esta es la clave para el problema!
  lawyer: Lawyer;
}
