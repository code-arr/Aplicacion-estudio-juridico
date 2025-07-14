import { Module } from "@nestjs/common";
import { Usuario } from "src/entities/usuario.entity";
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthRepository } from "src/repositories/auth.repository";
import { UserService } from "src/services/user.service";
import { AuthController } from "src/controllers/auth.controller";
import { UserRepository } from "src/repositories/user.repository";

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  controllers: [AuthController],
  providers: [AuthRepository , UserService , UserRepository],
  exports: [AuthRepository , UserService , UserRepository]
})
export class AuthModule {}
