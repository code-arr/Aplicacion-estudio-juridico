import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbogadoDto } from '../dtos/lawyer.dto';
import { Lawyer } from '../entities/lawyer.entity';
import { Client } from '../entities/client.entity';
import { ClienteService } from '../services/cliente.service';
import { UserService } from '../services/user.service';
import { abogadosSeedData } from '../utils/abogados';
import { casosSeedData } from '../utils/casos';
import { clientesSeedData } from '../utils/clientes';
import { Repository } from 'typeorm';

@Injectable()
export class AbogadoRepository {
  constructor(
    @InjectRepository(Lawyer) private readonly repository: Repository<Lawyer>,
    @InjectRepository(Client)
    private readonly clienteRepository: Repository<Client>,
    private readonly userService: UserService,
    private readonly clienteService: ClienteService, // Asegúrate de importar y usar el UserRepository correctamente
  ) {}
  async createAbogado(abogado: AbogadoDto): Promise<Lawyer> {
    const newAbogado = this.repository.create(abogado);
    return this.repository.save(newAbogado);
  }
  async saveAbogado(abogado: Lawyer): Promise<Lawyer> {
    return this.repository.save(abogado);
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
          newAbogado.user = usuario; // Asocia el usuario al abogado
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
      const abogados = await this.getAllLawyers();
      const clientes = clientesSeedData;

      for (const abogado of abogados) {
        for (const cliente of clientes) {
          if (
            abogado.user?.email === cliente.abogadoAsociadoEmail &&
            cliente.email
          ) {
            const clienteReal = await this.clienteService.findByEmail(
              cliente.email,
            );

            if (clienteReal) {
              abogado.clients.push(clienteReal);
            }
          }
        }
      }

      await this.repository.save(abogados);
      return 'clientes agregados correctamente a los abogados';
    } catch (error) {
      console.error('Error asociando clientes a abogados:', error);
      throw new Error('Error asociando clientes a abogados');
    }
  }

  async getAbogadoById(id: string): Promise<Lawyer | null> {
    return await this.repository.findOne({
      where: { id }
    });
  }

  async getAbogadoByEmail(email: string): Promise<Lawyer | null> {
    return await this.repository.findOne({
      where: { user: { email: email } },
    });
  }

  async getAllLawyers():Promise<Lawyer[]> {
    return await this.repository.find();
  }
}
