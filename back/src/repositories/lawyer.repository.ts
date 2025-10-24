import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbogadoDto } from '../dtos/lawyer.dto';
import { Lawyer } from '../entities/lawyer.entity';
import { Client } from '../entities/client.entity';
import { ClienteService } from '../services/cliente.service';
import { UserService } from '../services/user.service';
import { abogadosSeedData } from '../utils/abogados';
import { casosSeedData } from '../utils/casos';
import { clientesSeedData } from '../utils/clientes';
import { DataSource, Repository } from 'typeorm';
import { ParentTouchService } from 'src/services/parent-touch.service';
import { UpdateLawyerDto } from 'src/dtos/updateLawyer.dto';

@Injectable()
export class AbogadoRepository {
  constructor(
    @InjectRepository(Lawyer) private readonly repository: Repository<Lawyer>,
    @InjectRepository(Client)
    private readonly clienteRepository: Repository<Client>,
    private readonly userService: UserService,
    private readonly clienteService: ClienteService,
    private readonly dataSource: DataSource,
    private readonly parentTouch: ParentTouchService, // Asegúrate de importar y usar el UserRepository correctamente
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
    if (!id) {
      return null;
    }
    const lawyer = await this.repository.findOne({
      where: { id: id },
    });
    console.log(' Lawyer en getAbogadoById:', lawyer);
    return lawyer;
  }

  async getAbogadoByEmail(email: string): Promise<Lawyer | null> {
    const lawyer = await this.repository.findOne({
      where: { user: { email: email } },
    });
    console.log(lawyer);
    return lawyer;
  }

  async getAllLawyers(): Promise<Lawyer[]> {
    return await this.repository.find();
  }

  async deleteClientFromLawyer(
    lawyerId: string,
    clientId: string,
  ): Promise<Lawyer | null> {
    const lawyer = await this.repository.findOne({
      where: { id: lawyerId },
      relations: ['clients'],
    });
    if (!lawyer) throw new NotFoundException('Lawyer not found');

    const clientExists = lawyer.clients.some((c) => c.id === clientId);
    if (!clientExists)
      throw new NotFoundException('Client not found in this lawyer');

    // Romper la relación
    await this.repository
      .createQueryBuilder()
      .relation('clients')
      .of(lawyerId)
      .remove(clientId);

    // Opcional: devolver el abogado actualizado
    const updatedLawyer = await this.repository.findOne({
      where: { id: lawyerId },
      relations: ['clients'],
    });

    return updatedLawyer;
  }
  async getClientsByLawyerId(lawyerId: string): Promise<Client[]> {
    const lawyer = await this.repository.findOne({
      where: { id: lawyerId },
      relations: ['clients'],
    });
    if (!lawyer) throw new NotFoundException('Lawyer not found');
    return lawyer.clients;
  }

  async updateLawyer(
    lawyerId: string,
    updateData: UpdateLawyerDto,
  ): Promise<Lawyer> {
    return this.dataSource.transaction(async (manager) => {
      try {
        const lawyerRepo = manager.getRepository(Lawyer);

        // Buscar abogado
        const lawyer = await lawyerRepo.findOne({
          where: { id: lawyerId },
          relations: ['clients', 'clientItems'], // tocar si necesitas relaciones
        });
        if (!lawyer) throw new NotFoundException('Lawyer not found');

        // Actualizar solo los campos recibidos
        Object.assign(lawyer, updateData);

        // Guardar cambios
        const saved = await lawyerRepo.save(lawyer);

        // Tocar clientes asociados si hay alguno
        if (lawyer.clients?.length) {
          for (const client of lawyer.clients) {
            await this.parentTouch.touchClient(manager, client.id);
          }
        }

        // Tocar clientItems asociados si hay alguno
        if (lawyer.clientItems?.length) {
          for (const item of lawyer.clientItems) {
            await this.parentTouch.touchClientItem(manager, item.id);
          }
        }

        return saved;
      } catch (error) {
        console.error('Error updating lawyer:', error);
        throw new InternalServerErrorException('Error updating lawyer');
      }
    });
  }
}
