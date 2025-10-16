import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth2';
import { StrategyOptions } from 'passport-google-oauth2';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { User } from 'src/entities/user.entity';
import { UserService } from 'src/services/user.service';
import { STATUS_CODES } from 'http';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private authRepository: AuthRepository,
    private userService: UserService,
  ) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/gmail.send',
      ],
      accessType: 'offline',
      prompt: 'consent',
      passReqToCallback: true,
    } as StrategyOptions); // Añadimos la aserción de tipo aquí
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { email } = profile;

    const rawState = req.query.state as string;
    const state = JSON.parse(
      Buffer.from(rawState, 'base64url').toString('utf-8'),
    ) as { email: string };
    console.log('DB EMAIL - ' + state.email);

    const user = await this.userService.findOneByEmail(state.email);
    if (!user) {
      return done(
        new UnauthorizedException('Usuario no autenticado con JWT.'),
        false,
      );
    }
    user.googleEmail = email;

    await this.userService.updateUser(user.id, user);

    if (!user) {
      return done(
        new UnauthorizedException('Usuario no autenticado con JWT.'),
        false,
      );
    }

    try {
      // Usamos el servicio para vincular la cuenta de Google al usuario existente
      const updatedUser = await this.authRepository.linkGoogleAccount(user.id, {
        googleRefreshToken: refreshToken,
      });

      const combinedUser = {
        user: updatedUser,
        googleTokens: { accessToken, refreshToken },
      };

      done(null, combinedUser);
    } catch (error) {
      done(error, false);
    }
  }
}
