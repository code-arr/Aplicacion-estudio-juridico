import { Injectable } from "@nestjs/common";
import { AdministradorDto } from "src/dtos/admin.dto";
import { Admin } from "src/entities/admin.entity";
import { AdminRepository } from "src/repositories/admin.repository";

@Injectable()
export class AdminService {

    constructor(private readonly adminRepository: AdminRepository) {}

  async createAdmin(adminDto: AdministradorDto): Promise<Admin> {
    return this.adminRepository.createAdmin(adminDto);
  }

  async seedAdmin(): Promise<Admin> {
    return this.adminRepository.seedAdmin();
  }

  async getAdmin(): Promise<Admin[]> {
    return this.adminRepository.getAdmin();
  }
}