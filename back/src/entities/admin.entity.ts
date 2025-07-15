import { Entity, JoinColumn, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { IsUUID } from 'class-validator';
import { Usuario } from './usuario.entity';

@Entity('administradores')
export class Administrador {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  //relacion con usuario
   
  @OneToOne(() => Usuario, user => user.admin, { onDelete: 'CASCADE' })
  @JoinColumn() 
  usuario: Usuario;
}
