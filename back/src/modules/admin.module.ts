import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminController } from "src/controllers/admin.controller";
import { Admin } from "src/entities/admin.entity";
import { User } from "src/entities/user.entity";
import { AdminRepository } from "src/repositories/admin.repository";
import { UserRepository } from "src/repositories/user.repository";
import { AdminService } from "src/services/admin.service";
import { UserService } from "src/services/user.service";

@Module({
  imports: [TypeOrmModule.forFeature([Admin , User])],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository , UserService , UserRepository],
  exports: [AdminService, AdminRepository,UserService , UserRepository],
})
export class AdminModule {}
