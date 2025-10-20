import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLogin } from 'src/userLogins/userLogin.entity';
import { UserLoginsService } from './userLogins.service';
import { UserLoginsController } from './userLogins.controller';
import { GeoIpService } from './geoip.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserLogin])],
  providers: [UserLoginsService, GeoIpService],
  exports: [UserLoginsService],
  controllers: [UserLoginsController],
})
export class UserLoginsModule {}
