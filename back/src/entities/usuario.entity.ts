import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsUUID } from 'class-validator';
import { Administrador } from './admin.entity';
import { Abogado } from './abogado.entity';

export enum UserRole {
  ADMIN = 'admin',
  ABOGADO = 'abogado',
}
@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ABOGADO,
  })
  role: UserRole;

  //relacion con admin
  @OneToOne(() => Administrador, (admin) => admin.usuario)
  @JoinColumn() 
  admin: Administrador;

  //relacion con abogado
  @OneToOne(() => Abogado, (abogado) => abogado.usuario)
  @JoinColumn() // <-- ¡Esta es la clave para el problema!
  abogado: Abogado;
}
