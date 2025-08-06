import { Module } from "@nestjs/common";
import { User } from "src/entities/user.entity";
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthRepository } from "src/repositories/auth.repository";
import { UserService } from "src/services/user.service";
import { AuthController } from "src/controllers/auth.controller";
import { UserRepository } from "src/repositories/user.repository";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [AuthRepository , UserService , UserRepository],
  exports: [AuthRepository , UserService , UserRepository]
})
export class AuthModule {}
