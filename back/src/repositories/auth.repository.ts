import { registerUserDto } from 'src/dtos/user.dto';
import { Usuario } from 'src/entities/usuario.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/services/user.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthRepository {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(user: registerUserDto): Promise<Partial<Usuario> | void> {
    try {
      this.userService.createUser(user);
    } catch (error) {
      throw new Error(
        'Error al registrar el usuario en auth: ' + error.message,
      );
    }
  }

  async createJwtToken(user: Usuario): Promise<string> {
    try {
      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      return this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
      });
    } catch (error) {
      throw new Error('Error al crear el token JWT: ' + error.message);
    }
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ message: string; token?: string }> {
    try {
      const user = await this.userService.findOneByEmail(email);
      if (!user) {
        return { message: 'Usuario no encontrado' };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { message: 'Contraseña incorrecta' };
      }

      const token = await this.createJwtToken(user);
      return { message: 'Login exitoso', token };
    } catch (error) {
      throw new Error('Error al iniciar sesión: ' + error.message);
    }
  }
}
