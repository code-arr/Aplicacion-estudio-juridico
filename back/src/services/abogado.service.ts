import { Injectable } from '@nestjs/common';
import { AbogadoDto } from '../dtos/lawyer.dto';
import { Lawyer } from '../entities/lawyer.entity';
import { AbogadoRepository } from '../repositories/lawyer.repository';
import { UpdateLawyerDto } from 'src/dtos/updateLawyer.dto';

@Injectable()
export class AbogadoService {
  constructor(private readonly abogadoRepository: AbogadoRepository) {}

  async seedData(): Promise<string> {
    return this.abogadoRepository.seedData();
  }

  async seedClienteAbogados(): Promise<string> {
    return this.abogadoRepository.seedClientesAbogados();
  }
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

  createLawyer(lawyerDto: AbogadoDto): Promise<Lawyer> {
    return this.abogadoRepository.createLawyer(lawyerDto);
  }
}
