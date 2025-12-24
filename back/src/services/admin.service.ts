// admin.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { Admin } from 'src/entities/admin.entity';
import { AdminRepository } from 'src/repositories/admin.repository';
import { AuthRepository } from 'src/auth/auth.repository'; // 👈 Importar

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly authRepository: AuthRepository, // 👈 Inyectar
  ) {}

  // 👇 NUEVO
  async setupFirstAdmin(email: string, password: string) {
    // Verificar que NO haya ningún admin
    const existingAdmin = await this.adminRepository.getAdmin();

    if (existingAdmin) {
      throw new BadRequestException(
        'El sistema ya está inicializado. No se pueden crear más admins por este método.',
      );
    }

    // Crear el primer admin
    const result = await this.authRepository.createAdmin(email, password);

    return {
      message:
        '✅ Sistema inicializado correctamente. Ya podés iniciar sesión.',
      admin: {
        id: result.admin.id,
        email: result.user.email,
      },
    };
  }

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

