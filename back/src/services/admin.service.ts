// admin.service.ts

import { Injectable } from '@nestjs/common';
import { Admin } from 'src/entities/admin.entity';
import { AdminRepository } from 'src/repositories/admin.repository';
import { AuthRepository } from 'src/auth/auth.repository'; // 👈 Importar

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly authRepository: AuthRepository, // 👈 Inyectar
  ) {}

  // 👇 Este método ahora delega a AuthRepository
  async createAdmin(
    email: string,
    password: string,
  ): Promise<{ user: any; admin: Admin }> {
    return this.authRepository.createAdmin(email, password);
  }

  async seedAdmin() {
    return this.adminRepository.seedAdmin();
  }

  async getAdmin(): Promise<Admin | null> {
    return this.adminRepository.getAdmin();
  }

  async deleteClient(clientId: string): Promise<void> {
    return this.adminRepository.deleteClient(clientId);
  }
}

