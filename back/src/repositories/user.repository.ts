import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { registerUserDto } from 'src/dtos/user.dto';
import { Usuario } from 'src/entities/usuario.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class userRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
  ) {}

  async createUser(user: registerUserDto): Promise<Partial<Usuario> | void> {
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
      const { id, password, ...rest } = newUser;

      return rest;
    } catch (error) {
    if (error instanceof BadRequestException) {
        throw error;
      }
    throw new InternalServerErrorException("Error inesperado al crear el usuario.");
    }
  }
}
