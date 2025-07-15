import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminController } from "src/controllers/admin.controller";
import { Administrador } from "src/entities/admin.entity";
import { Usuario } from "src/entities/usuario.entity";
import { AdminRepository } from "src/repositories/admin.repository";
import { UserRepository } from "src/repositories/user.repository";
import { AdminService } from "src/services/admin.service";
import { UserService } from "src/services/user.service";

@Module({
  imports: [TypeOrmModule.forFeature([Administrador , Usuario])],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository , UserService , UserRepository],
  exports: [AdminService, AdminRepository,UserService , UserRepository],
})
export class AdminModule {}
