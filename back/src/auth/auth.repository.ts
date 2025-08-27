import { registerUserDto } from 'src/dtos/user.dto';
import { User } from 'src/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/services/user.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class AuthRepository {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(user): Promise<Partial<User> | void> {
    try {
      this.userService.createUser(user);
    } catch (error) {
      throw new Error(
        'Error al registrar el usuario en auth: ' + error.message,
      );
    }
  }

  async createJwtToken(user: User): Promise<string> {
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
  ): Promise<{ message: string; token?: string; userData?: any; user?: any }> {
    try {
      const Newuser = await this.userService.findOneByEmail(email);
      const user = {
        email: Newuser?.email,
        id: Newuser?.id,
        role: Newuser?.role,
      };
      if (!Newuser) {
        throw new BadRequestException('Usuario no encontrado');
      }

      const isPasswordValid = await bcrypt.compare(password, Newuser.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Contraseña incorrecta');
      }

      const token = await this.createJwtToken(Newuser);
      return { message: 'Login exitoso', token, user };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error('Error al iniciar sesión: ' + error);
    }
  }

  async validateUser(profile: any, refreshToken: string): Promise<User> {
    const email = profile.emails[0].value;

    // 1. Busca si el usuario ya existe en tu base de datos
    let user = await this.userService.findOneByEmail(email);

    if (!user) {
      throw new BadRequestException('Usuario no registrado');
    }

    user.googleRefreshToken = refreshToken;
    return user;
  }

  async linkGoogleAccount(userId: string, googleData: {  googleRefreshToken: string }): Promise<User> {
    const user = await this.userService.getOneById(userId);

    if (!user) {
        throw new NotFoundException('Usuario no encontrado.');
    }
    
    user.googleRefreshToken = googleData.googleRefreshToken;

     this.userService.updateUser(userId, user);

     return user;
}


}
