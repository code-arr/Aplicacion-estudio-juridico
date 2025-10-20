// src/auth/google.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth2';
import { StrategyOptions } from 'passport-google-oauth2';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/services/user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private userService: UserService) {
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
    } as StrategyOptions);
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { email } = profile;

    // Recupero el email "de BD" que venía en state
    const rawState = req.query.state as string;
    const state = JSON.parse(
      Buffer.from(rawState, 'base64url').toString('utf-8'),
    ) as { email: string };

    const user = await this.userService.findOneByEmail(state.email);
    if (!user) {
      return done(
        new UnauthorizedException('Usuario no autenticado con JWT.'),
        false,
      );
    }

    // Persisto email de Google y refresh token directamente con UserService
    await this.userService.updateUser(user.id, {
      googleEmail: email,
      googleRefreshToken: refreshToken,
    });

    const combinedUser = {
      user: { ...user, googleEmail: email }, // opcional, para que el caller tenga el email linkeado
      googleTokens: { accessToken, refreshToken },
    };

    return done(null, combinedUser);
  }
}
