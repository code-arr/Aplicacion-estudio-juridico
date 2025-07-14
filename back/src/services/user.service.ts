import { Injectable } from '@nestjs/common';
import { registerUserDto } from 'src/dtos/user.dto';
import { Usuario } from 'src/entities/usuario.entity';
import { UserRepository } from 'src/repositories/user.repository';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async findOneByEmail(email: string): Promise<Usuario | null> {
    return this.userRepository.findOneByEmail(email);
  }

  async createUser(user: registerUserDto): Promise<Partial<Usuario> | void> {
    return this.userRepository.createUser(user);
  }
}
