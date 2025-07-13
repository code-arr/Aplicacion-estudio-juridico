import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { IsUUID } from 'class-validator'; // Importar IsUUID para validación
import { v4 as uuid } from 'uuid'; // Importar uuid para la generación del ID
import { Caso } from './caso.entity';
import { join } from 'path';
import { Abogado } from './abogado.entity';
import { Cronometro } from './cronometro.entity';


@Entity('clientes') 
export class Cliente {
  @PrimaryGeneratedColumn('uuid') 
  @IsUUID() 
  id: string = uuid(); 

  @Column()
  name: string; 

  @Column()
  lastName: string; 

  @OneToMany(() => Caso, (caso) => caso.clientes)
  casos: Caso[];

  @OneToMany(() => Abogado, (abogado) => abogado.cliente)
    abogados: Abogado[];

  @OneToMany(() => Cronometro, (cronometro) => cronometro.cliente)
    cronometros: Cronometro[];

 
}