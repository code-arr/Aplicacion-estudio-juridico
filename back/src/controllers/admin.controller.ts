import { Controller, Get, Post } from '@nestjs/common';
import { AdminService } from 'src/services/admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('seeder')
  
  async seedAdmin() {
    return this.adminService.seedAdmin();
  }

  @Get('')
  async getAdmin() {
    return this.adminService.getAdmin();
  }
}
