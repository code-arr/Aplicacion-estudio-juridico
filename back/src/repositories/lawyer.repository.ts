import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbogadoDto } from '../dtos/lawyer.dto';
import { Lawyer, lawyerType } from '../entities/lawyer.entity';
import { Client } from '../entities/client.entity';
import { ClienteService } from '../services/cliente.service';
import { UserService } from '../services/user.service';
import { abogadosSeedData } from '../utils/abogados';
import { casosSeedData } from '../utils/casos';
import { clientesSeedData } from '../utils/clientes';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { ParentTouchService } from 'src/services/parent-touch.service';
import { UpdateLawyerDto } from 'src/dtos/updateLawyer.dto';
import * as bcrypt from 'bcrypt';
import { User } from 'src/entities/user.entity';

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
  async createLawyerInTransaction(
    manager: EntityManager, // 👈 Recibe el manager de la transacción
    lawyerData: {
      firstName: string;
      lastName: string;
      phone: string;
      rut: string;
      address?: string;
      type?: lawyerType;
      user: User; // 👈 El user ya creado
    },
  ): Promise<Lawyer> {
    // Crear lawyer
    const newLawyer = manager.create(Lawyer, {
      firstName: lawyerData.firstName,
      lastName: lawyerData.lastName,
      phone: lawyerData.phone,
      rut: lawyerData.rut,
      address: lawyerData.address,
      type: lawyerData.type,
      user: lawyerData.user, // Asociar el user
    });

    // Guardar usando el manager de la transacción
    return await manager.save(Lawyer, newLawyer);
  }
  async saveAbogado(abogado: Lawyer): Promise<Lawyer> {
    return this.repository.save(abogado);
  }
  async deleteLawyer(id: string): Promise<{ message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lawyer = await this.repository.findOne({
        where: { id },
        relations: ['clients'],
      });

      if (!lawyer) {
        throw new NotFoundException(`El abogado con id ${id} no existe.`);
      }

      // 🔹 Quitamos este abogado del array de cada cliente
      if (lawyer.clients && lawyer.clients.length > 0) {
        console.log(
          `🔄 Quitando al abogado ${lawyer.firstName} ${lawyer.lastName} de ${lawyer.clients.length} clientes`,
        );

        for (const client of lawyer.clients) {
          // Sacamos el abogado del array
          client.lawyers = client.lawyers.filter((l) => l.id !== id);
          await queryRunner.manager.save(Client, client);
        }
      }

      // 🔹 Eliminamos el abogado
      await queryRunner.manager.remove(Lawyer, lawyer);

      await queryRunner.commitTransaction();

      console.log(
        `✅ Abogado ${lawyer.firstName} ${lawyer.lastName} eliminado correctamente`,
      );
      return { message: `Abogado con id ${id} eliminado correctamente.` };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Error al eliminar abogado:', error);
      throw new InternalServerErrorException(
        'Error al eliminar el abogado. Intente nuevamente.',
      );
    } finally {
      await queryRunner.release();
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

  async getLawyersByIds(ids: string[]): Promise<Lawyer[]> {
    if (!ids || ids.length === 0) {
      return []; // Devuelve vacío si no hay IDs
    }

    return this.repository.find({
      where: {
        id: In(ids), // Usa el operador 'In' de TypeORM
      },
    });
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

  async addClientToLawyer(
    lawyerId: string,
    clientId: string,
  ): Promise<Lawyer | null> {
    // 1. Verificar si el abogado existe
    const lawyer = await this.repository.findOne({
      where: { id: lawyerId },
    });
    if (!lawyer) {
      throw new NotFoundException('Lawyer not found');
    }

    // 2. Verificar si el cliente existe (Asumiendo que tienes un ClientRepository inyectado,
    // si no, este paso es crucial para asegurar que el clientId es válido)
    // *** Asume que existe un 'clientRepository' inyectado en la clase ***
    const client = await this.clienteRepository.findOne({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // 3. Opcional: Verificar si la relación ya existe antes de añadir

    // 4. Establecer la relación (Agregar el cliente al abogado)
    await this.repository
      .createQueryBuilder()
      .relation('clients') // Nombre de la propiedad de la relación en la entidad Lawyer
      .of(lawyerId)
      .add(clientId); // Usa .add() para vincular

    // 5. Devolver el abogado actualizado con la nueva lista de clientes
    const updatedLawyer = await this.repository.findOne({
      where: { id: lawyerId },
      relations: ['clients'],
    });

    return updatedLawyer;
  }

  async updateLawyer(
    lawyerId: string,
    updateData: UpdateLawyerDto,
  ): Promise<Lawyer> {
    return this.dataSource.transaction(async (manager) => {
      try {
        const lawyerRepo = manager.getRepository(Lawyer);

        // 1. Buscamos abogado Y usuario
        const lawyer = await lawyerRepo.findOne({
          where: { id: lawyerId },
          relations: ['clients', 'clientItems', 'user'], // Traemos el user
        });
        if (!lawyer) throw new NotFoundException('Lawyer not found');

        // 2. Sacamos la password del objeto de datos para que no rompa al Lawyer
        const { password, ...lawyerData } = updateData;

        // 3. Actualizamos al Abogado
        Object.assign(lawyer, lawyerData);
        const savedLawyer = await lawyerRepo.save(lawyer);

        // 4. 🔐 Actualizamos al Usuario (Usando el MISMO manager)
        if (password && lawyer.user) {
          // Acá duplicamos la lógica de hash por seguridad transaccional.
          // Es un trade-off aceptable.
          const salt = await bcrypt.genSalt();
          lawyer.user.password = await bcrypt.hash(password, salt);

          // Guardamos usando MANAGER (clave para la transacción)
          await manager.save(lawyer.user);
        }

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

        return savedLawyer;
      } catch (error) {
        console.error('Error updating lawyer:', error);
        throw new InternalServerErrorException('Error updating lawyer');
      }
    });
  }

  async findByEmails(emails: [{ name: string; email: string }]) {
    const mailList = emails.map((e) => e.email); // extrae solo los correos

    return this.repository.find({
      where: { user: { email: In(mailList) } },
      relations: ['user'], // importante para acceder al email del user
    });
  }
}

