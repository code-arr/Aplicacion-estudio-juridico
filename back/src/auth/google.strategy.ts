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
    try {
      console.log('GoogleStrategy.validate - profile:', {
        id: profile?.id,
        displayName: profile?.displayName,
        emails: profile?.emails,
      });

      // extraer email de forma segura
      const emailFromProfile =
        Array.isArray(profile?.emails) && profile.emails[0]?.value
          ? profile.emails[0].value
          : undefined;

      const rawState = (req.query?.state as string) || '';
      let stateObj: { email?: string; returnTo?: string } | null = null;
      if (rawState) {
        try {
          stateObj = JSON.parse(
            Buffer.from(rawState, 'base64url').toString('utf-8'),
          );
        } catch (err) {
          console.warn(
            'GoogleStrategy.validate: state inválido',
            rawState,
            err,
          );
        }
      }

      if (!stateObj?.email) {
        // si no viene email en state, intentamos fallback a emailFromProfile (solo si tu flujo lo permite)
        if (!emailFromProfile) {
          return done(
            new UnauthorizedException('State sin email y profile sin emails'),
            false,
          );
        }
        stateObj = { email: emailFromProfile };
      }

      const user = await this.userService.findOneByEmail(stateObj.email!);
      if (!user) {
        return done(
          new UnauthorizedException('Usuario no encontrado en BD'),
          false,
        );
      }

      // Guardar el refresh token y el googleEmail (puede fallar; loguear)
      try {
        await this.userService.updateUser(user.id, {
          googleEmail: emailFromProfile ?? stateObj.email,
          googleRefreshToken: refreshToken,
        });
      } catch (err) {
        console.error('Error updateUser en GoogleStrategy:', err);
        // no abortar el flow: devolver igualmente el objeto combinado (según tu criterio)
      }

      const combinedUser = {
        user: { ...user, googleEmail: emailFromProfile ?? stateObj.email },
        googleTokens: { accessToken, refreshToken },
      };

      return done(null, combinedUser);
    } catch (err) {
      console.error('Error en GoogleStrategy.validate:', err);
      return done(err, false);
    }
  }
}
