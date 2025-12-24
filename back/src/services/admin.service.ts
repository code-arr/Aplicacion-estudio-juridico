// admin.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Admin } from 'src/entities/admin.entity';
import { AdminRepository } from 'src/repositories/admin.repository';
import { AuthRepository } from 'src/auth/auth.repository';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
  ) {}

  async setupFirstAdmin() {
    // 1️⃣ Verificar que no exista admin
    const existingAdmin = await this.adminRepository.getAdmin();

    if (existingAdmin) {
      throw new BadRequestException(
        'El sistema ya fue inicializado. Ya existe un administrador.',
      );
    }

    // 2️⃣ Leer variables de entorno
    const email = this.configService.get<string>('ADMIN_EMAIL');
    const password = this.configService.get<string>('ADMIN_PASSWORD');

    if (!email || !password) {
      throw new BadRequestException(
        'ADMIN_EMAIL o ADMIN_PASSWORD no están configuradas en el entorno.',
      );
    }

    // 3️⃣ Crear admin usando el flujo normal
    const result = await this.authRepository.createAdmin(email, password);

    return {
      message: '✅ Administrador inicial creado correctamente.',
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

