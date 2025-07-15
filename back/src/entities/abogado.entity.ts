import { IsUUID } from 'class-validator';
import { Column, Entity, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
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
  tipoAbogado: tipoAbogado;

  @Column({
    type: 'enum',
    enum: SeniorityLevel,
    nullable: true,
  })
  seniorityLevel: SeniorityLevel;

  @Column({type: 'int', default: 0})
  horasTrabajadas: number;

  //relacion con usuario
  @OneToOne(() => Usuario, (usuario) => usuario.abogado)
  usuario: Usuario;

 
  //relacion con cronometro
@ManyToMany(() => Caso, (caso) => caso.abogados)
  @JoinTable({
    name: 'abogados_casos', // Nombre de la tabla intermedia
    joinColumn: {
      name: 'abogadoId', // Nombre de la columna que referencia al Abogado en la tabla intermedia
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'casoId', // Nombre de la columna que referencia al Caso en la tabla intermedia
      referencedColumnName: 'id',
    },
  })
  casos: Caso[];

  // Relación One-to-Many con Cronometro
  // Un abogado puede tener muchos cronómetros. La clave foránea estará en la tabla 'cronometros'.
  @OneToMany(() => Cronometro, (cronometro) => cronometro.abogado)
  cronometros: Cronometro[];

  // Relación Many-to-Many con Cliente
  // Abogado es el propietario: se creará una tabla intermedia 'abogados_clientes'.
  @ManyToMany(() => Cliente, (cliente) => cliente.abogados)
  @JoinTable({
    name: 'abogados_clientes', // Nombre de la tabla intermedia
    joinColumn: {
      name: 'abogadoId', // Nombre de la columna que referencia al Abogado en la tabla intermedia
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'clienteId', // Nombre de la columna que referencia al Cliente en la tabla intermedia
      referencedColumnName: 'id',
    },
  })
  clientes: Cliente[];
}
