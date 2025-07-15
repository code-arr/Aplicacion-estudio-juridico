import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdministradorDto } from 'src/dtos/admin.dto';
import { Administrador } from 'src/entities/admin.entity';
import { UserService } from 'src/services/user.service';
import { Repository } from 'typeorm';

@Injectable()
export class AdminRepository {
  constructor(
    @InjectRepository(Administrador)
    private adminRepository: Repository<Administrador>,
    private readonly userService: UserService, // Asegúrate de importar y usar el UserRepository correctamente
  ) {}

    async createAdmin(data: AdministradorDto): Promise<Administrador> {
        const user = await this.userService.findOneByEmail(data.userEmail);
        if (!user) {
            throw new Error('User not found');
        }
        const admin = this.adminRepository.create({
            usuario: user,
        });
        return this.adminRepository.save(admin);
    }

  async seedAdmin(): Promise<Administrador> {
   
    const newAdmin = await this.createAdmin({
      userEmail: 'admin@example.com'
    });

    return newAdmin;
  }
  
  async getAdmin() :Promise<Administrador[]> {
    return this.adminRepository.find({ relations: ['usuario'] });

  }
}
