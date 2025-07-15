import { IsUUID } from 'class-validator';
import { Column, Entity, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Usuario } from './usuario.entity';
import { Caso } from './caso.entity';
import { Cronometro } from './cronometro.entity';
import { Cliente } from './cliente.entity';

export enum tipoAbogado {
  CRIMINAL = 'criminal',
  CIVIL = 'civil',
  FAMILIAR = 'familiar',
 
}

export enum SeniorityLevel {
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
}
@Entity({ name: 'abogados' })
export class Abogado {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100 })
  apellido: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  direccion: string;

  @Column({ type: 'varchar', length: 15, unique: true })
  telefono: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  rut : string;

  @Column({
    type: 'enum',
    enum: tipoAbogado,
    nullable : true,
  })

  @Column({
    type: 'enum',
    enum: SeniorityLevel,
    nullable: true,
  })
  tipo:SeniorityLevel;

  @Column({type: 'int', default: 0})
  horasTrabajadas: number;

  //relacion con usuario
  @OneToOne(() => Usuario, (usuario) => usuario.abogado)
  usuario: Usuario;

  //relacion con con caso
  @ManyToMany(() => Caso, (caso) => caso.abogados)
  casos: Caso[];
  
  //relacion con cronometro
  @OneToMany(() => Cronometro, (cronometro) => cronometro.abogado)
  cronometros: Cronometro[];

  //relacion con cliente
  @ManyToMany(() => Cliente, (cliente) => cliente.abogados)
  clientes: Cliente[];
}
