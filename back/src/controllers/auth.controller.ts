import { Body, Controller, Post } from '@nestjs/common';
import { registerUserDto } from 'src/dtos/user.dto';
import { Usuario } from 'src/entities/usuario.entity';
import { AuthRepository } from 'src/repositories/auth.repository';

@Controller('auth')
export class AuthController {
  constructor(private readonly authRepository: AuthRepository) {}

  @Post('register')
  async register(@Body() user: registerUserDto): Promise<Partial<Usuario> | void> {
    try {
      return this.authRepository.register(user);
    } catch (error) {
      throw new Error(
        'Error al registrar el usuario en el controlador: ' + error.message,
      );
    }
  }

    @Post('login')
    async login(@Body() { email, password }: { email: string; password: string }): Promise<{ message: string; token?: string }> {
        try {
            return this.authRepository.login(email, password);
        } catch (error) {
            throw new Error(
                'Error al iniciar sesión en el controlador: ' + error.message,
            );
        }
    }
}
