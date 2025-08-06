import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { registerUserDto } from 'src/dtos/user.dto';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { usersSeedData } from 'src/utils/usuarios';

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
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error inesperado al crear el usuario. REPOSITORIO',
      );
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

  async getAllUsers():Promise<User[]>{
    return await this.userRepository.find();
  }
}
