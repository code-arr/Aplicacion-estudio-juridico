import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { IsUUID } from 'class-validator'; // Importar IsUUID para validación
import { v4 as uuid } from 'uuid'; // Importar uuid para la generación del ID
import { Caso } from './caso.entity';
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

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column()
  rut : string;

  @ManyToMany(() => Caso, (caso) => caso.clientes)
  casos: Caso[]; // Sin @JoinTable aquí

  @ManyToMany(() => Abogado, (abogado) => abogado.clientes)
    abogados: Abogado[];

  @OneToMany(() => Cronometro, (cronometro) => cronometro.cliente)
    cronometros: Cronometro[];

 
}