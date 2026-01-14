// entities/user.entity.ts
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsUUID } from 'class-validator';
import { Admin } from './admin.entity';
import { Lawyer } from './lawyer.entity';
import * as moment from 'moment-timezone';

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

  @Column({ type: 'varchar', length: 100, default: '' })
  googleEmail: string;

  @Column({ type: 'varchar', length: 100 })
  password: string;

  @Column({ type: 'varchar', length: 300, default: '' })
  googleRefreshToken: string;

  @Column({ type: 'text', nullable: true })
  googleSignatureHtml?: string;

  @Column({ type: 'timestamptz', nullable: true })
  googleSignatureFetchedAt?: Date;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.LAWYER,
  })
  role: UserRole;

  @Column({ type: 'uuid', nullable: true })
  lawyerId?: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

  //relacion con admin
  @OneToOne(() => Admin, (admin) => admin.user)
  admin: Admin;

  //relacion con abogado
  @OneToOne(() => Lawyer, (lawyer) => lawyer.user, { onDelete: 'CASCADE' })
  lawyer: Lawyer;
}

