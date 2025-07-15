import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsObject, isObject } from 'class-validator';
import { AbogadoDto } from 'src/dtos/abogado.dto';
import { Abogado } from 'src/entities/abogado.entity';
import { ClienteService } from 'src/services/cliente.service';
import { UserService } from 'src/services/user.service';
import { abogadosSeedData } from 'src/utils/abogados';
import { clientesSeedData } from 'src/utils/clientes';
import { Repository } from 'typeorm';

@Injectable()
export class AbogadoRepository {
  constructor(
    @InjectRepository(Abogado) private readonly repository: Repository<Abogado>,
    private readonly userService: UserService,
    private readonly clienteService: ClienteService, // Asegúrate de importar y usar el UserRepository correctamente
  ) {}
  async createAbogado(abogado: AbogadoDto): Promise<Abogado> {
    const newAbogado = this.repository.create(abogado);
    return this.repository.save(newAbogado);
  }
  async getAllAbogados(): Promise<Abogado[]> {
    return this.repository.find({ relations: ['usuario' , "clientes"] });
  }
  async seedData(): Promise<string> {
    try {
      const abogados = abogadosSeedData;
      for (const abogado of abogados) {
        const newAbogado = await this.createAbogado(abogado);
        const usuario = await this.userService.findOneByEmail(
          abogado.userEmail,
        );
        if (usuario) {
          newAbogado.usuario = usuario; // Asocia el usuario al abogado
        }
        await this.repository.save(newAbogado);
      }
      return 'abogados agregados correctamente';
    } catch (error) {
      console.error('Error seeding abogados:', error);
      throw new Error('Error seeding abogados');
    }
  }

async seedClientesAbogados(): Promise<string> {
  try {
    const abogados = await this.getAllAbogados();
    const clientes = clientesSeedData;

    for (const abogado of abogados) {
      for (const cliente of clientes) {
        if (abogado.usuario?.email === cliente.abogadoAsociadoEmail && cliente.email) {
          const clienteReal = await this.clienteService.findByEmail(
            cliente.email
          );
          
          if (clienteReal) {
            abogado.clientes.push(clienteReal);
          }
        }
      }
    }
    
    await this.repository.save(abogados); 
    return "clientes agregados correctamente a los abogados";
  } catch (error) {
    console.error('Error asociando clientes a abogados:', error);
    throw new Error('Error asociando clientes a abogados');
  }
}
}
