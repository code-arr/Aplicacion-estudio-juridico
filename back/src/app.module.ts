import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import typeormConfig from './config/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm'; // <-- Importa esto aquí también
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users.module';
import { AbogadoModule } from './modules/abogado.module';
import { AdminModule } from './modules/admin.module';
import { ClienteModule } from './modules/cliente.module';
import { CategoryModule } from './modules/category.module';
import { SectionModule } from './modules/sectionModule';
import { ItemTypeModule } from './modules/itemType.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { clientItemModule } from './modules/clientItem.module';
import { DocumentModule } from './modules/document.module';
import { ProcessModule } from './modules/process.module';
import { GoogleModule } from './auth/google.module';


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
    CategoryModule,
    SectionModule,
    ItemTypeModule,
    MailerModule,
    clientItemModule,
    DocumentModule,
    ProcessModule,
    GoogleModule
  ],
  controllers: [AppController ],
  providers: [AppService ],

})
export class AppModule {}
