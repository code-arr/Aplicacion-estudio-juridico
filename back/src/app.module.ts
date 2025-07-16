import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import typeormConfig from './config/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm'; // <-- Importa esto aquí también
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { AuthRepository } from './repositories/auth.repository';
import { UserRepository } from './repositories/user.repository';
import { UserService } from './services/user.service';
import { AuthModule } from './modules/auth.module';
import { UsersModule } from './modules/users.module';
import { AbogadoModule } from './modules/abogado.module';
import { AdminModule } from './modules/admin.module';
import { ClienteModule } from './modules/cliente.module';
import { CasoModule } from './modules/caso.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [typeormConfig] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Usa el operador de aserción no nula '!' si estás seguro de que la configuración existe
        const options = configService.get<TypeOrmModuleOptions>('typeorm')!;
        return options;
      },
    }),
     JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    AuthModule,
    UsersModule,
    AbogadoModule,
    AdminModule,
    ClienteModule,
    CasoModule
  ],
  controllers: [AppController ],
  providers: [AppService ],

})
export class AppModule {}
