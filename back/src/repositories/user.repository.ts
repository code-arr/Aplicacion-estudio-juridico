import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { registerUserDto } from '../dtos/user.dto';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { usersSeedData } from '../utils/usuarios';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async userSeedData(): Promise<string> {
    try {
      const users = usersSeedData;
      for (const user of users) {
        await this.createUser(user);
      }
    } catch (error) {
      throw new InternalServerErrorException(
        'Error inesperado al hacer el seed de los usuarios. REPOSITORIO',
      );
    }
    return 'Seed de usuarios completado exitosamente.';
  }

  async createUser(user: registerUserDto): Promise<Partial<User> | void> {
    try {
      console.log(user);
      
      const userExist = await this.userRepository.findOne({
        where: { email: user.email },
      });
      if (userExist) {
        throw new BadRequestException(
          'Ya hay un usuario registrado con este email.',
        );
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);
      const newUser = this.userRepository.create({
        ...user,
        password: hashedPassword,
      });
      await this.userRepository.save(newUser);
      const { id, password, ...rest } = newUser;
      console.log('Usuario creado:', rest);
      console.log(newUser.password);

      return rest;
    } catch (error) {
      if (error) {
        console.log(error);

        throw error;
      }
    }
  }
  async findOneByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { email } });
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al buscar el usuario por email: REPOSITORIO ' + error.message,
      );
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async getOneById(id: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al buscar el usuario por ID: REPOSITORIO ' + error.message,
      );
    }
  }

  async updateUser(
    id: string,
    userData: Partial<User>,
  ): Promise<Partial<User> | void> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException('Usuario no encontrado.');
      }
      Object.assign(user, userData);
      await this.userRepository.save(user);
      const { password, ...updatedUser } = user;
      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error inesperado al actualizar el usuario. REPOSITORIO',
      );
    }
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      console.log(user);
      console.log(email);

      if (!user) {
        throw new NotFoundException('Usuario no encontrado.');
      }
      const isMatch = await bcrypt.compare(password, user.password);
      return isMatch;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error inesperado al verificar la contraseña. REPOSITORIO',
      );
    }
  }
  async deleteUser(id: string): Promise<string> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundException('No se encontró el usuario con ese ID.');
      }

      await this.userRepository.remove(user);

      console.log(`Usuario eliminado correctamente: ${user.email}`);

      return 'Usuario eliminado exitosamente.';
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al eliminar el usuario:', error);
      throw new InternalServerErrorException(
        'Error inesperado al eliminar el usuario. REPOSITORIO',
      );
    }
  }

  async changePassword(
    email: string,
    newPassword: string,
  ): Promise<string | void> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        throw new NotFoundException('Usuario no encontrado.');
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await this.userRepository.save(user);
      return (
        'Contraseña del usuario ' + user.email + ' actualizada exitosamente.'
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error inesperado al cambiar la contraseña. REPOSITORIO',
      );
    }
  }

  async updatePassword(userId: string, newPassword: string) {
    const user = await this.getOneById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 🔐 Hash del password antes de guardar
    const hashed = await bcrypt.hash(newPassword, 10);

    user.password = hashed;
    await this.userRepository.save(user);

    return { message: 'Contraseña actualizada correctamente' };
  }
}
