import { Injectable } from '@nestjs/common';
import { registerUserDto } from '../dtos/user.dto';
import { User, UserRole } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { EntityManager } from 'typeorm';
import { use } from 'passport';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async userSeedData(): Promise<string> {
    return this.userRepository.userSeedData();
  }
  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneByEmail(email);
  }

  async createUser(
    manager: EntityManager, // 👈 Recibe el manager de la transacción
    userData: {
      email: string;
      password: string;
      role: UserRole;
    },
  ): Promise<User> {
    return this.userRepository.createUserInTransaction(manager, userData);
  }
  async getAllUsers(): Promise<User[]> {
    return this.userRepository.getAllUsers();
  }

  async getOneById(id: string): Promise<User | null> {
    return this.userRepository.getOneById(id);
  }

  async updateUser(
    id: string,
    userData: Partial<User>,
  ): Promise<Partial<User> | void> {
    return this.userRepository.updateUser(id, userData);
  }
  async verifyPassword(email: string, password: string): Promise<boolean> {
    return this.userRepository.verifyPassword(email, password);
  }

  async changePassword(
    email: string,
    newPassword: string,
  ): Promise<string | void> {
    return this.userRepository.changePassword(email, newPassword);
  }

  async updatePassword(id: string, newPassword: string) {
    return this.userRepository.updatePassword(id, newPassword);
  }

  async deleteUser(id: string) {
    return this.userRepository.deleteUser(id);
  }
}

