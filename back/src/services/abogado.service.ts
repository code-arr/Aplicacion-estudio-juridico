import { Injectable } from '@nestjs/common';
import { AbogadoDto } from '../dtos/lawyer.dto';
import { Lawyer, lawyerType } from '../entities/lawyer.entity';
import { AbogadoRepository } from '../repositories/lawyer.repository';
import { UpdateLawyerDto } from 'src/dtos/updateLawyer.dto';
import { EntityManager } from 'typeorm';
import { User } from 'src/entities/user.entity';

@Injectable()
export class AbogadoService {
  constructor(private readonly abogadoRepository: AbogadoRepository) {}

  async getAbogadoById(id: string): Promise<Lawyer | null> {
    return this.abogadoRepository.getAbogadoById(id);
  }
  async getAbogadoByEmail(email: string): Promise<Lawyer | null> {
    return this.abogadoRepository.getAbogadoByEmail(email);
  }
  async saveAbogado(abogado: Lawyer): Promise<Lawyer> {
    return this.abogadoRepository.saveAbogado(abogado);
  }
  async getAllLawyers(): Promise<Lawyer[]> {
    return await this.abogadoRepository.getAllLawyers();
  }
  async deleteClientFromLawyer(
    lawyerId: string,
    clientId: string,
  ): Promise<Lawyer | null> {
    return this.abogadoRepository.deleteClientFromLawyer(lawyerId, clientId);
  }
  async updateLawyer(
    lawyerId: string,
    updateData: UpdateLawyerDto,
  ): Promise<Lawyer> {
    return this.abogadoRepository.updateLawyer(lawyerId, updateData);
  }

  async deleteLawyer(id: string): Promise<{ message: string }> {
    return this.abogadoRepository.deleteLawyer(id);
  }

  async addClientToLawyer(
    lawyerId: string,
    clientId: string,
  ): Promise<Lawyer | null> {
    return this.abogadoRepository.addClientToLawyer(lawyerId, clientId);
  }

  findByEmails(emails: [{ name: string; email: string }]) {
    return this.abogadoRepository.findByEmails(emails);
  }

  createLawyer(
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
    return this.abogadoRepository.createLawyerInTransaction(
      manager,
      lawyerData,
    );
  }
}

