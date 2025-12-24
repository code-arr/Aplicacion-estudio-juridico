import { registerUserDto } from '../dtos/user.dto';
import { User, UserRole } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { isBefore, addMinutes } from 'date-fns';
import { UserService } from '../services/user.service';
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MyMailerService } from '../mailer/mailer.service';
import { PasswordResetRepository } from '../repositories/passwordResetToken.repository';
import { SystemMailerService } from 'src/mailer/system-mailer.service';
import { UserLoginsService } from 'src/userLogins/userLogins.service';
import { Request } from 'express';
import { AbogadoService } from 'src/services/abogado.service';
import { AbogadoRepository } from 'src/repositories/lawyer.repository';
import { Lawyer, lawyerType } from 'src/entities/lawyer.entity';
import { UserRepository } from 'src/repositories/user.repository';
import { DataSource, EntityManager } from 'typeorm'; // 👈 Importar EntityManager
import { Admin } from 'src/entities/admin.entity';
import { AdminRepository } from 'src/repositories/admin.repository';

@Injectable()
export class AuthRepository {
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
    private readonly lawyerService: AbogadoService,
    private readonly lawyerRepository: AbogadoRepository,
    private readonly adminRepository: AdminRepository, // 👈 AGREGAR ESTO
    private readonly jwtService: JwtService,
    private readonly systemMailer: SystemMailerService,
    private readonly resetRepo: PasswordResetRepository,
    private readonly userLogins: UserLoginsService,
    private readonly dataSource: DataSource,
  ) {}

  async register(
    userData: { email: string; password: string },
    lawyerData: {
      firstName: string;
      lastName: string;
      phone: string;
      rut: string;
      address?: string;
      type?: lawyerType;
    },
  ): Promise<{ user: Partial<User>; lawyer: Lawyer }> {
    // 🔄 Transacción
    return this.dataSource.transaction(async (manager) => {
      // 1. Verificar que no exista el email
      const existingUser = await manager.findOne(User, {
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new BadRequestException('Ya existe un usuario con este email');
      }

      // 2. Delegar creación de User al repository
      const savedUser = await this.userService.createUser(
        manager, // 👈 Pasar el manager
        {
          email: userData.email,
          password: userData.password,
          role: UserRole.LAWYER,
        },
      );

      // 3. Delegar creación de Lawyer al repository
      const savedLawyer = await this.lawyerService.createLawyer(
        manager, // 👈 Pasar el manager
        {
          ...lawyerData,
          user: savedUser, // Asociar el user
        },
      );

      // 4. Retornar sin password
      const { password, ...userWithoutPassword } = savedUser;

      return {
        user: userWithoutPassword,
        lawyer: savedLawyer,
      };
    });
  }

  async createAdmin(
    email: string,
    password: string,
  ): Promise<{ user: Partial<User>; admin: Admin }> {
    return this.dataSource.transaction(async (manager) => {
      // Verificar email
      const existingUser = await manager.findOne(User, {
        where: { email },
      });

      if (existingUser) {
        throw new BadRequestException('Ya existe un usuario con este email');
      }

      // Crear User
      const savedUser = await this.userRepository.createUserInTransaction(
        manager,
        {
          email,
          password,
          role: UserRole.ADMIN,
        },
      );

      // Crear Admin
      const savedAdmin = await this.adminRepository.createAdminInTransaction(
        manager,
        { user: savedUser },
      );

      const { password: _, ...userWithoutPassword } = savedUser;

      return {
        user: userWithoutPassword,
        admin: savedAdmin,
      };
    });
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
        expiresIn: '8h', // <- clave
        issuer: 'legal-app',
        audience: 'desktop',
      });
    } catch (error) {
      throw new Error('Error al crear el token JWT: ' + error.message);
    }
  }

  async login(
    email: string,
    password: string,
    ctx?: { req?: Request; deviceId?: string }, // 👈 NUEVO
  ): Promise<{ message: string; token?: string; user?: any }> {
    try {
      const user = await this.userService.findOneByEmail(email);

      // 🔒 No reveles si el usuario existe o si la contraseña está mal.
      if (!user) {
        throw new UnauthorizedException('Credenciales inválidas'); // 401
      }

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        throw new UnauthorizedException('Credenciales inválidas'); // 401
      }

      const token = await this.createJwtToken(user);

      // 👇👇👇 REGISTRO DEL LOGIN (IP/UA reales desde req)
      const forwarded = (ctx?.req?.headers['x-forwarded-for'] as string) || '';
      const ip =
        forwarded.split(',')[0]?.trim() ||
        (ctx?.req as any)?.ip ||
        (ctx?.req as any)?.socket?.remoteAddress ||
        'unknown';

      const userAgent = ctx?.req?.headers['user-agent'] || 'unknown';
      const deviceId = ctx?.deviceId || 'unknown';

      // no bloquea el login si falla el save, pero loguea
      try {
        await this.userLogins.create({
          userId: user.id,
          deviceId,
          userAgent,
          ip,
        });
      } catch (err) {
        // podés poner un logger acá si querés
      }

      return {
        message: 'Login exitoso',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          googleEmail: user.googleEmail ?? null,
        },
      };
    } catch (e) {
      // si ya es 401/400, preservalo
      if (
        e instanceof UnauthorizedException ||
        e instanceof BadRequestException
      ) {
        throw e;
      }
      // cualquier otra cosa => 500
      throw new InternalServerErrorException('No se pudo iniciar sesión');
    }
  }

  async validateUser(profile: any, refreshToken: string): Promise<User> {
    const email = profile.emails[0].value;

    // 1. Busca si el usuario ya existe en tu base de datos
    const user = await this.userService.findOneByEmail(email);

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
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const t = await this.resetRepo.findValidByHash(tokenHash);

    if (!t || isBefore(t.expiresAt, new Date()) || t.usedAt) {
      throw new BadRequestException('Token inválido o expirado');
    }

    //const hashedPassword = await bcrypt.hash(password, 10);
    await this.userService.updatePassword(t.userId, password);
    await this.resetRepo.markUsed(t.id);

    return { ok: true, message: 'Contraseña restablecida correctamente' };
  }
}

