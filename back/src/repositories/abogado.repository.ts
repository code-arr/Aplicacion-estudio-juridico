import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbogadoDto } from 'src/dtos/abogado';
import { Abogado } from 'src/entities/abogado.entity';
import { UserService } from 'src/services/user.service';
import { abogadosSeedData } from 'src/utils/abogados';
import { Repository } from 'typeorm';

@Injectable()
export class AbogadoRepository {
  constructor(
    @InjectRepository(Abogado) private readonly repository: Repository<Abogado>,
    private readonly userService: UserService, // Asegúrate de importar y usar el UserRepository correctamente
  ) {}
    async createAbogado(abogado: AbogadoDto): Promise<Abogado> {
        const newAbogado = this.repository.create(abogado);
        return this.repository.save(newAbogado);
    }
    async getAllAbogados(): Promise<Abogado[]> {
        return this.repository.find({ relations: ['usuario'] });
    }
  async seedData(): Promise<string> {
   try {
     const abogados = abogadosSeedData;
     for (const abogado of abogados) {
       const newAbogado = await this.createAbogado(abogado);
       const usuario = await this.userService.findOneByEmail(abogado.userEmail);
       if (usuario) {
         newAbogado.usuario = usuario; // Asocia el usuario al abogado
       }
        await this.repository.save(newAbogado);
     }
     return 'abogados agregados correctamente';
   } catch (error) {
     console.error('Error seeding abogados:', error);
     throw new Error('Error seeding abogados');
    
   }
  }
}
