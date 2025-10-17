import { registerUserDto } from 'src/dtos/user.dto';
import { User } from 'src/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { isBefore, addMinutes } from 'date-fns';
import { UserService } from 'src/services/user.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SystemMailerService } from 'src/mailer/system-mailer.service'; // ✅ NUEVO
import { PasswordResetRepository } from 'src/repositories/passwordResetToken.repository';
/* import { MyMailerService } from 'src/mailer/mailer.service'; */

@Injectable()
export class AuthRepository {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly systemMailer: SystemMailerService, // ✅ neutral
    private readonly resetRepo: PasswordResetRepository,
    /* private readonly mailer: MyMailerService, */
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
        googleEmail: Newuser?.googleEmail ? Newuser.googleEmail : null,
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

  async linkGoogleAccount(
    userId: string,
    googleData: { googleRefreshToken: string },
  ): Promise<User> {
    const user = await this.userService.getOneById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    user.googleRefreshToken = googleData.googleRefreshToken;

    this.userService.updateUser(userId, user);

    return user;
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findOneByEmail(email);

    // Siempre responder igual, no revelar si existe o no
    if (user) {
      await this.resetRepo.invalidateAll(user.id);

      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = addMinutes(new Date(), 30);

      await this.resetRepo.createToken({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      // ✅ usar el mail neutral del sistema
      await this.systemMailer.sendPasswordReset(email, token);
    }

    return { message: 'Si existe, te enviamos un correo' };
  }

  // --- NUEVO: Restablecer la contraseña ---
  async resetPassword(token: string, password: string) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const t = await this.resetRepo.findValidByHash(tokenHash);

    if (!t || isBefore(t.expiresAt, new Date()) || t.usedAt) {
      throw new BadRequestException("Token inválido o expirado");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userService.updatePassword(t.userId, hashedPassword);
    await this.resetRepo.markUsed(t.id);

    return { ok: true, message: "Contraseña restablecida correctamente" };
  }
}
}
