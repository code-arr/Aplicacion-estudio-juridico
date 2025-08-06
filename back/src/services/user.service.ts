import { Injectable } from '@nestjs/common';
import { registerUserDto } from 'src/dtos/user.dto';
import { User } from 'src/entities/user.entity';
import { UserRepository } from 'src/repositories/user.repository';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}
  
  async userSeedData(): Promise<string> {
    return this.userRepository.userSeedData();
  }
  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneByEmail(email);
  }

  async createUser(user: registerUserDto): Promise<Partial<User> | void> {
    return this.userRepository.createUser(user);
  }
    async getAllUsers():Promise<User[]>{
    return this.userRepository.getAllUsers();
  }
}
