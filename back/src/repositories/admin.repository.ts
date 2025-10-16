import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdministradorDto } from 'src/dtos/admin.dto';
import { Admin } from 'src/entities/admin.entity';
import { UserService } from 'src/services/user.service';
import { Repository } from 'typeorm';

@Injectable()
export class AdminRepository {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private readonly userService: UserService, // Asegúrate de importar y usar el UserRepository correctamente
  ) {}

    async createAdmin(data: AdministradorDto): Promise<Admin> {
        const user = await this.userService.findOneByEmail(data.userEmail);
        if (!user) {
            throw new Error('User not found');
        }
        const admin = this.adminRepository.create({
            user: user,
        });
        return this.adminRepository.save(admin);
    }

  async seedAdmin(): Promise<Admin> {
   
    const newAdmin = await this.createAdmin({
      userEmail: 'admin@example.com'
    });

    return newAdmin;
  }
  
  async getAdmin() :Promise<Admin[]> {
    return this.adminRepository.find({ relations: ['usuario'] });

  }
}
